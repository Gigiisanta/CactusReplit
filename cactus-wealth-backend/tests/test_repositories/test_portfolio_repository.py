"""
Pruebas unitarias para PortfolioRepository.
Testea la lógica de construcción de queries y manipulación de datos,
mockeando la session de SQLModel para aislar la lógica del repositorio.
"""

from datetime import datetime
from decimal import Decimal
from unittest.mock import Mock

import pytest


class TestPortfolioRepository:
    """Test suite para PortfolioRepository con session mockeada."""

    def test_get_by_client_id_builds_correct_query(
        self, portfolio_repository, mock_session: Mock
    ):
        """Test que get_by_client_id construye la query correcta."""
        # Arrange
        client_id = 123
        mock_result = Mock()
        mock_result.all.return_value = [Mock(), Mock()]
        mock_session.exec.return_value = mock_result

        # Act
        result = portfolio_repository.get_by_client_id(client_id)

        # Assert
        mock_session.exec.assert_called_once()
        assert len(result) == 2

    def test_get_with_positions_returns_portfolio_with_positions(
        self, portfolio_repository, mock_session: Mock
    ):
        """Test que get_with_positions carga las posiciones correctamente."""
        # Arrange
        portfolio_id = 456
        mock_portfolio = Mock()
        mock_portfolio.id = portfolio_id

        # Mock para la primera query (portfolio)
        mock_portfolio_result = Mock()
        mock_portfolio_result.first.return_value = mock_portfolio

        # Mock para la segunda query (positions)
        mock_positions = [Mock(), Mock()]
        mock_positions_result = Mock()
        mock_positions_result.all.return_value = mock_positions

        # Configurar mock_session.exec para retornar diferentes resultados
        mock_session.exec.side_effect = [mock_portfolio_result, mock_positions_result]

        # Act
        result = portfolio_repository.get_with_positions(portfolio_id)

        # Assert
        assert result == mock_portfolio
        assert result.positions == mock_positions
        assert mock_session.exec.call_count == 2

    def test_get_with_positions_returns_none_when_portfolio_not_found(
        self, portfolio_repository, mock_session: Mock
    ):
        """Test que get_with_positions retorna None cuando no encuentra el portfolio."""
        # Arrange
        portfolio_id = 999
        mock_result = Mock()
        mock_result.first.return_value = None
        mock_session.exec.return_value = mock_result

        # Act
        result = portfolio_repository.get_with_positions(portfolio_id)

        # Assert
        assert result is None
        assert mock_session.exec.call_count == 1

    def test_create_position_adds_commits_and_refreshes(
        self, portfolio_repository, mock_session: Mock
    ):
        """Test que create_position ejecuta el ciclo completo de creación."""
        # Arrange
        mock_position = Mock()

        # Act
        result = portfolio_repository.create_position(mock_position)

        # Assert
        mock_session.add.assert_called_once_with(mock_position)
        mock_session.commit.assert_called_once()
        mock_session.refresh.assert_called_once_with(mock_position)
        assert result == mock_position

    def test_create_snapshot_with_default_timestamp(
        self, portfolio_repository, mock_session: Mock
    ):
        """Test que create_snapshot usa timestamp actual cuando no se proporciona."""
        # Arrange
        portfolio_id = 123
        value = Decimal("10000.50")

        # Mock datetime.utcnow para verificar que se usa
        from unittest.mock import patch

        with patch(
            "cactus_wealth.repositories.portfolio_repository.datetime"
        ) as mock_datetime:
            mock_now = datetime(2024, 1, 15, 12, 0, 0)
            mock_datetime.utcnow.return_value = mock_now

            # Act
            result = portfolio_repository.create_snapshot(portfolio_id, value)

            # Assert
            mock_session.add.assert_called_once()
            mock_session.commit.assert_called_once()
            mock_session.refresh.assert_called_once()
            mock_datetime.utcnow.assert_called_once()

            # Verificar que se creó PortfolioSnapshot con los datos correctos
            added_snapshot = mock_session.add.call_args[0][0]
            assert added_snapshot.portfolio_id == portfolio_id
            assert added_snapshot.value == value
            assert added_snapshot.timestamp == mock_now

    def test_get_snapshots_for_portfolio_with_default_limit(
        self, portfolio_repository, mock_session: Mock
    ):
        """Test que get_snapshots_for_portfolio usa límite por defecto."""
        # Arrange
        portfolio_id = 456
        mock_snapshots = [Mock() for _ in range(5)]
        mock_result = Mock()
        mock_result.all.return_value = mock_snapshots
        mock_session.exec.return_value = mock_result

        # Act
        result = portfolio_repository.get_snapshots_for_portfolio(portfolio_id)

        # Assert
        mock_session.exec.assert_called_once()
        assert result == mock_snapshots

    def test_get_all_portfolios_returns_all(
        self, portfolio_repository, mock_session: Mock
    ):
        """Test que get_all_portfolios retorna todos los portfolios."""
        # Arrange
        mock_portfolios = [Mock() for _ in range(3)]
        mock_result = Mock()
        mock_result.all.return_value = mock_portfolios
        mock_session.exec.return_value = mock_result

        # Act
        result = portfolio_repository.get_all_portfolios()

        # Assert
        mock_session.exec.assert_called_once()
        assert result == mock_portfolios
        assert len(result) == 3

    def test_get_portfolios_by_advisor_builds_join_query(
        self, portfolio_repository, mock_session: Mock
    ):
        """Test que get_portfolios_by_advisor construye query con JOIN a Client."""
        # Arrange
        advisor_id = 789
        mock_portfolios = [Mock(), Mock()]
        mock_result = Mock()
        mock_result.all.return_value = mock_portfolios
        mock_session.exec.return_value = mock_result

        # Act
        result = portfolio_repository.get_portfolios_by_advisor(advisor_id)

        # Assert
        mock_session.exec.assert_called_once()
        assert result == mock_portfolios


# Marcadores para organizar las pruebas
pytestmark = pytest.mark.unit
