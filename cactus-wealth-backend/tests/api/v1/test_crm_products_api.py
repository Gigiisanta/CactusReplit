import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from cactus_wealth.main import app
from cactus_wealth.models import User, Client, InvestmentAccount, InsurancePolicy, UserRole, RiskProfile
from cactus_wealth.security import create_access_token
from cactus_wealth.database import get_session
from cactus_wealth.crud import create_user, create_client


@pytest.fixture
def client():
    """Test client for API calls."""
    return TestClient(app)


@pytest.fixture
def sample_advisor(session: Session) -> User:
    """Create a sample advisor user."""
    from cactus_wealth.schemas import UserCreate
    
    user_data = UserCreate(
        username="test_advisor",
        email="advisor@test.com",
        password="testpass123",
        role=UserRole.JUNIOR_ADVISOR
    )
    return create_user(session=session, user_create=user_data)


@pytest.fixture
def sample_admin(session: Session) -> User:
    """Create a sample admin user."""
    from cactus_wealth.schemas import UserCreate
    
    user_data = UserCreate(
        username="test_admin",
        email="admin@test.com",
        password="testpass123",
        role=UserRole.ADMIN
    )
    return create_user(session=session, user_create=user_data)


@pytest.fixture
def sample_advisor_2(session: Session) -> User:
    """Create a second advisor user for authorization tests."""
    from cactus_wealth.schemas import UserCreate
    
    user_data = UserCreate(
        username="advisor_2",
        email="advisor2@test.com",
        password="testpass123",
        role=UserRole.SENIOR_ADVISOR
    )
    return create_user(session=session, user_create=user_data)


@pytest.fixture
def sample_client(session: Session, sample_advisor: User) -> Client:
    """Create a sample client for the advisor."""
    from cactus_wealth.schemas import ClientCreate
    
    client_data = ClientCreate(
        first_name="Juan",
        last_name="Pérez",
        email="juan@test.com",
        risk_profile=RiskProfile.MEDIUM
    )
    return create_client(session=session, client=client_data, owner_id=sample_advisor.id)


@pytest.fixture
def sample_client_advisor_2(session: Session, sample_advisor_2: User) -> Client:
    """Create a sample client for the second advisor."""
    from cactus_wealth.schemas import ClientCreate
    
    client_data = ClientCreate(
        first_name="María",
        last_name="González",
        email="maria@test.com",
        risk_profile=RiskProfile.HIGH
    )
    return create_client(session=session, client=client_data, owner_id=sample_advisor_2.id)


def get_auth_headers(user: User) -> dict:
    """Get authorization headers for a user."""
    token = create_access_token(data={"sub": user.email})
    return {"Authorization": f"Bearer {token}"}


# ============ INVESTMENT ACCOUNT TESTS ============

def test_create_investment_account_success(client: TestClient, session: Session, sample_advisor: User, sample_client: Client):
    """Test successful creation of investment account."""
    headers = get_auth_headers(sample_advisor)
    
    account_data = {
        "platform": "Balanz",
        "account_number": "BAL123456",
        "aum": "50000.00"
    }
    
    response = client.post(
        f"/api/v1/clients/{sample_client.id}/investment-accounts/",
        json=account_data,
        headers=headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["platform"] == "Balanz"
    assert data["account_number"] == "BAL123456"
    assert float(data["aum"]) == 50000.00
    assert data["client_id"] == sample_client.id


def test_create_investment_account_forbidden_wrong_advisor(
    client: TestClient, 
    session: Session, 
    sample_advisor_2: User, 
    sample_client: Client
):
    """Test that advisor cannot create account for client that doesn't belong to them."""
    headers = get_auth_headers(sample_advisor_2)
    
    account_data = {
        "platform": "Decrypto",
        "account_number": "DEC789",
        "aum": "25000.00"
    }
    
    response = client.post(
        f"/api/v1/clients/{sample_client.id}/investment-accounts/",
        json=account_data,
        headers=headers
    )
    
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]


def test_create_investment_account_admin_access(
    client: TestClient, 
    session: Session, 
    sample_admin: User, 
    sample_client: Client
):
    """Test that admin can create account for any client."""
    headers = get_auth_headers(sample_admin)
    
    account_data = {
        "platform": "Decrypto",
        "account_number": "ADMIN123",
        "aum": "75000.00"
    }
    
    response = client.post(
        f"/api/v1/clients/{sample_client.id}/investment-accounts/",
        json=account_data,
        headers=headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["platform"] == "Decrypto"


def test_get_investment_account_success(
    client: TestClient, 
    session: Session, 
    sample_advisor: User, 
    sample_client: Client
):
    """Test successful retrieval of investment account."""
    # First create an account
    from cactus_wealth.schemas import InvestmentAccountCreate
    import cactus_wealth.crud as crud
    
    account_data = InvestmentAccountCreate(
        platform="Test Platform",
        account_number="TEST123",
        aum=Decimal("30000.00")
    )
    account = crud.create_client_investment_account(
        session=session,
        account_data=account_data,
        client_id=sample_client.id
    )
    
    headers = get_auth_headers(sample_advisor)
    
    response = client.get(
        f"/api/v1/investment-accounts/{account.id}",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == account.id
    assert data["platform"] == "Test Platform"


def test_get_investment_account_not_found(client: TestClient, session: Session, sample_advisor: User):
    """Test retrieval of non-existent investment account."""
    headers = get_auth_headers(sample_advisor)
    
    response = client.get(
        "/api/v1/investment-accounts/999",
        headers=headers
    )
    
    assert response.status_code == 404


def test_get_investment_accounts_for_client(
    client: TestClient, 
    session: Session, 
    sample_advisor: User, 
    sample_client: Client
):
    """Test getting all investment accounts for a client."""
    # Create multiple accounts
    from cactus_wealth.schemas import InvestmentAccountCreate
    import cactus_wealth.crud as crud
    
    for i in range(3):
        account_data = InvestmentAccountCreate(
            platform=f"Platform{i}",
            account_number=f"ACC{i}",
            aum=Decimal(f"{10000 + i * 5000}.00")
        )
        crud.create_client_investment_account(
            session=session,
            account_data=account_data,
            client_id=sample_client.id
        )
    
    headers = get_auth_headers(sample_advisor)
    
    response = client.get(
        f"/api/v1/clients/{sample_client.id}/investment-accounts/",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3


def test_update_investment_account_success(
    client: TestClient, 
    session: Session, 
    sample_advisor: User, 
    sample_client: Client
):
    """Test successful update of investment account."""
    # Create an account first
    from cactus_wealth.schemas import InvestmentAccountCreate
    import cactus_wealth.crud as crud
    
    account_data = InvestmentAccountCreate(
        platform="Original Platform",
        account_number="ORIG123",
        aum=Decimal("20000.00")
    )
    account = crud.create_client_investment_account(
        session=session,
        account_data=account_data,
        client_id=sample_client.id
    )
    
    headers = get_auth_headers(sample_advisor)
    
    update_data = {
        "platform": "Updated Platform",
        "aum": "35000.00"
    }
    
    response = client.put(
        f"/api/v1/investment-accounts/{account.id}",
        json=update_data,
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["platform"] == "Updated Platform"
    assert float(data["aum"]) == 35000.00
    assert data["account_number"] == "ORIG123"  # Unchanged


def test_delete_investment_account_success(
    client: TestClient, 
    session: Session, 
    sample_advisor: User, 
    sample_client: Client
):
    """Test successful deletion of investment account."""
    # Create an account first
    from cactus_wealth.schemas import InvestmentAccountCreate
    import cactus_wealth.crud as crud
    
    account_data = InvestmentAccountCreate(
        platform="To Delete",
        account_number="DEL123",
        aum=Decimal("15000.00")
    )
    account = crud.create_client_investment_account(
        session=session,
        account_data=account_data,
        client_id=sample_client.id
    )
    
    headers = get_auth_headers(sample_advisor)
    
    response = client.delete(
        f"/api/v1/investment-accounts/{account.id}",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == account.id
    
    # Verify it's actually deleted
    deleted_account = session.get(InvestmentAccount, account.id)
    assert deleted_account is None


# ============ INSURANCE POLICY TESTS ============

def test_create_insurance_policy_success(client: TestClient, session: Session, sample_advisor: User, sample_client: Client):
    """Test successful creation of insurance policy."""
    headers = get_auth_headers(sample_advisor)
    
    policy_data = {
        "policy_number": "POL123456",
        "insurance_type": "Seguro de Vida",
        "premium_amount": "500.00",
        "coverage_amount": "100000.00"
    }
    
    response = client.post(
        f"/api/v1/clients/{sample_client.id}/insurance-policies/",
        json=policy_data,
        headers=headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["policy_number"] == "POL123456"
    assert data["insurance_type"] == "Seguro de Vida"
    assert float(data["premium_amount"]) == 500.00
    assert float(data["coverage_amount"]) == 100000.00
    assert data["client_id"] == sample_client.id


def test_create_insurance_policy_duplicate_number(
    client: TestClient, 
    session: Session, 
    sample_advisor: User, 
    sample_client: Client
):
    """Test that creating policy with duplicate policy number fails."""
    # First create a policy
    from cactus_wealth.schemas import InsurancePolicyCreate
    import cactus_wealth.crud as crud
    
    policy_data = InsurancePolicyCreate(
        policy_number="DUPLICATE123",
        insurance_type="Seguro de Vida",
        premium_amount=Decimal("300.00"),
        coverage_amount=Decimal("50000.00")
    )
    crud.create_client_insurance_policy(
        session=session,
        policy_data=policy_data,
        client_id=sample_client.id
    )
    
    headers = get_auth_headers(sample_advisor)
    
    # Try to create another with same policy number
    duplicate_policy_data = {
        "policy_number": "DUPLICATE123",
        "insurance_type": "Seguro de Retiro",
        "premium_amount": "400.00",
        "coverage_amount": "60000.00"
    }
    
    response = client.post(
        f"/api/v1/clients/{sample_client.id}/insurance-policies/",
        json=duplicate_policy_data,
        headers=headers
    )
    
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_create_insurance_policy_forbidden_wrong_advisor(
    client: TestClient, 
    session: Session, 
    sample_advisor_2: User, 
    sample_client: Client
):
    """Test that advisor cannot create policy for client that doesn't belong to them."""
    headers = get_auth_headers(sample_advisor_2)
    
    policy_data = {
        "policy_number": "FORBIDDEN123",
        "insurance_type": "Seguro de Vida",
        "premium_amount": "250.00",
        "coverage_amount": "30000.00"
    }
    
    response = client.post(
        f"/api/v1/clients/{sample_client.id}/insurance-policies/",
        json=policy_data,
        headers=headers
    )
    
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]


def test_get_insurance_policy_success(
    client: TestClient, 
    session: Session, 
    sample_advisor: User, 
    sample_client: Client
):
    """Test successful retrieval of insurance policy."""
    # Create a policy first
    from cactus_wealth.schemas import InsurancePolicyCreate
    import cactus_wealth.crud as crud
    
    policy_data = InsurancePolicyCreate(
        policy_number="GET123",
        insurance_type="Seguro de Retiro",
        premium_amount=Decimal("450.00"),
        coverage_amount=Decimal("80000.00")
    )
    policy = crud.create_client_insurance_policy(
        session=session,
        policy_data=policy_data,
        client_id=sample_client.id
    )
    
    headers = get_auth_headers(sample_advisor)
    
    response = client.get(
        f"/api/v1/insurance-policies/{policy.id}",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == policy.id
    assert data["policy_number"] == "GET123"


def test_get_insurance_policies_for_client(
    client: TestClient, 
    session: Session, 
    sample_advisor: User, 
    sample_client: Client
):
    """Test getting all insurance policies for a client."""
    # Create multiple policies
    from cactus_wealth.schemas import InsurancePolicyCreate
    import cactus_wealth.crud as crud
    
    for i in range(2):
        policy_data = InsurancePolicyCreate(
            policy_number=f"MULTI{i}",
            insurance_type=f"Tipo{i}",
            premium_amount=Decimal(f"{200 + i * 100}.00"),
            coverage_amount=Decimal(f"{40000 + i * 10000}.00")
        )
        crud.create_client_insurance_policy(
            session=session,
            policy_data=policy_data,
            client_id=sample_client.id
        )
    
    headers = get_auth_headers(sample_advisor)
    
    response = client.get(
        f"/api/v1/clients/{sample_client.id}/insurance-policies/",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


def test_update_insurance_policy_success(
    client: TestClient, 
    session: Session, 
    sample_advisor: User, 
    sample_client: Client
):
    """Test successful update of insurance policy."""
    # Create a policy first
    from cactus_wealth.schemas import InsurancePolicyCreate
    import cactus_wealth.crud as crud
    
    policy_data = InsurancePolicyCreate(
        policy_number="UPDATE123",
        insurance_type="Original Type",
        premium_amount=Decimal("300.00"),
        coverage_amount=Decimal("50000.00")
    )
    policy = crud.create_client_insurance_policy(
        session=session,
        policy_data=policy_data,
        client_id=sample_client.id
    )
    
    headers = get_auth_headers(sample_advisor)
    
    update_data = {
        "insurance_type": "Updated Type",
        "premium_amount": "350.00"
    }
    
    response = client.put(
        f"/api/v1/insurance-policies/{policy.id}",
        json=update_data,
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["insurance_type"] == "Updated Type"
    assert float(data["premium_amount"]) == 350.00
    assert data["policy_number"] == "UPDATE123"  # Unchanged


def test_delete_insurance_policy_success(
    client: TestClient, 
    session: Session, 
    sample_advisor: User, 
    sample_client: Client
):
    """Test successful deletion of insurance policy."""
    # Create a policy first
    from cactus_wealth.schemas import InsurancePolicyCreate
    import cactus_wealth.crud as crud
    
    policy_data = InsurancePolicyCreate(
        policy_number="DELETE123",
        insurance_type="To Delete",
        premium_amount=Decimal("200.00"),
        coverage_amount=Decimal("25000.00")
    )
    policy = crud.create_client_insurance_policy(
        session=session,
        policy_data=policy_data,
        client_id=sample_client.id
    )
    
    headers = get_auth_headers(sample_advisor)
    
    response = client.delete(
        f"/api/v1/insurance-policies/{policy.id}",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == policy.id
    
    # Verify it's actually deleted
    deleted_policy = session.get(InsurancePolicy, policy.id)
    assert deleted_policy is None


# ============ AUTHORIZATION EDGE CASES ============

def test_admin_can_access_any_client_accounts(
    client: TestClient, 
    session: Session, 
    sample_admin: User, 
    sample_client_advisor_2: Client
):
    """Test that admin can access accounts for any client."""
    # Create account for advisor_2's client
    from cactus_wealth.schemas import InvestmentAccountCreate
    import cactus_wealth.crud as crud
    
    account_data = InvestmentAccountCreate(
        platform="Admin Test",
        account_number="ADMIN789",
        aum=Decimal("60000.00")
    )
    account = crud.create_client_investment_account(
        session=session,
        account_data=account_data,
        client_id=sample_client_advisor_2.id
    )
    
    headers = get_auth_headers(sample_admin)
    
    # Admin should be able to access this account
    response = client.get(
        f"/api/v1/investment-accounts/{account.id}",
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["platform"] == "Admin Test"


def test_advisor_cannot_access_other_advisor_client_policies(
    client: TestClient, 
    session: Session, 
    sample_advisor: User, 
    sample_client_advisor_2: Client
):
    """Test that advisor cannot access policies of other advisor's clients."""
    # Create policy for advisor_2's client
    from cactus_wealth.schemas import InsurancePolicyCreate
    import cactus_wealth.crud as crud
    
    policy_data = InsurancePolicyCreate(
        policy_number="FORBIDDEN456",
        insurance_type="Private Policy",
        premium_amount=Decimal("600.00"),
        coverage_amount=Decimal("120000.00")
    )
    policy = crud.create_client_insurance_policy(
        session=session,
        policy_data=policy_data,
        client_id=sample_client_advisor_2.id
    )
    
    headers = get_auth_headers(sample_advisor)
    
    # sample_advisor should NOT be able to access this policy
    response = client.get(
        f"/api/v1/insurance-policies/{policy.id}",
        headers=headers
    )
    
    assert response.status_code == 403 