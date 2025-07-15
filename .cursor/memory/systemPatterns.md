# CactusDashboard System Patterns

## Architecture Patterns
- **Layered Architecture**: endpoints → services → crud → models
- **Dependency Injection**: FastAPI Depends() for all cross-cutting concerns
- **Repository Pattern**: Centralized data access through repositories/
- **Service Layer**: Business logic isolation in services.py

## Data Flow Patterns
```
User Request → API Endpoint → Service Function → CRUD Operation → Database
                ↓
         Response Schema ← Business Logic ← Data Retrieval ← SQL Query
```

## Error Handling Strategy
- **Backend**: DetailedHTTPException with structured error responses
- **Frontend**: useApiErrorHandler hook for consistent error processing
- **Logging**: Structured logging with correlation IDs for tracing

## Testing Patterns
- **Unit Tests**: Service layer business logic validation
- **Integration Tests**: API endpoint + database interaction
- **E2E Tests**: Full user workflow simulation with Playwright
- **Test Data**: Factory patterns for consistent test fixtures

## Security Patterns
- **Authentication**: JWT tokens with role-based claims
- **Authorization**: Decorator-based permission checking
- **Data Filtering**: Row-level security via user context injection
- **Input Validation**: Pydantic schema validation at API boundaries

## Performance Patterns
- **Database**: Connection pooling, query optimization, strategic indexing
- **Caching**: Redis for session data, in-memory for reference data  
- **Frontend**: Code splitting, lazy loading, React Query for data fetching
- **API**: Pagination, field selection, bulk operations for efficiency

## Deployment Patterns
- **Development**: Docker Compose with hot reload
- **Production**: Container orchestration with health checks
- **Database**: Alembic migrations with rollback capabilities
- **Monitoring**: Structured logging + health endpoints 