import asyncio
import logging
import os
from datetime import timedelta
from typing import Dict, Any

from arq import create_pool
from arq.connections import RedisSettings
from sqlmodel import Session, select

from cactus_wealth.database import engine
from cactus_wealth.models import Portfolio
from cactus_wealth.services import PortfolioService
from cactus_wealth.core.dataprovider import get_market_data_provider

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def create_all_snapshots(ctx: Dict[str, Any]) -> str:
    """
    Create snapshots for all portfolios in the system.
    
    This task is executed periodically to maintain up-to-date portfolio valuations
    for KPI calculations like Monthly Growth.
    
    Args:
        ctx: ARQ context dictionary
        
    Returns:
        Success message with snapshot count
    """
    logger.info("Starting daily portfolio snapshots creation")
    snapshots_created = 0
    errors = 0
    
    try:
        # Create database session
        with Session(engine) as db_session:
            # Get all portfolio IDs
            statement = select(Portfolio.id, Portfolio.name)
            portfolios = db_session.exec(statement).all()
            
            if not portfolios:
                logger.warning("No portfolios found in the system")
                return "No portfolios found to snapshot"
            
            logger.info(f"Found {len(portfolios)} portfolios to snapshot")
            
            # Initialize services
            market_data_provider = get_market_data_provider()
            portfolio_service = PortfolioService(
                db_session=db_session,
                market_data_provider=market_data_provider
            )
            
            # Create snapshots for each portfolio
            for portfolio_id, portfolio_name in portfolios:
                try:
                    snapshot = portfolio_service.create_snapshot_for_portfolio(portfolio_id)
                    snapshots_created += 1
                    logger.info(
                        f"✅ Snapshot created for portfolio '{portfolio_name}' (ID: {portfolio_id}): "
                        f"Value=${snapshot.value}, Timestamp={snapshot.timestamp}"
                    )
                except Exception as e:
                    errors += 1
                    logger.error(
                        f"❌ Failed to create snapshot for portfolio '{portfolio_name}' (ID: {portfolio_id}): {str(e)}"
                    )
            
            result_message = (
                f"Daily snapshots completed: {snapshots_created} created, {errors} errors"
            )
            logger.info(result_message)
            return result_message
            
    except Exception as e:
        error_message = f"Critical error during snapshot creation: {str(e)}"
        logger.error(error_message)
        raise Exception(error_message)


async def startup(ctx: Dict[str, Any]) -> None:
    """
    ARQ worker startup function.
    
    Schedules the recurring daily snapshot task.
    """
    logger.info("🚀 ARQ Worker starting up...")
    
    # Schedule the daily snapshot task
    # This will run every 24 hours, starting 1 minute after startup for testing
    await ctx['redis'].enqueue_job(
        'create_all_snapshots',
        _defer_by=timedelta(minutes=1),  # Start in 1 minute for testing
        _job_id='daily_snapshot_job_initial'
    )
    
    # Schedule recurring daily job
    await ctx['redis'].enqueue_job(
        'create_all_snapshots',
        _defer_by=timedelta(hours=24),
        _job_id='daily_snapshot_job_recurring'
    )
    
    logger.info("📅 Daily snapshot jobs scheduled successfully")


async def shutdown(ctx: Dict[str, Any]) -> None:
    """ARQ worker shutdown function."""
    logger.info("🛑 ARQ Worker shutting down...")


class WorkerSettings:
    """ARQ Worker configuration."""
    
    # Redis connection settings
    redis_settings = RedisSettings.from_dsn(
        os.getenv('REDIS_URL', 'redis://localhost:6379')
    )
    
    # Functions that can be executed by the worker
    functions = [create_all_snapshots]
    
    # Worker startup and shutdown hooks
    on_startup = startup
    on_shutdown = shutdown
    
    # Worker configuration
    max_jobs = 10
    job_timeout = 300  # 5 minutes timeout for jobs
    keep_result = 3600  # Keep job results for 1 hour
    
    # Logging configuration
    log_level = 'INFO'
    
    # Health check settings
    health_check_interval = 30


# For manual testing and debugging
async def test_snapshot_creation():
    """Test function to manually trigger snapshot creation."""
    logger.info("Testing snapshot creation...")
    result = await create_all_snapshots({})
    logger.info(f"Test result: {result}")


if __name__ == "__main__":
    # For testing the worker manually
    asyncio.run(test_snapshot_creation()) 