import os

from arq import create_pool
from arq.connections import ArqRedis, RedisSettings


class ARQConfig:
    """Centralized ARQ configuration for the application."""

    @staticmethod
    def get_redis_settings() -> RedisSettings:
        """Get Redis settings from environment variables."""
        return RedisSettings.from_dsn(os.getenv("REDIS_URL", "redis://localhost:6379"))

    @staticmethod
    async def get_redis_pool() -> ArqRedis:
        """Create and return Redis connection pool for enqueuing jobs."""
        return await create_pool(ARQConfig.get_redis_settings())

    @staticmethod
    async def enqueue_snapshot_job(redis_pool: ArqRedis | None = None) -> str:
        """
        Manually enqueue a snapshot creation job.

        This function can be used by the FastAPI app to trigger
        snapshot creation on demand.

        Args:
            redis_pool: Optional Redis pool. If None, a new one will be created.

        Returns:
            Job ID of the enqueued task
        """
        pool = redis_pool or await ARQConfig.get_redis_pool()

        try:
            job = await pool.enqueue_job("create_all_snapshots")
            job_id = job.job_id if job else "unknown"
            return job_id
        finally:
            if not redis_pool:  # Only close if we created the pool
                await pool.close()


# Example usage for FastAPI endpoints (future use)
"""
from cactus_wealth.core.arq import ARQConfig

@app.post("/admin/trigger-snapshots")
async def trigger_snapshots_manually():
    '''Administrative endpoint to manually trigger portfolio snapshots.'''
    try:
        job_id = await ARQConfig.enqueue_snapshot_job()
        return {"message": "Snapshot job enqueued", "job_id": job_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to enqueue job: {str(e)}")
"""
