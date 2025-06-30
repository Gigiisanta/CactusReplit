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
        ctx: ARQ context dictionary containing database engine
        
    Returns:
        Success message with snapshot count
    """
    logger.info("Starting daily portfolio snapshots creation")
    snapshots_created = 0
    errors = 0
    
    try:
        # Get database engine from context
        db_engine = ctx.get('engine', engine)
        
        # Create database session with proper context management
        with Session(db_engine) as db_session:
            # Get all portfolio IDs and names
            statement = select(Portfolio.id, Portfolio.name)
            portfolios = db_session.exec(statement).all()
            
            if not portfolios:
                logger.warning("No portfolios found in the system")
                return "No portfolios found to snapshot"
            
            logger.info(f"Found {len(portfolios)} portfolios to snapshot")
            
            # Initialize services with the session
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
            
            # Commit all changes in a single transaction
            db_session.commit()
            
            result_message = (
                f"Successfully created {snapshots_created} snapshots, {errors} errors"
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
    
    Initializes database engine in the worker context and schedules recurring tasks.
    """
    logger.info("🚀 ARQ Worker starting up...")
    
    # Store database engine in worker context for reuse
    ctx['engine'] = engine
    logger.info("📦 Database engine initialized in worker context")
    
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
    """
    ARQ worker shutdown function.
    
    Properly disposes of database connections.
    """
    logger.info("🛑 ARQ Worker shutting down...")
    
    # Dispose of database engine if it exists in context
    if 'engine' in ctx:
        try:
            await ctx['engine'].dispose()
            logger.info("🗄️ Database engine disposed properly")
        except Exception as e:
            logger.error(f"Error disposing database engine: {e}")


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
    # Create a mock context with engine
    test_ctx = {'engine': engine}
    result = await create_all_snapshots(test_ctx)
    logger.info(f"Test result: {result}")


if __name__ == "__main__":
    # For testing the worker manually
    asyncio.run(test_snapshot_creation()) 