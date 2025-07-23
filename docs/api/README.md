# 🔌 API Documentation - CactusDashboard

## Visión General

La API de CactusDashboard está construida con FastAPI y proporciona endpoints RESTful para la gestión de riqueza y clientes.

## Base URL

```
Development: http://localhost:8000
Production: https://api.cactusdashboard.com
```

## Autenticación

### JWT Token
Todos los endpoints protegidos requieren un token JWT en el header:

```
Authorization: Bearer <token>
```

### Obtener Token
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password123"
}
```

### Response
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

## Endpoints Principales

### Autenticación

#### POST /api/v1/auth/login
Iniciar sesión de usuario.

#### POST /api/v1/auth/register
Registrar nuevo usuario.

#### POST /api/v1/auth/refresh
Renovar token de acceso.

#### POST /api/v1/auth/logout
Cerrar sesión.

### Clientes

#### GET /api/v1/clients
Obtener lista de clientes.

**Query Parameters:**
- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 20)
- `search`: Búsqueda por nombre o email
- `status`: Filtrar por estado

#### POST /api/v1/clients
Crear nuevo cliente.

#### GET /api/v1/clients/{client_id}
Obtener cliente específico.

#### PUT /api/v1/clients/{client_id}
Actualizar cliente.

#### DELETE /api/v1/clients/{client_id}
Eliminar cliente.

### Portfolios

#### GET /api/v1/portfolios
Obtener portfolios del usuario.

#### POST /api/v1/portfolios
Crear nuevo portfolio.

#### GET /api/v1/portfolios/{portfolio_id}
Obtener portfolio específico.

#### PUT /api/v1/portfolios/{portfolio_id}
Actualizar portfolio.

#### DELETE /api/v1/portfolios/{portfolio_id}
Eliminar portfolio.

### Assets

#### GET /api/v1/assets
Obtener lista de assets.

#### POST /api/v1/assets
Crear nuevo asset.

#### GET /api/v1/assets/{asset_id}
Obtener asset específico.

#### PUT /api/v1/assets/{asset_id}
Actualizar asset.

#### DELETE /api/v1/assets/{asset_id}
Eliminar asset.

### Reportes

#### POST /api/v1/reports/generate
Generar reporte.

#### GET /api/v1/reports/{report_id}
Obtener reporte.

#### GET /api/v1/reports/{report_id}/download
Descargar reporte.

### Dashboard

#### GET /api/v1/dashboard/kpis
Obtener KPIs del dashboard.

#### GET /api/v1/dashboard/charts
Obtener datos para gráficos.

#### GET /api/v1/dashboard/notifications
Obtener notificaciones.

## Esquemas de Datos

### Cliente
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "phone": "string",
  "status": "active|inactive|prospect",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Portfolio
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "client_id": "uuid",
  "total_value": "decimal",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Asset
```json
{
  "id": "uuid",
  "name": "string",
  "type": "stock|bond|real_estate|crypto",
  "value": "decimal",
  "portfolio_id": "uuid",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

## Códigos de Error

### 400 Bad Request
Datos de entrada inválidos.

### 401 Unauthorized
Token de autenticación inválido o faltante.

### 403 Forbidden
Usuario no tiene permisos para el recurso.

### 404 Not Found
Recurso no encontrado.

### 422 Unprocessable Entity
Datos de validación fallidos.

### 500 Internal Server Error
Error interno del servidor.

## Rate Limiting

- **Límite**: 100 requests por minuto por IP
- **Header**: `X-RateLimit-Remaining`
- **Reset**: `X-RateLimit-Reset`

## WebSocket

### Conexión
```
ws://localhost:8000/ws
```

### Eventos

#### Notificaciones
```json
{
  "type": "notification",
  "data": {
    "id": "uuid",
    "title": "string",
    "message": "string",
    "level": "info|warning|error"
  }
}
```

#### Actualizaciones en Tiempo Real
```json
{
  "type": "update",
  "data": {
    "entity": "client|portfolio|asset",
    "action": "created|updated|deleted",
    "id": "uuid"
  }
}
```

## Testing

### Endpoints de Testing

#### GET /api/v1/health
Health check del servicio.

#### GET /api/v1/health/db
Health check de la base de datos.

### Ejemplos de Testing

```bash
# Health check
curl http://localhost:8000/api/v1/health

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com","password":"password123"}'

# Obtener clientes
curl http://localhost:8000/api/v1/clients \
  -H "Authorization: Bearer <token>"
```

## Documentación Interactiva

- **Swagger UI**: `/docs`
- **ReDoc**: `/redoc`
- **OpenAPI Schema**: `/openapi.json` 