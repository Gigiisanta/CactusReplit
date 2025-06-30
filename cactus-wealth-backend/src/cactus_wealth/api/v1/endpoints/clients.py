from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from cactus_wealth.database import get_session
from cactus_wealth.models import User
from cactus_wealth.schemas import ClientCreate, ClientRead, ClientUpdate, ClientReadWithDetails
from cactus_wealth.security import get_current_user
from cactus_wealth.services import NotificationService
import cactus_wealth.crud as crud

router = APIRouter()


@router.post("/", response_model=ClientRead, status_code=status.HTTP_201_CREATED)
def create_client(
    client_create: ClientCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
) -> ClientRead:
    """
    Create a new client for the authenticated advisor.
    """
    try:
        client = crud.create_client(
            session=session, 
            client=client_create, 
            owner_id=current_user.id
        )
        
        # Create notification for the advisor
        try:
            notification_service = NotificationService(session)
            notification_service.create_notification(
                user_id=current_user.id,
                message=f"Nuevo cliente añadido: {client.first_name} {client.last_name}"
            )
        except Exception as e:
            # Don't fail the client creation if notification fails
            print(f"Failed to create notification for new client: {str(e)}")
        
        return ClientRead.model_validate(client)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/", response_model=List[ClientReadWithDetails])
def read_clients(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
) -> List[ClientReadWithDetails]:
    """
    Get all clients belonging to the authenticated advisor with full details.
    """
    clients = crud.get_clients_by_user(
        session=session, 
        owner_id=current_user.id, 
        skip=skip, 
        limit=limit
    )
    return [ClientReadWithDetails.model_validate(client) for client in clients]


@router.get("/{client_id}", response_model=ClientReadWithDetails)
def read_client(
    client_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
) -> ClientReadWithDetails:
    """
    Get a specific client by ID with full details (only if owned by the authenticated advisor).
    """
    client = crud.get_client(
        session=session, 
        client_id=client_id, 
        owner_id=current_user.id
    )
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Client not found"
        )
    return ClientReadWithDetails.model_validate(client)


@router.put("/{client_id}", response_model=ClientRead)
def update_client(
    client_id: int,
    client_update: ClientUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
) -> ClientRead:
    """
    Update a client (only if owned by the authenticated advisor).
    """
    try:
        client = crud.update_client(
            session=session,
            client_id=client_id,
            client_update=client_update,
            owner_id=current_user.id
        )
        if client is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Client not found"
            )
        return ClientRead.model_validate(client)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{client_id}", response_model=ClientRead)
def delete_client(
    client_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
) -> ClientRead:
    """
    Delete a client (only if owned by the authenticated advisor).
    """
    client = crud.remove_client(
        session=session,
        client_id=client_id,
        owner_id=current_user.id
    )
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    return ClientRead.model_validate(client) 