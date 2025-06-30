# 🌵 CACTUS WEALTH DASHBOARD - RESUMEN TÉCNICO ULTRA COMPLETO

## 📋 INFORMACIÓN GENERAL DEL PROYECTO

**Nombre:** Cactus Wealth Dashboard  
**Versión:** 0.1.0  
**Tipo:** Plataforma de Gestión de Patrimonio para Asesores Financieros  
**Arquitectura:** Full-Stack Web Application (Backend API + Frontend SPA)  
**Estado:** MVP Funcional con Capacidades Avanzadas  
**Líneas de Código:** 8,000+ líneas totales

## 🎯 VISIÓN Y PROPÓSITO ESTRATÉGICO

### Problema Identificado
Los asesores financieros dedican 80% de su tiempo a tareas administrativas manuales, reportes y sistemas desconectados, limitando su capacidad de asesoramiento y construcción de relaciones.

### Visión del Producto
Plataforma unificada que automatiza tareas administrativas para que los asesores se enfoquen en asesoramiento estratégico y relaciones con clientes.

### Propuesta de Valor
- **Liberación de Carga Administrativa:** Reducción de generación de reportes de horas a minutos
- **Gestión 360° de Clientes:** Vista completa e instantánea del cliente
- **Valoración en Tiempo Real:** Integración con Yahoo Finance
- **Automatización de Snapshots:** Workers ARQ para análisis histórico
- **Reportes PDF Profesionales:** Generación automática con branding

## 🏗️ ARQUITECTURA TÉCNICA AVANZADA

### Stack Tecnológico Principal

| Capa | Tecnología | Versión | Propósito | Archivo Config |
|------|------------|---------|-----------|----------------|
| **Backend API** | FastAPI + SQLModel | Python 3.11+ | API REST asíncrona y tipada | `pyproject.toml` |
| **Frontend SPA** | Next.js + TypeScript | 14.0.4 | Interfaz reactiva con SSR | `package.json` |
| **Base de Datos** | PostgreSQL | 15-alpine | Almacenamiento relacional | `docker-compose.yml` |
| **Cache/Queue** | Redis + ARQ | 7-alpine | Colas asíncronas | `worker.py` |
| **UI System** | shadcn/ui + Tailwind CSS | Latest | Sistema de diseño personalizado | `tailwind.config.ts` |
| **PDF Engine** | WeasyPrint + Jinja2 | Latest | Generación de reportes | `services.py` |
| **Market Data** | Yahoo Finance (yfinance) | 0.2.28+ | Valoración tiempo real | `dataprovider.py` |
| **Contenerización** | Docker + Docker Compose | Latest | Entornos reproducibles | `docker-compose.yml` |

### Principios Arquitecturales
1. **Security by Design:** JWT + bcrypt + RBAC + audit logs
2. **Data Provider Abstraction:** Capa desacoplada de fuentes externas
3. **Event-Driven Workers:** ARQ workers para tareas asíncronas
4. **Domain-Driven Design:** Services layer especializados
5. **Type Safety:** 100% tipado TypeScript + Python type hints

## 🗄️ MODELO DE DATOS AVANZADO

### Entidades Principales con Relaciones

**Users (Asesores)**
```python
# Archivo: models.py líneas 58-85
- id: int (PK)
- username: str (unique, indexed)
- email: str (unique, indexed) 
- hashed_password: str
- role: UserRole [ADMIN, SENIOR_ADVISOR, JUNIOR_ADVISOR]
- is_active: bool
- created_at, updated_at: datetime
# Relación 1:N con clients
```

**Clients (Clientes CRM)**
```python
# Archivo: models.py líneas 87-155
- id: int (PK)
- first_name, last_name: str
- email: str (unique, indexed)
- risk_profile: RiskProfile [LOW, MEDIUM, HIGH]
- status: ClientStatus [prospect, contacted, onboarding, active_investor, active_insured, dormant]
- lead_source: LeadSource [referral, social_media, event, organic, other]
- notes: str (max 2000)
- portfolio_name: str
- referred_by_client_id: int (self-referential FK)
- owner_id: int (FK to Users)
# Relaciones: portfolios, investment_accounts, insurance_policies, referred_clients
```

**Assets (Activos Financieros)**
```python
# Archivo: models.py líneas 157-180
- id: int (PK)
- ticker_symbol: str (unique, indexed)
- name: str
- asset_type: AssetType [STOCK, ETF, BOND]
- sector: str (nullable)
# Relación 1:N con positions
```

**Portfolios + Positions**
```python
# Archivo: models.py líneas 182-237
Portfolio:
- id: int (PK)
- name: str
- client_id: int (FK)
- created_at, updated_at: datetime

Position:
- id: int (PK)
- quantity: float (>=0)
- purchase_price: float (>=0)
- portfolio_id, asset_id: int (FKs)
```

**PortfolioSnapshots (Histórico Automatizado)**
```python
# Archivo: models.py líneas 209-235
- id: int (PK)
- value: Decimal(15,2) (valor actual del portfolio)
- timestamp: datetime (timezone-aware, indexed)
- portfolio_id: int (FK)
# Creados automáticamente por ARQ Worker cada 24h
```

**Investment Accounts + Insurance Policies**
```python
# Archivo: models.py líneas 299-371
InvestmentAccount:
- platform: str (ej: "Balanz", "Decrypto")
- account_number: str
- aum: Decimal(15,2) (Assets Under Management)

InsurancePolicy:
- policy_number: str (unique)
- insurance_type: str
- premium_amount, coverage_amount: Decimal(15,2)
```

## 🔌 API ENDPOINTS COMPLETA

### Base URL: `http://localhost:8000/api/v1`

**Authentication & Health**
```
GET  /health                           # Health check
POST /login/access-token              # JWT authentication
GET  /users/me                        # Current user info
```

**Users Management**
```
GET  /users/                          # List users (ADMIN only)
POST /users/                          # Create user
```

**Clients (CRM Avanzado)**
```
GET    /clients/                      # List with pagination/filters
POST   /clients/                      # Create with referral validation
GET    /clients/{id}                  # Detail with accounts/policies
PUT    /clients/{id}                  # Update with audit trail
DELETE /clients/{id}                  # Soft delete with verification
```

**Portfolios (Valoración Tiempo Real)**
```
GET /portfolios/                      # List advisor's portfolios
GET /portfolios/{id}                  # Detail with positions
GET /portfolios/{id}/valuation        # ⭐ Valoración Yahoo Finance
GET /portfolios/{id}/report/download  # ⭐ Descarga PDF inmediata
```

**Dashboard (KPIs Inteligentes)**
```
GET  /dashboard/summary               # KPIs por rol:
                                      # - total_clients
                                      # - assets_under_management
                                      # - monthly_growth_percentage
                                      # - reports_generated_this_quarter
POST /dashboard/debug/trigger-snapshots # Manual snapshot trigger (ADMIN)
```

**Financial Products**
```
# Investment Accounts
GET    /investment-accounts/
POST   /investment-accounts/
GET    /investment-accounts/{id}
PUT    /investment-accounts/{id}
DELETE /investment-accounts/{id}

# Insurance Policies  
GET    /insurance-policies/
POST   /insurance-policies/
GET    /insurance-policies/{id}
PUT    /insurance-policies/{id}
DELETE /insurance-policies/{id}
```

## 🎨 FRONTEND - NEXT.JS 14 APP ROUTER

### Estructura de Páginas Principales

**Root Layout (`app/layout.tsx`)**
- AuthProvider para gestión de estado global
- Configuración de fuentes y metadatos
- CSS global con variables de Cactus Wealth

**Authentication**
```
/login                                # Página de login con validación
/register                             # Registro usuarios (condicional)
```

**Dashboard Principal (`/dashboard`)**
```
/dashboard/                           # Vista principal con KPIs
  ├── components/
  │   ├── DashboardKPIs.tsx          # Métricas en tiempo real
  │   ├── DashboardActions.tsx       # Acciones rápidas
  │   └── DashboardRecentActivity.tsx # Actividad reciente
  └── layout.tsx                      # Layout con sidebar
```

**Gestión de Clientes (`/clients`)**
```
/clients/                             # DataTable con @tanstack/react-table
/clients/[clientId]/                  # Detalle completo cliente
  ├── components/
  │   ├── ClientDetailsCard.tsx      # Info principal
  │   ├── InvestmentAccountsSection.tsx # Cuentas inversión  
  │   ├── InsurancePoliciesSection.tsx   # Pólizas seguro
  │   ├── AddInvestmentAccountDialog.tsx # Modal crear cuenta
  │   └── AddInsurancePolicyDialog.tsx   # Modal crear póliza
  └── page.tsx                        # Página principal detalle
```

**Gestión de Portfolios (`/portfolios`)**
```
/portfolios/                          # Lista portfolios
/portfolios/manage/[id]/              # Gestión específica portfolio
  ├── components/
  │   ├── AddAssetDialog.tsx         # Agregar activos
  │   └── HistoricalPerformanceChart.tsx # Gráficos performance
  └── page.tsx
```

### Componentes UI Reutilizables (shadcn/ui)

**Ubicación:** `components/ui/`
- `button.tsx`, `card.tsx`, `dialog.tsx`, `table.tsx`
- `input.tsx`, `select.tsx`, `tabs.tsx`, `badge.tsx`
- `skeleton.tsx` para loading states

**Sistema de Colores Cactus Wealth:**
```typescript
// tailwind.config.ts líneas 50-75
cactus: {
  '500': '#2d8f2d',    # Verde principal
  '600': '#237a23',
  '700': '#1d631d'
}
sage: {
  '500': '#5f6b5f',    # Verde sage secundario
}
sand: {
  '500': '#d4b896',    # Arena/beige accent
}
```

## ⚙️ SERVICIOS DE NEGOCIO AVANZADOS

### PortfolioService (services.py líneas 30-220)
```python
class PortfolioService:
    def get_portfolio_valuation(portfolio_id: int) -> PortfolioValuation:
        # Obtiene precios actuales de Yahoo Finance
        # Calcula valor mercado vs costo
        # Calcula P&L y porcentaje
        
    def create_snapshot_for_portfolio(portfolio_id: int) -> PortfolioSnapshot:
        # Crea snapshot automático
        # Guarda en BD para análisis histórico
        # Notifica al advisor
```

### ReportService (services.py líneas 220-472)
```python
def generate_portfolio_report_pdf() -> bytes:
    # Usa Jinja2 para template HTML
    # WeasyPrint para conversión PDF
    # Branding Cactus Wealth personalizado
    
async def generate_portfolio_report() -> ReportResponse:
    # Proceso asíncrono completo
    # Integra con PortfolioService
    # Guarda reporte en sistema archivos
```

### DashboardService (services.py líneas 473-756)
```python
def get_dashboard_summary(user: User) -> DashboardSummaryResponse:
    # KPIs basados en rol de usuario
    # ADMIN: datos globales
    # ADVISOR: solo clientes asignados
    
def _calculate_monthly_growth(user: User) -> Optional[float]:
    # Usa PortfolioSnapshots para calcular crecimiento
    # Compara mes actual vs anterior
    # Retorna None si datos insuficientes
```

## 🤖 WORKERS ARQ ASÍNCRONOS

### Worker Principal (worker.py)
```python
# Configuración ARQ
class WorkerSettings:
    redis_settings = RedisSettings.from_dsn(REDIS_URL)
    functions = [create_all_snapshots]
    max_jobs = 10
    job_timeout = 300  # 5 minutos
    
async def create_all_snapshots() -> str:
    # Ejecuta cada 24 horas
    # Crea snapshots para todos los portfolios
    # Manejo de errores por portfolio individual
    # Logging detallado de resultados
```

### Configuración ARQ (core/arq.py)
- Enqueue jobs bajo demanda
- Retry logic para fallos
- Job IDs para tracking
- Integration con Redis

## 📊 SCHEMAS Y VALIDACIONES PYDANTIC

### Schemas Principales (schemas.py)

**Cliente con Validaciones:**
```python
class ClientCreate(BaseModel):
    first_name: str
    last_name: str  
    email: EmailStr                    # Validación email automática
    risk_profile: RiskProfile
    status: ClientStatus = ClientStatus.prospect
    referred_by_client_id: Optional[int] = None
```

**Dashboard Response:**
```python
class DashboardSummaryResponse(BaseModel):
    total_clients: int
    assets_under_management: float
    monthly_growth_percentage: Optional[float]  # None si datos insuficientes
    reports_generated_this_quarter: int
```

**Portfolio Valuation:**
```python
class PortfolioValuation(BaseModel):
    portfolio_id: int
    portfolio_name: str
    total_value: float              # Valor actual mercado
    total_cost_basis: float         # Costo total compra
    total_pnl: float               # Ganancia/Pérdida
    total_pnl_percentage: float    # P&L porcentaje
    positions_count: int
    last_updated: datetime
```

## 🐳 CONFIGURACIÓN DOCKER Y DESARROLLO

### Docker Compose (docker-compose.yml)
```yaml
services:
  db:                              # PostgreSQL 15-alpine
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: cactus_db
      POSTGRES_USER: cactus_user
    healthcheck:                   # Health check automático
      test: ["CMD-SHELL", "pg_isready"]
      
  backend:                         # FastAPI backend
    build: ./cactus-wealth-backend
    environment:
      DATABASE_URL: postgresql://...
      REDIS_URL: redis://cactus_redis:6379
    depends_on:
      db: {condition: service_healthy}
      
  redis:                          # Redis para ARQ
    image: redis:7-alpine
    
  frontend:                       # Next.js frontend
    build: 
      context: ./cactus-wealth-frontend
      dockerfile: Dockerfile.dev
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000/api/v1
      
  arq_worker:                     # Worker ARQ independiente
    build: ./cactus-wealth-backend
    command: /usr/local/bin/start-worker.sh
    depends_on: [redis, db]
```

### Script de Desarrollo Avanzado (start.sh)
- Consola interactiva de desarrollo
- Limpieza automática de puertos (3000, 8000, 5432, 6379)
- Gestión de servicios Docker
- Status monitoring en tiempo real
- Configuración de red LAN
- Logs centralizados
- Backup y restore de BD

## 🧪 TESTING Y CALIDAD

### Backend Testing (pytest)
```python
# pyproject.toml configuración
[tool.pytest.ini_options]
addopts = [
    "--cov=src/cactus_wealth",
    "--cov-report=term-missing", 
    "--cov-fail-under=80",        # Cobertura mínima 80%
]
markers = [
    "slow: marks tests as slow",
    "integration: marks tests as integration tests",
    "unit: marks tests as unit tests",
]
```

### Frontend Testing (Jest + Playwright)
```json
// package.json scripts
{
  "test": "jest",
  "test:coverage": "jest --coverage",
  "e2e": "playwright test",
  "e2e:ui": "playwright test --ui"
}
```

### Linting y Formateo
**Backend (Ruff):**
- Configuración en `pyproject.toml`
- Reglas E, W, F, I, B, C4, UP, ARG, SIM, TCH
- Auto-formatting con quote-style "double"

**Frontend (ESLint + Prettier):**
- Next.js config con reglas estrictas
- Prettier con plugin Tailwind CSS
- Husky hooks para pre-commit

## 🔒 SEGURIDAD Y CONFIGURACIÓN

### Variables de Entorno (config.py)
```python
class Settings(BaseSettings):
    PROJECT_NAME: str = "Cactus Wealth Dashboard API"
    DATABASE_URL: str = "postgresql://..."
    REDIS_URL: str = "redis://localhost:6379"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    CORS_ORIGINS: str = "http://localhost:3000,..."
    
    class Config:
        env_file = ".env"
```

### Autenticación y Autorización
- JWT tokens con OAuth2PasswordBearer
- Password hashing con bcrypt
- Role-based access control (RBAC)
- Session persistence en localStorage
- Automatic token inclusion en requests

## 📈 CARACTERÍSTICAS AVANZADAS

### Market Data Integration
- Yahoo Finance API para precios tiempo real
- Caching de datos para optimización
- Error handling robusto para datos faltantes
- Support para múltiples asset types

### PDF Report Generation
- Templates Jinja2 con branding Cactus
- WeasyPrint para conversión HTML→PDF
- Datos dinámicos de valoración
- Descarga inmediata desde frontend

### Real-time Portfolio Valuation
- Cálculo dinámico de P&L
- Precio actual vs precio compra
- Métricas de performance
- Error handling por posición individual

### Automated Snapshots
- Workers ARQ ejecutando cada 24h
- Historial para cálculo de crecimiento mensual
- Notificaciones automáticas
- Manejo de errores por portfolio

### Advanced CRM Features
- Lead source tracking
- Referral system (self-referential)
- Client status pipeline
- Investment accounts management
- Insurance policies tracking
- Notes and portfolio naming

## 🚀 PRÓXIMOS PASOS Y EXTENSIBILIDAD

### Arquitectura Preparada Para:
- AI/ML integration hooks
- Vector DB para recomendaciones
- Microservices decomposition
- Observability con Prometheus/Grafana
- CI/CD pipelines
- Multi-tenant architecture
- Real-time notifications con WebSockets

### Patrones Implementados:
- Repository pattern en services
- Factory pattern para providers
- Observer pattern para notifications
- Strategy pattern para data providers
- Command pattern para ARQ workers

---

**🌵 Este documento sirve como referencia completa para cualquier IA que necesite entender y trabajar con el proyecto Cactus Wealth Dashboard. Todas las referencias a archivos y líneas de código están actualizadas según el estado actual del proyecto.** 