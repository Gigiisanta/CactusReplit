# 🌵 CactusDashboard Core Rules

## Purpose
FinTech wealth management platform. Senior engineer mindset: secure, scalable, production-ready.

## Scope
Full-stack: FastAPI + Next.js + PostgreSQL. English-only codebase.

## Guidelines

### ⚡ Architecture Flow
`endpoints.py` → `services.py` → `crud.py` → `models.py`
- **Endpoints**: routing only, zero business logic
- **Services**: complete business logic
- **CRUD**: pure DB ops
- **Models/Schemas**: SQLModel + Pydantic

### 🔒 Security First
- RBAC verification mandatory (`ADMIN`, `SENIOR_ADVISOR`, `JUNIOR_ADVISOR`, `COMPLIANCE`)
- Use `get_current_user` dependency
- No direct DB queries in endpoints

### 🎯 Code Quality
- Strict typing: TypeScript strict mode, Python type hints
- Async/await for ALL I/O
- `Depends()` for DI
- Zero dead code, explicit naming
- Composition > inheritance

### 🧪 Testing Required
Every service/endpoint needs pytest/jest test.

## Anti-patterns
- ❌ Business logic in endpoints
- ❌ Direct DB access from endpoints  
- ❌ Missing type hints
- ❌ Sync I/O operations
- ❌ Magic numbers/strings

## Examples

```python
# ✅ Correct endpoint structure
@router.get("/clients/{client_id}")
async def get_client(
    client_id: int,
    current_user: User = Depends(get_current_user),
    client_service: ClientService = Depends()
):
    return await client_service.get_client(client_id, current_user)
```

```tsx
// ✅ Correct React component
const ClientCard: React.FC<ClientCardProps> = ({ clientId }) => {
  const { data, isLoading } = useQuery(['client', clientId], 
    () => clientService.getClient(clientId)
  );
  
  if (isLoading) return <Skeleton />;
  return <Card>{data?.name}</Card>;
};
```

- Frontend: Component tests with Jest, E2E with Playwright
- Reference configs: [jest.config.js](mdc:cactus-wealth-frontend/jest.config.js), [playwright.config.ts](mdc:cactus-wealth-frontend/playwright.config.ts)
