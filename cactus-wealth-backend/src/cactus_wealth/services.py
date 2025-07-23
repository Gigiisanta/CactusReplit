import asyncio
import hashlib
import json
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from pathlib import Path
import os
from typing import Any

import cactus_wealth.crud as crud
import numpy as np
import pandas as pd
import redis
import yfinance as yf
from cactus_wealth import schemas
from cactus_wealth.core.config import settings
from cactus_wealth.core.dataprovider import MarketDataProvider
from cactus_wealth.models import (
    Asset,
    Client,
    InsurancePolicy,
    InvestmentAccount,
    Notification,
    Portfolio,
    PortfolioSnapshot,
    Position,
    Report,
    User,
    UserRole,
)
from cactus_wealth.repositories import (
    AssetRepository,
    ClientRepository,
    NotificationRepository,
    PortfolioRepository,
)
from cactus_wealth.schemas import (
    BacktestDataPoint,
    BacktestRequest,
    BacktestResponse,
    PortfolioComposition,
)
from jinja2 import Environment, FileSystemLoader
from sqlmodel import Session, func, select
from .core.logging_config import get_structured_logger
from pydantic import BaseModel
from fastapi import HTTPException, status, UploadFile

logger = get_structured_logger(__name__)


class SyncEvent(BaseModel):
    """Event model for SyncBridge communication"""

    event: str
    payload: dict[str, Any]


class SyncService:
    """Service for synchronizing data with external systems via SyncBridge"""

    def __init__(self):
        self.sync_bridge_url = os.getenv("TWENTY_SYNC_URL", "http://sync_bridge:8001")
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis_client = redis.from_url(self.redis_url, decode_responses=True)

    def emit_client_event(self, event_type: str, client_data: dict[str, Any]) -> bool:
        """Encola un evento de cliente en Redis para ser procesado por un worker."""
        event = {
            "event": event_type,
            "payload": client_data,
        }
        try:
            self.redis_client.rpush("outbox:client_events", json.dumps(event))
            return True
        except Exception as e:
            print(f"[ERROR] No se pudo encolar evento: {e}")
            return False

    async def client_created(self, client: "Client") -> None:
        client_data = {
            "id": client.id,
            "first_name": client.first_name,
            "last_name": client.last_name,
            "email": client.email,
            "status": (
                client.status.value
                if hasattr(client.status, "value")
                else str(client.status)
            ),
            "risk_profile": (
                client.risk_profile.value
                if hasattr(client.risk_profile, "value")
                else str(client.risk_profile)
            ),
            "lead_source": (
                client.lead_source.value
                if hasattr(client.lead_source, "value")
                else str(client.lead_source) if client.lead_source else None
            ),
            "notes": client.notes,
            "portfolio_name": client.portfolio_name,
            "created_at": client.created_at.isoformat() if client.created_at else None,
            "updated_at": client.updated_at.isoformat() if client.updated_at else None,
        }
        self.emit_client_event("client.created", client_data)

    async def client_updated(self, client: "Client") -> None:
        client_data = {
            "id": client.id,
            "first_name": client.first_name,
            "last_name": client.last_name,
            "email": client.email,
            "status": (
                client.status.value
                if hasattr(client.status, "value")
                else str(client.status)
            ),
            "risk_profile": (
                client.risk_profile.value
                if hasattr(client.risk_profile, "value")
                else str(client.risk_profile)
            ),
            "lead_source": (
                client.lead_source.value
                if hasattr(client.lead_source, "value")
                else str(client.lead_source) if client.lead_source else None
            ),
            "notes": client.notes,
            "portfolio_name": client.portfolio_name,
            "created_at": client.created_at.isoformat() if client.created_at else None,
            "updated_at": client.updated_at.isoformat() if client.updated_at else None,
        }
        self.emit_client_event("client.updated", client_data)

    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()


# Global sync service instance
sync_service = SyncService()


class PortfolioService:
    """
    🚀 REFACTORED: Clean service class following Repository pattern.

    Service class for portfolio business logic with clean separation
    between business logic and data access through repositories.
    """

    def __init__(self, db_session: Session, market_data_provider: MarketDataProvider):
        """
        Initialize the portfolio service with repositories.

        Args:
            db_session: Database session
            market_data_provider: Provider for market data
        """
        # 🚀 CLEAN ARCHITECTURE: Use repositories instead of direct DB access
        self.portfolio_repo = PortfolioRepository(db_session)
        self.asset_repo = AssetRepository(db_session)
        self.notification_repo = NotificationRepository(db_session)
        self.client_repo = ClientRepository(db_session)

        self.market_data_provider = market_data_provider
        self.notification_service = NotificationService(db_session)

    def get_portfolio_valuation(self, portfolio_id: int) -> schemas.PortfolioValuation:
        """
        🚀 REFACTORED: Calculate portfolio valuation using clean repository pattern.

        Args:
            portfolio_id: ID of the portfolio to valuate

        Returns:
            PortfolioValuation with calculated values

        Raises:
            ValueError: If portfolio not found
            Exception: For market data retrieval errors
        """
        logger.info("portfolio_valuation_started", portfolio_id=portfolio_id)

        # 🚀 CLEAN: Use repository instead of direct DB queries
        portfolio = self.portfolio_repo.get_with_positions(portfolio_id)

        if not portfolio:
            raise ValueError(f"Portfolio with ID {portfolio_id} not found")

        # 🚀 CLEAN: Get positions through repository
        positions = self.portfolio_repo.get_positions_for_portfolio(portfolio_id)

        if not positions:
            logger.warning("portfolio_has_no_positions", portfolio_id=portfolio_id)
            return schemas.PortfolioValuation(
                portfolio_id=portfolio_id,
                portfolio_name=portfolio.name,
                total_value=0.0,
                total_cost_basis=0.0,
                total_pnl=0.0,
                total_pnl_percentage=0.0,
                positions_count=0,
                last_updated=datetime.utcnow(),
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
            "portfolio_valuation_completed",
            portfolio_id=portfolio_id,
            total_value=round(total_value, 2),
            total_cost_basis=round(total_cost_basis, 2),
            total_pnl=round(total_pnl, 2),
            total_pnl_percentage=round(total_pnl_percentage, 2),
            positions_valued=positions_valued,
        )

        return schemas.PortfolioValuation(
            portfolio_id=portfolio_id,
            portfolio_name=portfolio.name,
            total_value=round(total_value, 2),
            total_cost_basis=round(total_cost_basis, 2),
            total_pnl=round(total_pnl, 2),
            total_pnl_percentage=round(total_pnl_percentage, 2),
            positions_count=positions_valued,
            last_updated=datetime.utcnow(),
        )

    def create_snapshot_for_portfolio(self, portfolio_id: int) -> PortfolioSnapshot:
        """
        🚀 REFACTORED: Create portfolio snapshot using clean repository pattern.

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

            # 🚀 CLEAN: Create snapshot through repository
            snapshot = self.portfolio_repo.create_snapshot(
                portfolio_id=portfolio_id,
                value=Decimal(str(valuation.total_value)),
                timestamp=datetime.utcnow(),
            )

            logger.info(
                f"Snapshot created for portfolio {portfolio_id}: "
                f"ID={snapshot.id}, Value=${snapshot.value}, "
                f"Timestamp={snapshot.timestamp}"
            )

            # Create notification for the portfolio owner
            try:
                # 🚀 CLEAN: Get portfolio through repository
                portfolio = self.portfolio_repo.get_by_id(portfolio_id)
                if portfolio and portfolio.client:
                    owner_id = portfolio.client.owner_id
                    portfolio_name = valuation.portfolio_name
                    total_value = valuation.total_value

                    self.notification_service.create_notification(
                        user_id=owner_id,
                        message=f"Valoración del portfolio '{portfolio_name}' actualizada. Nuevo valor: ${total_value:,.2f}",
                    )
            except Exception as e:
                logger.warning(
                    f"Failed to create notification for portfolio snapshot: {str(e)}"
                )

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

        # Setup Jinja2 template environment with autoescape enabled for security
        current_dir = Path(__file__).parent
        templates_dir = current_dir / "templates"
        self.env = Environment(
            loader=FileSystemLoader(str(templates_dir)),
            autoescape=True,  # Enable autoescape to prevent XSS vulnerabilities
        )

    def generate_portfolio_report_pdf(
        self, valuation_data: schemas.PortfolioValuation, portfolio_name: str
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
        logger.info(
            f"Generating PDF report for portfolio {valuation_data.portfolio_id}"
        )

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
                    enhanced_position = type(
                        "EnhancedPosition",
                        (),
                        {
                            "id": position.id,
                            "quantity": position.quantity,
                            "purchase_price": position.purchase_price,
                            "current_price": current_price,
                            "portfolio_id": position.portfolio_id,
                            "asset_id": position.asset_id,
                            "asset": position.asset,
                            "created_at": position.created_at,
                            "updated_at": position.updated_at,
                        },
                    )()

                    enhanced_positions.append(enhanced_position)

                except Exception as e:
                    logger.warning(
                        f"Failed to get current price for {position.asset.ticker_symbol}: {str(e)}"
                    )
                    # Use purchase price as fallback
                    enhanced_position = type(
                        "EnhancedPosition",
                        (),
                        {
                            "id": position.id,
                            "quantity": position.quantity,
                            "purchase_price": position.purchase_price,
                            "current_price": position.purchase_price,  # Fallback
                            "portfolio_id": position.portfolio_id,
                            "asset_id": position.asset_id,
                            "asset": position.asset,
                            "created_at": position.created_at,
                            "updated_at": position.updated_at,
                        },
                    )()

                    enhanced_positions.append(enhanced_position)

            # Prepare template data
            template_data = {
                "portfolio_id": valuation_data.portfolio_id,
                "portfolio_name": valuation_data.portfolio_name,
                "total_value": valuation_data.total_value,
                "total_cost_basis": valuation_data.total_cost_basis,
                "total_pnl": valuation_data.total_pnl,
                "total_pnl_percentage": valuation_data.total_pnl_percentage,
                "positions_count": valuation_data.positions_count,
                "last_updated": valuation_data.last_updated,
                "report_date": datetime.utcnow(),
                "positions": enhanced_positions,
            }

            # Load and render template
            template = self.env.get_template("report.html")
            html_content = template.render(**template_data)

            # Convert HTML to PDF using WeasyPrint
            try:
                import weasyprint
            except ImportError as e:
                raise Exception(
                    f"WeasyPrint is not available. Please install system dependencies for PDF generation: {str(e)}"
                )

            logger.info("Converting HTML to PDF using WeasyPrint")

            # Get the base URL for CSS resolution
            current_dir = Path(__file__).parent
            templates_dir = current_dir / "templates"
            base_url = f"file://{templates_dir}/"

            # Generate PDF
            pdf_bytes = weasyprint.HTML(
                string=html_content, base_url=base_url
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
        self, client_id: int, advisor: User, report_type: str = "PORTFOLIO_SUMMARY"
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
        logger.info(
            f"Starting report generation for client {client_id} by advisor {advisor.id}"
        )

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
            portfolio_statement = select(Portfolio).where(
                Portfolio.client_id == client_id
            )
            portfolios = self.db.exec(portfolio_statement).all()

            if not portfolios:
                raise ValueError(f"No portfolios found for client {client_id}")

            # Use the first portfolio for the report
            portfolio = portfolios[0]

            # 3. Get portfolio valuation data
            valuation_data = self.portfolio_service.get_portfolio_valuation(
                portfolio.id
            )

            # 4. Generate PDF
            pdf_bytes = self.generate_portfolio_report_pdf(
                valuation_data, portfolio.name
            )

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
                generated_at=datetime.utcnow(),
            )

            self.db.add(report)
            self.db.commit()
            self.db.refresh(report)

            logger.info(f"Report record created with ID {report.id}")

            # Create notification for the advisor
            try:
                await self.notification_service.create_notification_async(
                    user_id=advisor.id,
                    message=f"Se ha generado un nuevo reporte para {client.first_name} {client.last_name}",
                )
            except Exception as e:
                logger.warning(
                    f"Failed to create notification for report generation: {str(e)}"
                )

            return schemas.ReportResponse(
                success=True,
                message=f"Report generated successfully for {client.first_name} {client.last_name}",
                report_id=report.id,
                file_path=str(file_path),
            )

        except ValueError as e:
            logger.warning(f"Validation error during report generation: {str(e)}")
            return schemas.ReportResponse(success=False, message=str(e))
        except Exception as e:
            logger.error(f"Unexpected error during report generation: {str(e)}")
            # Rollback transaction if report creation failed
            self.db.rollback()
            return schemas.ReportResponse(
                success=False, message=f"Report generation failed: {str(e)}"
            )


class DashboardService:
    """
    Optimized service for dashboard calculations with Redis caching.

    Features:
    - Redis-based caching with 5-minute TTL for dashboard data
    - Optimized database queries with eager loading
    - Role-based data filtering
    - Efficient AUM calculations
    """

    def __init__(self, db_session: Session, market_data_provider=None):
        """
        Initialize the dashboard service.

        Args:
            db_session: Database session
            market_data_provider: Provider for market data
        """
        self.db = db_session
        self.market_data_provider = market_data_provider
        self.portfolio_service = PortfolioService(db_session, market_data_provider)

    def _get_cache_key(self, user_id: int, user_role: str) -> str:
        """Generate cache key for dashboard data."""
        return f"dashboard:summary:{user_id}:{user_role}"

    def _get_cached_dashboard(self, user_id: int, user_role: str) -> dict | None:
        """Get cached dashboard data."""
        if not REDIS_AVAILABLE:
            return None

        try:
            cache_key = self._get_cache_key(user_id, user_role)
            cached_data = redis_client.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            logger.warning(f"Failed to get cached dashboard: {e}")

        return None

    def _cache_dashboard(self, user_id: int, user_role: str, data: dict) -> None:
        """Cache dashboard data for 5 minutes."""
        if not REDIS_AVAILABLE:
            return

        try:
            cache_key = self._get_cache_key(user_id, user_role)
            redis_client.setex(cache_key, 300, json.dumps(data))  # 5 minutes TTL
        except Exception as e:
            logger.warning(f"Failed to cache dashboard: {e}")

    def get_dashboard_summary(self, user: User) -> schemas.DashboardSummaryResponse:
        """
        Calculate dashboard KPIs with caching and optimized queries.

        Args:
            user: Authenticated user requesting the dashboard data

        Returns:
            DashboardSummaryResponse with calculated KPIs
        """
        logger.info(
            f"Calculating dashboard summary for user {user.id} with role {user.role}"
        )

        # Try to get cached data first
        cached_data = self._get_cached_dashboard(user.id, user.role.value)
        if cached_data:
            logger.info(f"Using cached dashboard data for user {user.id}")
            return schemas.DashboardSummaryResponse(**cached_data)

        # Apply role-based filtering for clients
        clients_query = select(Client)
        if user.role != UserRole.ADMIN:
            # Non-admin users only see their assigned clients
            clients_query = clients_query.where(Client.owner_id == user.id)

        # 1. Total Clients Count - Optimized query
        total_clients = len(self.db.exec(clients_query).all())
        logger.debug(f"Total clients: {total_clients}")

        # 2. Assets Under Management (AUM) - Optimized calculation
        aum = self._calculate_assets_under_management_optimized(user)
        logger.debug(f"Assets under management: ${aum:.2f}")

        # 3. Monthly Growth Percentage - Real implementation
        monthly_growth = self._calculate_monthly_growth(user)
        logger.debug(f"Monthly growth calculation: {monthly_growth}")

        # 4. Reports Generated This Quarter - Optimized query
        reports_generated = self._calculate_reports_generated_this_quarter_optimized(
            user
        )
        logger.debug(f"Reports generated this quarter: {reports_generated}")

        dashboard_summary = schemas.DashboardSummaryResponse(
            total_clients=total_clients,
            assets_under_management=round(aum, 2),
            monthly_growth_percentage=monthly_growth,
            reports_generated_this_quarter=reports_generated,
        )

        # Cache the result
        self._cache_dashboard(user.id, user.role.value, dashboard_summary.model_dump())

        return dashboard_summary

    def _calculate_assets_under_management_optimized(self, user: User) -> float:
        """
        Optimized AUM calculation with efficient queries.
        """
        try:
            # Use a single optimized query for AUM calculation
            if user.role == UserRole.ADMIN:
                # Admin sees all portfolios
                aum_query = select(func.sum(Portfolio.current_value)).select_from(
                    Portfolio
                )
            else:
                # Non-admin users only see their portfolios
                aum_query = (
                    select(func.sum(Portfolio.current_value))
                    .select_from(Portfolio)
                    .join(Client)
                    .where(Client.owner_id == user.id)
                )

            result = self.db.exec(aum_query).first()
            return float(result) if result else 0.0

        except Exception as e:
            logger.error(f"Error calculating AUM: {e}")
            return 0.0

    def _calculate_reports_generated_this_quarter_optimized(self, user: User) -> int:
        """
        Optimized reports count for current quarter.
        """
        try:
            # Calculate quarter boundaries
            now = datetime.utcnow()
            quarter_start = datetime(now.year, ((now.month - 1) // 3) * 3 + 1, 1)

            # Build optimized query
            reports_query = (
                select(func.count(Report.id))
                .select_from(Report)
                .where(Report.generated_at >= quarter_start)
            )

            # Apply role-based filtering
            if user.role != UserRole.ADMIN:
                reports_query = reports_query.where(Report.advisor_id == user.id)

            result = self.db.exec(reports_query).first()
            return int(result) if result else 0

        except Exception as e:
            logger.error(f"Error calculating reports count: {e}")
            return 0

    def _calculate_monthly_growth(self, user: User) -> float | None:
        """
        Calculate monthly growth percentage based on portfolio snapshots.

        Args:
            user: User to calculate growth for

        Returns:
            Monthly growth as decimal (0.082 for 8.2%) or None if insufficient data
        """
        try:
            from datetime import datetime

            # Calculate current month start date
            now = datetime.now(UTC)
            current_month_start = datetime(now.year, now.month, 1, tzinfo=UTC)

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
                    func.max(PortfolioSnapshot.timestamp).label("latest_timestamp"),
                )
                .where(PortfolioSnapshot.portfolio_id.in_(portfolio_ids))
                .group_by(PortfolioSnapshot.portfolio_id)
            ).subquery()

            current_aum_query = select(func.sum(PortfolioSnapshot.value)).join(
                current_snapshots_query,
                (
                    PortfolioSnapshot.portfolio_id
                    == current_snapshots_query.c.portfolio_id
                )
                & (
                    PortfolioSnapshot.timestamp
                    == current_snapshots_query.c.latest_timestamp
                ),
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
                    func.max(PortfolioSnapshot.timestamp).label(
                        "month_start_timestamp"
                    ),
                )
                .where(PortfolioSnapshot.portfolio_id.in_(portfolio_ids))
                .where(PortfolioSnapshot.timestamp <= current_month_start)
                .group_by(PortfolioSnapshot.portfolio_id)
            ).subquery()

            start_of_month_aum_query = select(func.sum(PortfolioSnapshot.value)).join(
                month_start_snapshots_query,
                (
                    PortfolioSnapshot.portfolio_id
                    == month_start_snapshots_query.c.portfolio_id
                )
                & (
                    PortfolioSnapshot.timestamp
                    == month_start_snapshots_query.c.month_start_timestamp
                ),
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
                f"Growth={growth_percentage:.4f} ({growth_percentage * 100:.2f}%)"
            )

            return round(growth_percentage, 4)  # Return as decimal (0.0523 for 5.23%)

        except Exception as e:
            logger.error(
                f"Failed to calculate monthly growth for user {user.id}: {str(e)}"
            )
            # Return None instead of raising exception to prevent dashboard failure
            return None

    def get_aum_history(
        self, user: User, days: int = 30
    ) -> list[schemas.AUMHistoryPoint]:
        """
        🚀 INSIGHT ANALYTICS: Get AUM (Assets Under Management) historical data for charts.

        Returns daily AUM totals based on portfolio snapshots, respecting user permissions.

        Args:
            user: Current authenticated user
            days: Number of days to look back (default: 30)

        Returns:
            List of AUMHistoryPoint objects for time series visualization
        """
        try:
            # Initialize portfolio repository
            from .repositories.portfolio_repository import PortfolioRepository

            portfolio_repo = PortfolioRepository(self.db)

            # Determine advisor_id based on user role
            advisor_id = None if user.role == UserRole.ADMIN else user.id

            # Get AUM history data
            aum_data = portfolio_repo.get_aum_history(days=days, advisor_id=advisor_id)

            # Convert to schema objects
            aum_history_points = [
                schemas.AUMHistoryPoint(date=item["date"], value=item["value"])
                for item in aum_data
            ]

            logger.info(
                f"AUM history retrieved for user {user.id}: "
                f"{len(aum_history_points)} data points over {days} days"
            )

            return aum_history_points

        except Exception as e:
            logger.error(f"Failed to get AUM history for user {user.id}: {str(e)}")
            # Return empty list instead of raising exception to prevent frontend failure
            return []


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
        current_advisor: User,
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
        # Verify client ownership/access
        self._verify_client_access(client_id, current_advisor)

        try:
            # Create the investment account
            return crud.create_client_investment_account(
                session=self.db, account_data=account_data, client_id=client_id
            )
        except Exception as e:
            logger.error(
                f"Failed to create investment account for client {client_id}: {str(e)}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create investment account: {str(e)}",
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
        # Get the account
        account = crud.get_investment_account(session=self.db, account_id=account_id)
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Investment account not found",
            )

        # Verify client ownership/access through the account's client
        self._verify_client_access(account.client_id, current_advisor)

        return account

    def get_accounts_by_client(
        self, client_id: int, current_advisor: User, skip: int = 0, limit: int = 100
    ) -> list[InvestmentAccount]:
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
            session=self.db, client_id=client_id, skip=skip, limit=limit
        )

    def update_account(
        self,
        account_id: int,
        update_data: schemas.InvestmentAccountUpdate,
        current_advisor: User,
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
        # Get and verify account access
        account = self.get_account(account_id, current_advisor)

        try:
            return crud.update_investment_account(
                session=self.db, account_db_obj=account, update_data=update_data
            )
        except Exception as e:
            logger.error(f"Failed to update investment account {account_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to update investment account: {str(e)}",
            )

    def delete_account(
        self, account_id: int, current_advisor: User
    ) -> InvestmentAccount:
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
        # Get and verify account access (this also checks authorization)
        self.get_account(account_id, current_advisor)

        deleted_account = crud.delete_investment_account(
            session=self.db, account_id=account_id
        )
        if not deleted_account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Investment account not found",
            )

        return deleted_account

    def bulk_upload_investment_accounts(
        self, client_id: int, file: UploadFile, current_advisor: User
    ):
        from io import BytesIO

        import pandas as pd
        from .models import InvestmentAccount
        from .schemas import InvestmentAccountCreate

        # Leer archivo Excel o CSV
        content = file.file.read()
        try:
            if file.filename.endswith(".csv"):
                df = pd.read_csv(BytesIO(content))
            else:
                df = pd.read_excel(BytesIO(content))
        except Exception as e:
            return {"error": f"Archivo inválido: {str(e)}"}
        required_cols = {"platform", "account_number", "aum"}
        missing = required_cols - set(df.columns)
        if missing:
            return {"error": f"Faltan columnas requeridas: {', '.join(missing)}"}
        valid_rows = []
        invalid_rows = []
        created = 0
        updated = 0
        for idx, row in df.iterrows():
            if not all(pd.notnull(row[col]) for col in required_cols):
                invalid_rows.append({"row": idx + 2, "data": row.to_dict()})
                continue
            # Buscar si ya existe cuenta con mismo account_number y client_id
            existing = self.db.exec(
                select(InvestmentAccount).where(
                    InvestmentAccount.client_id == client_id,
                    InvestmentAccount.account_number == str(row["account_number"]),
                )
            ).first()
            if existing:
                # Actualizar AUM y plataforma si cambió
                existing.platform = str(row["platform"])
                existing.aum = row["aum"]
                self.db.add(existing)
                updated += 1
            else:
                # Crear nueva cuenta
                data = InvestmentAccountCreate(
                    platform=str(row["platform"]),
                    account_number=str(row["account_number"]),
                    aum=row["aum"],
                    client_id=client_id,
                )
                obj = InvestmentAccount(**data.model_dump())
                self.db.add(obj)
                created += 1
            valid_rows.append(
                {
                    "platform": row["platform"],
                    "account_number": row["account_number"],
                    "aum": row["aum"],
                }
            )
        self.db.commit()
        return {
            "created": created,
            "updated": updated,
            "invalid": invalid_rows,
            "total": len(df),
        }

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
        # ADMIN users can access any client
        if current_advisor.role == UserRole.ADMIN:
            client = crud.get_client(
                session=self.db, client_id=client_id, owner_id=None
            )
            if not client:
                # For ADMIN, we need to check without owner restriction
                client = self.db.get(Client, client_id)
            if not client:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Client not found"
                )
            return client

        # Non-ADMIN users can only access their own clients
        client = crud.get_client(
            session=self.db, client_id=client_id, owner_id=current_advisor.id
        )
        if not client:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only manage accounts for your own clients.",
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
        current_advisor: User,
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
        # Verify client ownership/access
        self._verify_client_access(client_id, current_advisor)

        try:
            # Create the insurance policy
            return crud.create_client_insurance_policy(
                session=self.db, policy_data=policy_data, client_id=client_id
            )
        except ValueError as e:
            # Policy number already exists
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        except Exception as e:
            logger.error(
                f"Failed to create insurance policy for client {client_id}: {str(e)}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create insurance policy: {str(e)}",
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
        # Get the policy
        policy = crud.get_insurance_policy(session=self.db, policy_id=policy_id)
        if not policy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Insurance policy not found",
            )

        # Verify client ownership/access through the policy's client
        self._verify_client_access(policy.client_id, current_advisor)

        return policy

    def get_policies_by_client(
        self, client_id: int, current_advisor: User, skip: int = 0, limit: int = 100
    ) -> list[InsurancePolicy]:
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
            session=self.db, client_id=client_id, skip=skip, limit=limit
        )

    def update_policy(
        self,
        policy_id: int,
        update_data: schemas.InsurancePolicyUpdate,
        current_advisor: User,
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
        # Get and verify policy access
        policy = self.get_policy(policy_id, current_advisor)

        try:
            return crud.update_insurance_policy(
                session=self.db, policy_db_obj=policy, update_data=update_data
            )
        except ValueError as e:
            # Policy number conflict
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        except Exception as e:
            logger.error(f"Failed to update insurance policy {policy_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to update insurance policy: {str(e)}",
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
        # Get and verify policy access (this also checks authorization)
        self.get_policy(policy_id, current_advisor)

        deleted_policy = crud.delete_insurance_policy(
            session=self.db, policy_id=policy_id
        )
        if not deleted_policy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Insurance policy not found",
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
        # ADMIN users can access any client
        if current_advisor.role == UserRole.ADMIN:
            client = crud.get_client(
                session=self.db, client_id=client_id, owner_id=None
            )
            if not client:
                # For ADMIN, we need to check without owner restriction
                client = self.db.get(Client, client_id)
            if not client:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Client not found"
                )
            return client

        # Non-ADMIN users can only access their own clients
        client = crud.get_client(
            session=self.db, client_id=client_id, owner_id=current_advisor.id
        )
        if not client:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only manage policies for your own clients.",
            )

        return client


class NotificationService:
    """
    🚀 ENHANCED: Service class for managing user notifications with real-time WebSocket support.
    """

    def __init__(self, db_session: Session):
        """Initialize the notification service."""
        self.db = db_session
        from .repositories.notification_repository import NotificationRepository

        self.notification_repo = NotificationRepository(db_session)

    def create_notification(self, user_id: int, message: str) -> Notification:
        """
        Create a notification and send it in real-time.

        Args:
            user_id: ID of the user to notify
            message: Notification message

        Returns:
            The created Notification object
        """
        logger.info("notification_creation_started", user_id=user_id, message=message)

        # Create notification in the database
        notification = Notification(user_id=user_id, message=message)
        notification = self.notification_repo.create(notification)

        # 🚀 REAL-TIME: Send notification via WebSocket
        # We use asyncio.create_task to send the notification without
        # blocking the main thread.
        try:
            # ✅ FIX: Pass primitive types to the async task to prevent DetachedInstanceError.
            # The session that created the `notification` object may close before the task runs.
            # By passing primitive data, we decouple the task from the session.
            asyncio.create_task(
                self._send_realtime_notification(
                    user_id=notification.user_id,
                    message=notification.message,
                    notification_id=notification.id,
                    read_status=notification.read,
                    created_iso=notification.created_at.isoformat(),
                )
            )
            logger.info(
                "realtime_notification_task_created", notification_id=notification.id
            )
        except Exception as e:
            logger.error("realtime_notification_dispatch_failed", error=str(e))

        return notification

    async def create_notification_async(
        self, user_id: int, message: str
    ) -> Notification:
        """
        Creates a notification asynchronously and sends it in real-time.

        This method is suitable for use in async contexts.
        """
        logger.info(
            "async_notification_creation_started", user_id=user_id, message=message
        )

        notification = await self.notification_repo.create_async(
            user_id=user_id, message=message
        )

        # Dispatch real-time notification
        try:
            await self._send_realtime_notification(
                user_id=notification.user_id,
                message=notification.message,
                notification_id=notification.id,
                read_status=notification.read,
                created_iso=notification.created_at.isoformat(),
            )
            logger.info(
                "async_realtime_notification_sent", notification_id=notification.id
            )
        except Exception as e:
            logger.error("async_realtime_notification_dispatch_failed", error=str(e))

        return notification

    async def _send_realtime_notification(
        self,
        user_id: int,
        message: str,
        notification_id: int,
        read_status: bool,
        created_iso: str,
    ):
        """
        Sends a notification to a user via WebSocket using primitive data types.

        Args:
            user_id: The ID of the user to send the notification to.
            message: The content of the notification message.
            notification_id: The ID of the notification.
            read_status: The read status of the notification.
            created_iso: The ISO formatted creation timestamp.
        """
        from cactus_wealth.core.websocket_manager import manager  # Defer import

        logger.info("realtime_notification_sending", notification_id=notification_id)

        # Construct the payload
        payload = {
            "type": "notification",
            "payload": {
                "id": notification_id,
                "message": message,
                "read": read_status,
                "created_at": created_iso,
            },
        }

        # Send the message through the WebSocket manager
        try:
            await manager.send_personal_message(json.dumps(payload), user_id)
            logger.info(
                "realtime_notification_sent_successfully",
                user_id=user_id,
                notification_id=notification_id,
            )
        except Exception as e:
            logger.error(
                "websocket_send_failed",
                user_id=user_id,
                notification_id=notification_id,
                error=str(e),
            )


class PortfolioBacktestService:
    """
    Optimized service for portfolio backtesting with Redis caching and concurrency.

    Features:
    - Industry-standard financial formulas
    - Redis-based caching with 24h TTL
    - Concurrent yfinance API calls
    - 100% data integrity from yfinance
    """

    def __init__(self):
        """Initialize the optimized backtest service with Redis connection."""
        self.period_mapping = {
            "1d": "1d",
            "5d": "5d",
            "1mo": "1mo",
            "3mo": "3mo",
            "6mo": "6mo",
            "1y": "1y",
            "2y": "2y",
            "5y": "5y",
            "10y": "10y",
            "ytd": "ytd",
            "max": "max",
        }

        # Initialize Redis connection
        try:
            self.redis_client = redis.from_url(
                settings.REDIS_URL, decode_responses=True
            )
            self.redis_client.ping()  # Test connection
            logger.info("Redis connection established for backtesting cache")
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Operating without cache.")
            self.redis_client = None

    def _ensure_timezone_aware(
        self, target_date: datetime, reference_index: pd.DatetimeIndex
    ) -> datetime:
        """
        Ensure target_date is timezone-aware and compatible with reference_index.

        This utility function resolves timezone compatibility issues when comparing
        datetime objects with pandas DatetimeIndex objects from yfinance, which
        are typically timezone-aware.

        Args:
            target_date: The datetime object to make timezone-aware
            reference_index: The pandas DatetimeIndex to get timezone info from

        Returns:
            A timezone-aware datetime object compatible with reference_index

        Raises:
            None - handles all cases gracefully
        """
        # If target_date is already timezone-aware, return as-is
        if target_date.tzinfo is not None:
            return target_date

        # If reference_index has timezone info, apply it to target_date
        if hasattr(reference_index, "tz") and reference_index.tz is not None:
            return target_date.replace(tzinfo=reference_index.tz)

        # If reference_index has no timezone, return target_date unchanged
        return target_date

    async def perform_backtest(self, request: BacktestRequest) -> BacktestResponse:
        """
        Perform optimized portfolio backtesting with caching and concurrency.

        Args:
            request: BacktestRequest with composition, benchmarks, and period

        Returns:
            BacktestResponse with historical performance data

        Raises:
            ValueError: For invalid periods or data retrieval failures
        """
        try:
            # Validate period
            if request.period not in self.period_mapping:
                raise ValueError(
                    f"Invalid period: {request.period}. Valid options: {list(self.period_mapping.keys())}"
                )

            # Extract and validate tickers
            portfolio_tickers = [comp.ticker for comp in request.composition]
            all_tickers = portfolio_tickers + request.benchmarks

            if not all_tickers:
                raise ValueError("No tickers provided for backtesting")

            # Validate weights sum to 1.0
            total_weight = sum(comp.weight for comp in request.composition)
            if abs(total_weight - 1.0) > 0.001:
                raise ValueError(
                    f"Portfolio weights must sum to 1.0, got {total_weight}"
                )

            # Download historical data (with caching and concurrency)
            hist_data = await self._download_historical_data_cached(
                all_tickers, request.period
            )

            if hist_data.empty:
                raise ValueError(
                    "No historical data available for the selected tickers and period"
                )

            # Download dividend data concurrently
            dividend_data = await self._download_dividend_data_concurrent(
                all_tickers, request.period
            )

            # Calculate portfolio performance using daily returns
            portfolio_daily_returns = self._calculate_portfolio_daily_returns(
                hist_data, request.composition, portfolio_tickers
            )

            # Calculate portfolio cumulative returns for visualization
            portfolio_cumulative = self._calculate_cumulative_returns(
                portfolio_daily_returns
            )

            # Calculate benchmark returns
            benchmark_returns = self._calculate_benchmark_returns(
                hist_data, request.benchmarks
            )

            # Generate data points for visualization
            data_points = self._generate_data_points(
                hist_data.index, portfolio_cumulative, benchmark_returns, dividend_data
            )

            # Calculate performance metrics using corrected formulas
            performance_metrics = self._calculate_performance_metrics_corrected(
                portfolio_daily_returns, benchmark_returns
            )

            return BacktestResponse(
                start_date=hist_data.index[0].strftime("%Y-%m-%d"),
                end_date=hist_data.index[-1].strftime("%Y-%m-%d"),
                portfolio_composition=request.composition,
                benchmarks=request.benchmarks,
                data_points=data_points,
                performance_metrics=performance_metrics,
            )

        except Exception as e:
            logger.error(f"Backtesting error: {str(e)}")
            raise ValueError(f"Failed to perform backtest: {str(e)}")

    def _generate_cache_key(
        self, ticker: str, period: str, data_type: str = "prices"
    ) -> str:
        """Generate unique cache key for ticker data."""
        key_string = f"{data_type}:{ticker}:{period}"
        # Use SHA-256 instead of MD5 for better security (not used for cryptographic purposes)
        return f"yfinance:{hashlib.sha256(key_string.encode()).hexdigest()}"

    async def _download_historical_data_cached(
        self, tickers: list[str], period: str
    ) -> pd.DataFrame:
        """Download historical data with Redis caching and concurrent execution."""

        async def fetch_ticker_data(ticker: str) -> tuple[str, pd.Series]:
            """Fetch data for a single ticker with caching."""
            cache_key = self._generate_cache_key(ticker, period, "prices")

            # Try cache first
            if self.redis_client:
                try:
                    cached_data = self.redis_client.get(cache_key)
                    if cached_data:
                        data_dict = json.loads(cached_data)
                        return ticker, pd.Series(
                            data_dict["prices"],
                            index=pd.to_datetime(data_dict["dates"]),
                        )
                except Exception as e:
                    logger.warning(f"Cache read error for {ticker}: {e}")

            # Cache miss - fetch from yfinance
            try:
                data = yf.download(
                    ticker, period=period, interval="1d", auto_adjust=True, prepost=True
                )
                if data.empty:
                    raise ValueError(f"No data available for {ticker}")

                close_prices = data["Close"]

                # Ensure close_prices is a Series (in case yfinance returns DataFrame)
                if isinstance(close_prices, pd.DataFrame):
                    close_prices = (
                        close_prices.squeeze()
                    )  # Convert single-column DataFrame to Series

                # Cache the result with robust serialization
                if self.redis_client and not close_prices.empty:
                    try:
                        cache_data = {
                            "prices": close_prices.values.tolist(),  # Use .values.tolist() for safe serialization
                            "dates": close_prices.index.strftime("%Y-%m-%d").tolist(),
                        }
                        self.redis_client.setex(
                            cache_key, 86400, json.dumps(cache_data)
                        )  # 24h TTL
                    except Exception as e:
                        logger.warning(f"Cache write error for {ticker}: {e}")

                return ticker, close_prices

            except Exception as e:
                logger.error(f"Failed to download data for {ticker}: {e}")
                raise ValueError(f"Failed to retrieve data for {ticker}: {str(e)}")

        # Execute all downloads concurrently
        tasks = [fetch_ticker_data(ticker) for ticker in tickers]
        results = await asyncio.gather(*tasks)

        # Combine results into DataFrame with proper DatetimeIndex
        data_dict = dict(results)
        combined_df = pd.DataFrame(data_dict)

        # Ensure DataFrame has a proper DatetimeIndex for backtesting
        if not isinstance(combined_df.index, pd.DatetimeIndex):
            # Try to convert index to datetime if it's not already
            try:
                combined_df.index = pd.to_datetime(combined_df.index)
            except Exception as e:
                logger.error(f"Failed to convert index to DatetimeIndex: {e}")
                raise ValueError("Invalid date index in historical data")

        # Sort by date to ensure chronological order
        combined_df = combined_df.sort_index()

        return combined_df.dropna()

    async def _download_dividend_data_concurrent(
        self, tickers: list[str], period: str
    ) -> dict[str, pd.Series]:
        """Download dividend data concurrently with caching."""

        async def fetch_dividend_data(ticker: str) -> tuple[str, pd.Series]:
            """Fetch dividend data for single ticker."""
            cache_key = self._generate_cache_key(ticker, period, "dividends")

            # Try cache first
            if self.redis_client:
                try:
                    cached_data = self.redis_client.get(cache_key)
                    if cached_data:
                        data_dict = json.loads(cached_data)
                        if data_dict["dividends"]:
                            return ticker, pd.Series(
                                data_dict["dividends"],
                                index=pd.to_datetime(data_dict["dates"]),
                            )
                        else:
                            return ticker, pd.Series(dtype=float)
                except Exception as e:
                    logger.warning(f"Dividend cache read error for {ticker}: {e}")

            # Fetch from yfinance
            try:
                ticker_obj = yf.Ticker(ticker)
                dividends = ticker_obj.dividends

                # Filter by period
                if not dividends.empty:
                    end_date = datetime.now()
                    period_days = {
                        "1mo": 30,
                        "3mo": 90,
                        "6mo": 180,
                        "1y": 365,
                        "2y": 730,
                        "5y": 1825,
                    }
                    if period in period_days:
                        start_date = end_date - timedelta(days=period_days[period])
                        # Ensure timezone compatibility before comparison
                        compatible_start_date = self._ensure_timezone_aware(
                            start_date, dividends.index
                        )
                        dividends = dividends[dividends.index >= compatible_start_date]

                # Cache result
                if self.redis_client:
                    try:
                        if not dividends.empty:
                            cache_data = {
                                "dividends": dividends.tolist(),
                                "dates": dividends.index.strftime("%Y-%m-%d").tolist(),
                            }
                        else:
                            cache_data = {"dividends": [], "dates": []}
                        self.redis_client.setex(
                            cache_key, 86400, json.dumps(cache_data)
                        )
                    except Exception as e:
                        logger.warning(f"Dividend cache write error for {ticker}: {e}")

                return ticker, dividends

            except Exception as e:
                logger.warning(f"Could not download dividends for {ticker}: {e}")
                return ticker, pd.Series(dtype=float)

        # Execute dividend downloads concurrently
        tasks = [fetch_dividend_data(ticker) for ticker in tickers]
        results = await asyncio.gather(*tasks)

        return dict(results)

    def _calculate_portfolio_daily_returns(
        self,
        hist_data: pd.DataFrame,
        composition: list[PortfolioComposition],
        tickers: list[str],
    ) -> pd.Series:
        """Calculate portfolio daily returns (not cumulative) for accurate metrics."""

        # Robust validation of DataFrame structure for backtesting
        if hist_data.empty:
            raise ValueError("Historical data is empty")

        # Ensure DataFrame has proper DatetimeIndex
        if not isinstance(hist_data.index, pd.DatetimeIndex):
            raise ValueError(
                "Historical data must have DatetimeIndex for backtesting calculations"
            )

        # Ensure chronological order
        if not hist_data.index.is_monotonic_increasing:
            hist_data = hist_data.sort_index()
            logger.info("Historical data sorted chronologically for backtesting")

        # Create weights dictionary
        weights = {comp.ticker: comp.weight for comp in composition}

        # Validate all tickers present
        missing_tickers = [t for t in tickers if t not in hist_data.columns]
        if missing_tickers:
            raise ValueError(f"Missing price data for tickers: {missing_tickers}")

        # Calculate daily returns for each asset
        asset_returns = hist_data[tickers].pct_change().fillna(0)

        # Calculate weighted portfolio daily returns
        portfolio_daily_returns = pd.Series(0.0, index=asset_returns.index)
        for ticker in tickers:
            if ticker in weights:
                portfolio_daily_returns += asset_returns[ticker] * weights[ticker]

        return portfolio_daily_returns.dropna()

    def _calculate_cumulative_returns(
        self, daily_returns: pd.Series, start_value: float = 100.0
    ) -> pd.Series:
        """Convert daily returns to cumulative returns for visualization."""
        return (1 + daily_returns).cumprod() * start_value

    def _calculate_benchmark_returns(
        self, hist_data: pd.DataFrame, benchmarks: list[str]
    ) -> dict[str, pd.Series]:
        """Calculate benchmark cumulative returns."""
        benchmark_returns = {}

        for benchmark in benchmarks:
            if benchmark in hist_data.columns:
                daily_returns = hist_data[benchmark].pct_change().fillna(0)
                cumulative_returns = self._calculate_cumulative_returns(daily_returns)
                benchmark_returns[benchmark] = cumulative_returns

        return benchmark_returns

    def _calculate_performance_metrics_corrected(
        self, daily_returns: pd.Series, benchmark_returns: dict[str, pd.Series]
    ) -> dict:
        """
        Calculate performance metrics using industry-standard formulas.

        All formulas follow CFA Institute standards:
        - Annualized Volatility: σ_annual = σ_daily × √252
        - Sharpe Ratio: (R_p - R_f) / σ_p (annualized)
        - Max Drawdown: Maximum peak-to-trough decline
        """
        if len(daily_returns) < 2:
            raise ValueError("Insufficient data points for performance calculation")

        # Total Return
        total_return = (1 + daily_returns).prod() - 1

        # Annualized Return
        trading_days = len(daily_returns)
        years = trading_days / 252.0
        annualized_return = (1 + total_return) ** (1 / years) - 1 if years > 0 else 0

        # Annualized Volatility (Industry Standard)
        daily_volatility = daily_returns.std()
        annualized_volatility = daily_volatility * np.sqrt(252)

        # Sharpe Ratio (Corrected - using daily returns)
        # Using 2% risk-free rate (clearly documented assumption)
        risk_free_rate_annual = 0.02
        risk_free_rate_daily = risk_free_rate_annual / 252
        excess_returns = daily_returns - risk_free_rate_daily
        sharpe_ratio = (
            (excess_returns.mean() * 252) / annualized_volatility
            if annualized_volatility > 0
            else 0
        )

        # Maximum Drawdown (Corrected Algorithm)
        cumulative_returns = self._calculate_cumulative_returns(daily_returns, 1.0)
        running_max = cumulative_returns.expanding().max()
        drawdowns = (cumulative_returns - running_max) / running_max
        max_drawdown = drawdowns.min()  # Most negative value

        # Start and end values for visualization
        start_value = 100.0
        end_value = start_value * (1 + total_return)

        metrics = {
            "total_return": float(total_return),
            "annualized_return": float(annualized_return),
            "annualized_volatility": float(annualized_volatility),
            "sharpe_ratio": float(sharpe_ratio),
            "max_drawdown": float(max_drawdown),
            "start_value": float(start_value),
            "end_value": float(end_value),
            "trading_days": int(trading_days),
            "risk_free_rate_assumption": 0.02,
        }

        # Add benchmark comparisons using same methodology
        for benchmark_name, benchmark_series in benchmark_returns.items():
            if not benchmark_series.empty and len(benchmark_series) > 1:
                bench_daily_returns = benchmark_series.pct_change().dropna()
                if len(bench_daily_returns) > 0:
                    bench_total_return = (1 + bench_daily_returns).prod() - 1
                    metrics[f"{benchmark_name}_total_return"] = float(
                        bench_total_return
                    )
                    metrics[f"vs_{benchmark_name}"] = float(
                        total_return - bench_total_return
                    )
                    metrics[f"alpha_vs_{benchmark_name}"] = float(
                        annualized_return
                        - ((1 + bench_total_return) ** (1 / years) - 1)
                    )

        return metrics

    def _generate_data_points(
        self,
        dates: pd.DatetimeIndex,
        portfolio_cumulative: pd.Series,
        benchmark_returns: dict[str, pd.Series],
        dividend_data: dict[str, pd.Series],
    ) -> list[BacktestDataPoint]:
        """Generate data points for visualization."""
        data_points = []

        for date in dates:
            # Portfolio value
            portfolio_value = float(portfolio_cumulative.loc[date])

            # Benchmark values
            benchmark_values = {}
            for benchmark, returns in benchmark_returns.items():
                if date in returns.index:
                    benchmark_values[benchmark] = float(returns.loc[date])

            # Dividend events for this date
            dividend_events = []
            for ticker, dividends in dividend_data.items():
                if not dividends.empty and date.date() in [
                    d.date() for d in dividends.index
                ]:
                    # Use timezone-aware date comparison by converting both to date objects
                    matching_dividends = dividends[dividends.index.date == date.date()]
                    if not matching_dividends.empty:
                        dividend_amount = matching_dividends.iloc[0]
                        dividend_events.append(
                            {"ticker": ticker, "amount": float(dividend_amount)}
                        )

            data_points.append(
                BacktestDataPoint(
                    date=date.strftime("%Y-%m-%d"),
                    portfolio_value=portfolio_value,
                    benchmark_values=benchmark_values,
                    dividend_events=dividend_events,
                )
            )

        return data_points


# Global Redis client and availability flag for dashboard caching
try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    redis_client.ping()
    REDIS_AVAILABLE = True
except Exception:
    redis_client = None
    REDIS_AVAILABLE = False
