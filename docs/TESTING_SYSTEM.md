# Sistema de Test Automáticos - CactusDashboard

## 🎯 Descripción

Sistema completo de testing automático para debugging antes de ejecución, diseñado específicamente para CactusDashboard. Proporciona verificación exhaustiva de calidad, funcionalidad y rendimiento antes de iniciar la aplicación.

## 🏗️ Arquitectura del Sistema

```
CactusDashboard/
├── quality-check.sh          # Quality checks principales
├── test-master.sh            # Orquestador principal
├── tests/
│   └── test_runner.py        # Test runner del backend
├── cactus-wealth-frontend/
│   └── test-runner.js        # Test runner del frontend
├── e2e-test-runner.js        # Test runner E2E
├── test-config.json          # Configuración del sistema
└── test-reports/             # Reportes generados
```

## 🚀 Uso Rápido

### Ejecutar todos los tests
```bash
./test-master.sh
```

### Tests rápidos (sin E2E)
```bash
./test-master.sh --quick
```

### Solo backend
```bash
./test-master.sh --backend
```

### Solo frontend
```bash
./test-master.sh --frontend
```

### Solo E2E
```bash
./test-master.sh --e2e
```

## 📋 Componentes del Sistema

### 1. Quality Check (`quality-check.sh`)
Verificaciones de calidad antes de ejecución:
- ✅ Dependencias del sistema
- ✅ Configuración de entorno
- ✅ Estructura del proyecto
- ✅ Linting (Backend: Ruff, Frontend: ESLint)
- ✅ Type checking (Backend: MyPy, Frontend: TypeScript)
- ✅ Tests unitarios
- ✅ Build verification
- ✅ Análisis de seguridad (Bandit)
- ✅ Análisis de complejidad (Radon)
- ✅ Verificación de puertos
- ✅ Conexiones a servicios (DB, Redis)

### 2. Backend Test Runner (`tests/test_runner.py`)
Tests específicos del backend:
- 🐍 Verificación de dependencias Python
- 🔍 Linting con Ruff
- 📝 Type checking con MyPy
- 🧪 Tests unitarios con pytest
- 🔗 Tests de integración
- 🛡️ Escaneo de seguridad con Bandit
- 📊 Análisis de complejidad con Radon
- 🗄️ Verificación de conexión a BD
- 🔄 Verificación de migraciones

### 3. Frontend Test Runner (`cactus-wealth-frontend/test-runner.js`)
Tests específicos del frontend:
- ⚛️ Verificación de dependencias Node.js
- 🔍 Linting con ESLint
- 🎨 Formateo con Prettier
- 📝 Type checking con TypeScript
- 🧪 Tests unitarios con Jest
- 🧩 Tests de componentes
- 🪝 Tests de hooks
- 🏗️ Build verification
- ♿ Tests de accesibilidad
- 📦 Análisis de bundle

### 4. E2E Test Runner (`e2e-test-runner.js`)
Tests end-to-end completos:
- 🐳 Verificación de servicios Docker
- 🏥 Health checks del backend
- 🏥 Health checks del frontend
- 🗄️ Conexión a base de datos
- 🔴 Conexión a Redis
- 🔌 Tests de endpoints de API
- 🌐 Tests de WebSocket
- 🧭 Navegación del frontend
- ⚡ Tests de performance
- 🎭 Tests con Playwright

### 5. Test Master (`test-master.sh`)
Orquestador principal que:
- 🎛️ Coordina todos los componentes
- 📊 Genera reportes consolidados
- 🧹 Limpia archivos temporales
- 📈 Proporciona resumen final
- 🎯 Maneja exit codes apropiados

## ⚙️ Configuración

### Archivo de Configuración (`test-config.json`)

```json
{
  "project": {
    "name": "CactusDashboard",
    "version": "1.0.0"
  },
  "services": {
    "backend": {
      "url": "http://localhost:8000",
      "health_endpoint": "/health"
    },
    "frontend": {
      "url": "http://localhost:3000"
    }
  },
  "thresholds": {
    "performance": {
      "backend_response_time": 2000,
      "frontend_load_time": 5000
    },
    "coverage": {
      "backend_minimum": 80,
      "frontend_minimum": 70
    }
  }
}
```

## 📊 Reportes

### Tipos de Reportes Generados
- `test-reports/consolidated_report.json` - Reporte principal
- `test-reports/backend_test_report.json` - Tests del backend
- `test-reports/frontend_test_report.json` - Tests del frontend
- `test-reports/e2e_test_report.json` - Tests E2E
- `bandit_report.json` - Análisis de seguridad
- `radon_report.json` - Análisis de complejidad

### Estructura del Reporte
```json
{
  "summary": {
    "total_tests": 15,
    "passed": 14,
    "failed": 1,
    "errors": 0,
    "skipped": 0,
    "success_rate": 93.3
  },
  "results": [
    {
      "name": "Linting",
      "status": "PASSED",
      "duration": 1250,
      "error_message": null
    }
  ]
}
```

## 🎯 Casos de Uso

### 1. Desarrollo Diario
```bash
# Tests rápidos antes de commit
./test-master.sh --quick
```

### 2. Pre-deployment
```bash
# Tests completos antes de producción
./test-master.sh --all
```

### 3. Debugging Específico
```bash
# Solo verificar backend
./test-master.sh --backend

# Solo verificar frontend
./test-master.sh --frontend
```

### 4. CI/CD Pipeline
```bash
# Ejecutar en pipeline automatizado
./test-master.sh --quality --backend --frontend
```

## 🔧 Personalización

### Modificar Thresholds
Editar `test-config.json`:
```json
{
  "thresholds": {
    "performance": {
      "backend_response_time": 1000  // Más estricto
    }
  }
}
```

### Agregar Nuevos Tests
1. Crear función en el runner correspondiente
2. Agregar a la lista de tests en `runAllTests()`
3. Actualizar configuración si es necesario

### Configurar Notificaciones
```json
{
  "notifications": {
    "enabled": true,
    "slack_webhook": "https://hooks.slack.com/...",
    "email": {
      "recipients": ["team@cactuswealth.com"]
    }
  }
}
```

## 🚨 Troubleshooting

### Errores Comunes

#### 1. Dependencias Faltantes
```bash
# Instalar Poetry
curl -sSL https://install.python-poetry.org | python3 -

# Instalar pnpm
npm install -g pnpm
```

#### 2. Puertos Ocupados
```bash
# Limpiar puertos
lsof -ti:8000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

#### 3. Servicios Docker No Iniciados
```bash
# Iniciar servicios
docker-compose up -d postgres redis
```

#### 4. Tests Fallando
```bash
# Verificar logs detallados
./test-master.sh --verbose

# Ejecutar componente específico
python3 tests/test_runner.py --verbose
```

### Logs y Debugging
- Los logs se guardan en `test-logs/`
- Usar `--verbose` para output detallado
- Revisar reportes JSON para detalles específicos

## 📈 Métricas y Monitoreo

### Métricas Recolectadas
- ⏱️ Duración de tests
- 📊 Tasa de éxito
- 🎯 Cobertura de código
- ⚡ Performance metrics
- 🛡️ Security issues
- 📏 Complexity scores

### Alertas Automáticas
- Test failures
- Coverage drops
- Performance degradation
- Security vulnerabilities

## 🔄 Integración con CI/CD

### GitHub Actions
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Tests
        run: ./test-master.sh --quality --backend --frontend
```

### GitLab CI
```yaml
test:
  stage: test
  script:
    - ./test-master.sh --quality --backend --frontend
  artifacts:
    reports:
      junit: test-reports/*.xml
```

## 🎓 Mejores Prácticas

### 1. Ejecutar Tests Regularmente
- Antes de cada commit
- En pull requests
- Antes de deployment

### 2. Mantener Thresholds Actualizados
- Revisar métricas periódicamente
- Ajustar thresholds según necesidades
- Documentar cambios

### 3. Monitorear Tendencias
- Revisar reportes históricos
- Identificar degradaciones
- Proactivamente mejorar calidad

### 4. Optimizar Performance
- Usar `--quick` para desarrollo
- Ejecutar tests en paralelo cuando sea posible
- Cachear dependencias

## 🤝 Contribución

### Agregar Nuevos Tests
1. Crear función de test
2. Agregar a runner correspondiente
3. Actualizar documentación
4. Agregar tests para el nuevo test

### Reportar Issues
1. Describir problema claramente
2. Incluir logs relevantes
3. Especificar entorno
4. Proponer solución si es posible

## 📚 Referencias

- [CactusDashboard.md](CactusDashboard.md) - Arquitectura principal
- [quality-check.sh](quality-check.sh) - Quality checks
- [test-config.json](test-config.json) - Configuración
- [test-reports/](test-reports/) - Reportes generados

## 🎯 Objetivos del Sistema

1. **Prevención de Errores** - Detectar problemas antes de ejecución
2. **Calidad Consistente** - Mantener estándares de calidad
3. **Feedback Rápido** - Proporcionar información inmediata
4. **Automatización** - Reducir trabajo manual
5. **Trazabilidad** - Documentar estado del sistema
6. **Escalabilidad** - Crecer con el proyecto

---

**¡El sistema de testing está diseñado para hacer que el desarrollo sea más confiable y eficiente!** 🚀 