from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from cactus_wealth import schemas
from cactus_wealth.models import User, UserRole
from cactus_wealth.database import get_session
from cactus_wealth.security import get_current_user
from cactus_wealth.services import DashboardService
from cactus_wealth.core.dataprovider import get_market_data_provider
from cactus_wealth.core.arq import ARQConfig

router = APIRouter()


@router.get("/summary", response_model=schemas.DashboardSummaryResponse)
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session)
) -> schemas.DashboardSummaryResponse:
    """
    Get dashboard summary with key performance indicators.
    
    Returns dashboard KPIs based on user role:
    - ADMIN: Global data across all clients
    - SENIOR_ADVISOR/JUNIOR_ADVISOR: Data for assigned clients only
    
    Returns:
        DashboardSummaryResponse: Contains total_clients, assets_under_management, 
                                 monthly_growth_percentage, and reports_generated_this_quarter
    """
    try:
        # Initialize market data provider and dashboard service
        market_data_provider = get_market_data_provider()
        dashboard_service = DashboardService(db, market_data_provider)
        
        # Calculate dashboard summary based on user permissions
        summary = dashboard_service.get_dashboard_summary(current_user)
        
        return summary
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to calculate dashboard summary: {str(e)}"
        )


@router.post("/debug/trigger-snapshots")
async def trigger_snapshots_debug(
    current_user: User = Depends(get_current_user)
) -> dict:
    """
    DEBUG ENDPOINT: Manually trigger portfolio snapshots creation.
    
    This is a temporary endpoint for testing the ARQ worker.
    Only ADMIN users can trigger this action.
    
    Returns:
        Success message with job ID
    """
    # Only allow ADMIN users to trigger this
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Only ADMIN users can trigger manual snapshots"
        )
    
    try:
        job_id = await ARQConfig.enqueue_snapshot_job()
        return {
            "message": "Portfolio snapshots job enqueued successfully",
            "job_id": job_id,
            "triggered_by": current_user.username
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to enqueue snapshots job: {str(e)}"
        ) 