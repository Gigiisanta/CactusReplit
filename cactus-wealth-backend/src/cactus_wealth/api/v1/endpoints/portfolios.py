import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlmodel import Session, select

from cactus_wealth.security import get_current_user as get_current_active_user
from cactus_wealth.core.dataprovider import YahooFinanceProvider
from cactus_wealth.database import get_session
from cactus_wealth.models import User, Portfolio, Client
from cactus_wealth.services import PortfolioService, ReportService, PortfolioBacktestService
from cactus_wealth import schemas

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/{portfolio_id}/valuation", response_model=schemas.PortfolioValuation)
def get_portfolio_valuation(
    portfolio_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)]
) -> schemas.PortfolioValuation:
    """
    Get portfolio valuation with real-time market data.
    
    This endpoint calculates the current market value of a portfolio based on
    real-time market prices, and returns comprehensive valuation metrics.
    
    Args:
        portfolio_id: ID of the portfolio to valuate
        session: Database session
        current_user: Currently authenticated user (advisor)
        
    Returns:
        PortfolioValuation with current market values and P&L calculations
        
    Raises:
        HTTPException: If portfolio not found or user doesn't have access
    """
    logger.info(f"Portfolio valuation requested by user {current_user.email} for portfolio {portfolio_id}")
    
    # Get portfolio and verify ownership through client relationship
    statement = (
        select(Portfolio)
        .join(Client)
        .where(Portfolio.id == portfolio_id)
        .where(Client.owner_id == current_user.id)
    )
    portfolio = session.exec(statement).first()
    
    if not portfolio:
        logger.warning(
            f"Portfolio {portfolio_id} not found or not accessible by user {current_user.email}"
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found or you don't have access to it"
        )
    
    try:
        # Create market data provider and portfolio service
        market_data_provider = YahooFinanceProvider()
        portfolio_service = PortfolioService(session, market_data_provider)
        
        # Get portfolio valuation
        valuation = portfolio_service.get_portfolio_valuation(portfolio_id)
        
        logger.info(
            f"Portfolio valuation completed for portfolio {portfolio_id}: "
            f"Value=${valuation.total_value:.2f}, P&L=${valuation.total_pnl:.2f}"
        )
        
        return valuation
        
    except ValueError as e:
        logger.error(f"ValueError in portfolio valuation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error calculating portfolio valuation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to calculate portfolio valuation. Please try again later."
        )


@router.get("/{portfolio_id}/report/download")
def download_portfolio_report(
    portfolio_id: int,
    session: Annotated[Session, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_active_user)]
) -> Response:
    """
    Download portfolio valuation report as PDF.
    
    This endpoint generates and returns a comprehensive PDF report containing
    portfolio valuation data, position details, and performance metrics with
    Cactus Wealth branding.
    
    Args:
        portfolio_id: ID of the portfolio to generate report for
        session: Database session
        current_user: Currently authenticated user (advisor)
        
    Returns:
        Response with PDF content and appropriate headers for download
        
    Raises:
        HTTPException: If portfolio not found, user doesn't have access, or report generation fails
    """
    logger.info(f"PDF report download requested by user {current_user.email} for portfolio {portfolio_id}")
    
    # Get portfolio and verify ownership through client relationship
    statement = (
        select(Portfolio)
        .join(Client)
        .where(Portfolio.id == portfolio_id)
        .where(Client.owner_id == current_user.id)
    )
    portfolio = session.exec(statement).first()
    
    if not portfolio:
        logger.warning(
            f"Portfolio {portfolio_id} not found or not accessible by user {current_user.email}"
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found or you don't have access to it"
        )
    
    try:
        # Create services
        market_data_provider = YahooFinanceProvider()
        portfolio_service = PortfolioService(session, market_data_provider)
        report_service = ReportService(session, market_data_provider)
        
        # Get portfolio valuation first
        logger.info(f"Getting valuation data for portfolio {portfolio_id}")
        valuation = portfolio_service.get_portfolio_valuation(portfolio_id)
        
        # Generate PDF report
        logger.info(f"Generating PDF report for portfolio {portfolio_id}")
        pdf_bytes = report_service.generate_portfolio_report_pdf(
            valuation_data=valuation,
            portfolio_name=portfolio.name
        )
        
        # Prepare filename
        filename = f"Cactus_Wealth_Report_{portfolio_id}.pdf"
        
        logger.info(
            f"PDF report generated successfully for portfolio {portfolio_id}. "
            f"File size: {len(pdf_bytes)} bytes. Returning to user {current_user.email}"
        )
        
        # Return PDF as downloadable response
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
        
    except ValueError as e:
        logger.error(f"ValueError in portfolio report generation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error generating portfolio report: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate portfolio report. Please try again later."
        )


@router.post("/backtest", response_model=schemas.BacktestResponse)
async def backtest_portfolio(
    request: schemas.BacktestRequest,
    current_user: Annotated[User, Depends(get_current_active_user)]
) -> schemas.BacktestResponse:
    """
    Perform optimized portfolio backtesting with Redis caching and concurrency.
    
    This endpoint calculates historical performance of a given portfolio composition
    against selected benchmarks using industry-standard financial formulas:
    
    FEATURES:
    - Redis-based caching with 24h TTL for yfinance data
    - Concurrent API calls for maximum performance
    - Industry-standard metrics (CFA Institute formulas):
      * Annualized Volatility: σ_daily × √252
      * Sharpe Ratio: (R_p - R_f) / σ_p (using 2% risk-free rate)
      * Max Drawdown: Peak-to-trough decline methodology
    - 100% data integrity from yfinance (no mock data)
    
    PERFORMANCE:
    - First call: Normal latency (network-bound)
    - Subsequent calls: Near-instant (Redis cache hit)
    - Concurrent ticker processing for optimal throughput
    
    Args:
        request: BacktestRequest with portfolio composition, benchmarks, and period
        current_user: Currently authenticated user (advisor)
        
    Returns:
        BacktestResponse with complete historical performance analysis
        
    Raises:
        HTTPException: If backtesting fails or invalid parameters provided
    """
    logger.info(f"Optimized portfolio backtesting requested by user {current_user.email}")
    
    try:
        # The optimized service now handles all validation internally
        # including portfolio weights and ticker validation
        
        # Create optimized backtest service and perform concurrent analysis
        backtest_service = PortfolioBacktestService()
        result = await backtest_service.perform_backtest(request)
        
        logger.info(
            f"Optimized backtesting completed for {len(request.composition)} assets "
            f"over period {request.period}. "
            f"Total return: {result.performance_metrics.get('total_return', 0):.2%}. "
            f"Sharpe ratio: {result.performance_metrics.get('sharpe_ratio', 0):.2f}. "
            f"Max drawdown: {result.performance_metrics.get('max_drawdown', 0):.2%}"
        )
        
        return result
        
    except ValueError as e:
        logger.error(f"ValueError in portfolio backtesting: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error in portfolio backtesting: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to perform portfolio backtesting. Please try again later."
        ) 