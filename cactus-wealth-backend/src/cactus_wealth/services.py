import logging
import os
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from decimal import Decimal

from jinja2 import Environment, FileSystemLoader
from sqlmodel import Session, select, func

# WeasyPrint will be imported when needed for PDF generation

from cactus_wealth.core.dataprovider import MarketDataProvider
from cactus_wealth.models import Portfolio, Position, Asset, User, Client, UserRole, Report, PortfolioSnapshot, InvestmentAccount, InsurancePolicy, Notification
from cactus_wealth import schemas
import cactus_wealth.crud as crud

logger = logging.getLogger(__name__)


class PortfolioService:
    """Service class for portfolio business logic."""
    
    def __init__(self, db_session: Session, market_data_provider: MarketDataProvider):
        """
        Initialize the portfolio service.
        
        Args:
            db_session: Database session
            market_data_provider: Provider for market data
        """
        self.db = db_session
        self.market_data_provider = market_data_provider
        self.notification_service = NotificationService(db_session)
    
    def get_portfolio_valuation(self, portfolio_id: int) -> schemas.PortfolioValuation:
        """
        Calculate portfolio valuation with current market prices.
        
        Args:
            portfolio_id: ID of the portfolio to valuate
            
        Returns:
            PortfolioValuation with calculated values
            
        Raises:
            ValueError: If portfolio not found
            Exception: For market data retrieval errors
        """
        logger.info(f"Starting valuation for portfolio {portfolio_id}")
        
        # Get portfolio with positions and assets
        statement = (
            select(Portfolio)
            .where(Portfolio.id == portfolio_id)
        )
        portfolio = self.db.exec(statement).first()
        
        if not portfolio:
            raise ValueError(f"Portfolio with ID {portfolio_id} not found")
        
        # Get positions with assets
        positions_statement = (
            select(Position)
            .join(Asset)
            .where(Position.portfolio_id == portfolio_id)
        )
        positions = self.db.exec(positions_statement).all()
        
        if not positions:
            logger.warning(f"Portfolio {portfolio_id} has no positions")
            return schemas.PortfolioValuation(
                portfolio_id=portfolio_id,
                portfolio_name=portfolio.name,
                total_value=0.0,
                total_cost_basis=0.0,
                total_pnl=0.0,
                total_pnl_percentage=0.0,
                positions_count=0,
                last_updated=datetime.utcnow()
            )
        
        total_value = 0.0
        total_cost_basis = 0.0
        positions_valued = 0
        
        for position in positions:
            try:
                # Get current market price
                current_price = self.market_data_provider.get_current_price(
                    position.asset.ticker_symbol
                )
                
                # Calculate position values
                position_market_value = position.quantity * current_price
                position_cost_basis = position.quantity * position.purchase_price
                
                total_value += position_market_value
                total_cost_basis += position_cost_basis
                positions_valued += 1
                
                logger.debug(
                    f"Position {position.asset.ticker_symbol}: "
                    f"Qty={position.quantity}, "
                    f"Purchase=${position.purchase_price:.2f}, "
                    f"Current=${current_price:.2f}, "
                    f"Value=${position_market_value:.2f}"
                )
                
            except Exception as e:
                logger.error(
                    f"Failed to get price for {position.asset.ticker_symbol} "
                    f"in portfolio {portfolio_id}: {str(e)}"
                )
                # For production, you might want to handle this differently
                # For now, we'll re-raise the exception
                raise Exception(
                    f"Failed to valuate position {position.asset.ticker_symbol}: {str(e)}"
                )
        
        # Calculate P&L
        total_pnl = total_value - total_cost_basis
        total_pnl_percentage = (
            (total_pnl / total_cost_basis * 100) if total_cost_basis > 0 else 0.0
        )
        
        logger.info(
            f"Portfolio {portfolio_id} valuation complete: "
            f"Value=${total_value:.2f}, "
            f"Cost=${total_cost_basis:.2f}, "
            f"P&L=${total_pnl:.2f} ({total_pnl_percentage:.2f}%)"
        )
        
        return schemas.PortfolioValuation(
            portfolio_id=portfolio_id,
            portfolio_name=portfolio.name,
            total_value=round(total_value, 2),
            total_cost_basis=round(total_cost_basis, 2),
            total_pnl=round(total_pnl, 2),
            total_pnl_percentage=round(total_pnl_percentage, 2),
            positions_count=positions_valued,
            last_updated=datetime.utcnow()
        )

    def create_snapshot_for_portfolio(self, portfolio_id: int) -> PortfolioSnapshot:
        """
        Create a snapshot of the current portfolio value.
        
        Args:
            portfolio_id: ID of the portfolio to snapshot
            
        Returns:
            Created PortfolioSnapshot instance
            
        Raises:
            ValueError: If portfolio not found or valuation fails
        """
        logger.info(f"Creating snapshot for portfolio {portfolio_id}")
        
        try:
            # Get current portfolio valuation
            valuation = self.get_portfolio_valuation(portfolio_id)
            
            # Create snapshot
            snapshot = PortfolioSnapshot(
                portfolio_id=portfolio_id,
                value=Decimal(str(valuation.total_value)),
                timestamp=datetime.utcnow()
            )
            
            # Save to database
            self.db.add(snapshot)
            self.db.commit()
            self.db.refresh(snapshot)
            
            logger.info(
                f"Snapshot created for portfolio {portfolio_id}: "
                f"ID={snapshot.id}, Value=${snapshot.value}, "
                f"Timestamp={snapshot.timestamp}"
            )
            
            # Create notification for the portfolio owner
            try:
                # Get portfolio to access client and owner information
                portfolio = self.db.get(Portfolio, portfolio_id)
                if portfolio and portfolio.client:
                    owner_id = portfolio.client.owner_id
                    portfolio_name = valuation.portfolio_name
                    total_value = valuation.total_value
                    
                    self.notification_service.create_notification(
                        user_id=owner_id,
                        message=f"Valoración del portfolio '{portfolio_name}' actualizada. Nuevo valor: ${total_value:,.2f}"
                    )
            except Exception as e:
                logger.warning(f"Failed to create notification for portfolio snapshot: {str(e)}")
            
            return snapshot
            
        except Exception as e:
            self.db.rollback()
            logger.error(
                f"Failed to create snapshot for portfolio {portfolio_id}: {str(e)}"
            )
            raise ValueError(f"Failed to create portfolio snapshot: {str(e)}")


class ReportService:
    """Service class for generating PDF reports."""
    
    def __init__(self, db_session: Session, market_data_provider: MarketDataProvider):
        """
        Initialize the report service.
        
        Args:
            db_session: Database session
            market_data_provider: Provider for market data
        """
        self.db = db_session
        self.market_data_provider = market_data_provider
        self.notification_service = NotificationService(db_session)
        self.portfolio_service = PortfolioService(db_session, market_data_provider)
        
        # Setup Jinja2 template environment
        current_dir = Path(__file__).parent
        templates_dir = current_dir / "templates"
        self.env = Environment(loader=FileSystemLoader(str(templates_dir)))
    
    def generate_portfolio_report_pdf(
        self, 
        valuation_data: schemas.PortfolioValuation, 
        portfolio_name: str
    ) -> bytes:
        """
        Generate a PDF report for portfolio valuation.
        
        Args:
            valuation_data: Portfolio valuation data
            portfolio_name: Name of the portfolio
            
        Returns:
            PDF content as bytes
            
        Raises:
            Exception: If template rendering or PDF generation fails
        """
        logger.info(f"Generating PDF report for portfolio {valuation_data.portfolio_id}")
        
        try:
            # Get positions with current market prices for detailed table
            positions_statement = (
                select(Position)
                .join(Asset)
                .where(Position.portfolio_id == valuation_data.portfolio_id)
            )
            positions = self.db.exec(positions_statement).all()
            
            # Enhance positions with current market prices
            enhanced_positions = []
            for position in positions:
                try:
                    current_price = self.market_data_provider.get_current_price(
                        position.asset.ticker_symbol
                    )
                    
                    # Create enhanced position object with current price
                    enhanced_position = type('EnhancedPosition', (), {
                        'id': position.id,
                        'quantity': position.quantity,
                        'purchase_price': position.purchase_price,
                        'current_price': current_price,
                        'portfolio_id': position.portfolio_id,
                        'asset_id': position.asset_id,
                        'asset': position.asset,
                        'created_at': position.created_at,
                        'updated_at': position.updated_at
                    })()
                    
                    enhanced_positions.append(enhanced_position)
                    
                except Exception as e:
                    logger.warning(
                        f"Failed to get current price for {position.asset.ticker_symbol}: {str(e)}"
                    )
                    # Use purchase price as fallback
                    enhanced_position = type('EnhancedPosition', (), {
                        'id': position.id,
                        'quantity': position.quantity,
                        'purchase_price': position.purchase_price,
                        'current_price': position.purchase_price,  # Fallback
                        'portfolio_id': position.portfolio_id,
                        'asset_id': position.asset_id,
                        'asset': position.asset,
                        'created_at': position.created_at,
                        'updated_at': position.updated_at
                    })()
                    
                    enhanced_positions.append(enhanced_position)
            
            # Prepare template data
            template_data = {
                'portfolio_id': valuation_data.portfolio_id,
                'portfolio_name': valuation_data.portfolio_name,
                'total_value': valuation_data.total_value,
                'total_cost_basis': valuation_data.total_cost_basis,
                'total_pnl': valuation_data.total_pnl,
                'total_pnl_percentage': valuation_data.total_pnl_percentage,
                'positions_count': valuation_data.positions_count,
                'last_updated': valuation_data.last_updated,
                'report_date': datetime.utcnow(),
                'positions': enhanced_positions
            }
            
            # Load and render template
            template = self.env.get_template('report.html')
            html_content = template.render(**template_data)
            
            # Convert HTML to PDF using WeasyPrint
            try:
                import weasyprint
            except ImportError as e:
                raise Exception(f"WeasyPrint is not available. Please install system dependencies for PDF generation: {str(e)}")
            
            logger.info("Converting HTML to PDF using WeasyPrint")
            
            # Get the base URL for CSS resolution
            current_dir = Path(__file__).parent
            templates_dir = current_dir / "templates"
            base_url = f"file://{templates_dir}/"
            
            # Generate PDF
            pdf_bytes = weasyprint.HTML(
                string=html_content,
                base_url=base_url
            ).write_pdf()
            
            logger.info(
                f"PDF report generated successfully for portfolio {valuation_data.portfolio_id}. "
                f"Size: {len(pdf_bytes)} bytes"
            )
            
            return pdf_bytes
            
        except Exception as e:
            logger.error(f"Failed to generate PDF report: {str(e)}")
            raise Exception(f"Report generation failed: {str(e)}")
    
    async def generate_portfolio_report(
        self, 
        client_id: int, 
        advisor: User, 
        report_type: str = "PORTFOLIO_SUMMARY"
    ) -> schemas.ReportResponse:
        """
        Complete workflow for generating a portfolio report with database tracking.
        
        Args:
            client_id: ID of the client to generate report for
            advisor: User (advisor) generating the report
            report_type: Type of report to generate
            
        Returns:
            ReportResponse with success status and report information
            
        Raises:
            ValueError: If client or portfolio not found or access denied
            Exception: For report generation errors
        """
        logger.info(f"Starting report generation for client {client_id} by advisor {advisor.id}")
        
        try:
            # 1. Verify client exists and advisor has access
            client_statement = select(Client).where(Client.id == client_id)
            if advisor.role != UserRole.ADMIN:
                # Non-admin users can only generate reports for their assigned clients
                client_statement = client_statement.where(Client.owner_id == advisor.id)
            
            client = self.db.exec(client_statement).first()
            if not client:
                raise ValueError(f"Client {client_id} not found or access denied")
            
            # 2. Get client's portfolios (we'll use the first one for now)
            portfolio_statement = select(Portfolio).where(Portfolio.client_id == client_id)
            portfolios = self.db.exec(portfolio_statement).all()
            
            if not portfolios:
                raise ValueError(f"No portfolios found for client {client_id}")
            
            # Use the first portfolio for the report
            portfolio = portfolios[0]
            
            # 3. Get portfolio valuation data
            valuation_data = self.portfolio_service.get_portfolio_valuation(portfolio.id)
            
            # 4. Generate PDF
            pdf_bytes = self.generate_portfolio_report_pdf(valuation_data, portfolio.name)
            
            # 5. Create media/reports directory if it doesn't exist
            media_dir = Path("media")
            reports_dir = media_dir / "reports"
            reports_dir.mkdir(parents=True, exist_ok=True)
            
            # 6. Generate unique filename
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            filename = f"report_{client_id}_{timestamp}.pdf"
            file_path = reports_dir / filename
            
            # 7. Save PDF to file
            with open(file_path, "wb") as f:
                f.write(pdf_bytes)
            
            logger.info(f"PDF saved to {file_path}")
            
            # 8. Create Report record in database
            report = Report(
                client_id=client_id,
                advisor_id=advisor.id,
                file_path=str(file_path),
                report_type=report_type,
                generated_at=datetime.utcnow()
            )
            
            self.db.add(report)
            self.db.commit()
            self.db.refresh(report)
            
            logger.info(f"Report record created with ID {report.id}")
            
            # Create notification for the advisor
            try:
                self.notification_service.create_notification(
                    user_id=advisor.id,
                    message=f"Se ha generado un nuevo reporte para {client.first_name} {client.last_name}"
                )
            except Exception as e:
                logger.warning(f"Failed to create notification for report generation: {str(e)}")
            
            return schemas.ReportResponse(
                success=True,
                message=f"Report generated successfully for {client.first_name} {client.last_name}",
                report_id=report.id,
                file_path=str(file_path)
            )
            
        except ValueError as e:
            logger.warning(f"Validation error during report generation: {str(e)}")
            return schemas.ReportResponse(
                success=False,
                message=str(e)
            )
        except Exception as e:
            logger.error(f"Unexpected error during report generation: {str(e)}")
            # Rollback transaction if report creation failed
            self.db.rollback()
            return schemas.ReportResponse(
                success=False,
                message=f"Report generation failed: {str(e)}"
            )


class DashboardService:
    """Service class for dashboard business logic and KPI calculations."""
    
    def __init__(self, db_session: Session, market_data_provider: MarketDataProvider):
        """
        Initialize the dashboard service.
        
        Args:
            db_session: Database session
            market_data_provider: Provider for market data
        """
        self.db = db_session
        self.market_data_provider = market_data_provider
        self.portfolio_service = PortfolioService(db_session, market_data_provider)
    
    def get_dashboard_summary(self, user: User) -> schemas.DashboardSummaryResponse:
        """
        Calculate dashboard KPIs based on user role and permissions.
        
        Args:
            user: Authenticated user requesting the dashboard data
            
        Returns:
            DashboardSummaryResponse with calculated KPIs
        """
        logger.info(f"Calculating dashboard summary for user {user.id} with role {user.role}")
        
        # Apply role-based filtering for clients
        clients_query = select(Client)
        if user.role != UserRole.ADMIN:
            # Non-admin users only see their assigned clients
            clients_query = clients_query.where(Client.owner_id == user.id)
        
        # 1. Total Clients Count
        total_clients = len(self.db.exec(clients_query).all())
        logger.debug(f"Total clients: {total_clients}")
        
        # 2. Assets Under Management (AUM) - Sum of all portfolio values
        aum = self._calculate_assets_under_management(user)
        logger.debug(f"Assets under management: ${aum:.2f}")
        
        # 3. Monthly Growth Percentage - Real implementation
        monthly_growth = self._calculate_monthly_growth(user)
        logger.debug(f"Monthly growth calculation: {monthly_growth}")
        
        # 4. Reports Generated This Quarter - Count from Report model
        reports_generated = self._calculate_reports_generated_this_quarter(user)
        logger.debug(f"Reports generated this quarter: {reports_generated}")
        
        dashboard_summary = schemas.DashboardSummaryResponse(
            total_clients=total_clients,
            assets_under_management=round(aum, 2),
            monthly_growth_percentage=monthly_growth,
            reports_generated_this_quarter=reports_generated
        )
        
        logger.info(
            f"Dashboard summary calculated for user {user.id}: "
            f"clients={total_clients}, AUM=${aum:.2f}, "
            f"growth={monthly_growth}, reports={reports_generated}"
        )
        
        return dashboard_summary
    
    def _calculate_assets_under_management(self, user: User) -> float:
        """
        Calculate total Assets Under Management for user's accessible clients.
        
        Args:
            user: User to calculate AUM for
            
        Returns:
            Total AUM as float
        """
        try:
            # Get portfolios based on user role
            portfolios_query = select(Portfolio).join(Client)
            if user.role != UserRole.ADMIN:
                # Non-admin users only see portfolios of their assigned clients
                portfolios_query = portfolios_query.where(Client.owner_id == user.id)
            
            portfolios = self.db.exec(portfolios_query).all()
            
            if not portfolios:
                logger.warning(f"No portfolios found for user {user.id}")
                return 0.0
            
            total_aum = 0.0
            portfolios_valued = 0
            
            for portfolio in portfolios:
                try:
                    # Get portfolio valuation using existing service
                    valuation = self.portfolio_service.get_portfolio_valuation(portfolio.id)
                    total_aum += valuation.total_value
                    portfolios_valued += 1
                    
                    logger.debug(
                        f"Portfolio {portfolio.id} '{portfolio.name}': "
                        f"Value=${valuation.total_value:.2f}"
                    )
                    
                except Exception as e:
                    logger.error(
                        f"Failed to valuate portfolio {portfolio.id} for AUM calculation: {str(e)}"
                    )
                    # Continue with other portfolios instead of failing completely
                    continue
            
            logger.info(
                f"AUM calculation complete: ${total_aum:.2f} "
                f"from {portfolios_valued}/{len(portfolios)} portfolios"
            )
            
            return total_aum
            
        except Exception as e:
            logger.error(f"Failed to calculate AUM for user {user.id}: {str(e)}")
            # Return 0 instead of raising exception to prevent dashboard failure
            return 0.0
    
    def _calculate_reports_generated_this_quarter(self, user: User) -> int:
        """
        Calculate total reports generated this quarter for user's accessible data.
        
        Args:
            user: User to calculate reports for
            
        Returns:
            Total reports generated this quarter as int
        """
        try:
            from datetime import datetime, timezone
            
            # Calculate current quarter start date
            now = datetime.now(timezone.utc)
            current_year = now.year
            current_month = now.month
            
            # Determine quarter start month
            if current_month in [1, 2, 3]:
                quarter_start_month = 1
            elif current_month in [4, 5, 6]:
                quarter_start_month = 4
            elif current_month in [7, 8, 9]:
                quarter_start_month = 7
            else:  # [10, 11, 12]
                quarter_start_month = 10
            
            # Create quarter start datetime
            quarter_start = datetime(current_year, quarter_start_month, 1, tzinfo=timezone.utc)
            
            # Build query with proper filtering
            reports_query = select(func.count(Report.id)).where(
                Report.generated_at >= quarter_start
            )
            
            # Apply role-based access control
            if user.role != UserRole.ADMIN:
                # Non-admin users only see reports they generated
                reports_query = reports_query.where(Report.advisor_id == user.id)
            
            reports_count = self.db.exec(reports_query).first() or 0
            
            logger.info(
                f"Reports generated this quarter for user {user.id}: {reports_count} "
                f"(since {quarter_start.strftime('%Y-%m-%d')})"
            )
            
            return reports_count
            
        except Exception as e:
            logger.error(f"Failed to calculate reports for user {user.id}: {str(e)}")
            # Return 0 instead of raising exception to prevent dashboard failure
            return 0

    def _calculate_monthly_growth(self, user: User) -> Optional[float]:
        """
        Calculate monthly growth percentage based on portfolio snapshots.
        
        Args:
            user: User to calculate growth for
            
        Returns:
            Monthly growth as decimal (0.082 for 8.2%) or None if insufficient data
        """
        try:
            from datetime import datetime, timezone
            from decimal import Decimal
            
            # Calculate current month start date
            now = datetime.now(timezone.utc)
            current_month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
            
            # Get portfolios based on user role
            portfolios_query = select(Portfolio).join(Client)
            if user.role != UserRole.ADMIN:
                # Non-admin users only see portfolios of their assigned clients
                portfolios_query = portfolios_query.where(Client.owner_id == user.id)
            
            portfolios = self.db.exec(portfolios_query).all()
            
            if not portfolios:
                logger.warning(f"No portfolios found for user {user.id}")
                return None
            
            portfolio_ids = [p.id for p in portfolios]
            
            # Get current AUM from most recent snapshots
            current_snapshots_query = (
                select(
                    PortfolioSnapshot.portfolio_id,
                    func.max(PortfolioSnapshot.timestamp).label('latest_timestamp')
                )
                .where(PortfolioSnapshot.portfolio_id.in_(portfolio_ids))
                .group_by(PortfolioSnapshot.portfolio_id)
            ).subquery()
            
            current_aum_query = (
                select(func.sum(PortfolioSnapshot.value))
                .join(
                    current_snapshots_query,
                    (PortfolioSnapshot.portfolio_id == current_snapshots_query.c.portfolio_id) &
                    (PortfolioSnapshot.timestamp == current_snapshots_query.c.latest_timestamp)
                )
            )
            
            current_aum = self.db.exec(current_aum_query).first()
            
            if not current_aum or current_aum == 0:
                logger.warning(f"No current AUM data found for user {user.id}")
                return None
            
            # Get start-of-month AUM from snapshots closest to month start
            # Find the latest snapshot before or at the start of current month for each portfolio
            month_start_snapshots_query = (
                select(
                    PortfolioSnapshot.portfolio_id,
                    func.max(PortfolioSnapshot.timestamp).label('month_start_timestamp')
                )
                .where(PortfolioSnapshot.portfolio_id.in_(portfolio_ids))
                .where(PortfolioSnapshot.timestamp <= current_month_start)
                .group_by(PortfolioSnapshot.portfolio_id)
            ).subquery()
            
            start_of_month_aum_query = (
                select(func.sum(PortfolioSnapshot.value))
                .join(
                    month_start_snapshots_query,
                    (PortfolioSnapshot.portfolio_id == month_start_snapshots_query.c.portfolio_id) &
                    (PortfolioSnapshot.timestamp == month_start_snapshots_query.c.month_start_timestamp)
                )
            )
            
            start_of_month_aum = self.db.exec(start_of_month_aum_query).first()
            
            if not start_of_month_aum or start_of_month_aum == 0:
                logger.warning(f"No start-of-month AUM data found for user {user.id}")
                return None
            
            # Calculate growth percentage
            # Convert Decimal to float for calculation
            current_aum_float = float(current_aum)
            start_of_month_aum_float = float(start_of_month_aum)
            
            growth_percentage = (current_aum_float / start_of_month_aum_float) - 1
            
            logger.info(
                f"Monthly growth calculation for user {user.id}: "
                f"Current=${current_aum_float:.2f}, "
                f"StartOfMonth=${start_of_month_aum_float:.2f}, "
                f"Growth={growth_percentage:.4f} ({growth_percentage*100:.2f}%)"
            )
            
            return round(growth_percentage, 4)  # Return as decimal (0.0523 for 5.23%)
            
        except Exception as e:
            logger.error(f"Failed to calculate monthly growth for user {user.id}: {str(e)}")
            # Return None instead of raising exception to prevent dashboard failure
            return None


# ============ INVESTMENT ACCOUNT SERVICE ============

class InvestmentAccountService:
    """Service class for Investment Account business logic with authorization."""
    
    def __init__(self, db_session: Session):
        """Initialize the investment account service."""
        self.db = db_session
    
    def create_account_for_client(
        self,
        account_data: schemas.InvestmentAccountCreate,
        client_id: int,
        current_advisor: User
    ) -> InvestmentAccount:
        """
        Create an investment account for a client with proper authorization.
        
        Args:
            account_data: Investment account creation data
            client_id: ID of the client
            current_advisor: Current authenticated advisor
            
        Returns:
            Created InvestmentAccount instance
            
        Raises:
            HTTPException: If authorization fails or client not found
        """
        from fastapi import HTTPException, status
        
        # Verify client ownership/access
        client = self._verify_client_access(client_id, current_advisor)
        
        try:
            # Create the investment account
            return crud.create_client_investment_account(
                session=self.db,
                account_data=account_data,
                client_id=client_id
            )
        except Exception as e:
            logger.error(f"Failed to create investment account for client {client_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create investment account: {str(e)}"
            )
    
    def get_account(self, account_id: int, current_advisor: User) -> InvestmentAccount:
        """
        Get an investment account with proper authorization.
        
        Args:
            account_id: ID of the investment account
            current_advisor: Current authenticated advisor
            
        Returns:
            InvestmentAccount instance
            
        Raises:
            HTTPException: If authorization fails or account not found
        """
        from fastapi import HTTPException, status
        
        # Get the account
        account = crud.get_investment_account(session=self.db, account_id=account_id)
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Investment account not found"
            )
        
        # Verify client ownership/access through the account's client
        self._verify_client_access(account.client_id, current_advisor)
        
        return account
    
    def get_accounts_by_client(
        self,
        client_id: int,
        current_advisor: User,
        skip: int = 0,
        limit: int = 100
    ) -> List[InvestmentAccount]:
        """
        Get all investment accounts for a client with proper authorization.
        
        Args:
            client_id: ID of the client
            current_advisor: Current authenticated advisor
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of InvestmentAccount instances
            
        Raises:
            HTTPException: If authorization fails or client not found
        """
        # Verify client ownership/access
        self._verify_client_access(client_id, current_advisor)
        
        return crud.get_investment_accounts_by_client(
            session=self.db,
            client_id=client_id,
            skip=skip,
            limit=limit
        )
    
    def update_account(
        self,
        account_id: int,
        update_data: schemas.InvestmentAccountUpdate,
        current_advisor: User
    ) -> InvestmentAccount:
        """
        Update an investment account with proper authorization.
        
        Args:
            account_id: ID of the investment account
            update_data: Update data
            current_advisor: Current authenticated advisor
            
        Returns:
            Updated InvestmentAccount instance
            
        Raises:
            HTTPException: If authorization fails or account not found
        """
        from fastapi import HTTPException, status
        
        # Get and verify account access
        account = self.get_account(account_id, current_advisor)
        
        try:
            return crud.update_investment_account(
                session=self.db,
                account_db_obj=account,
                update_data=update_data
            )
        except Exception as e:
            logger.error(f"Failed to update investment account {account_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to update investment account: {str(e)}"
            )
    
    def delete_account(self, account_id: int, current_advisor: User) -> InvestmentAccount:
        """
        Delete an investment account with proper authorization.
        
        Args:
            account_id: ID of the investment account
            current_advisor: Current authenticated advisor
            
        Returns:
            Deleted InvestmentAccount instance
            
        Raises:
            HTTPException: If authorization fails or account not found
        """
        from fastapi import HTTPException, status
        
        # Get and verify account access (this also checks authorization)
        account = self.get_account(account_id, current_advisor)
        
        deleted_account = crud.delete_investment_account(session=self.db, account_id=account_id)
        if not deleted_account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Investment account not found"
            )
        
        return deleted_account
    
    def _verify_client_access(self, client_id: int, current_advisor: User) -> Client:
        """
        Verify that the current advisor has access to the specified client.
        
        Args:
            client_id: ID of the client
            current_advisor: Current authenticated advisor
            
        Returns:
            Client instance if access is granted
            
        Raises:
            HTTPException: If authorization fails or client not found
        """
        from fastapi import HTTPException, status
        
        # ADMIN users can access any client
        if current_advisor.role == UserRole.ADMIN:
            client = crud.get_client(session=self.db, client_id=client_id, owner_id=None)
            if not client:
                # For ADMIN, we need to check without owner restriction
                client = self.db.get(Client, client_id)
            if not client:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Client not found"
                )
            return client
        
        # Non-ADMIN users can only access their own clients
        client = crud.get_client(session=self.db, client_id=client_id, owner_id=current_advisor.id)
        if not client:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only manage accounts for your own clients."
            )
        
        return client


# ============ INSURANCE POLICY SERVICE ============

class InsurancePolicyService:
    """Service class for Insurance Policy business logic with authorization."""
    
    def __init__(self, db_session: Session):
        """Initialize the insurance policy service."""
        self.db = db_session
    
    def create_policy_for_client(
        self,
        policy_data: schemas.InsurancePolicyCreate,
        client_id: int,
        current_advisor: User
    ) -> InsurancePolicy:
        """
        Create an insurance policy for a client with proper authorization.
        
        Args:
            policy_data: Insurance policy creation data
            client_id: ID of the client
            current_advisor: Current authenticated advisor
            
        Returns:
            Created InsurancePolicy instance
            
        Raises:
            HTTPException: If authorization fails or client not found
        """
        from fastapi import HTTPException, status
        
        # Verify client ownership/access
        client = self._verify_client_access(client_id, current_advisor)
        
        try:
            # Create the insurance policy
            return crud.create_client_insurance_policy(
                session=self.db,
                policy_data=policy_data,
                client_id=client_id
            )
        except ValueError as e:
            # Policy number already exists
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            logger.error(f"Failed to create insurance policy for client {client_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create insurance policy: {str(e)}"
            )
    
    def get_policy(self, policy_id: int, current_advisor: User) -> InsurancePolicy:
        """
        Get an insurance policy with proper authorization.
        
        Args:
            policy_id: ID of the insurance policy
            current_advisor: Current authenticated advisor
            
        Returns:
            InsurancePolicy instance
            
        Raises:
            HTTPException: If authorization fails or policy not found
        """
        from fastapi import HTTPException, status
        
        # Get the policy
        policy = crud.get_insurance_policy(session=self.db, policy_id=policy_id)
        if not policy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Insurance policy not found"
            )
        
        # Verify client ownership/access through the policy's client
        self._verify_client_access(policy.client_id, current_advisor)
        
        return policy
    
    def get_policies_by_client(
        self,
        client_id: int,
        current_advisor: User,
        skip: int = 0,
        limit: int = 100
    ) -> List[InsurancePolicy]:
        """
        Get all insurance policies for a client with proper authorization.
        
        Args:
            client_id: ID of the client
            current_advisor: Current authenticated advisor
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of InsurancePolicy instances
            
        Raises:
            HTTPException: If authorization fails or client not found
        """
        # Verify client ownership/access
        self._verify_client_access(client_id, current_advisor)
        
        return crud.get_insurance_policies_by_client(
            session=self.db,
            client_id=client_id,
            skip=skip,
            limit=limit
        )
    
    def update_policy(
        self,
        policy_id: int,
        update_data: schemas.InsurancePolicyUpdate,
        current_advisor: User
    ) -> InsurancePolicy:
        """
        Update an insurance policy with proper authorization.
        
        Args:
            policy_id: ID of the insurance policy
            update_data: Update data
            current_advisor: Current authenticated advisor
            
        Returns:
            Updated InsurancePolicy instance
            
        Raises:
            HTTPException: If authorization fails or policy not found
        """
        from fastapi import HTTPException, status
        
        # Get and verify policy access
        policy = self.get_policy(policy_id, current_advisor)
        
        try:
            return crud.update_insurance_policy(
                session=self.db,
                policy_db_obj=policy,
                update_data=update_data
            )
        except ValueError as e:
            # Policy number conflict
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            logger.error(f"Failed to update insurance policy {policy_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to update insurance policy: {str(e)}"
            )
    
    def delete_policy(self, policy_id: int, current_advisor: User) -> InsurancePolicy:
        """
        Delete an insurance policy with proper authorization.
        
        Args:
            policy_id: ID of the insurance policy
            current_advisor: Current authenticated advisor
            
        Returns:
            Deleted InsurancePolicy instance
            
        Raises:
            HTTPException: If authorization fails or policy not found
        """
        from fastapi import HTTPException, status
        
        # Get and verify policy access (this also checks authorization)
        policy = self.get_policy(policy_id, current_advisor)
        
        deleted_policy = crud.delete_insurance_policy(session=self.db, policy_id=policy_id)
        if not deleted_policy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Insurance policy not found"
            )
        
        return deleted_policy
    
    def _verify_client_access(self, client_id: int, current_advisor: User) -> Client:
        """
        Verify that the current advisor has access to the specified client.
        
        Args:
            client_id: ID of the client
            current_advisor: Current authenticated advisor
            
        Returns:
            Client instance if access is granted
            
        Raises:
            HTTPException: If authorization fails or client not found
        """
        from fastapi import HTTPException, status
        
        # ADMIN users can access any client
        if current_advisor.role == UserRole.ADMIN:
            client = crud.get_client(session=self.db, client_id=client_id, owner_id=None)
            if not client:
                # For ADMIN, we need to check without owner restriction
                client = self.db.get(Client, client_id)
            if not client:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Client not found"
                )
            return client
        
        # Non-ADMIN users can only access their own clients
        client = crud.get_client(session=self.db, client_id=client_id, owner_id=current_advisor.id)
        if not client:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only manage policies for your own clients."
            )
        
        return client


class NotificationService:
    """Service class for managing user notifications."""
    
    def __init__(self, db_session: Session):
        """Initialize the notification service."""
        self.db = db_session
    
    def create_notification(self, user_id: int, message: str) -> Notification:
        """
        Create a new notification for a user.
        
        Args:
            user_id: ID of the user to notify
            message: Notification message content
            
        Returns:
            Created Notification instance
        """
        notification = Notification(
            user_id=user_id,
            message=message
        )
        
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        
        logger.info(f"Notification created for user {user_id}: {message}")
        return notification