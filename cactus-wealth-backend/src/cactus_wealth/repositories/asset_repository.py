"""
Asset repository for asset-related database operations.
"""

from typing import List, Optional
from sqlmodel import Session, select
from ..models import Asset, AssetType
from .base_repository import BaseRepository


class AssetRepository(BaseRepository[Asset]):
    """Repository for Asset-related database operations."""
    
    def __init__(self, session: Session):
        super().__init__(session, Asset)
    
    def get_by_ticker(self, ticker_symbol: str) -> Optional[Asset]:
        """
        Get an asset by its ticker symbol.
        
        Args:
            ticker_symbol: The asset's ticker symbol
            
        Returns:
            Asset if found, None otherwise
        """
        statement = select(Asset).where(Asset.ticker_symbol == ticker_symbol)
        return self.session.exec(statement).first()
    
    def get_by_type(self, asset_type: AssetType) -> List[Asset]:
        """
        Get all assets of a specific type.
        
        Args:
            asset_type: The type of assets to retrieve
            
        Returns:
            List of assets of the specified type
        """
        statement = select(Asset).where(Asset.asset_type == asset_type)
        return list(self.session.exec(statement).all())
    
    def get_by_sector(self, sector: str) -> List[Asset]:
        """
        Get all assets in a specific sector.
        
        Args:
            sector: The sector name
            
        Returns:
            List of assets in the specified sector
        """
        statement = select(Asset).where(Asset.sector == sector)
        return list(self.session.exec(statement).all())
    
    def search_by_name_or_ticker(self, query: str, limit: int = 20) -> List[Asset]:
        """
        Search assets by name or ticker symbol.
        
        Args:
            query: The search query
            limit: Maximum number of results to return
            
        Returns:
            List of assets matching the search query
        """
        # Using case-insensitive search
        statement = (
            select(Asset)
            .where(
                (Asset.name.ilike(f"%{query}%")) | 
                (Asset.ticker_symbol.ilike(f"%{query}%"))
            )
            .limit(limit)
        )
        return list(self.session.exec(statement).all())
    
    def get_distinct_sectors(self) -> List[str]:
        """
        Get all distinct sectors from assets.
        
        Returns:
            List of unique sector names
        """
        statement = select(Asset.sector).distinct().where(Asset.sector.is_not(None))
        return [sector for sector in self.session.exec(statement).all() if sector] 