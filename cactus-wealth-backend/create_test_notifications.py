#!/usr/bin/env python3
"""
Script to create test notifications for verifying the notification system.
"""

import asyncio
from datetime import datetime, timedelta
from sqlmodel import Session, create_engine, select

from src.cactus_wealth.database import engine
from src.cactus_wealth.models import User, Notification
from src.cactus_wealth.services import NotificationService


def create_test_notifications():
    """Create test notifications for demo purposes."""
    
    with Session(engine) as session:
        # Get first user (advisor)
        user_statement = select(User).limit(1)
        user = session.exec(user_statement).first()
        
        if not user:
            print("No users found in database. Please create a user first.")
            return
        
        print(f"Creating test notifications for user: {user.username} (ID: {user.id})")
        
        # Initialize notification service
        notification_service = NotificationService(session)
        
        # Create test notifications with different timestamps
        test_notifications = [
            {
                "message": "Nuevo cliente añadido: María González",
                "created_at_offset": 5  # 5 minutes ago
            },
            {
                "message": "Se ha generado un nuevo reporte para Carlos Rodríguez",
                "created_at_offset": 15  # 15 minutes ago
            },
            {
                "message": "Valoración del portfolio 'Portfolio Principal' actualizada. Nuevo valor: $125,430.50",
                "created_at_offset": 30  # 30 minutes ago
            },
            {
                "message": "Nuevo cliente añadido: Ana Torres",
                "created_at_offset": 45  # 45 minutes ago
            },
            {
                "message": "Se ha generado un nuevo reporte para María González", 
                "created_at_offset": 60  # 1 hour ago
            }
        ]
        
        for i, notification_data in enumerate(test_notifications):
            try:
                # Create notification
                notification = Notification(
                    user_id=user.id,
                    message=notification_data["message"],
                    is_read=False
                )
                
                # Set custom created_at time (simulating different timestamps)
                offset_minutes = notification_data["created_at_offset"]
                custom_time = datetime.utcnow() - timedelta(minutes=offset_minutes)
                notification.created_at = custom_time
                
                session.add(notification)
                print(f"✓ Created notification {i+1}: {notification_data['message']}")
                
            except Exception as e:
                print(f"✗ Failed to create notification {i+1}: {str(e)}")
        
        # Commit all notifications
        try:
            session.commit()
            print(f"\n✅ Successfully created {len(test_notifications)} test notifications!")
            print(f"🔗 You can now visit the dashboard to see the notifications in action.")
        except Exception as e:
            session.rollback()
            print(f"✗ Failed to commit notifications: {str(e)}")


if __name__ == "__main__":
    create_test_notifications() 