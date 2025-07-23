from datetime import timedelta

from cactus_wealth.core.config import settings
from cactus_wealth.database import get_session
from cactus_wealth.schemas import Token
from cactus_wealth.security import authenticate_user, create_access_token
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session
import logging

router = APIRouter()


@router.post("/access-token", response_model=Token)
async def login_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session),
) -> Token:
    # Log temporal del body crudo recibido
    logging.info(f"[DEBUG LOGIN] Headers: {request.headers}")
    logging.info(f"[DEBUG LOGIN] form_data.username={form_data.username}, form_data.password={form_data.password}, form_data.grant_type={getattr(form_data, 'grant_type', None)}, form_data.scope={getattr(form_data, 'scope', None)}")
    user = authenticate_user(
        session=session,
        username=form_data.username,  # Now using username for authentication
        password=form_data.password,
    )
    if not user:
        logging.info(f"[DEBUG LOGIN] Authentication failed for username={form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email},  # Keep email in token for compatibility
        expires_delta=access_token_expires,
    )
    return Token(access_token=access_token, token_type="bearer")
