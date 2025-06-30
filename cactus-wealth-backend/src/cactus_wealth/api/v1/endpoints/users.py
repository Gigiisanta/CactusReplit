from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from cactus_wealth.database import get_session
from cactus_wealth.models import User
from cactus_wealth.schemas import UserCreate, UserRead
from cactus_wealth.security import get_current_user
import cactus_wealth.crud as crud

router = APIRouter()


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    user_create: UserCreate,
    session: Session = Depends(get_session)
) -> UserRead:
    """
    Create a new user account.
    """
    try:
        user = crud.create_user(session=session, user_create=user_create)
        return UserRead.model_validate(user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/me", response_model=UserRead)
def read_users_me(
    current_user: User = Depends(get_current_user)
) -> UserRead:
    """
    Get current authenticated user.
    """
    return UserRead.model_validate(current_user) 