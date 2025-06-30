from typing import List

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from cactus_wealth.database import get_session
from cactus_wealth.models import User
from cactus_wealth.schemas import AssetRead
from cactus_wealth.security import get_current_user
import cactus_wealth.crud as crud

router = APIRouter()


@router.get("/search", response_model=List[AssetRead])
def search_assets(
    query: str = Query(..., min_length=1, max_length=50, description="Search term for asset ticker or name"),
    limit: int = Query(10, ge=1, le=20, description="Maximum number of results to return"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
) -> List[AssetRead]:
    """
    Search for assets by ticker symbol or name.
    
    First searches the local database for matching assets.
    If the query appears to be a ticker symbol and we have fewer results than the limit,
    attempts to fetch the asset from yfinance and stores it locally for future searches.
    
    Args:
        query: Search term (ticker symbol or asset name)
        limit: Maximum number of results (1-20)
        
    Returns:
        List of matching assets with their details including sector information
    """
    assets = crud.search_assets(session=session, query=query, limit=limit)
    return [AssetRead.model_validate(asset) for asset in assets] 