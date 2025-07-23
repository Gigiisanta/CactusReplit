# Manifiesto de Arquitectura y Reconstrucción - CactusDashboard

## 1. Principios y Visión Arquitectónica

La arquitectura de CactusDashboard se rige por un conjunto de principios fundamentales, diseñados para garantizar la escalabilidad, mantenibilidad y seguridad de la plataforma FinTech.

1.  **Seguridad de Tipos de Extremo a Extremo (E2E Type Safety)**: Un contrato estricto une al backend y al frontend. El esquema OpenAPI del backend es la única fuente de verdad, y los tipos del frontend se generan automáticamente a partir de él. Esto elimina una clase entera de errores de integración y asegura que los datos sean consistentes en toda la pila.
2.  **Configuración Centralizada y Validada**: Toda la configuración de la aplicación (bases de datos, claves secretas, orígenes CORS) se gestiona a través de variables de entorno y se carga en un único objeto de configuración (`Settings` en Pydantic) al inicio. Esto proporciona un único lugar para gestionar la configuración y valida que todos los valores necesarios estén presentes y sean correctos antes de que la aplicación se inicie.
3.  **Manejo de Errores Unificado y Semántico**: Las excepciones del backend no son errores genéricos 500. Se utiliza una jerarquía de excepciones personalizadas (`DetailedHTTPException`) que se propagan al frontend con códigos de error semánticos (ej. `CLIENT_NOT_FOUND`). Un hook de React (`useApiErrorHandler`) intercepta estos errores y muestra mensajes claros al usuario, creando un flujo de error predecible y robusto.
4.  **Principio DRY en Lógica y Componentes**: La lógica de negocio está encapsulada en la capa de Servicios del backend, evitando la duplicación en los endpoints. En el frontend, se utiliza un sistema de diseño interno (`components/ui`) y hooks personalizados para reutilizar la lógica de la UI y el manejo de datos, asegurando consistencia y reduciendo el código repetitivo.
5.  **Rendimiento Proactivo y Asincronía**: La arquitectura está diseñada para ser rápida y responsiva. Se utilizan operaciones de base de datos asíncronas, se delegan tareas pesadas (como la generación de informes) a un trabajador en segundo plano (ARQ con Redis) y se implementa caching a nivel de datos (ej. yfinance) para minimizar la latencia.

## 2. Especificación de la Pila Tecnológica Definitiva

| Capa | Tecnología | Versión (si aplica) | Propósito |
|---|---|---|---|
| **Backend** | Python, FastAPI | ^3.11, ^0.111.0 | Framework de API de alto rendimiento. |
| **Frontend** | TypeScript, Next.js | ^5.2.2, ^14.2.30 | Framework de React para aplicaciones web modernas con SSR/SSG. |
| **Base de Datos** | PostgreSQL | (N/A en código) | Base de datos relacional robusta y escalable. |
| **ORM / Modelado** | SQLModel | ^0.0.19 | ORM moderno que combina Pydantic y SQLAlchemy. |
| **Validación de Datos**| Pydantic | (Incluido en FastAPI) | Validación de datos y gestión de esquemas de API. |
| **Gestión de Estado**| Zustand | (N/A en código) | Gestor de estado minimalista y potente para React. |
| **UI Components** | shadcn/ui, Radix UI | (N/A en código) | Componentes de UI reutilizables y accesibles. |
| **Styling** | Tailwind CSS | ^3.3.6 | Framework CSS de utilidad para un diseño rápido. |
| **Pruebas Backend** | Pytest, factory-boy | ^8.2.2, ^3.3.3 | Framework de pruebas para Python y generación de datos de prueba. |
| **Pruebas Frontend** | Jest, Playwright | ^29.7.0, ^1.40.0 | Pruebas unitarias/componentes y pruebas E2E. |
| **Tareas en Segundo Plano** | ARQ, Redis | ^0.25.0, ^5.0.0 | Cola de tareas asíncronas y broker de mensajes. |
| **Contenerización** | Docker, Docker Compose | (N/A) | Entornos de desarrollo y producción consistentes. |

## 3. Arquitectura del Backend (cactus-wealth-backend)

### 3.1. Estructura de Directorios Ideal

La estructura de directorios sigue una estricta separación de capas, facilitando la navegación y el mantenimiento.

`src/cactus_wealth/`
├── `__init__.py`
├── `api`
│   ├── `__init__.py`
│   └── `v1`
│       ├── `__init__.py`
│       ├── `api.py`            # Ensamblador de routers
│       ├── `dependencies.py`   # Dependencias de endpoints
│       └── `endpoints`
│           ├── `__init__.py`
│           ├── `assets.py`
│           ├── `clients.py`
│           ├── `dashboard.py`
│           ├── `health.py`
│           ├── `insurance_policies.py`
│           ├── `investment_accounts.py`
│           ├── `login.py`
│           ├── `model_portfolios.py`
│           ├── `notifications.py`
│           ├── `portfolios.py`
│           ├── `reports.py`
│           └── `users.py`
├── `core`
│   ├── `__init__.py`
│   ├── `arq.py`              # Configuración del worker
│   ├── `config.py`           # Settings de la aplicación
│   ├── `dataprovider.py`     # Abstracción de datos de mercado
│   ├── `exceptions.py`       # Excepciones personalizadas
│   ├── `service_base.py`     # Clase base para servicios
│   └── `tasks.py`            # Definición de tareas asíncronas
├── `crud.py`                 # Operaciones de base de datos
├── `database.py`             # Configuración y sesión de BD
├── `models.py`               # Modelos de datos SQLAlchemy
├── `schemas.py`              # Esquemas Pydantic (contratos API)
├── `security.py`             # Lógica de autenticación y seguridad
├── `services.py`             # Lógica de negocio
├── `templates`
│   ├── `report.html`
│   └── `styles.css`
└── `worker.py`               # Punto de entrada del worker ARQ


### 3.2. Modelos de Datos (SQLAlchemy)

Los modelos definen el esquema de la base de datos usando `SQLModel`.

```python
# En models.py

# --- Enums ---
# UserRole, RiskProfile, AssetType, ClientStatus, LeadSource, ReportType

# --- Tablas ---
class User(SQLModel, table=True): ...
class Client(SQLModel, table=True): ...
class Asset(SQLModel, table=True): ...
class Portfolio(SQLModel, table=True): ...
class Position(SQLModel, table=True): ...
class PortfolioSnapshot(SQLModel, table=True): ...
class Report(SQLModel, table=True): ...
class InvestmentAccount(SQLModel, table=True): ...
class InsurancePolicy(SQLModel, table=True): ...
class Notification(SQLModel, table=True): ...
class ModelPortfolio(SQLModel, table=True): ...
class ModelPortfolioPosition(SQLModel, table=True): ...
```

### 3.3. Contratos de API (Pydantic)

Los esquemas de `Pydantic` definen las formas de los datos para las peticiones y respuestas de la API, desacoplando los modelos de la base de datos de la interfaz pública.

```python
# En schemas.py

# --- Schemas de Creación (Create) ---
class UserCreate(BaseModel): ...
class ClientCreate(BaseModel): ...
class InvestmentAccountCreate(BaseModel): ...
class InsurancePolicyCreate(BaseModel): ...
class ModelPortfolioCreate(BaseModel): ...
class ModelPortfolioPositionCreate(BaseModel): ...
class ReportCreate(BaseModel): ...

# --- Schemas de Actualización (Update) ---
class ClientUpdate(BaseModel): ...
class InvestmentAccountUpdate(BaseModel): ...
class InsurancePolicyUpdate(BaseModel): ...
class ModelPortfolioUpdate(BaseModel): ...
class ModelPortfolioPositionUpdate(BaseModel): ...

# --- Schemas de Lectura (Read) ---
class UserRead(BaseModel): ...
class ClientRead(BaseModel): ...
class ClientReadWithDetails(BaseModel): ...
class AssetRead(BaseModel): ...
class PortfolioRead(BaseModel): ...
class PositionRead(BaseModel): ...
class InvestmentAccountRead(BaseModel): ...
class InsurancePolicyRead(BaseModel): ...
class NotificationRead(BaseModel): ...
class ModelPortfolioRead(BaseModel): ...
class ModelPortfolioPositionRead(BaseModel): ...
class ReportRead(BaseModel): ...

# --- Schemas de Operaciones Específicas ---
class Token(BaseModel): ...
class TokenData(BaseModel): ...
class PortfolioValuation(BaseModel): ...
class DashboardSummaryResponse(BaseModel): ...
class ReportResponse(BaseModel): ...
class BacktestRequest(BaseModel): ...
class BacktestResponse(BaseModel): ...
```

### 3.4. Definición de Endpoints de la API

| Método | Ruta | Esquema Petición | Esquema Respuesta | Lógica Principal |
|---|---|---|---|---|
| POST | `/login/access-token` | `OAuth2PasswordRequestForm` | `Token` | `security.authenticate_user` |
| GET | `/users/me` | - | `UserRead` | `security.get_current_user` |
| GET | `/clients/` | - | `list[ClientRead]` | `crud.get_clients_by_owner` |
| POST | `/clients/` | `ClientCreate` | `ClientRead` | `crud.create_client` |
| GET | `/clients/{id}` | - | `ClientRead` | `dependencies.get_client_from_path` |
| PUT | `/clients/{id}` | `ClientUpdate` | `ClientRead` | `crud.update_client` |
| DELETE| `/clients/{id}` | - | `ClientRead` | `crud.delete_client` |
| GET | `/portfolios/{id}/valuation` | - | `PortfolioValuation`| `PortfolioService.get_portfolio_valuation`|
| POST | `/portfolios/backtest` | `BacktestRequest` | `BacktestResponse` | `PortfolioBacktestService.perform_backtest` |
| GET | `/assets/search` | `query: str` | `list[AssetRead]`| `crud.search_assets` |
| GET | `/dashboard/summary` | - | `DashboardSummary`| `DashboardService.get_dashboard_summary`|
| POST | `/reports/.../generate-report`| `ReportCreate` | `ReportResponse` | `tasks.generate_client_report_task`|
| GET | `/reports/{id}/download` | - | `FileResponse` | `ReportService.generate_portfolio_report_pdf`|
| GET | `/model-portfolios/` | - | `list[ModelPortfolioRead]`| `crud.get_model_portfolios` |
| POST | `/model-portfolios/` | `ModelPortfolioCreate`| `ModelPortfolioRead`| `crud.create_model_portfolio` |
| POST | `.../positions` | `ModelPortfolioPositionCreate`|`ModelPortfolioPositionRead`| `crud.create_model_portfolio_position`|

*(Nota: La tabla es un resumen. Las rutas para `investment-accounts` y `insurance-policies` siguen un patrón CRUD similar.)*

### 3.5. Capa de Servicios

La capa de servicios (`services.py`) encapsula la lógica de negocio compleja.

-   **`AssetService`**: Gestiona la creación y recuperación de activos, interactuando con proveedores de datos de mercado externos (ej. yfinance) y cacheando los resultados en la BD local.
-   **`PortfolioService`**: Orquesta el cálculo de la valoración de carteras, combinando datos de la BD con precios de mercado en tiempo real.
-   **`ReportService`**: Responsable de generar informes en PDF, utilizando plantillas `Jinja2` y `WeasyPrint` para renderizar los datos de valoración en un formato profesional.
-   **`DashboardService`**: Calcula métricas agregadas para el panel principal (AUM, crecimiento, etc.), respetando el control de acceso basado en roles.
-   **`InvestmentAccountService` / `InsurancePolicyService`**: Servicios CRUD que heredan de `BaseService` para manejar la lógica de negocio de productos financieros, incluyendo la validación de acceso.
-   **`NotificationService`**: Lógica para crear y recuperar notificaciones para los usuarios.
-   **`PortfolioBacktestService`**: Orquesta la compleja lógica de backtesting, gestionando el cacheo de datos históricos (Redis), la ejecución concurrente de descargas y el cálculo de métricas de rendimiento.

### 3.6. Módulos del Núcleo (Core)

-   **`core/config.py`**: Define la clase `Settings` que carga toda la configuración desde variables de entorno. Usa `Pydantic` para validación y `lru_cache` para asegurar que la configuración se lea una sola vez.
-   **`core/exceptions.py`**: Establece una jerarquía de excepciones personalizadas que heredan de `DetailedHTTPException`. Esto permite que la API devuelva errores estructurados en JSON con un `detail` legible y un `code` semántico, facilitando el manejo de errores en el frontend.
-   **`core/tasks.py`**: Define las cargas útiles (argumentos) para los trabajos asíncronos (`GenerateReportTaskArgs`) y los handlers que serán ejecutados por el worker `ARQ`. Desacopla la ejecución de tareas largas de las peticiones HTTP.

## 4. Arquitectura del Frontend (cactus-wealth-frontend)

### 4.1. Estructura de Directorios Ideal

La estructura del frontend se centra en el `App Router` de Next.js y una clara separación de responsabilidades.

`cactus-wealth-frontend/`
├── `app/`
│   ├── `(auth)/`             # Grupo de rutas de autenticación
│   │   └── `login/`
│   │       └── `page.tsx`
│   ├── `(dashboard)/`        # Grupo de rutas protegidas
│   │   ├── `layout.tsx`      # Layout con Sidebar y Header
│   │   ├── `dashboard/`
│   │   │   └── `page.tsx`
│   │   ├── `clients/`
│   │   │   ├── `[id]/`
│   │   │   │   └── `page.tsx`
│   │   │   └── `page.tsx`
│   │   └── `...`
│   ├── `layout.tsx`          # Layout raíz (proveedor de contexto)
│   └── `page.tsx`            # Página de entrada/redirección
├── `components/`
│   ├── `clients/`            # Componentes específicos para 'clients'
│   ├── `layout/`             # Componentes de layout (Header, Sidebar)
│   ├── `shared/`             # Componentes compartidos entre features
│   └── `ui/`                 # Sistema de diseño (Button, Card, etc.)
├── `hooks/`
│   └── `useApiErrorHandler.ts` # Hooks personalizados
├── `lib/`
│   ├── `apiClient.ts`        # Cliente Axios con interceptores
│   ├── `config.ts`           # Configuración del frontend
│   ├── `generated/`          # Cliente y tipos autogenerados desde el backend
│   └── `utils.ts`            # Funciones de utilidad
├── `stores/`
│   └── `auth.store.ts`       # Store de estado global (Zustand)
└── `...`


### 4.2. Sistema de Diseño Interno (components/ui)

La UI se construye sobre un conjunto de componentes reutilizables, basados en `shadcn/ui` y `Radix UI`, asegurando consistencia visual y accesibilidad.

-   **`Button`**: Componente de botón con variantes (primary, secondary, destructive, ghost).
-   **`Input`**: Campo de entrada estandarizado.
-   **`Card`**: Contenedor con estilos predefinidos para agrupar información.
-   **`Dialog`**: Modal para acciones enfocadas (ej. crear/editar cliente).
-   **`Table`**: Componente de tabla con estilos para mostrar datos tabulares.
-   **`Select`**, **`Checkbox`**: Controles de formulario estandarizados.
-   **`Skeleton`**: Placeholder de carga para mejorar la UX percibida.
-   **`Sonner`**: Para mostrar notificaciones (toasts) de éxito o error.

### 4.3. Gestión de Estado (Zustand)

Se utiliza `Zustand` para el estado global del cliente, específicamente para la autenticación.

-   **`auth.store.ts`**:
    -   **State Slice**: `{ user: User | null, token: string | null }`
    -   **Acciones**:
        -   `login(user, token)`: Almacena el usuario y el token.
        -   `logout()`: Limpia el usuario y el token.
        -   `setUser(user)`: Actualiza la información del usuario.
    -   **Middleware**: Usa `persist` para guardar el estado en `localStorage`, permitiendo sesiones persistentes entre recargas de página.

### 4.4. Hooks Personalizados Reutilizables

-   **`useApiErrorHandler`**: Un hook que encapsula la lógica de manejo de errores de la API. Proporciona una función `handleApiError` que se puede llamar en bloques `catch`. Inspecciona el error, determina si es un `ApiError` estructurado desde el backend, extrae el mensaje de error semántico y muestra una notificación (toast) al usuario.

## 5. Patrones de Integración Full-Stack

### Flujo de Tipado E2E

1.  **Backend**: `FastAPI` genera automáticamente un `openapi.json` que describe toda la API, incluyendo endpoints, modelos y esquemas.
2.  **Proceso de Generación**: En el frontend, se ejecuta el script `npm run generate:api`.
3.  **Comando**: `openapi --input ../cactus-wealth-backend/openapi.json --output ./lib/generated ...`
4.  **Resultado**: Esto utiliza `openapi-typescript-codegen` para crear un cliente de API (`axios`) completamente tipado en `lib/generated/`, con todos los servicios y modelos como interfaces de TypeScript. Cualquier cambio en el backend que rompa el contrato de la API causará errores de tipo en el frontend durante la compilación.

### Flujo de Configuración

1.  **Backend**: `core/config.py` lee las variables de entorno (`.env`) en un objeto `Settings` de Pydantic. Esto centraliza y valida la configuración del servidor.
2.  **Frontend**: `lib/config.ts` lee variables de entorno públicas (`NEXT_PUBLIC_*`) para configurar el cliente de API, como `NEXT_PUBLIC_API_BASE_URL`. Esto permite que el frontend se conecte al backend correcto sin hardcodear URLs.

### Flujo de Manejo de Errores

1.  **Backend**: Un error de negocio ocurre (ej. un usuario intenta acceder a un cliente que no le pertenece). El `BaseService` lanza una `ForbiddenError("You do not have permission...")`.
2.  **Respuesta API**: FastAPI intercepta esta excepción y la serializa en una respuesta `403 Forbidden` con un cuerpo JSON: `{ "detail": "You do not have permission...", "code": "FORBIDDEN" }`.
3.  **Frontend**: El cliente de API (`apiClient.ts`) realiza una llamada y recibe la respuesta 403, que lanza una `ApiError` (del cliente generado).
4.  **Componente React**: La llamada a la API en el componente está envuelta en un `try...catch`. El bloque `catch` llama a `handleApiError(error)` del hook `useApiErrorHandler`.
5.  **Hook**: `useApiErrorHandler` identifica que es una `ApiError`, extrae el `detail` del cuerpo de la respuesta y usa `sonner` para mostrar un toast de error con el mensaje "You do not have permission...".

## 6. Estrategia de Pruebas y CI/CD

### Pirámide de Pruebas

La estrategia se alinea con la pirámide de pruebas clásica para un equilibrio entre velocidad y confianza:

-   **Unitarias (70%)**: Pruebas rápidas y aisladas. En el backend, para la lógica de los servicios (`services.py`). En el frontend, para componentes de UI y hooks (`Jest`).
-   **Integración (20%)**: Pruebas que verifican la interacción entre varias partes. En el backend, se prueba que un endpoint llama al servicio correcto y devuelve el esquema esperado (`pytest` con `httpx`). En el frontend, se prueba que un componente renderiza correctamente al recibir datos de un hook (`React Testing Library`).
-   **E2E (10%)**: Pruebas completas que simulan el flujo de un usuario real a través de la aplicación. Se utiliza `Playwright` para automatizar el navegador y probar flujos críticos como el login, la creación de un cliente y la generación de un informe.

### Patrones de Pruebas

-   **Backend (`tests/factories.py`)**: Se utiliza `factory-boy` para crear datos de prueba (Usuarios, Clientes, etc.) de manera programática y reutilizable, evitando la creación manual de objetos en cada test.
-   **Frontend (`lib/mocks/handlers.ts`)**: Se utiliza `msw` (Mock Service Worker) para interceptar las peticiones de red y devolver respuestas de API simuladas, permitiendo probar los componentes de React en aislamiento sin depender de un backend real.

### Pipeline de CI (`quality-check.sh`)

Un pipeline de CI/CD debe ejecutar los siguientes pasos en cada commit para garantizar la calidad del código:

1.  **Instalar Dependencias** (Backend y Frontend).
2.  **Linting**: Ejecutar `Ruff` (backend) y `ESLint` (frontend) para verificar la calidad y el estilo del código.
3.  **Formato**: Ejecutar `Black` (backend) y `Prettier` (frontend) para asegurar un formato de código consistente.
4.  **Type Checking**: Ejecutar `mypy` (backend) y `tsc` (frontend) para verificar la seguridad de tipos.
5.  **Pruebas Unitarias y de Integración**: Ejecutar `pytest` y `jest`.
6.  **Build**: Crear una build de producción del frontend (`next build`).
7.  **(Opcional) Pruebas E2E**: Ejecutar las pruebas de `Playwright`.

## 7. Plan de Reconstrucción por Fases (Para Gemini 2.5 Pro)

Esta es una hoja de ruta de alto nivel para reconstruir el proyecto desde cero, asegurando una base sólida en cada fase.

1.  **Fase 1: Scaffolding y Configuración del Backend**
    -   Inicializar proyecto `Poetry`.
    -   Crear la estructura de directorios (`src/cactus_wealth`, `core`, `api`, etc.).
    -   Implementar `core/config.py` para la gestión de configuración.
    -   Configurar la conexión a la base de datos en `database.py`.
    -   Crear el `Dockerfile` y `docker-compose.yml` básicos para el servicio backend y la base de datos.

2.  **Fase 2: Definición de Modelos y Migración de BD**
    -   Implementar todos los modelos de datos en `models.py` usando `SQLModel`.
    -   Implementar todos los esquemas Pydantic en `schemas.py`.
    -   Configurar `Alembic` para las migraciones de base de datos.
    -   Generar y aplicar la primera migración para crear todas las tablas.

3.  **Fase 3: Implementación de Lógica del Backend (Servicios, CRUD, API)**
    -   Implementar la lógica de autenticación en `security.py`.
    -   Implementar las funciones `CRUD` básicas en `crud.py`.
    -   Implementar la lógica de negocio en `services.py`, comenzando con los servicios más simples.
    -   Crear todos los endpoints en `api/v1/endpoints/`, conectándolos a la capa de servicios.
    -   Implementar el sistema de excepciones en `core/exceptions.py`.

4.  **Fase 4: Scaffolding y Configuración del Frontend**
    -   Inicializar proyecto `Next.js` con `TypeScript` y `Tailwind CSS`.
    -   Crear la estructura de directorios (`app`, `components`, `lib`, etc.).
    -   Configurar el `apiClient` con `axios` e interceptores básicos.
    -   Ejecutar `generate:api` por primera vez para generar los tipos del backend.

5.  **Fase 5: Creación del Sistema de Diseño y Layouts**
    -   Implementar todos los componentes base en `components/ui/`.
    -   Crear los componentes de layout principales (`Header`, `Sidebar`) en `components/layout/`.
    -   Implementar los layouts de la aplicación en `app/(dashboard)/layout.tsx`.

6.  **Fase 6: Gestión de Estado y Conexión de UI**
    -   Implementar el store de autenticación con `Zustand` en `stores/auth.store.ts`.
    -   Implementar el `useApiErrorHandler` hook.
    -   Crear las páginas principales (Login, Dashboard, Clients) y conectar los componentes de la UI a los servicios de la API generada.

7.  **Fase 7: Conexión Final, Pruebas y Cierre**
    -   Implementar la lógica del cliente para flujos complejos (backtesting, generación de informes).
    -   Escribir pruebas unitarias (`pytest`, `jest`) para la lógica de negocio y los componentes críticos.
    -   Escribir pruebas E2E (`Playwright`) para los flujos más importantes (login, crear cliente).
    -   Configurar y validar el pipeline de CI/CD (`quality-check.sh`).
    -   Documentar el `README.md` final para ambos proyectos. 