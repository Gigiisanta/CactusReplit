import os
import sys

sys.path.insert(
    0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))
)
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from cactus_wealth.database import get_session
from cactus_wealth.models import (
    Asset,
    AssetType,
    Client,
    Portfolio,
    PortfolioSnapshot,
    Position,
    Report,
    RiskProfile,
    User,
    UserRole,
)
from cactus_wealth.security import create_access_token
from fastapi.testclient import TestClient
from main import app
from sqlmodel import Session  # Solo para type hints si es necesario


# Eliminar fixtures locales de session y client, y usar las globales de conftest.py
# Eliminar imports innecesarios


@pytest.fixture(name="admin_user")
def admin_user_fixture(session: Session):
    """Create an admin user for testing."""
    user = User(
        email="admin@test.com",
        username="admin",
        hashed_password="hashed_password",
        role=UserRole.ADMIN,
        is_active=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture(name="advisor_user")
def advisor_user_fixture(session: Session):
    """Create a senior advisor user for testing."""
    user = User(
        email="advisor@test.com",
        username="advisor",
        hashed_password="hashed_password",
        role=UserRole.SENIOR_ADVISOR,
        is_active=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture(name="test_assets")
def test_assets_fixture(session: Session):
    """Create test assets."""
    assets = [
        Asset(ticker_symbol="AAPL", name="Apple Inc.", asset_type=AssetType.STOCK),
        Asset(ticker_symbol="GOOGL", name="Alphabet Inc.", asset_type=AssetType.STOCK),
        Asset(ticker_symbol="SPY", name="SPDR S&P 500 ETF", asset_type=AssetType.ETF),
    ]

    for asset in assets:
        session.add(asset)

    session.commit()

    for asset in assets:
        session.refresh(asset)

    return assets


@pytest.fixture(name="test_clients_and_portfolios")
def test_clients_and_portfolios_fixture(
    session: Session, admin_user: User, advisor_user: User, test_assets: list[Asset]
):
    """Create test clients with portfolios and positions."""

    # Create clients for admin user
    admin_client1 = Client(
        first_name="John",
        last_name="Admin",
        email="john.admin@test.com",
        risk_profile=RiskProfile.MEDIUM,
        owner_id=admin_user.id,
    )

    admin_client2 = Client(
        first_name="Jane",
        last_name="Admin",
        email="jane.admin@test.com",
        risk_profile=RiskProfile.HIGH,
        owner_id=admin_user.id,
    )

    # Create clients for advisor user
    advisor_client1 = Client(
        first_name="Bob",
        last_name="Advisor",
        email="bob.advisor@test.com",
        risk_profile=RiskProfile.LOW,
        owner_id=advisor_user.id,
    )

    clients = [admin_client1, admin_client2, advisor_client1]
    for client in clients:
        session.add(client)

    session.commit()

    for client in clients:
        session.refresh(client)

    # Create portfolios and positions
    portfolios_data = [
        # Admin client 1 portfolio
        {
            "client": admin_client1,
            "name": "Conservative Portfolio",
            "positions": [
                {
                    "asset": test_assets[0],
                    "quantity": 100,
                    "purchase_price": 150.0,
                },  # AAPL
                {
                    "asset": test_assets[2],
                    "quantity": 50,
                    "purchase_price": 400.0,
                },  # SPY
            ],
        },
        # Admin client 2 portfolio
        {
            "client": admin_client2,
            "name": "Growth Portfolio",
            "positions": [
                {
                    "asset": test_assets[1],
                    "quantity": 25,
                    "purchase_price": 2000.0,
                },  # GOOGL
            ],
        },
        # Advisor client portfolio
        {
            "client": advisor_client1,
            "name": "Balanced Portfolio",
            "positions": [
                {
                    "asset": test_assets[0],
                    "quantity": 50,
                    "purchase_price": 160.0,
                },  # AAPL
                {
                    "asset": test_assets[2],
                    "quantity": 25,
                    "purchase_price": 410.0,
                },  # SPY
            ],
        },
    ]

    portfolios = []
    for portfolio_data in portfolios_data:
        portfolio = Portfolio(
            name=portfolio_data["name"], client_id=portfolio_data["client"].id
        )
        session.add(portfolio)
        session.commit()
        session.refresh(portfolio)
        portfolios.append(portfolio)

        # Add positions to portfolio
        for position_data in portfolio_data["positions"]:
            position = Position(
                quantity=position_data["quantity"],
                purchase_price=position_data["purchase_price"],
                average_price=position_data.get("average_price", position_data["purchase_price"]),
                current_price=position_data.get("current_price", position_data["purchase_price"]),
                portfolio_id=portfolio.id,
                asset_id=position_data["asset"].id,
            )
            session.add(position)
        session.commit()

    return {
        "clients": clients,
        "portfolios": portfolios,
        "admin_clients": [admin_client1, admin_client2],
        "advisor_clients": [advisor_client1],
    }


def test_dashboard_summary_admin_user(
    test_client: TestClient, admin_user: User, test_clients_and_portfolios: dict
):
    """Test dashboard summary endpoint with admin user - should see all clients."""

    # Create access token for admin user
    token = create_access_token(data={"sub": admin_user.email})
    headers = {"Authorization": f"Bearer {token}"}

    # Call dashboard summary endpoint
    response = test_client.get("/api/v1/dashboard/summary", headers=headers)

    # Verify response
    assert response.status_code == 200
    data = response.json()

    # Admin should see all 3 clients (2 admin + 1 advisor)
    assert data["total_clients"] == 3

    # Should have AUM calculated (though exact value depends on market data mock)
    assert "assets_under_management" in data
    assert isinstance(data["assets_under_management"], (int, float))
    assert data["assets_under_management"] >= 0

    # Monthly growth should be None (TODO)
    assert data["monthly_growth_percentage"] is None

    # Reports should be 0 (placeholder)
    assert data["reports_generated_this_quarter"] == 0


def test_dashboard_summary_advisor_user(
    test_client: TestClient, advisor_user: User, test_clients_and_portfolios: dict
):
    """Test dashboard summary endpoint with advisor user - should see only assigned clients."""

    # Create access token for advisor user
    token = create_access_token(data={"sub": advisor_user.email})
    headers = {"Authorization": f"Bearer {token}"}

    # Call dashboard summary endpoint
    response = test_client.get("/api/v1/dashboard/summary", headers=headers)

    # Verify response
    assert response.status_code == 200
    data = response.json()

    # Advisor should see only 1 client (their assigned client)
    assert data["total_clients"] == 1

    # Should have AUM calculated for advisor's client only
    assert "assets_under_management" in data
    assert isinstance(data["assets_under_management"], (int, float))
    assert data["assets_under_management"] >= 0

    # Monthly growth should be None (TODO)
    assert data["monthly_growth_percentage"] is None

    # Reports should be 0 (placeholder)
    assert data["reports_generated_this_quarter"] == 0


def test_dashboard_summary_unauthorized(test_client: TestClient):
    """Test dashboard summary endpoint without authentication."""

    # Call dashboard summary endpoint without token
    response = test_client.get("/api/v1/dashboard/summary")

    # Should return 401 Unauthorized
    assert response.status_code == 401


def test_dashboard_summary_invalid_token(test_client: TestClient):
    """Test dashboard summary endpoint with invalid token."""

    # Call dashboard summary endpoint with invalid token
    headers = {"Authorization": "Bearer invalid_token"}
    response = test_client.get("/api/v1/dashboard/summary", headers=headers)

    # Should return 401 Unauthorized
    assert response.status_code == 401


def test_dashboard_summary_response_schema(
    test_client: TestClient, admin_user: User, test_clients_and_portfolios: dict
):
    """Test that dashboard summary response matches expected schema."""

    # Create access token for admin user
    token = create_access_token(data={"sub": admin_user.email})
    headers = {"Authorization": f"Bearer {token}"}

    # Call dashboard summary endpoint
    response = test_client.get("/api/v1/dashboard/summary", headers=headers)

    # Verify response structure
    assert response.status_code == 200
    data = response.json()

    # Check all required fields are present
    required_fields = [
        "total_clients",
        "assets_under_management",
        "monthly_growth_percentage",
        "reports_generated_this_quarter",
    ]

    for field in required_fields:
        assert field in data

    # Check field types
    assert isinstance(data["total_clients"], int)
    assert isinstance(data["assets_under_management"], (int, float))
    assert data["monthly_growth_percentage"] is None or isinstance(
        data["monthly_growth_percentage"], (int, float)
    )
    assert isinstance(data["reports_generated_this_quarter"], int)


def test_dashboard_reports_kpi_with_generated_reports(
    session: Session,
    test_client: TestClient,
    admin_user: User,
    advisor_user: User,
    test_clients_and_portfolios: dict,
):
    """Test that reports_generated_this_quarter KPI correctly counts generated reports."""
    from datetime import datetime

    # Create some reports for this quarter
    admin_client = test_clients_and_portfolios["admin_clients"][0]
    advisor_client = test_clients_and_portfolios["advisor_clients"][0]

    # Create reports generated by admin user
    admin_report1 = Report(
        client_id=admin_client.id,
        advisor_id=admin_user.id,
        file_path="/media/reports/admin_report_1.pdf",
        report_type="PORTFOLIO_SUMMARY",
        generated_at=datetime.now(UTC),
    )

    admin_report2 = Report(
        client_id=admin_client.id,
        advisor_id=admin_user.id,
        file_path="/media/reports/admin_report_2.pdf",
        report_type="PORTFOLIO_SUMMARY",
        generated_at=datetime.now(UTC),
    )

    # Create report generated by advisor user
    advisor_report1 = Report(
        client_id=advisor_client.id,
        advisor_id=advisor_user.id,
        file_path="/media/reports/advisor_report_1.pdf",
        report_type="PORTFOLIO_SUMMARY",
        generated_at=datetime.now(UTC),
    )

    reports = [admin_report1, admin_report2, advisor_report1]
    for report in reports:
        session.add(report)

    session.commit()

    # Test admin user - should see all 3 reports
    admin_token = create_access_token(data={"sub": admin_user.email})
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    admin_response = test_client.get("/api/v1/dashboard/summary", headers=admin_headers)
    assert admin_response.status_code == 200

    admin_data = admin_response.json()
    assert admin_data["reports_generated_this_quarter"] == 3

    # Test advisor user - should see only their 1 report
    advisor_token = create_access_token(data={"sub": advisor_user.email})
    advisor_headers = {"Authorization": f"Bearer {advisor_token}"}

    advisor_response = test_client.get("/api/v1/dashboard/summary", headers=advisor_headers)
    assert advisor_response.status_code == 200

    advisor_data = advisor_response.json()
    assert advisor_data["reports_generated_this_quarter"] == 1


def test_dashboard_reports_kpi_with_old_reports(
    session: Session,
    test_client: TestClient,
    admin_user: User,
    test_clients_and_portfolios: dict,
):
    """Test that dashboard reports KPI only counts reports from current quarter."""
    from datetime import datetime, timedelta

    # Create a report from last quarter (older than 3 months)
    old_report_date = datetime.now(UTC) - timedelta(days=100)
    old_report = Report(
        client_id=test_clients_and_portfolios["admin_clients"][0].id,
        advisor_id=admin_user.id,
        generated_at=old_report_date,
        file_path="/fake/path/old_report.pdf",
        report_type="PORTFOLIO_SUMMARY",
    )
    session.add(old_report)
    session.commit()

    # Create access token
    access_token = create_access_token(data={"sub": admin_user.email})

    # Test dashboard endpoint
    response = test_client.get(
        "/api/v1/dashboard/summary", headers={"Authorization": f"Bearer {access_token}"}
    )

    assert response.status_code == 200
    data = response.json()

    # Should not count old reports
    assert data["reports_generated_this_quarter"] == 0


def test_dashboard_monthly_growth_with_snapshots(
    session: Session,
    test_client: TestClient,
    admin_user: User,
    test_clients_and_portfolios: dict,
):
    """Test monthly growth calculation with historical portfolio snapshots."""

    # Get the portfolios created in the fixture
    portfolios = test_clients_and_portfolios["portfolios"]

    # Define dates for snapshots
    now = datetime.now(UTC)
    current_month_start = datetime(now.year, now.month, 1, tzinfo=UTC)

    # Create historical snapshots for each portfolio
    snapshot_data = [
        # Portfolio 1: Started month at $100k, now at $105k (5% growth)
        {
            "portfolio_id": portfolios[0].id,
            "start_of_month_value": Decimal("100000.00"),
            "current_value": Decimal("105000.00"),
        },
        # Portfolio 2: Started month at $50k, now at $52k (4% growth)
        {
            "portfolio_id": portfolios[1].id,
            "start_of_month_value": Decimal("50000.00"),
            "current_value": Decimal("52000.00"),
        },
    ]

    # Create start-of-month snapshots
    for data in snapshot_data:
        start_of_month_snapshot = PortfolioSnapshot(
            portfolio_id=data["portfolio_id"],
            value=data["start_of_month_value"],
            timestamp=current_month_start,
        )
        session.add(start_of_month_snapshot)

    # Create current snapshots (few days ago to simulate recent data)
    recent_date = now - timedelta(days=2)
    for data in snapshot_data:
        current_snapshot = PortfolioSnapshot(
            portfolio_id=data["portfolio_id"],
            value=data["current_value"],
            timestamp=recent_date,
        )
        session.add(current_snapshot)

    session.commit()

    # Create access token
    access_token = create_access_token(data={"sub": admin_user.email})

    # Test dashboard endpoint
    response = test_client.get(
        "/api/v1/dashboard/summary", headers={"Authorization": f"Bearer {access_token}"}
    )

    assert response.status_code == 200
    data = response.json()

    # Verify monthly growth calculation
    # Expected: (157000 / 150000) - 1 = 0.0467 (approximately 4.67%)
    # Portfolio 1: 105k -> 100k = 5% growth
    # Portfolio 2: 52k -> 50k = 4% growth
    # Combined: (157k / 150k) - 1 = 0.0467
    assert data["monthly_growth_percentage"] is not None
    assert (
        abs(data["monthly_growth_percentage"] - 0.0467) < 0.001
    )  # Allow small rounding differences

    print(
        f"Monthly Growth: {data['monthly_growth_percentage']:.4f} ({data['monthly_growth_percentage']*100:.2f}%)"
    )


def test_dashboard_monthly_growth_no_historical_data(
    session: Session,
    test_client: TestClient,
    admin_user: User,
    test_clients_and_portfolios: dict,
):
    """Test monthly growth returns None when no historical snapshot data exists."""

    # Create access token
    access_token = create_access_token(data={"sub": admin_user.email})

    # Test dashboard endpoint (no snapshots created)
    response = test_client.get(
        "/api/v1/dashboard/summary", headers={"Authorization": f"Bearer {access_token}"}
    )

    assert response.status_code == 200
    data = response.json()

    # Should return None when no historical data
    assert data["monthly_growth_percentage"] is None
