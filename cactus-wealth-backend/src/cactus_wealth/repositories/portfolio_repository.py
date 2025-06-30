"""
Portfolio repository for portfolio-related database operations.
"""

from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from sqlmodel import Session, select
from ..models import Portfolio, Position, Asset, PortfolioSnapshot, Client
from .base_repository import BaseRepository


class PortfolioRepository(BaseRepository[Portfolio]):
    """Repository for Portfolio-related database operations."""
    
    def __init__(self, session: Session):
        super().__init__(session, Portfolio)
    
    def get_by_client_id(self, client_id: int) -> List[Portfolio]:
        """
        Get all portfolios for a specific client.
        
        Args:
            client_id: The client's ID
            
        Returns:
            List of portfolios for the client
        """
        statement = select(Portfolio).where(Portfolio.client_id == client_id)
        return list(self.session.exec(statement).all())
    
    def get_with_positions(self, portfolio_id: int) -> Optional[Portfolio]:
        """
        Get a portfolio with all its positions and assets loaded.
        
        Args:
            portfolio_id: The portfolio's ID
            
        Returns:
            Portfolio with positions loaded, or None if not found
        """
        statement = (
            select(Portfolio)
            .where(Portfolio.id == portfolio_id)
        )
        portfolio = self.session.exec(statement).first()
        
        if portfolio:
            # Explicitly load positions with assets
            positions_statement = (
                select(Position)
                .join(Asset)
                .where(Position.portfolio_id == portfolio_id)
            )
            portfolio.positions = list(self.session.exec(positions_statement).all())
        
        return portfolio
    
    def get_positions_for_portfolio(self, portfolio_id: int) -> List[Position]:
        """
        Get all positions for a specific portfolio with assets loaded.
        
        Args:
            portfolio_id: The portfolio's ID
            
        Returns:
            List of positions with assets loaded
        """
        statement = (
            select(Position)
            .join(Asset)
            .where(Position.portfolio_id == portfolio_id)
        )
        return list(self.session.exec(statement).all())
    
    def create_position(self, position: Position) -> Position:
        """
        Create a new position in a portfolio.
        
        Args:
            position: The position to create
            
        Returns:
            The created position
        """
        self.session.add(position)
        self.session.commit()
        self.session.refresh(position)
        return position
    
    def create_snapshot(self, portfolio_id: int, value: Decimal, timestamp: datetime = None) -> PortfolioSnapshot:
        """
        Create a portfolio snapshot for tracking historical values.
        
        Args:
            portfolio_id: The portfolio's ID
            value: The portfolio's value at the snapshot time
            timestamp: Optional timestamp (defaults to current time)
            
        Returns:
            The created snapshot
        """
        if timestamp is None:
            timestamp = datetime.utcnow()
            
        snapshot = PortfolioSnapshot(
            portfolio_id=portfolio_id,
            value=value,
            timestamp=timestamp
        )
        
        self.session.add(snapshot)
        self.session.commit()
        self.session.refresh(snapshot)
        return snapshot
    
    def get_snapshots_for_portfolio(self, portfolio_id: int, limit: int = 100) -> List[PortfolioSnapshot]:
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
    
    def get_all_portfolios(self) -> List[Portfolio]:
        """
        Get all portfolios in the system.
        
        Returns:
            List of all portfolios
        """
        statement = select(Portfolio)
        return list(self.session.exec(statement).all())
    
    def get_portfolios_by_advisor(self, advisor_id: int) -> List[Portfolio]:
        """
        Get all portfolios managed by a specific advisor.
        
        Args:
            advisor_id: The advisor's user ID
            
        Returns:
            List of portfolios managed by the advisor
        """
        statement = (
            select(Portfolio)
            .join(Client)
            .where(Client.owner_id == advisor_id)
        )
        return list(self.session.exec(statement).all()) 