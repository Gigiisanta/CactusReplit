#!/usr/bin/env python3
"""
Script to seed historical portfolio snapshot data for development and testing.

This script creates PortfolioSnapshot entries with realistic historical values
to enable testing of the Monthly Growth KPI calculation.
"""

import random
import sys
from datetime import datetime, timedelta
from decimal import Decimal
from pathlib import Path

# Add the src directory to Python path for imports
sys.path.insert(0, str(Path(__file__).parent / "src"))

from sqlmodel import Session, create_engine, select
from cactus_wealth.core.config import settings
from cactus_wealth.models import Portfolio, PortfolioSnapshot
from cactus_wealth.core.dataprovider import get_market_data_provider
from cactus_wealth.services import PortfolioService


def create_historical_snapshots():
    """Create historical snapshots for all existing portfolios."""
    
    # Create database engine and session
    engine = create_engine(settings.DATABASE_URL)
    
    with Session(engine) as session:
        # Initialize market data provider and portfolio service
        market_data_provider = get_market_data_provider()
        portfolio_service = PortfolioService(session, market_data_provider)
        
        # Get all existing portfolios
        portfolios = session.exec(select(Portfolio)).all()
        
        if not portfolios:
            print("No portfolios found. Please create portfolios first.")
            return
        
        print(f"Found {len(portfolios)} portfolios. Creating historical snapshots...")
        
        for portfolio in portfolios:
            try:
                print(f"\nProcessing portfolio {portfolio.id}: '{portfolio.name}'")
                
                # Get current portfolio value
                current_valuation = portfolio_service.get_portfolio_valuation(portfolio.id)
                current_value = current_valuation.total_value
                
                if current_value <= 0:
                    print(f"Skipping portfolio {portfolio.id} - no current value")
                    continue
                
                # Define historical dates (start of current month, start of last month, etc.)
                now = datetime.utcnow()
                current_month_start = datetime(now.year, now.month, 1)
                
                # Calculate previous months
                if now.month == 1:
                    prev_month = 12
                    prev_year = now.year - 1
                else:
                    prev_month = now.month - 1
                    prev_year = now.year
                
                last_month_start = datetime(prev_year, prev_month, 1)
                
                # Create historical snapshots with realistic value variations
                historical_dates = [
                    (last_month_start - timedelta(days=30), 0.85, 0.95),  # ~2 months ago
                    (last_month_start, 0.90, 1.0),  # Start of last month
                    (current_month_start, 0.95, 1.05),  # Start of current month
                    (now - timedelta(days=7), 0.98, 1.02),  # One week ago
                ]
                
                snapshots_created = 0
                
                for snapshot_date, min_factor, max_factor in historical_dates:
                    # Generate realistic historical value
                    value_factor = random.uniform(min_factor, max_factor)
                    historical_value = current_value * value_factor
                    
                    # Check if snapshot already exists for this date
                    existing_snapshot = session.exec(
                        select(PortfolioSnapshot)
                        .where(PortfolioSnapshot.portfolio_id == portfolio.id)
                        .where(PortfolioSnapshot.timestamp >= snapshot_date)
                        .where(PortfolioSnapshot.timestamp < snapshot_date + timedelta(days=1))
                    ).first()
                    
                    if existing_snapshot:
                        print(f"  Snapshot already exists for {snapshot_date.strftime('%Y-%m-%d')} - skipping")
                        continue
                    
                    # Create snapshot
                    snapshot = PortfolioSnapshot(
                        portfolio_id=portfolio.id,
                        value=Decimal(str(round(historical_value, 2))),
                        timestamp=snapshot_date
                    )
                    
                    session.add(snapshot)
                    snapshots_created += 1
                    
                    print(f"  Created snapshot: {snapshot_date.strftime('%Y-%m-%d')} - ${historical_value:.2f}")
                
                # Commit snapshots for this portfolio
                session.commit()
                print(f"  ✅ Created {snapshots_created} snapshots for portfolio {portfolio.id}")
                
            except Exception as e:
                session.rollback()
                print(f"  ❌ Failed to create snapshots for portfolio {portfolio.id}: {str(e)}")
                continue
        
        print(f"\n🎉 Historical data seeding completed!")


if __name__ == "__main__":
    print("🌱 Starting historical portfolio data seeding...")
    create_historical_snapshots() 