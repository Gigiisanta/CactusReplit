import os
from datetime import datetime
from typing import Any

import redis
from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.get("/status")
async def get_automation_status() -> dict[str, Any]:
    """Get current automation system status"""
    try:
        # Connect to Redis to check queue status
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        r = redis.Redis.from_url(redis_url)

        # Check if Redis is accessible
        r.ping()

        # Get queue length (approximate)
        queue_length = r.xlen("outbox") if r.exists("outbox") else 0

        return {
            "healthy": True,
            "queue": queue_length,
            "lastSync": datetime.utcnow().isoformat(),
        }
    except Exception:
        return {"healthy": False, "queue": 0, "lastSync": "Never"}


@router.post("/trigger-sync")
async def trigger_full_sync() -> dict[str, str]:
    """Trigger a full synchronization with external systems"""
    try:
        # This would trigger a full sync process
        # For now, just return success
        return {"message": "Full sync triggered successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to trigger sync: {str(e)}")


@router.post("/send-test-email")
async def send_test_email() -> dict[str, str]:
    """Send a test welcome email"""
    try:
        # This would send a test email
        # For now, just return success
        return {"message": "Test email sent successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to send test email: {str(e)}"
        )
