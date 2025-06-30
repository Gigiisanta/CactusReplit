from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session

from cactus_wealth.core.config import settings
from cactus_wealth.database import get_session
from cactus_wealth.schemas import Token
from cactus_wealth.security import authenticate_user, create_access_token

router = APIRouter()


@router.post("/access-token", response_model=Token)
def login_access_token(
    session: Session = Depends(get_session),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = authenticate_user(
        session=session,
        username=form_data.username,  # Now using username for authentication
        password=form_data.password
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},  # Keep email in token for compatibility
        expires_delta=access_token_expires
    )
    
    return Token(access_token=access_token, token_type="bearer") 