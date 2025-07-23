# Import client_event_bus to register SQLAlchemy event listeners
# Import conditionally to avoid table redefinition issues during testing
import logging

try:
    pass
except Exception as e:
    logging.warning(f"client_event_bus import failed: {e}")
