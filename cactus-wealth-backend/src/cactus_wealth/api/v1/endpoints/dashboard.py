from cactus_wealth import schemas
from cactus_wealth.core.dataprovider import MarketDataProvider, get_market_data_provider
from cactus_wealth.database import get_session
from cactus_wealth.models import User
from cactus_wealth.security import get_current_user
from cactus_wealth.services import DashboardService
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

router = APIRouter()


def get_dashboard_service(
    session: Session = Depends(get_session),
    market_data_provider: MarketDataProvider = Depends(get_market_data_provider),
) -> DashboardService:
    """Dependency to get dashboard service."""
    return DashboardService(
        db_session=session, market_data_provider=market_data_provider
    )


@router.get("/summary")
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
) -> schemas.DashboardSummaryResponse:
    """
    Get dashboard summary with key metrics.
    """
    try:
        summary = dashboard_service.get_dashboard_summary(current_user)
        return summary
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to calculate dashboard summary: {str(e)}"
        )


@router.get("/aum-history")
def get_aum_history(
    days: int = Query(30, ge=1, le=365, description="Number of days of history"),
    current_user: User = Depends(get_current_user),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
) -> list[schemas.AUMHistoryPoint]:
    """
    Get AUM history data for charts.
    """
    try:
        return dashboard_service.get_aum_history(current_user, days)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get AUM history: {str(e)}"
        )
