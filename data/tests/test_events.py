import pytest
import asyncio
import json
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime

# Skip all sync_bridge tests if not available
pytest.importorskip('sync_bridge', reason='sync_bridge microservice not present in this environment')

from cactus_wealth.models import Client, ClientStatus, RiskProfile, LeadSource
from cactus_wealth.client_event_bus import ClientEventBus
from sync_bridge.sync_bridge import handle_event, ClientEvent, check_status_rules

@pytest.fixture
def mock_redis():
    """Mock Redis client"""
    mock = AsyncMock()
    mock.xadd = AsyncMock()
    mock.ping = AsyncMock()
    return mock

@pytest.fixture
def mock_http_client():
    """Mock HTTP client for Twenty CRM"""
    mock = AsyncMock()
    mock.get = AsyncMock()
    mock.post = AsyncMock()
    mock.patch = AsyncMock()
    return mock

@pytest.fixture
def sample_client_data():
    """Sample client data for testing"""
    return {
        "id": 123,
        "first_name": "John",
        "last_name": "Doe", 
        "email": "john.doe@example.com",
        "status": "agendado_2da_reunion",
        "risk_profile": "MEDIUM",
        "lead_source": "ORGANIC",
        "notes": "Test client",
        "portfolio_name": "Growth Portfolio",
        "owner_id": 1,
        "created_at": "2024-01-15T10:00:00",
        "updated_at": "2024-01-15T10:00:00"
    }

class TestClientEventBus:
    """Test client event bus functionality"""
    
    @pytest.mark.asyncio
    async def test_serialize_client(self):
        """Test client serialization"""
        # Create mock client
        client = MagicMock(spec=Client)
        client.id = 123
        client.first_name = "John"
        client.last_name = "Doe"
        client.email = "john@example.com"
        client.status = ClientStatus.prospect
        client.risk_profile = RiskProfile.MEDIUM
        client.lead_source = LeadSource.ORGANIC
        client.notes = "Test"
        client.portfolio_name = "Growth"
        client.referred_by_client_id = None
        client.owner_id = 1
        client.created_at = datetime(2024, 1, 15, 10, 0, 0)
        client.updated_at = datetime(2024, 1, 15, 10, 0, 0)
        
        result = ClientEventBus.serialize_client(client)
        
        assert result["id"] == 123
        assert result["first_name"] == "John"
        assert result["email"] == "john@example.com"
        assert "created_at" in result
    
    @pytest.mark.asyncio
    @patch('cactus_wealth.client_event_bus.redis_client')
    async def test_publish_event(self, mock_redis):
        """Test event publishing to Redis stream"""
        mock_redis.xadd = AsyncMock()
        
        client_data = {"id": 123, "email": "test@example.com"}
        await ClientEventBus.publish_event("client.created", client_data)
        
        mock_redis.xadd.assert_called_once()
        call_args = mock_redis.xadd.call_args
        assert call_args[0][0] == "outbox"  # stream name
        assert call_args[0][1]["event"] == "client.created"

class TestSyncBridge:
    """Test sync bridge functionality"""
    
    @pytest.mark.asyncio
    async def test_handle_client_created_event(self, sample_client_data):
        """Test handling client.created event"""
        with patch('sync_bridge.sync_bridge.upsert_twenty_person') as mock_upsert, \
             patch('sync_bridge.sync_bridge.emit_n8n_webhook') as mock_webhook:
            
            mock_upsert.return_value = "external_123"
            mock_webhook.return_value = True
            
            event = ClientEvent(
                event="client.created",
                payload=sample_client_data
            )
            
            # Mock background tasks
            mock_bg_tasks = MagicMock()
            
            result = await handle_event(event, mock_bg_tasks)
            
            assert result["status"] == "success"
            assert result["external_id"] == "external_123"
            assert result["automation_triggered"] == False
            mock_upsert.assert_called_once_with(sample_client_data)
    
    @pytest.mark.asyncio
    async def test_handle_status_change_trigger(self, sample_client_data):
        """Test status change that triggers automation"""
        with patch('sync_bridge.sync_bridge.upsert_twenty_person') as mock_upsert, \
             patch('sync_bridge.sync_bridge.emit_n8n_webhook') as mock_webhook:
            
            mock_upsert.return_value = "external_123"
            mock_webhook.return_value = True
            
            # Update client data to trigger onboarding
            sample_client_data["status"] = "apertura"
            
            event = ClientEvent(
                event="client.status_changed",
                payload=sample_client_data,
                metadata={
                    "from_status": "agendado_2da_reunion",
                    "to_status": "apertura",
                    "timestamp": "2024-01-15T10:30:00"
                }
            )
            
            mock_bg_tasks = MagicMock()
            
            result = await handle_event(event, mock_bg_tasks)
            
            assert result["status"] == "success"
            assert result["automation_triggered"] == True
            assert result["action"] == "trigger_onboarding"
    
    @pytest.mark.asyncio
    async def test_check_status_rules(self):
        """Test status rule matching"""
        event = ClientEvent(
            event="client.status_changed",
            payload={"id": 123},
            metadata={
                "from_status": "agendado_2da_reunion",
                "to_status": "apertura"
            }
        )
        
        action = await check_status_rules(event)
        assert action == "trigger_onboarding"
        
        # Test non-matching rule
        event.metadata["from_status"] = "prospecto"
        action = await check_status_rules(event)
        assert action is None

class TestIntegrationFlow:
    """Integration tests for complete event flow"""
    
    @pytest.mark.asyncio
    async def test_complete_client_lifecycle(self, sample_client_data):
        """Test complete client lifecycle from creation to onboarding"""
        events_captured = []
        
        # Mock all external dependencies
        with patch('sync_bridge.sync_bridge.upsert_twenty_person') as mock_twenty, \
             patch('sync_bridge.sync_bridge.emit_n8n_webhook') as mock_n8n, \
             patch('cactus_wealth.client_event_bus.redis_client') as mock_redis:
            
            mock_twenty.return_value = "external_123"
            mock_n8n.return_value = True
            mock_redis.xadd = AsyncMock()
            
            # Simulate client creation
            await ClientEventBus.publish_event("client.created", sample_client_data)
            
            # Simulate status change to trigger onboarding
            updated_data = sample_client_data.copy()
            updated_data["status"] = "apertura"
            
            metadata = {
                "from_status": "agendado_2da_reunion", 
                "to_status": "apertura",
                "timestamp": datetime.utcnow().isoformat()
            }
            
            await ClientEventBus.publish_event("client.status_changed", updated_data, metadata)
            
            # Verify events were published
            assert mock_redis.xadd.call_count == 2
            
            # Verify first call was client.created
            first_call = mock_redis.xadd.call_args_list[0]
            assert first_call[0][1]["event"] == "client.created"
            
            # Verify second call was status_changed
            second_call = mock_redis.xadd.call_args_list[1]
            assert second_call[0][1]["event"] == "client.status_changed"

@pytest.mark.asyncio
async def test_worker_event_processing():
    """Test worker processing of events"""
    from cactus_wealth.worker import EventWorker
    
    worker = EventWorker()
    
    # Mock sync bridge response
    with patch('cactus_wealth.worker.sync_client') as mock_client:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_client.post = AsyncMock(return_value=mock_response)
        
        event_data = {
            "event": "client.created",
            "payload": {"id": 123, "email": "test@example.com"}
        }
        
        result = await worker.process_client_event(event_data)
        
        assert result == True
        mock_client.post.assert_called_once()

if __name__ == "__main__":
    pytest.main([__file__, "-v"]) 