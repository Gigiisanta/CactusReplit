"""
Portfolio repository for portfolio-related database operations.
"""

from datetime import datetime, timedelta

from sqlalchemy.orm import selectinload
from sqlmodel import Session, func, select

from ..models import Client, Portfolio, PortfolioSnapshot, Position
from .base_repository import BaseRepository


class PortfolioRepository(BaseRepository[Portfolio]):
    """Repository for Portfolio-related database operations."""

    def __init__(self, session: Session):
        super().__init__(session, Portfolio)

    def get_by_client_id(self, client_id: int) -> list[Portfolio]:
        """
        Get all portfolios for a specific client.

        Args:
            client_id: The client's ID

        Returns:
            List of portfolios for the client
        """
        statement = select(Portfolio).where(Portfolio.client_id == client_id)
        return list(self.session.exec(statement).all())

    def get_with_positions(self, portfolio_id: int) -> Portfolio | None:
        """
        Get a portfolio with all its positions and assets loaded efficiently.

        Args:
            portfolio_id: The portfolio's ID

        Returns:
            Portfolio with positions and assets loaded, or None if not found
        """
        statement = (
            select(Portfolio)
            .where(Portfolio.id == portfolio_id)
            .options(selectinload(Portfolio.positions).selectinload(Position.asset))
        )
        return self.session.exec(statement).first()

    def get_all_portfolios_with_positions(self) -> list[Portfolio]:
        """
        Get all portfolios with positions and assets loaded efficiently.

        Returns:
            List of portfolios with positions and assets loaded
        """
        statement = select(Portfolio).options(
            selectinload(Portfolio.positions).selectinload(Position.asset)
        )
        return list(self.session.exec(statement).all())

    def get_portfolios_by_advisor_with_positions(
        self, advisor_id: int
    ) -> list[Portfolio]:
        """
        Get all portfolios managed by a specific advisor with positions loaded.

        Args:
            advisor_id: The advisor's user ID

        Returns:
            List of portfolios managed by the advisor with positions loaded
        """
        statement = (
            select(Portfolio)
            .join(Client)
            .where(Client.owner_id == advisor_id)
            .options(selectinload(Portfolio.positions).selectinload(Position.asset))
        )
        return list(self.session.exec(statement).all())

    def get_snapshots_for_portfolio(
        self, portfolio_id: int, limit: int = 100
    ) -> list[PortfolioSnapshot]:
        """
        Get historical snapshots for a portfolio.

        Args:
            portfolio_id: The portfolio's ID
            limit: Maximum number of snapshots to return

        Returns:
            List of snapshots ordered by timestamp (newest first)
        """
        statement = (
            select(PortfolioSnapshot)
            .where(PortfolioSnapshot.portfolio_id == portfolio_id)
            .order_by(PortfolioSnapshot.timestamp.desc())
            .limit(limit)
        )
        return list(self.session.exec(statement).all())

    def get_all_portfolios(self) -> list[Portfolio]:
        """
        Get all portfolios in the system.

        Returns:
            List of all portfolios
        """
        statement = select(Portfolio)
        return list(self.session.exec(statement).all())

    def get_portfolios_by_advisor(self, advisor_id: int) -> list[Portfolio]:
        """
        Get all portfolios managed by a specific advisor.

        Args:
            advisor_id: The advisor's user ID

        Returns:
            List of portfolios managed by the advisor
        """
        statement = select(Portfolio).join(Client).where(Client.owner_id == advisor_id)
        return list(self.session.exec(statement).all())

    def get_aum_history(
        self, days: int = 30, advisor_id: int | None = None
    ) -> list[dict]:
        """
        🚀 INSIGHT ANALYTICS: Get AUM (Assets Under Management) history aggregated by date.

        Returns daily AUM totals by summing all portfolio snapshots for each date.
        Useful for creating historical charts and trend analysis.

        Args:
            days: Number of days to look back (default: 30)
            advisor_id: Optional advisor ID to filter portfolios (None for global data)

        Returns:
            List of dictionaries with 'date' and 'value' keys, ordered by date ASC
            Example: [{"date": "2024-01-15", "value": 12345.67}, ...]
        """
        # Calculate start date
        start_date = datetime.utcnow() - timedelta(days=days)

        # Base query: aggregate snapshots by date
        query = select(
            func.date(PortfolioSnapshot.timestamp).label("date"),
            func.sum(PortfolioSnapshot.value).label("total_value"),
        ).where(PortfolioSnapshot.timestamp >= start_date)

        # If advisor_id is provided, filter by portfolios owned by that advisor
        if advisor_id is not None:
            query = (
                query.join(Portfolio, Portfolio.id == PortfolioSnapshot.portfolio_id)
                .join(Client, Client.id == Portfolio.client_id)
                .where(Client.owner_id == advisor_id)
            )

        # Group by date and order chronologically
        query = query.group_by(func.date(PortfolioSnapshot.timestamp)).order_by(
            func.date(PortfolioSnapshot.timestamp)
        )

        # Execute query and format results
        results = self.session.exec(query).all()

        return [
            {
                "date": result.date.strftime("%Y-%m-%d"),
                "value": float(result.total_value),
            }
            for result in results
        ]

    def create_position(self, position: Position) -> Position:
        self.session.add(position)
        self.session.commit()
        self.session.refresh(position)
        return position

    def create_snapshot(self, portfolio_id: int, value) -> PortfolioSnapshot:
        snapshot = PortfolioSnapshot(portfolio_id=portfolio_id, value=value)
        self.session.add(snapshot)
        self.session.commit()
        self.session.refresh(snapshot)
        return snapshot
