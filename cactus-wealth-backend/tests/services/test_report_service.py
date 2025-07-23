from datetime import UTC, datetime
from unittest.mock import MagicMock, Mock, patch

import pytest
from cactus_wealth import schemas
from cactus_wealth.core.dataprovider import MarketDataProvider
from cactus_wealth.models import (
    Asset,
    AssetType,
    Client,
    Portfolio,
    Position,
    RiskProfile,
    User,
    UserRole,
)
from cactus_wealth.services import ReportService
from sqlmodel import Session


class TestReportService:
    """Test cases for ReportService."""

    @pytest.fixture
    def mock_db_session(self):
        """Mock database session."""
        return Mock(spec=Session)

    @pytest.fixture
    def mock_market_data_provider(self):
        """Mock market data provider."""
        mock_provider = Mock(spec=MarketDataProvider)
        mock_provider.get_current_price.return_value = 150.0
        return mock_provider

    @pytest.fixture
    def report_service(self, mock_db_session, mock_market_data_provider):
        """Create ReportService instance with mocked dependencies."""
        return ReportService(mock_db_session, mock_market_data_provider)

    @pytest.fixture
    def sample_user(self):
        """Create a sample advisor user."""
        return User(
            id=1,
            username="advisor1",
            email="advisor1@example.com",
            hashed_password="hashed",
            role=UserRole.SENIOR_ADVISOR,
            is_active=True,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

    @pytest.fixture
    def sample_client(self):
        """Create a sample client."""
        return Client(
            id=1,
            first_name="John",
            last_name="Doe",
            email="john.doe@example.com",
            risk_profile=RiskProfile.MEDIUM,
            owner_id=1,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

    @pytest.fixture
    def sample_portfolio(self):
        """Create a sample portfolio."""
        return Portfolio(
            id=1,
            name="John's Portfolio",
            client_id=1,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

    @pytest.fixture
    def sample_asset(self):
        """Create a sample asset."""
        return Asset(
            id=1,
            ticker_symbol="AAPL",
            name="Apple Inc.",
            asset_type=AssetType.STOCK,
            created_at=datetime.now(UTC),
        )

    @pytest.fixture
    def sample_position(self):
        """Create a sample position."""
        return Position(
            id=1,
            quantity=100.0,
            purchase_price=140.0,
            portfolio_id=1,
            asset_id=1,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

    @pytest.fixture
    def sample_valuation_data(self):
        """Create sample portfolio valuation data."""
        return schemas.PortfolioValuation(
            portfolio_id=1,
            portfolio_name="John's Portfolio",
            total_value=15000.0,
            total_cost_basis=14000.0,
            total_pnl=1000.0,
            total_pnl_percentage=7.14,
            positions_count=1,
            last_updated=datetime.now(UTC),
        )

    @pytest.mark.asyncio
    async def test_generate_portfolio_report_success(
        self,
        report_service,
        sample_user,
        sample_client,
        sample_portfolio,
        sample_asset,
        sample_position,
        mock_db_session,
    ):
        """Test successful portfolio report generation."""
        # Mock database queries
        mock_db_session.exec.side_effect = [
            # Client query result
            Mock(first=Mock(return_value=sample_client)),
            # Portfolio query result
            Mock(all=Mock(return_value=[sample_portfolio])),
        ]

        # Mock portfolio service
        with patch.object(
            report_service, "portfolio_service"
        ) as mock_portfolio_service:
            mock_valuation = schemas.PortfolioValuation(
                portfolio_id=1,
                portfolio_name="John's Portfolio",
                total_value=15000.0,
                total_cost_basis=14000.0,
                total_pnl=1000.0,
                total_pnl_percentage=7.14,
                positions_count=1,
                last_updated=datetime.now(UTC),
            )
            mock_portfolio_service.get_portfolio_valuation.return_value = mock_valuation

            # Mock PDF generation
            with patch.object(
                report_service, "generate_portfolio_report_pdf"
            ) as mock_pdf_gen:
                mock_pdf_gen.return_value = b"fake_pdf_content"

                # Mock file system operations
                with (
                    patch("pathlib.Path.mkdir"),
                    patch("builtins.open", mock_open_func()),
                    patch.object(mock_db_session, "add"),
                    patch.object(mock_db_session, "commit"),
                    patch.object(mock_db_session, "refresh"),
                ):
                    # Execute the test
                    result = await report_service.generate_portfolio_report(
                        client_id=1,
                        advisor=sample_user,
                        report_type="PORTFOLIO_SUMMARY",
                    )

                    # Assertions
                    assert result.success is True
                    assert "Report generated successfully" in result.message
                    assert (
                        result.report_id is None
                    )  # Would be set by refresh in real scenario
                    assert result.file_path is not None

    @pytest.mark.asyncio
    async def test_generate_portfolio_report_client_not_found(
        self, report_service, sample_user, mock_db_session
    ):
        """Test report generation when client is not found."""
        # Mock database query returning None
        mock_db_session.exec.return_value.first.return_value = None

        # Execute the test
        result = await report_service.generate_portfolio_report(
            client_id=999, advisor=sample_user, report_type="PORTFOLIO_SUMMARY"
        )

        # Assertions
        assert result.success is False
        assert "not found or access denied" in result.message

    @pytest.mark.asyncio
    async def test_generate_portfolio_report_no_portfolios(
        self, report_service, sample_user, sample_client, mock_db_session
    ):
        """Test report generation when client has no portfolios."""
        # Mock database queries
        mock_db_session.exec.side_effect = [
            # Client query result
            Mock(first=Mock(return_value=sample_client)),
            # Portfolio query result (empty)
            Mock(all=Mock(return_value=[])),
        ]

        # Execute the test
        result = await report_service.generate_portfolio_report(
            client_id=1, advisor=sample_user, report_type="PORTFOLIO_SUMMARY"
        )

        # Assertions
        assert result.success is False
        assert "No portfolios found" in result.message

    @pytest.mark.asyncio
    async def test_generate_portfolio_report_access_denied_for_non_admin(
        self, report_service, sample_client, mock_db_session
    ):
        """Test that non-admin users can't access other advisor's clients."""
        # Create a different advisor
        different_advisor = User(
            id=2,
            username="advisor2",
            email="advisor2@example.com",
            hashed_password="hashed",
            role=UserRole.JUNIOR_ADVISOR,
            is_active=True,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )

        # Mock database query returning None (access denied)
        mock_db_session.exec.return_value.first.return_value = None

        # Execute the test
        result = await report_service.generate_portfolio_report(
            client_id=1, advisor=different_advisor, report_type="PORTFOLIO_SUMMARY"
        )

        # Assertions
        assert result.success is False
        assert "not found or access denied" in result.message

    @patch("weasyprint.HTML")
    def test_generate_portfolio_report_pdf_success(
        self,
        mock_weasyprint_html,
        report_service,
        sample_valuation_data,
        sample_asset,
        sample_position,
        mock_db_session,
    ):
        """Test PDF generation from portfolio valuation data."""
        # Mock position with asset
        position_with_asset = sample_position
        position_with_asset.asset = sample_asset
        position_with_asset.purchase_price = getattr(position_with_asset, 'purchase_price', 140.0)

        # Mock database query for positions
        mock_db_session.exec.return_value.all.return_value = [position_with_asset]

        # Mock WeasyPrint
        mock_pdf_instance = Mock()
        mock_pdf_instance.write_pdf.return_value = b"mock_pdf_content"
        mock_weasyprint_html.return_value = mock_pdf_instance

        # Mock template rendering
        with patch.object(report_service.env, "get_template") as mock_get_template:
            mock_template = Mock()
            mock_template.render.return_value = "<html>Mock HTML</html>"
            mock_get_template.return_value = mock_template

            # Execute the test
            pdf_bytes = report_service.generate_portfolio_report_pdf(
                sample_valuation_data, "Test Portfolio"
            )

            # Assertions
            assert pdf_bytes == b"mock_pdf_content"
            mock_template.render.assert_called_once()
            mock_weasyprint_html.assert_called_once()
            mock_pdf_instance.write_pdf.assert_called_once()

    def test_generate_portfolio_report_pdf_weasyprint_not_available(
        self, report_service, sample_valuation_data, mock_db_session
    ):
        """Test PDF generation when WeasyPrint is not available."""
        # Mock database query
        mock_db_session.exec.return_value.all.return_value = []

        # Mock ImportError for WeasyPrint
        with patch(
            "builtins.__import__",
            side_effect=ImportError("No module named 'weasyprint'"),
        ):
            with pytest.raises(Exception) as exc_info:
                report_service.generate_portfolio_report_pdf(
                    sample_valuation_data, "Test Portfolio"
                )

            assert (
                "WeasyPrint is not available" in str(exc_info.value)
                or "No module named 'weasyprint'" in str(exc_info.value)
            )

    @pytest.mark.asyncio
    async def test_generate_portfolio_report_database_rollback_on_error(
        self,
        report_service,
        sample_user,
        sample_client,
        sample_portfolio,
        mock_db_session,
    ):
        """Test that database transaction is rolled back on error."""
        # Mock database queries
        mock_db_session.exec.side_effect = [
            # Client query result
            Mock(first=Mock(return_value=sample_client)),
            # Portfolio query result
            Mock(all=Mock(return_value=[sample_portfolio])),
        ]

        # Mock portfolio service to raise an exception
        with patch.object(
            report_service, "portfolio_service"
        ) as mock_portfolio_service:
            mock_portfolio_service.get_portfolio_valuation.side_effect = Exception(
                "Portfolio service error"
            )

            # Execute the test
            result = await report_service.generate_portfolio_report(
                client_id=1, advisor=sample_user, report_type="PORTFOLIO_SUMMARY"
            )

            # Assertions
            assert result.success is False
            assert "Report generation failed" in result.message
            mock_db_session.rollback.assert_called_once()


def mock_open_func():
    """Create a mock for the open function."""
    m = MagicMock()
    handle = MagicMock()
    handle.write.return_value = None
    handle.__enter__.return_value = handle
    handle.__exit__.return_value = None
    m.return_value = handle
    return m
