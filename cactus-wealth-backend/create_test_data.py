#!/usr/bin/env python3
"""
Script to create comprehensive test data for demonstrating Monthly Growth functionality.
"""

import sys
import os
from datetime import datetime, timedelta, timezone
from decimal import Decimal

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from sqlmodel import Session, select
from cactus_wealth.database import engine
from cactus_wealth.models import (
    User, Client, Portfolio, Position, Asset, PortfolioSnapshot,
    UserRole, RiskProfile, AssetType, ClientStatus, LeadSource,
    InvestmentAccount, InsurancePolicy
)


def create_test_data():
    """Create comprehensive test data."""
    with Session(engine) as session:
        print("🌱 Creating test data...")
        
        # Get demo user
        demo_user = session.exec(select(User).where(User.username == "demo")).first()
        if not demo_user:
            print("❌ Demo user not found. Run create_demo_user.py first.")
            return
        
        # Create assets if they don't exist
        assets_data = [
            {"ticker": "AAPL", "name": "Apple Inc.", "type": AssetType.STOCK},
            {"ticker": "GOOGL", "name": "Alphabet Inc.", "type": AssetType.STOCK},
            {"ticker": "SPY", "name": "SPDR S&P 500 ETF", "type": AssetType.ETF},
        ]
        
        assets = {}
        for asset_data in assets_data:
            existing_asset = session.exec(
                select(Asset).where(Asset.ticker_symbol == asset_data["ticker"])
            ).first()
            
            if not existing_asset:
                asset = Asset(
                    ticker_symbol=asset_data["ticker"],
                    name=asset_data["name"],
                    asset_type=asset_data["type"]
                )
                session.add(asset)
                session.commit()
                session.refresh(asset)
                assets[asset_data["ticker"]] = asset
                print(f"  ✅ Created asset: {asset_data['ticker']}")
            else:
                assets[asset_data["ticker"]] = existing_asset
                print(f"  📝 Asset exists: {asset_data['ticker']}")
        
        # Create clients if they don't exist
        clients_data = [
            {
                "first_name": "John", 
                "last_name": "Smith", 
                "email": "john.smith@test.com", 
                "risk": RiskProfile.MEDIUM,
                "status": ClientStatus.active_investor,
                "lead_source": LeadSource.referral,
                "notes": "Cliente conservador con buen perfil de riesgo. Prefiere inversiones estables."
            },
            {
                "first_name": "Sarah", 
                "last_name": "Johnson", 
                "email": "sarah.johnson@test.com", 
                "risk": RiskProfile.HIGH,
                "status": ClientStatus.active_investor,
                "lead_source": LeadSource.social_media,
                "notes": "Inversionista agresiva con experiencia en mercados. Busca alto crecimiento."
            },
            {
                "first_name": "Carlos", 
                "last_name": "Rodriguez", 
                "email": "carlos.rodriguez@test.com", 
                "risk": RiskProfile.LOW,
                "status": ClientStatus.prospect,
                "lead_source": LeadSource.event,
                "notes": "Prospecto interesado en seguros de vida. Próxima reunión programada."
            },
            {
                "first_name": "Ana", 
                "last_name": "Martinez", 
                "email": "ana.martinez@test.com", 
                "risk": RiskProfile.MEDIUM,
                "status": ClientStatus.onboarding,
                "lead_source": LeadSource.referral,
                "notes": "En proceso de apertura de cuenta. Referida por John Smith.",
                "referred_by_email": "john.smith@test.com"
            },
            {
                "first_name": "Luis", 
                "last_name": "Garcia", 
                "email": "luis.garcia@test.com", 
                "risk": RiskProfile.HIGH,
                "status": ClientStatus.active_insured,
                "lead_source": LeadSource.organic,
                "notes": "Cliente con múltiples pólizas de seguro. Excelente perfil crediticio."
            }
        ]
        
        # Create clients in two passes to handle referrals
        clients = {}
        
        # First pass: create all clients without referrals
        for client_data in clients_data:
            existing_client = session.exec(
                select(Client).where(Client.email == client_data["email"])
            ).first()
            
            if not existing_client:
                client = Client(
                    first_name=client_data["first_name"],
                    last_name=client_data["last_name"],
                    email=client_data["email"],
                    risk_profile=client_data["risk"],
                    status=client_data["status"],
                    lead_source=client_data["lead_source"],
                    notes=client_data["notes"],
                    owner_id=demo_user.id
                )
                session.add(client)
                session.commit()
                session.refresh(client)
                clients[client_data["email"]] = client
                print(f"  ✅ Created client: {client_data['first_name']} {client_data['last_name']}")
            else:
                clients[client_data["email"]] = existing_client
                print(f"  📝 Client exists: {client_data['first_name']} {client_data['last_name']}")
        
        # Second pass: update referrals
        for client_data in clients_data:
            if "referred_by_email" in client_data:
                client = clients[client_data["email"]]
                referrer = clients.get(client_data["referred_by_email"])
                if referrer and not client.referred_by_client_id:
                    client.referred_by_client_id = referrer.id
                    session.add(client)
                    session.commit()
                    print(f"  🔗 Updated referral: {client.first_name} referred by {referrer.first_name}")
        
        # Create investment accounts
        investment_accounts_data = [
            {"client_email": "john.smith@test.com", "platform": "Balanz", "account_number": "BAL001", "aum": Decimal("37500.00")},
            {"client_email": "sarah.johnson@test.com", "platform": "Decrypto", "account_number": "DEC001", "aum": Decimal("68250.00")},
            {"client_email": "sarah.johnson@test.com", "platform": "Balanz", "account_number": "BAL002", "aum": Decimal("25000.00")},
            {"client_email": "ana.martinez@test.com", "platform": "Decrypto", "account_number": "DEC002", "aum": Decimal("15000.00")},
        ]
        
        for account_data in investment_accounts_data:
            client = clients.get(account_data["client_email"])
            if client:
                existing_account = session.exec(
                    select(InvestmentAccount).where(
                        InvestmentAccount.client_id == client.id,
                        InvestmentAccount.platform == account_data["platform"]
                    )
                ).first()
                
                if not existing_account:
                    account = InvestmentAccount(
                        platform=account_data["platform"],
                        account_number=account_data["account_number"],
                        aum=account_data["aum"],
                        client_id=client.id
                    )
                    session.add(account)
                    session.commit()
                    print(f"  💰 Created investment account: {account_data['platform']} for {client.first_name}")
        
        # Create insurance policies
        insurance_policies_data = [
            {"client_email": "john.smith@test.com", "policy_number": "VIDA001", "type": "Seguro de Vida", "premium": Decimal("250.00"), "coverage": Decimal("500000.00")},
            {"client_email": "carlos.rodriguez@test.com", "policy_number": "VIDA002", "type": "Seguro de Vida", "premium": Decimal("180.00"), "coverage": Decimal("300000.00")},
            {"client_email": "luis.garcia@test.com", "policy_number": "VIDA003", "type": "Seguro de Vida", "premium": Decimal("400.00"), "coverage": Decimal("750000.00")},
            {"client_email": "luis.garcia@test.com", "policy_number": "RET001", "type": "Seguro de Retiro", "premium": Decimal("500.00"), "coverage": Decimal("1000000.00")},
            {"client_email": "ana.martinez@test.com", "policy_number": "VIDA004", "type": "Seguro de Vida", "premium": Decimal("200.00"), "coverage": Decimal("400000.00")},
        ]
        
        for policy_data in insurance_policies_data:
            client = clients.get(policy_data["client_email"])
            if client:
                existing_policy = session.exec(
                    select(InsurancePolicy).where(
                        InsurancePolicy.policy_number == policy_data["policy_number"]
                    )
                ).first()
                
                if not existing_policy:
                    policy = InsurancePolicy(
                        policy_number=policy_data["policy_number"],
                        insurance_type=policy_data["type"],
                        premium_amount=policy_data["premium"],
                        coverage_amount=policy_data["coverage"],
                        client_id=client.id
                    )
                    session.add(policy)
                    session.commit()
                    print(f"  🛡️  Created insurance policy: {policy_data['type']} for {client.first_name}")
        
        # Create portfolios with positions
        portfolios_data = [
            {
                "name": "Conservative Growth",
                "client_email": "john.smith@test.com",
                "positions": [
                    {"ticker": "AAPL", "quantity": 100, "purchase_price": 150.0},
                    {"ticker": "SPY", "quantity": 50, "purchase_price": 400.0},
                ]
            },
            {
                "name": "Aggressive Growth",
                "client_email": "sarah.johnson@test.com",
                "positions": [
                    {"ticker": "GOOGL", "quantity": 25, "purchase_price": 2000.0},
                    {"ticker": "AAPL", "quantity": 75, "purchase_price": 160.0},
                ]
            }
        ]
        
        portfolios = []
        for portfolio_data in portfolios_data:
            existing_portfolio = session.exec(
                select(Portfolio).where(Portfolio.name == portfolio_data["name"])
            ).first()
            
            if not existing_portfolio:
                client = clients[portfolio_data["client_email"]]
                portfolio = Portfolio(
                    name=portfolio_data["name"],
                    client_id=client.id
                )
                session.add(portfolio)
                session.commit()
                session.refresh(portfolio)
                
                # Add positions
                for position_data in portfolio_data["positions"]:
                    asset = assets[position_data["ticker"]]
                    position = Position(
                        quantity=position_data["quantity"],
                        purchase_price=position_data["purchase_price"],
                        portfolio_id=portfolio.id,
                        asset_id=asset.id
                    )
                    session.add(position)
                
                session.commit()
                portfolios.append(portfolio)
                print(f"  ✅ Created portfolio: {portfolio_data['name']} with {len(portfolio_data['positions'])} positions")
            else:
                portfolios.append(existing_portfolio)
                print(f"  📝 Portfolio exists: {portfolio_data['name']}")
        
        # Create historical snapshots
        now = datetime.now(timezone.utc)
        current_month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
        
        # Calculate previous month
        if now.month == 1:
            prev_month = 12
            prev_year = now.year - 1
        else:
            prev_month = now.month - 1
            prev_year = now.year
        
        last_month_start = datetime(prev_year, prev_month, 1, tzinfo=timezone.utc)
        
        # Historical snapshot data (simulated realistic portfolio values)
        snapshots_data = [
            # Portfolio 1: Conservative Growth - showing steady growth
            {
                "portfolio_name": "Conservative Growth",
                "snapshots": [
                    (last_month_start, Decimal("35000.00")),  # Start of last month
                    (current_month_start, Decimal("36000.00")),  # Start of current month  
                    (now - timedelta(days=3), Decimal("37500.00")),  # Recent (4.17% growth this month)
                ]
            },
            # Portfolio 2: Aggressive Growth - showing higher volatility
            {
                "portfolio_name": "Aggressive Growth",
                "snapshots": [
                    (last_month_start, Decimal("62000.00")),  # Start of last month
                    (current_month_start, Decimal("65000.00")),  # Start of current month
                    (now - timedelta(days=3), Decimal("68250.00")),  # Recent (5% growth this month)
                ]
            }
        ]
        
        snapshots_created = 0
        for portfolio_data in snapshots_data:
            portfolio = next((p for p in portfolios if p.name == portfolio_data["portfolio_name"]), None)
            if not portfolio:
                continue
                
            for timestamp, value in portfolio_data["snapshots"]:
                # Check if snapshot already exists
                existing_snapshot = session.exec(
                    select(PortfolioSnapshot)
                    .where(PortfolioSnapshot.portfolio_id == portfolio.id)
                    .where(PortfolioSnapshot.timestamp >= timestamp)
                    .where(PortfolioSnapshot.timestamp < timestamp + timedelta(hours=1))
                ).first()
                
                if not existing_snapshot:
                    snapshot = PortfolioSnapshot(
                        portfolio_id=portfolio.id,
                        value=value,
                        timestamp=timestamp
                    )
                    session.add(snapshot)
                    snapshots_created += 1
        
        session.commit()
        print(f"  ✅ Created {snapshots_created} portfolio snapshots")
        
        print(f"\n🎉 Test data creation complete!")
        print(f"📊 Expected Monthly Growth: ~4.6% ((105,750 / 101,000) - 1)")
        print(f"   - Combined start-of-month value: $101,000")
        print(f"   - Combined current value: $105,750")
        print(f"   - Growth: 4.7%")


if __name__ == "__main__":
    create_test_data() 