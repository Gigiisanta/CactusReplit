import asyncio
import json
import os
from datetime import datetime
from typing import Any

import redis.asyncio as redis
import structlog
from sqlalchemy import event
from sqlalchemy.inspection import inspect

from .models import Client

logger = structlog.get_logger(__name__)

# Redis connection
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")
redis_client = redis.from_url(REDIS_URL)


class ClientEventBus:
    """Event bus for client-related domain events"""

    @staticmethod
    def serialize_client(client: Client) -> dict[str, Any]:
        """Convert Client model to serializable dict"""
        return {
            "id": client.id,
            "first_name": client.first_name,
            "last_name": client.last_name,
            "email": client.email,
            "status": (
                client.status.value
                if hasattr(client.status, "value")
                else str(client.status)
            ),
            "risk_profile": (
                client.risk_profile.value
                if hasattr(client.risk_profile, "value")
                else str(client.risk_profile)
            ),
            "lead_source": (
                client.lead_source.value
                if hasattr(client.lead_source, "value")
                else str(client.lead_source) if client.lead_source else None
            ),
            "notes": client.notes,
            "portfolio_name": client.portfolio_name,
            "referred_by_client_id": client.referred_by_client_id,
            "owner_id": client.owner_id,
            "created_at": client.created_at.isoformat() if client.created_at else None,
            "updated_at": client.updated_at.isoformat() if client.updated_at else None,
        }

    @staticmethod
    async def publish_event(
        event_type: str,
        client_data: dict[str, Any],
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """Publish event to Redis stream"""
        try:
            event_payload = {
                "event": event_type,
                "payload": json.dumps(client_data),
                "metadata": json.dumps(metadata or {}),
                "timestamp": datetime.utcnow().isoformat(),
            }

            # Add to outbox stream
            await redis_client.xadd(
                "outbox", event_payload, maxlen=10000  # Keep last 10k events
            )

            logger.info(
                "Event published",
                event_type=event_type,
                client_id=client_data.get("id"),
            )

        except Exception as e:
            logger.error("Failed to publish event", error=str(e), event_type=event_type)


@event.listens_for(Client, "after_insert")
def client_after_insert(mapper, connection, target):
    """SQLAlchemy after_insert listener for Client"""
    client_data = ClientEventBus.serialize_client(target)

    # Use asyncio to publish event
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # If we're already in an async context, schedule the coroutine
            asyncio.create_task(
                ClientEventBus.publish_event("client.created", client_data)
            )
        else:
            # Run in new event loop
            asyncio.run(ClientEventBus.publish_event("client.created", client_data))
    except Exception as e:
        logger.error("Failed to handle client_after_insert", error=str(e))


@event.listens_for(Client, "after_update")
def client_after_update(mapper, connection, target):
    """SQLAlchemy after_update listener for Client"""
    try:
        # Inspect the object to check for status changes
        state = inspect(target)
        status_attr = state.attrs.status

        if status_attr.history.has_changes():
            old_status = None
            if status_attr.history.deleted:
                old_value = status_attr.history.deleted[0]
                old_status = (
                    old_value.value if hasattr(old_value, "value") else str(old_value)
                )

            new_status = (
                target.status.value
                if hasattr(target.status, "value")
                else str(target.status)
            )

            client_data = ClientEventBus.serialize_client(target)
            metadata = {
                "from_status": old_status,
                "to_status": new_status,
                "timestamp": datetime.utcnow().isoformat(),
            }

            # Publish status change event
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    asyncio.create_task(
                        ClientEventBus.publish_event(
                            "client.status_changed", client_data, metadata
                        )
                    )
                else:
                    asyncio.run(
                        ClientEventBus.publish_event(
                            "client.status_changed", client_data, metadata
                        )
                    )
            except Exception as e:
                logger.error("Failed to publish status_changed event", error=str(e))

        # Also publish general update event
        client_data = ClientEventBus.serialize_client(target)
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(
                    ClientEventBus.publish_event("client.updated", client_data)
                )
            else:
                asyncio.run(ClientEventBus.publish_event("client.updated", client_data))
        except Exception as e:
            logger.error("Failed to publish client.updated event", error=str(e))

    except Exception as e:
        logger.error("Failed to handle client_after_update", error=str(e))
