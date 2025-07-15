# 🚀 API Design Patterns

## Purpose
Consistent RESTful API design for financial data.

## Scope
FastAPI endpoints, response formats, error handling.

## Guidelines

### 🛣️ URL Structure
- Plural nouns: `/api/v1/clients`, `/api/v1/portfolios`
- RESTful verbs: `GET`, `POST`, `PUT`, `DELETE`
- Resource nesting: `/api/v1/clients/{id}/portfolios`

### 📦 Response Format
```python
# Success
{
    "success": true,
    "data": {...},
    "message": "Operation completed"
}

# Error
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Invalid input",
        "details": {...}
    }
}

# Paginated
{
    "success": true,
    "data": [...],
    "pagination": {
        "page": 1,
        "per_page": 20,
        "total": 150
    }
}
```

### 🔍 Status Codes
- `200` - Success with data
- `201` - Resource created
- `400` - Bad request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not found
- `422` - Validation error
- `500` - Server error

### ⚡ Endpoint Pattern
```python
@router.get("/clients", response_model=ClientListResponse)
async def list_clients(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    client_service: ClientService = Depends()
):
    """List clients with pagination."""
    clients = await client_service.get_clients(current_user, skip, limit)
    return ClientListResponse(success=True, data=clients)
```

## Anti-patterns
- ❌ Business logic in endpoints
- ❌ Inconsistent response formats
- ❌ Missing error handling
- ❌ Non-RESTful URLs

## Examples

```python
# ✅ Complete endpoint example
@router.post("/clients", response_model=ClientResponse, status_code=201)
async def create_client(
    client_data: ClientCreate,
    current_user: User = Depends(get_current_user),
    client_service: ClientService = Depends()
):
    try:
        client = await client_service.create_client(client_data, current_user)
        return ClientResponse(
            success=True, 
            data=client, 
            message="Client created successfully"
        )
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
```

}));
```
