"""
Pruebas unitarias para ClientRepository.
Testea la lógica de queries relacionadas con clientes y sus productos financieros,
mockeando la session de SQLModel para aislar la lógica del repositorio.
"""

from decimal import Decimal
from unittest.mock import Mock

import pytest
from cactus_wealth import crud
from cactus_wealth.models import Client, InsurancePolicy, InvestmentAccount
from cactus_wealth.schemas import InsurancePolicyCreate, InvestmentAccountCreate
from sqlmodel import Session


class TestClientRepository:
    """Test suite para ClientRepository con session mockeada."""

    def test_get_by_email_builds_correct_query(
        self, client_repository, mock_session: Mock
    ):
        """Test que get_by_email construye la query correcta con filtro de email."""
        # Arrange
        email = "test@example.com"
        mock_client = Mock()
        mock_client.email = email
        mock_result = Mock()
        mock_result.first.return_value = mock_client
        mock_session.exec.return_value = mock_result

        # Act
        result = client_repository.get_by_email(email)

        # Assert
        mock_session.exec.assert_called_once()
        assert result == mock_client

    def test_get_by_email_returns_none_when_not_found(
        self, client_repository, mock_session: Mock
    ):
        """Test que get_by_email retorna None cuando no encuentra el email."""
        # Arrange
        email = "nonexistent@example.com"
        mock_result = Mock()
        mock_result.first.return_value = None
        mock_session.exec.return_value = mock_result

        # Act
        result = client_repository.get_by_email(email)

        # Assert
        mock_session.exec.assert_called_once()
        assert result is None

    def test_get_by_advisor_with_pagination(
        self, client_repository, mock_session: Mock
    ):
        """Test que get_by_advisor aplica paginación correctamente."""
        # Arrange
        advisor_id = 123
        skip = 10
        limit = 20
        mock_clients = [Mock() for _ in range(20)]
        mock_result = Mock()
        mock_result.all.return_value = mock_clients
        mock_session.exec.return_value = mock_result

        # Act
        result = client_repository.get_by_advisor(advisor_id, skip=skip, limit=limit)

        # Assert
        mock_session.exec.assert_called_once()
        assert len(result) == 20

    def test_get_with_products_loads_accounts_and_policies(
        self, client_repository, mock_session: Mock
    ):
        """Test que get_with_products retorna cliente con cuentas y pólizas cargadas."""
        # Arrange
        client_id = 123
        mock_client = Mock()
        mock_client.id = client_id
        mock_accounts = [Mock(), Mock()]
        mock_policies = [Mock(), Mock()]
        mock_client.investment_accounts = mock_accounts
        mock_client.insurance_policies = mock_policies
        mock_result = Mock()
        mock_result.first.return_value = mock_client
        mock_session.exec.side_effect = [mock_result, mock_result]

        # Act
        result = client_repository.get_with_products(client_id)

        # Assert
        assert result.id == mock_client.id
        assert result.investment_accounts == mock_accounts
        assert result.insurance_policies == mock_policies
        assert mock_session.exec.call_count == 1

    def test_verify_advisor_access_with_valid_access(
        self, client_repository, mock_session: Mock
    ):
        """Test que verify_advisor_access retorna cliente cuando hay acceso válido."""
        # Arrange
        client_id = 123
        advisor_id = 456
        mock_client = Mock()
        mock_client.id = client_id
        mock_client.owner_id = advisor_id
        mock_result = Mock()
        mock_result.first.return_value = mock_client
        mock_session.exec.return_value = mock_result

        # Act
        result = client_repository.verify_advisor_access(client_id, advisor_id)

        # Assert
        mock_session.exec.assert_called_once()
        assert result == mock_client

    def test_verify_advisor_access_with_invalid_access(
        self, client_repository, mock_session: Mock
    ):
        """Test que verify_advisor_access retorna None cuando no hay acceso válido."""
        # Arrange
        client_id = 123
        advisor_id = 789
        mock_result = Mock()
        mock_result.first.return_value = None
        mock_session.exec.return_value = mock_result

        # Act
        result = client_repository.verify_advisor_access(client_id, advisor_id)

        # Assert
        mock_session.exec.assert_called_once()
        assert result is None

    def test_create_investment_account_executes_full_cycle(
        self, client_repository, mock_session: Mock
    ):
        """Test que create_investment_account ejecuta add, commit y refresh."""
        # Arrange
        mock_account = Mock()

        # Act
        result = client_repository.create_investment_account(mock_account)

        # Assert
        mock_session.add.assert_called_once_with(mock_account)
        mock_session.commit.assert_called_once()
        mock_session.refresh.assert_called_once_with(mock_account)
        assert result == mock_account

    def test_create_insurance_policy_executes_full_cycle(
        self, client_repository, mock_session: Mock
    ):
        """Test que create_insurance_policy ejecuta add, commit y refresh."""
        # Arrange
        mock_policy = Mock()

        # Act
        result = client_repository.create_insurance_policy(mock_policy)

        # Assert
        mock_session.add.assert_called_once_with(mock_policy)
        mock_session.commit.assert_called_once()
        mock_session.refresh.assert_called_once_with(mock_policy)
        assert result == mock_policy


# Marcadores para organizar las pruebas
pytestmark = pytest.mark.unit


def test_delete_client_with_related_accounts_and_policies(
    session: Session, test_user, test_client_db
):
    """Test that deleting a client also deletes related investment accounts and insurance policies."""
    # Create investment account for the client
    investment_account_data = InvestmentAccountCreate(
        platform="Test Platform", account_number="TEST001", aum=Decimal("10000.00"), client_id=test_client_db.id
    )
    investment_account = crud.create_client_investment_account(
        session=session, account_data=investment_account_data, client_id=test_client_db.id
    )

    # Create insurance policy for the client
    insurance_policy_data = InsurancePolicyCreate(
        policy_number="POL001",
        insurance_type="Seguro de Vida",
        premium_amount=Decimal("500.00"),
        coverage_amount=Decimal("100000.00"),
        client_id=test_client_db.id,  # This will be ignored by the crud function
    )
    insurance_policy = crud.create_client_insurance_policy(
        session=session, policy_data=insurance_policy_data, client_id=test_client_db.id
    )

    # Verify accounts and policies exist
    assert session.get(InvestmentAccount, investment_account.id) is not None
    assert session.get(InsurancePolicy, insurance_policy.id) is not None

    # Delete the client
    deleted_client = crud.remove_client(
        session=session, client_id=test_client_db.id, owner_id=test_user.id
    )

    # Verify client was deleted
    assert deleted_client is not None
    assert session.get(Client, test_client_db.id) is None

    # Verify related accounts and policies were also deleted (cascade)
    assert session.get(InvestmentAccount, investment_account.id) is None
    assert session.get(InsurancePolicy, insurance_policy.id) is None


def test_delete_nonexistent_client(session: Session, test_user):
    """Test that deleting a nonexistent client returns None."""
    result = crud.remove_client(session=session, client_id=99999, owner_id=test_user.id)
    assert result is None


def test_delete_client_wrong_owner(
    session: Session, test_user, test_client_db, another_user
):
    """Test that deleting a client with wrong owner returns None."""
    result = crud.remove_client(
        session=session, client_id=test_client_db.id, owner_id=another_user.id
    )
    assert result is None
    # Verify client still exists
    assert session.get(Client, test_client_db.id) is not None
