# CactusDashboard Technical Context

## Stack Architecture
- **Backend**: FastAPI 0.104+ with Python 3.12, SQLModel/Pydantic
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript strict
- **Database**: PostgreSQL 15 with Alembic migrations
- **Styling**: Tailwind CSS, shadcn/ui components
- **State**: Zustand for global state management
- **Auth**: JWT-based with role-based access control

## Infrastructure Setup
- **Containerization**: Docker + docker-compose for dev/prod
- **API Documentation**: Auto-generated OpenAPI/Swagger
- **Testing**: pytest (backend), Jest + Playwright (frontend)
- **Quality**: ruff, mypy (Python), ESLint, Prettier (TypeScript)

## Key Configuration Files
- `pyproject.toml` - Python dependencies and tooling
- `package.json` - Node.js dependencies
- `alembic.ini` - Database migration config
- `docker-compose.yml` - Multi-service orchestration

## Database Schema
- Users (advisors) with hierarchical roles
- Clients linked to advisors via foreign keys
- Portfolios containing multiple asset positions
- Historical snapshots for performance tracking
- Audit trails for compliance requirements

## Security Implementation
- Row-level security via advisor_id filtering
- Input validation through Pydantic schemas
- Environment-based configuration secrets
- CORS protection for API endpoints 