#!/usr/bin/env python3
"""
Script to create a demo user for testing the new username authentication.
"""

import sys
import os

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from sqlmodel import Session, select
from cactus_wealth.database import engine
from cactus_wealth.models import User, UserRole
from cactus_wealth.security import get_password_hash


def create_demo_user():
    """Create a demo user for testing."""
    with Session(engine) as session:
        # Check if demo user already exists
        existing_user = session.exec(select(User).where(User.username == "demo")).first()
        if existing_user:
            print("Demo user already exists!")
            print(f"Username: {existing_user.username}")
            print(f"Email: {existing_user.email}")
            print(f"Role: {existing_user.role}")
            return existing_user
        
        # Create demo user
        demo_user = User(
            username="demo",
            email="demo@cactuswealth.com",
            hashed_password=get_password_hash("demo123"),
            role=UserRole.ADMIN,
            is_active=True
        )
        
        session.add(demo_user)
        session.commit()
        session.refresh(demo_user)
        
        print(f"Demo user created successfully!")
        print(f"Username: {demo_user.username}")
        print(f"Email: {demo_user.email}")
        print(f"Role: {demo_user.role}")
        
        return demo_user


if __name__ == "__main__":
    create_demo_user() 