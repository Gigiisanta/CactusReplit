---
description:
globs:
alwaysApply: True
---
# 🌵 Cactus Wealth - Cursor Rules Overview

This directory contains comprehensive development rules for the Cactus Wealth project. These rules ensure consistent, secure, and high-quality code across the entire FinTech platform.

## Rules Structure

### 🧠 [Core Development Rules](mdc:cactus-wealth-core.mdc)
The master ruleset covering:
- **Project Persona**: Senior FinTech Engineer mindset
- **Architecture Patterns**: Layered backend, App Router frontend
- **Tech Stack Guidelines**: FastAPI, Next.js 14, PostgreSQL
- **Testing Requirements**: Comprehensive test coverage
- **Code Quality Standards**: Ruff, mypy, ESLint, Prettier

### 🔒 [FinTech Security Rules](mdc:fintech-security.mdc)
Critical security requirements for financial data:
- **Data Protection**: Encryption, PII handling, audit trails
- **Authentication**: JWT, MFA, session management
- **Role-Based Access Control**: ADMIN, SENIOR_ADVISOR, JUNIOR_ADVISOR, COMPLIANCE
- **Regulatory Compliance**: FINRA, SEC, MiFID II standards
- **Infrastructure Security**: Container security, secrets management

### 🚀 [API Design Patterns](mdc:api-patterns.mdc)
Consistent API development patterns:
- **RESTful Conventions**: URL structure, HTTP methods, status codes
- **Response Formats**: Success, error, and pagination patterns
- **Service Layer Architecture**: Business logic separation
- **Frontend Integration**: Centralized API client patterns
- **Testing Strategies**: Backend and frontend testing approaches

### 🎨 [UI/UX Patterns](mdc:ui-ux-patterns.mdc)
Professional financial interface guidelines:
- **Brand Identity**: Cactus Wealth color palette and usage
- **Financial Data Presentation**: Currency formatting, charts, tables
- **Navigation Patterns**: Role-based navigation, breadcrumbs
- **Component Standards**: Forms, loading states, error handling
- **Accessibility**: Financial data accessibility, mobile responsiveness

## Quick Reference

### Key Technologies
- **Backend**: FastAPI + SQLModel + PostgreSQL
- **Frontend**: Next.js 14 + TypeScript + shadcn/ui
- **Testing**: pytest + Jest + Playwright
- **Infrastructure**: Docker + Alembic migrations

### Core Principles
1. **Security First**: Every feature must implement proper RBAC and data isolation
2. **Production Ready**: No mock data, full functionality always
3. **Type Safety**: Strict TypeScript and Python typing
4. **Testing Required**: All new features need corresponding tests
5. **Brand Consistency**: Use established color palette and patterns

### Critical Files to Reference
- [context.md](mdc:context.md) - Complete project context and vision
- [models.py](mdc:cactus-wealth-backend/src/cactus_wealth/models.py) - Database models
- [api.ts](mdc:cactus-wealth-frontend/lib/api.ts) - Frontend API client
- [AuthContext.tsx](mdc:cactus-wealth-frontend/context/AuthContext.tsx) - Authentication
- [globals.css](mdc:cactus-wealth-frontend/app/globals.css) - Styling foundation

## Development Workflow

1. **Plan**: Create atomic step checklist
2. **Secure**: Implement RBAC and validation
3. **Code**: Follow established patterns
4. **Test**: Write comprehensive tests
5. **Verify**: Run lints, type checks, tests
6. **Deploy**: Use Docker containers

## Role-Based Development

### For ADMIN Features
- Full system visibility
- User management capabilities
- Global analytics and reporting
- System configuration access

### For SENIOR_ADVISOR Features
- Team oversight capabilities
- Advanced analytics
- Template creation and sharing
- Junior advisor supervision

### For JUNIOR_ADVISOR Features
- Individual client management
- Basic reporting tools
- Portfolio operations
- Communication tools

### For COMPLIANCE Features
- Read-only audit access
- Immutable log reviews
- Regulatory reporting
- Data lineage tracking

Remember: Always implement the principle of least privilege - users should only access data they need for their specific role.
