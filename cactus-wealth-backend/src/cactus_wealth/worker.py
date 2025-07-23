import asyncio
import json
import os
from typing import Any

import httpx
import redis.asyncio as redis
import structlog
from arq.connections import RedisSettings
from sqlmodel import SQLModel

# Clear metadata before any imports to prevent conflicts
SQLModel.metadata.clear()

logger = structlog.get_logger(__name__)

# Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")
SYNC_BRIDGE_URL = os.getenv("SYNC_BRIDGE_URL", "http://sync_bridge:8001")

# HTTP client for sync bridge
sync_client = httpx.AsyncClient(timeout=30.0)


class EventWorker:
    """ARQ worker for processing client events from outbox stream"""

    def __init__(self) -> None:
        self.redis_client = None

    async def startup(self) -> None:
        """Initialize worker"""
        self.redis_client = redis.from_url(REDIS_URL)
        logger.info("EventWorker started")

    async def shutdown(self) -> None:
        """Cleanup worker"""
        if self.redis_client:
            await self.redis_client.close()
        await sync_client.aclose()
        logger.info("EventWorker stopped")

    async def process_client_event(self, event_data: dict[str, Any]) -> bool:
        """Process a single client event"""
        try:
            logger.info("Processing event", event_type=event_data.get("event"))

            # Send to sync bridge
            response = await sync_client.post(
                f"{SYNC_BRIDGE_URL}/events",
                json=event_data,
                headers={"Content-Type": "application/json"},
            )

            if response.status_code in [200, 201]:
                logger.info(
                    "Event processed successfully",
                    event_type=event_data.get("event"),
                    status=response.status_code,
                )
                return True
            else:
                logger.error(
                    "Sync bridge rejected event",
                    event_type=event_data.get("event"),
                    status=response.status_code,
                    response=response.text,
                )
                return False

        except Exception as e:
            logger.error("Failed to process event", error=str(e))
            return False

    async def consume_outbox_stream(self) -> None:
        """Continuously consume events from Redis stream"""
        consumer_group = "event_workers"
        consumer_name = f"worker-{os.getpid()}"

        try:
            # Create consumer group if it doesn't exist
            try:
                await self.redis_client.xgroup_create(
                    "outbox", consumer_group, id="0", mkstream=True
                )
            except Exception as e:
                logger.warning(f"Group creation failed: {e}")
                # Group probably already exists

            logger.info(
                "Starting stream consumer", group=consumer_group, consumer=consumer_name
            )

            while True:
                try:
                    # Read messages from stream
                    messages = await self.redis_client.xreadgroup(
                        consumer_group,
                        consumer_name,
                        {"outbox": ">"},
                        count=10,
                        block=1000,  # 1 second timeout
                    )

                    for stream_name, stream_messages in messages:
                        for message_id, fields in stream_messages:
                            try:
                                # Convert Redis hash to dict
                                event_data = {
                                    k.decode(): v.decode() for k, v in fields.items()
                                }

                                # Parse JSON fields
                                if "payload" in event_data:
                                    event_data["payload"] = json.loads(
                                        event_data["payload"]
                                    )
                                if "metadata" in event_data:
                                    event_data["metadata"] = json.loads(
                                        event_data["metadata"]
                                    )

                                # Process the event
                                success = await self.process_client_event(event_data)

                                if success:
                                    # Acknowledge message
                                    await self.redis_client.xack(
                                        "outbox", consumer_group, message_id
                                    )
                                    logger.debug(
                                        "Message acknowledged", message_id=message_id
                                    )
                                else:
                                    logger.warning(
                                        "Event processing failed, will retry",
                                        message_id=message_id,
                                    )

                            except Exception as e:
                                logger.error(
                                    "Failed to process message",
                                    message_id=message_id,
                                    error=str(e),
                                )

                except Exception as e:
                    logger.error("Stream reading error", error=str(e))
                    await asyncio.sleep(5)  # Back off on errors

        except Exception as e:
            logger.error("Fatal stream consumer error", error=str(e))
            raise


# ARQ worker function
async def startup(ctx) -> None:
    """ARQ startup function"""
    worker = EventWorker()
    await worker.startup()
    ctx["worker"] = worker


async def shutdown(ctx) -> None:
    """ARQ shutdown function"""
    worker = ctx.get("worker")
    if worker:
        await worker.shutdown()


async def process_events(ctx) -> None:
    """ARQ job function - consume outbox stream"""
    worker = ctx["worker"]
    await worker.consume_outbox_stream()


# ARQ worker settings
class WorkerSettings:
    functions = [process_events]
    on_startup = startup
    on_shutdown = shutdown
    redis_settings = RedisSettings.from_dsn(REDIS_URL)
    job_timeout = 300  # 5 minutes
    keep_result = 3600  # 1 hour
    max_jobs = 10
    health_check_interval = 30
