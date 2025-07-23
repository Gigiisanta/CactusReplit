# Desarrollo Local Ultra Optimizado — CactusDashboard

## Resumen de la Etapa

- Se eliminó la dependencia de Docker para desarrollo diario.
- Se automatizó el arranque, seed y migraciones con un solo script (`start-local.sh`).
- Se paralelizó el flujo para aprovechar todos los recursos de macOS.
- Se definieron `.env.local` para backend y frontend.
- Se documentó el baseline de performance y recomendaciones clave.

---

## 1. Diagnóstico y Decisiones

- Docker Compose es lento en Mac/Windows por virtualización y I/O.
- El desarrollo local puro (Poetry + Node.js + Postgres/Redis locales) es 10x más rápido.
- Se priorizó la experiencia de iteración continua y hot reload.
- Se automatizó el seed y migraciones solo la primera vez (lock).
- Se optimizó el uso de CPU/RAM y el monitoreo de logs.

---

## 2. Instrucciones de Uso

### Backend
- Requisitos: Python 3.12+, Poetry, PostgreSQL local, Redis local.
- `.env.local` ejemplo:
  ```env
  DATABASE_URL=postgresql://cactus_user:cactus_password@localhost:5432/cactus_wealth
  REDIS_URL=redis://localhost:6379/0
  ENVIRONMENT=development
  ```

### Frontend
- Requisitos: Node.js 18+ (o superior), npm.
- `.env.local` ejemplo:
  ```env
  NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
  ```

### Arranque Ultra Rápido
1. Da permisos: `chmod +x start-local.sh`
2. Ejecuta: `./start-local.sh`
3. Monitorea logs en tiempo real.
4. Si necesitas resetear el seed, borra `logs/.seed.lock` y relanza el script.

---

## 3. Script de Arranque (`start-local.sh`)
- Paraleliza Redis, Postgres, backend y frontend.
- Instala dependencias solo si hay cambios.
- Usa `npm ci` si hay lockfile.
- Ejecuta seed y migraciones solo una vez.
- Muestra resumen de PIDs y uso de recursos.
- Logs en tiempo real con `tail -F`.

---

## 4. Baseline de Performance

| Flujo                | Backend Ready | Frontend Ready | DB Ready | Hot Reload | RAM/CPU |
|----------------------|--------------|---------------|----------|------------|---------|
| Docker Compose (Mac) | 1-3 min      | 1-2 min       | 30-60s   | Lento      | Alto    |
| Local puro           | 5-10s        | 5-10s         | 2-5s     | Instant    | Bajo    |

---

## 5. Recomendaciones y Advertencias

- Solo usar Docker para CI/CD, staging y producción.
- No usar SQLite salvo para pruebas ultrarrápidas.
- No ejecutar seed en producción.
- Ajustar parámetros de Postgres/Redis solo en desarrollo.
- Mantener los scripts y .env actualizados.

---

## 6. Siguientes Pasos

- Iterar y mejorar la app sin fricción.
- Usar este baseline como referencia para futuras optimizaciones.
- Documentar cualquier cambio relevante en este archivo.

---

**Este documento resume y consolida todas las decisiones, scripts y recomendaciones clave de la etapa de optimización local de CactusDashboard.** 