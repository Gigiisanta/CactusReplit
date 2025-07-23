"""
Asset repository for asset-related database operations.
"""

from sqlalchemy.orm import selectinload
from sqlmodel import Session, func, select

from ..models import Asset, AssetType
from .base_repository import BaseRepository


class AssetRepository(BaseRepository[Asset]):
    """Repository for Asset-related database operations."""

    def __init__(self, session: Session):
        super().__init__(session, Asset)

    def get_by_ticker(self, ticker_symbol: str) -> Asset | None:
        """
        Get an asset by its ticker symbol.

        Args:
            ticker_symbol: The asset's ticker symbol

        Returns:
            Asset if found, None otherwise
        """
        statement = select(Asset).where(Asset.ticker_symbol == ticker_symbol)
        return self.session.exec(statement).first()

    def get_by_type(self, asset_type: AssetType) -> list[Asset]:
        """
        Get all assets of a specific type.

        Args:
            asset_type: The type of assets to retrieve

        Returns:
            List of assets of the specified type
        """
        statement = select(Asset).where(Asset.asset_type == asset_type)
        return list(self.session.exec(statement).all())

    def get_by_sector(self, sector: str) -> list[Asset]:
        """
        Get all assets in a specific sector.

        Args:
            sector: The sector name

        Returns:
            List of assets in the specified sector
        """
        statement = select(Asset).where(Asset.sector == sector)
        return list(self.session.exec(statement).all())

    def search_assets(self, query: str, limit: int = 10) -> list[Asset]:
        """
        Search assets by ticker symbol or name.

        Args:
            query: Search query
            limit: Maximum number of results

        Returns:
            List of matching assets
        """
        search_term = f"%{query.upper()}%"
        statement = (
            select(Asset)
            .where(
                (Asset.ticker_symbol.ilike(search_term))
                | (Asset.name.ilike(search_term))
            )
            .limit(limit)
            .order_by(Asset.ticker_symbol)
        )
        return list(self.session.exec(statement).all())

    def get_popular_assets(self, limit: int = 20) -> list[Asset]:
        """
        Get most popular assets based on usage in portfolios.

        Args:
            limit: Maximum number of assets to return

        Returns:
            List of popular assets
        """
        from ..models import Position

        statement = (
            select(Asset, func.count(Position.id).label("usage_count"))
            .outerjoin(Position)
            .group_by(Asset.id)
            .order_by(func.count(Position.id).desc())
            .limit(limit)
        )

        results = self.session.exec(statement).all()
        return [asset for asset, _ in results]

    def get_assets_by_market_cap(self, limit: int = 50) -> list[Asset]:
        """
        Get assets ordered by market cap (if available).

        Args:
            limit: Maximum number of assets to return

        Returns:
            List of assets ordered by market cap
        """
        statement = select(Asset).order_by(Asset.ticker_symbol).limit(limit)
        return list(self.session.exec(statement).all())

    def get_assets_with_positions(self, portfolio_id: int) -> list[Asset]:
        """
        Get assets that have positions in a specific portfolio.

        Args:
            portfolio_id: The portfolio ID

        Returns:
            List of assets with positions
        """
        from ..models import Position

        statement = (
            select(Asset)
            .join(Position)
            .where(Position.portfolio_id == portfolio_id)
            .options(selectinload(Asset.positions))
        )
        return list(self.session.exec(statement).all())

    def get_asset_statistics(self) -> dict:
        """
        Get asset statistics for dashboard.

        Returns:
            Dictionary with asset statistics
        """
        total_assets = self.session.exec(select(func.count(Asset.id))).first() or 0

        # Count by type
        type_counts = {}
        for asset_type in AssetType:
            count = (
                self.session.exec(
                    select(func.count(Asset.id)).where(Asset.asset_type == asset_type)
                ).first()
                or 0
            )
            type_counts[asset_type.value] = count

        # Count by sector
        sector_counts = {}
        sector_query = (
            select(Asset.sector, func.count(Asset.id))
            .where(Asset.sector.is_not(None))
            .group_by(Asset.sector)
        )
        for sector, count in self.session.exec(sector_query).all():
            sector_counts[sector] = count

        return {
            "total_assets": total_assets,
            "by_type": type_counts,
            "by_sector": sector_counts,
        }
