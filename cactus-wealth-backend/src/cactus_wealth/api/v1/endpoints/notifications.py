from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from cactus_wealth.database import get_session
from cactus_wealth.models import User, Notification
from cactus_wealth.schemas import NotificationRead
from cactus_wealth.security import get_current_user

router = APIRouter()


@router.get("/notifications", response_model=List[NotificationRead])
def get_user_notifications(
    db: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    limit: int = 10
):
    """
    Get the most recent notifications for the current user.
    
    Args:
        db: Database session
        current_user: Current authenticated user
        limit: Maximum number of notifications to return (default: 10)
        
    Returns:
        List of recent notifications ordered by created_at descending
    """
    statement = (
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
    )
    
    notifications = db.exec(statement).all()
    return notifications 