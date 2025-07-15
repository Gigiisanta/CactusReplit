---
alwaysApply: true
---
# Regla de Arquitectura y Generación — CactusDashboard

**Fuente de la verdad:**
- Usar siempre [CactusDashboard.md](mdc:CactusDashboard.md) como única fuente de verdad para todo lo que se genere en este proyecto.

**Stack:**
- Next.js + FastAPI + PostgreSQL
- Tailwind CSS, Zustand, SQLModel, Pydantic
- Tipado E2E con generación OpenAPI
- Manejo de errores con DetailedHTTPException (backend) y useApiErrorHandler (frontend)
- Async por defecto en FastAPI
- Testing obligatorio: pytest (backend), jest/playwright (frontend)

**Estructura:**
- Seguir estrictamente la estructura de carpetas y convenciones definidas en [CactusDashboard.md](mdc:CactusDashboard.md)
- DRY, clean, type-safe, escalable

**Reglas de generación:**
- OPTIMIZACIÓN DE TOKENS: Máxima eficiencia sin sacrificar calidad
- Output mínimo indispensable, solo código funcional
- Pensar paso a paso antes de generar código
- Retornar solo código en un único bloque, listo para pegar en Cursor
- Si se generan servicios, generar tests asociados
- Si se generan endpoints, generar esquemas asociados y conectarlos a servicios automáticamente
- Sin explicaciones ni comentarios externos al bloque de código
- No incluir contexto adicional a menos que sea estrictamente requerido
- Si la instrucción es ambigua, generar un esqueleto mínimo alineado a la arquitectura

**Objetivo:**
Permitir generación rápida y coherente de módulos y archivos para CactusDashboard, listos para integrarse al repositorio sin refactor, con coherencia de arquitectura, listos para CI/CD y para uso inmediato en producción.
description:
globs:
alwaysApply: false
---
