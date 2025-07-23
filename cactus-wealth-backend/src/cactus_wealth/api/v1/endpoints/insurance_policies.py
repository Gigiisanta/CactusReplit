from cactus_wealth.database import get_session
from cactus_wealth.models import User
from cactus_wealth.schemas import (
    InsurancePolicyCreate,
    InsurancePolicyRead,
    InsurancePolicyUpdate,
)
from cactus_wealth.security import get_current_user
from cactus_wealth.services import InsurancePolicyService
from fastapi import APIRouter, Depends, status
from sqlmodel import Session

router = APIRouter()


def get_policy_service(
    session: Session = Depends(get_session),
) -> InsurancePolicyService:
    """Dependency to get insurance policy service."""
    return InsurancePolicyService(db_session=session)


@router.post(
    "/clients/{client_id}/insurance-policies/",
    response_model=InsurancePolicyRead,
    status_code=status.HTTP_201_CREATED,
)
def create_insurance_policy_for_client(
    client_id: int,
    policy_create: InsurancePolicyCreate,
    current_user: User = Depends(get_current_user),
    policy_service: InsurancePolicyService = Depends(get_policy_service),
) -> InsurancePolicyRead:
    """
    Create a new insurance policy for a specific client.
    The client must belong to the authenticated advisor (or advisor must be ADMIN).
    """
    policy = policy_service.create_policy_for_client(
        policy_data=policy_create, client_id=client_id, current_advisor=current_user
    )
    return InsurancePolicyRead.model_validate(policy)


@router.get("/insurance-policies/{policy_id}", response_model=InsurancePolicyRead)
def get_insurance_policy(
    policy_id: int,
    current_user: User = Depends(get_current_user),
    policy_service: InsurancePolicyService = Depends(get_policy_service),
) -> InsurancePolicyRead:
    """
    Get a specific insurance policy by ID.
    Access is restricted to policies belonging to the advisor's clients.
    """
    policy = policy_service.get_policy(
        policy_id=policy_id, current_advisor=current_user
    )
    return InsurancePolicyRead.model_validate(policy)


@router.get(
    "/clients/{client_id}/insurance-policies/", response_model=list[InsurancePolicyRead]
)
def get_insurance_policies_for_client(
    client_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    policy_service: InsurancePolicyService = Depends(get_policy_service),
) -> list[InsurancePolicyRead]:
    """
    Get all insurance policies for a specific client.
    The client must belong to the authenticated advisor (or advisor must be ADMIN).
    """
    policies = policy_service.get_policies_by_client(
        client_id=client_id, current_advisor=current_user, skip=skip, limit=limit
    )
    return [InsurancePolicyRead.model_validate(policy) for policy in policies]


@router.put("/insurance-policies/{policy_id}", response_model=InsurancePolicyRead)
def update_insurance_policy(
    policy_id: int,
    policy_update: InsurancePolicyUpdate,
    current_user: User = Depends(get_current_user),
    policy_service: InsurancePolicyService = Depends(get_policy_service),
) -> InsurancePolicyRead:
    """
    Update an insurance policy.
    Access is restricted to policies belonging to the advisor's clients.
    """
    policy = policy_service.update_policy(
        policy_id=policy_id, update_data=policy_update, current_advisor=current_user
    )
    return InsurancePolicyRead.model_validate(policy)


@router.delete("/insurance-policies/{policy_id}", response_model=InsurancePolicyRead)
def delete_insurance_policy(
    policy_id: int,
    current_user: User = Depends(get_current_user),
    policy_service: InsurancePolicyService = Depends(get_policy_service),
) -> InsurancePolicyRead:
    """
    Delete an insurance policy.
    Access is restricted to policies belonging to the advisor's clients.
    """
    policy = policy_service.delete_policy(
        policy_id=policy_id, current_advisor=current_user
    )
    return InsurancePolicyRead.model_validate(policy)
