"""
Notification repository for notification-related database operations.
"""

from sqlmodel import Session, select

from ..models import Notification
from .base_repository import BaseRepository


class NotificationRepository(BaseRepository[Notification]):
    """Repository for Notification-related database operations."""

    def __init__(self, session: Session):
        super().__init__(session, Notification)

    def get_by_user_id(self, user_id: int, limit: int = 50) -> list[Notification]:
        """
        Get all notifications for a specific user.

        Args:
            user_id: The user's ID
            limit: Maximum number of notifications to return

        Returns:
            List of notifications for the user (newest first)
        """
        statement = (
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
        )
        return list(self.session.exec(statement).all())

    def get_unread_by_user_id(self, user_id: int) -> list[Notification]:
        """
        Get all unread notifications for a specific user.

        Args:
            user_id: The user's ID

        Returns:
            List of unread notifications for the user (newest first)
        """
        statement = (
            select(Notification)
            .where(Notification.user_id == user_id)
            .where(not Notification.is_read)
            .order_by(Notification.created_at.desc())
        )
        return list(self.session.exec(statement).all())

    def mark_as_read(self, notification_id: int) -> Notification | None:
        """
        Mark a notification as read.

        Args:
            notification_id: The notification's ID

        Returns:
            Updated notification if found, None otherwise
        """
        notification = self.get_by_id(notification_id)
        if notification:
            notification.is_read = True
            return self.update(notification)
        return None

    def mark_all_as_read_for_user(self, user_id: int) -> int:
        """
        Mark all notifications as read for a user.

        Args:
            user_id: The user's ID

        Returns:
            Number of notifications updated
        """
        unread_notifications = self.get_unread_by_user_id(user_id)
        count = 0

        for notification in unread_notifications:
            notification.is_read = True
            self.session.add(notification)
            count += 1

        if count > 0:
            self.session.commit()

        return count

    def count_unread_for_user(self, user_id: int) -> int:
        """
        Count unread notifications for a user.

        Args:
            user_id: The user's ID

        Returns:
            Number of unread notifications
        """
        return len(self.get_unread_by_user_id(user_id))
