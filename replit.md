# CactusDashboard - FinTech Wealth Management Platform

## Description
A comprehensive wealth management platform built with Next.js frontend and FastAPI backend, featuring client portfolio management, real-time market data, automated reporting, and investment analytics.

## Language
- **Primary**: TypeScript/JavaScript (Next.js frontend)
- **Secondary**: Python (FastAPI backend)

## Project Type
- **Category**: Full Stack Web Application
- **Framework**: Next.js + FastAPI
- **Database**: PostgreSQL
- **Cache**: Redis

## Dependencies
- **Frontend**: Node.js 20, Next.js 15, React 18, Tailwind CSS
- **Backend**: Python 3.12, FastAPI, SQLModel, PostgreSQL
- **Database**: PostgreSQL with Alembic migrations
- **Cache/Queue**: Redis with ARQ for background tasks

## Start Command
The project uses a custom workflow defined in `.replit` that starts both frontend and backend services in parallel:
- Frontend: `cd cactus-wealth-frontend && npm install && npm run dev`
- Backend: `cd cactus-wealth-backend && pip install -r requirements.txt && uvicorn main:app --host 0.0.0.0 --port 8000 --reload`

## Architecture
- **Frontend**: Next.js App Router with TypeScript, Zustand state management, shadcn/ui components
- **Backend**: FastAPI with SQLModel ORM, Pydantic validation, JWT authentication
- **Database**: PostgreSQL with Alembic migrations
- **Testing**: Jest/Playwright (frontend), pytest (backend)
- **Deployment**: Docker Compose with autoscaling support

## Key Features
- Client portfolio management with real-time data
- Investment analytics and reporting
- Automated background tasks
- Type-safe API contracts with OpenAPI generation
- Comprehensive testing suite
- Modern UI with dark/light themes

## Development
- Run `npm run dev` in frontend directory
- Run `uvicorn main:app --reload` in backend directory
- Use `docker-compose up` for full stack development
- Execute `bash scripts/cactus.sh` for common development tasks 