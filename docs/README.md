# CactusDashboard - Documentación

## Estructura del Proyecto

### 📁 Directorios Principales
- **`cactus-wealth-backend/`** - API FastAPI con PostgreSQL
- **`cactus-wealth-frontend/`** - Aplicación Next.js
- **`scripts/`** - Scripts organizados por categoría
- **`tools/`** - Herramientas auxiliares (sync-bridge, n8n-workflows)
- **`data/`** - Datos de testing y scripts de inicialización
- **`logs/`** - Logs organizados por categoría
- **`docs/`** - Documentación del proyecto

### 🚀 Inicio Rápido

```bash
# Script maestro para desarrollo
./scripts/dev/dev.sh start

# Comandos individuales
./scripts/dev/dev.sh setup    # Configurar entorno
./scripts/dev/dev.sh test     # Ejecutar tests
./scripts/dev/dev.sh quality  # Quality checks
./scripts/dev/dev.sh clean    # Limpiar archivos temporales
```

### 📋 Scripts Disponibles

#### Desarrollo (`scripts/dev/`)
- `dev.sh` - Script maestro
- `start.sh` - Iniciar entorno completo
- `setup-dev-env.sh` - Configurar entorno
- `quick_start.sh` - Inicio rápido
- `run-all.sh` - Pipeline completo

#### Testing (`scripts/testing/`)
- `test-master.sh` - Ejecutar todos los tests
- `fix-final-tests.sh` - Corregir tests
- `fix-issues.sh` - Corregir problemas
- `show-test-system.sh` - Mostrar sistema de tests

#### Quality (`scripts/quality/`)
- `quality-check.sh` - Checks de calidad
- `quality-master.sh` - Pipeline de calidad
- `quality-auto.sh` - Automatización
- `quality-monitor.sh` - Monitoreo
- `quality-optimizer.sh` - Optimización

### 📊 Logs y Datos

#### Logs (`logs/`)
- `quality/` - Logs de quality checks
- `testing/` - Logs de tests
- `deployment/` - Logs de deployment

#### Datos (`data/`)
- `test-dbs/` - Bases de datos de testing
- `init-scripts/` - Scripts de inicialización
- `tests/` - Tests del proyecto

### 🛠️ Herramientas (`tools/`)
- `sync-bridge/` - Bridge de sincronización
- `n8n-workflows/` - Workflows de automatización

### 📚 Documentación

#### Arquitectura (`docs/architecture/`)
- Documentación de arquitectura del sistema
- Patrones de diseño
- Decisiones técnicas

#### API (`docs/api/`)
- Documentación de endpoints
- Esquemas de datos
- Ejemplos de uso

#### Deployment (`docs/deployment/`)
- Guías de deployment
- Configuración de entornos
- Troubleshooting

#### Legacy (`docs/legacy/`)
- Documentación histórica
- Archivos obsoletos
- Referencias técnicas

## 🎯 Comandos Principales

```bash
# Desarrollo
./scripts/dev/dev.sh start

# Testing
./scripts/dev/dev.sh test

# Quality
./scripts/dev/dev.sh quality

# Limpieza
./scripts/dev/dev.sh clean

# Ver logs
./scripts/dev/dev.sh logs
```

## 📝 Notas de Mantenimiento

- Todos los logs se almacenan en `logs/` organizados por categoría
- Los datos de testing están en `data/test-dbs/`
- Los scripts están organizados por funcionalidad en `scripts/`
- La documentación está centralizada en `docs/` 