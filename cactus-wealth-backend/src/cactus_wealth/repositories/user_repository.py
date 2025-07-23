"""
User repository for user-related database operations.
"""

from sqlmodel import Session, select

from ..models import User, UserRole
from .base_repository import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository for User-related database operations."""

    def __init__(self, session: Session):
        super().__init__(session, User)

    def get_by_username(self, username: str) -> User | None:
        """
        Get a user by username.

        Args:
            username: The username to search for

        Returns:
            User if found, None otherwise
        """
        statement = select(User).where(User.username == username)
        return self.session.exec(statement).first()

    def get_by_email(self, email: str) -> User | None:
        """
        Get a user by email address.

        Args:
            email: The email address to search for

        Returns:
            User if found, None otherwise
        """
        statement = select(User).where(User.email == email)
        return self.session.exec(statement).first()

    def get_by_role(self, role: UserRole) -> list[User]:
        """
        Get all users with a specific role.

        Args:
            role: The user role to filter by

        Returns:
            List of users with the specified role
        """
        statement = select(User).where(User.role == role)
        return list(self.session.exec(statement).all())

    def get_active_users(self) -> list[User]:
        """
        Get all active users.

        Returns:
            List of active users
        """
        statement = select(User).where(User.is_active)
        return list(self.session.exec(statement).all())

    def get_advisors(self) -> list[User]:
        """
        Get all advisor users (senior and junior advisors).

        Returns:
            List of advisor users
        """
        statement = select(User).where(
            User.role.in_([role.value for role in [UserRole.SENIOR_ADVISOR, UserRole.JUNIOR_ADVISOR]])
        )
        return list(self.session.exec(statement).all())
