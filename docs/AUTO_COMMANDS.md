# 🚀 Comandos Automáticos - CactusDashboard Quality Check

## ⚡ Comandos Ultra-Rápidos (Sin Interacción)

### 1. **`./qc`** - Comando Principal Ultra-Rápido
```bash
# Ejecución ultra-rápida (por defecto)
./qc

# Con opciones
./qc status          # Ver estado del sistema
./qc optimize        # Optimización automática
./qc complete        # Ejecución completa
./qc benchmark       # Benchmark automático
./qc maintenance     # Mantenimiento automático
```

### 2. **`./quality-auto.sh`** - Script Ultra-Automático
```bash
# Ejecución ultra-rápida (por defecto)
./quality-auto.sh

# Comandos específicos
./quality-auto.sh quick              # Ejecución ultra-rápida
./quality-auto.sh complete           # Ejecución completa automática
./quality-auto.sh optimize           # Optimización automática
./quality-auto.sh monitor            # Monitoreo automático
./quality-auto.sh benchmark          # Benchmark automático
./quality-auto.sh maintenance        # Mantenimiento automático
./quality-auto.sh status             # Estado del sistema
```

### 3. **`./quality-check.sh`** - Sistema Principal Optimizado
```bash
# Ejecución básica (ultra-rápida)
./quality-check.sh

# Forzar re-ejecución completa
./quality-check.sh --no-cache

# Limpiar cache antes de ejecutar
./quality-check.sh --clean
```

### 4. **`./quality-master.sh`** - Sistema Maestro Automático
```bash
# Ejecución rápida automática (por defecto)
./quality-master.sh

# Comandos directos
./quality-master.sh quick              # Ejecución rápida
./quality-master.sh full               # Ejecución completa
./quality-master.sh optimize           # Optimización automática
./quality-master.sh monitor            # Monitoreo avanzado
./quality-master.sh cache              # Gestión de cache
./quality-master.sh benchmark          # Benchmark completo
./quality-master.sh maintenance        # Mantenimiento
./quality-master.sh status             # Estado del sistema
```

## 🎯 Comandos Específicos Automáticos

### Cache Inteligente
```bash
# Ver información del cache
./quality-cache.sh info

# Limpiar todo el cache
./quality-cache.sh clean

# Invalidar cache específico
./quality-cache.sh invalidate backend_deps

# Ver estadísticas de performance
./quality-cache.sh stats

# Optimizar cache existente
./quality-cache.sh optimize
```

### Monitoreo Automático
```bash
# Monitoreo continuo en tiempo real
./quality-monitor.sh monitor

# Ejecutar quality check con monitoreo
./quality-monitor.sh execute

# Mostrar dashboard una vez
./quality-monitor.sh dashboard

# Ver estadísticas de performance
./quality-monitor.sh stats
```

### Optimización Automática
```bash
# Optimización automática basada en métricas
./quality-optimizer.sh auto

# Optimización manual por tipo
./quality-optimizer.sh manual speed      # Velocidad máxima
./quality-optimizer.sh manual memory     # Memoria mínima
./quality-optimizer.sh manual balanced   # Balanceado
./quality-optimizer.sh manual aggressive # Agresivo

# Ver estado de optimización
./quality-optimizer.sh status

# Resetear configuración
./quality-optimizer.sh reset
```

### Benchmark Automático
```bash
# Benchmark completo
./quality-benchmark.sh

# Ver resultados
cat quality-benchmark-results.json | jq '.'

# Ver reporte generado
cat quality-benchmark-report.md
```

## 🚀 Flujos de Trabajo Automáticos

### Flujo 1: Desarrollo Diario (Ultra-Rápido)
```bash
# Solo ejecutar quality check
./qc

# O con el script completo
./quality-auto.sh
```

### Flujo 2: Optimización Completa
```bash
# Optimización automática completa
./qc optimize

# O paso a paso
./quality-optimizer.sh auto
./quality-cache.sh optimize
./quality-benchmark.sh
```

### Flujo 3: Monitoreo y Análisis
```bash
# Ver estado completo
./qc status

# Monitoreo automático
./qc monitor

# O comandos específicos
./quality-monitor.sh dashboard
./quality-monitor.sh stats
```

### Flujo 4: Mantenimiento Automático
```bash
# Mantenimiento completo
./qc maintenance

# O comandos específicos
./quality-cache.sh clean
./quality-optimizer.sh reset
```

## 📊 Métricas de Performance

### Comandos de Métricas
```bash
# Ver métricas rápidas
./qc status

# Ver estadísticas detalladas
./quality-monitor.sh stats

# Ver estado de optimización
./quality-optimizer.sh status

# Ver información de cache
./quality-cache.sh info
```

### Logs y Reportes
```bash
# Ver logs de ejecución
cat quality-execution.log

# Ver logs de optimización
cat quality-optimization.log

# Ver reporte de benchmark
cat quality-benchmark-report.md

# Ver historial de ejecuciones
cat quality-history.json | jq '.'
```

## 🎯 Casos de Uso Comunes

### 1. **Desarrollo Iterativo** ⚡
```bash
# Ejecución ultra-rápida con cache
./qc
```

### 2. **CI/CD Pipeline** 🚀
```bash
# Pipeline con cache persistente
./quality-check.sh --no-cache  # Primera vez
./qc                          # Siguientes builds (5x más rápido)
```

### 3. **Debugging Específico** 🔍
```bash
# Solo verificar dependencias
./quality-cache.sh invalidate backend_deps
./qc

# Solo verificar linting
./quality-cache.sh invalidate backend_lint frontend_lint
./qc
```

### 4. **Monitoreo Continuo** 📊
```bash
# Monitoreo en tiempo real
./quality-monitor.sh monitor

# Ejecutar con métricas detalladas
./quality-monitor.sh execute
```

### 5. **Optimización Automática** 🤖
```bash
# Optimización basada en métricas
./qc optimize

# Optimización manual para velocidad
./quality-optimizer.sh manual speed
```

## 🔧 Configuración Automática

### Variables de Entorno
```bash
# Número de jobs paralelos (por defecto: nproc)
export PARALLEL_JOBS=8

# Directorio de cache (por defecto: .quality-cache)
export CACHE_DIR=".my-cache"

# Timeout de operaciones (por defecto: 15s)
export TIMEOUT=30
```

### Configuración de Optimización
```json
{
  "parallel_jobs": 4,
  "cache_enabled": true,
  "timeout": 15,
  "max_retries": 2,
  "optimization_level": "balanced",
  "auto_cleanup": true,
  "compression_enabled": true,
  "monitoring_enabled": true
}
```

## 🎉 Ventajas de los Comandos Automáticos

### ✅ **Sin Interacción del Usuario**
- No requiere presionar Enter
- No requiere seleccionar opciones
- Ejecución directa en consola del chat

### ⚡ **Ultra-Rápidos**
- Ejecución en 20-25 segundos
- Cache inteligente automático
- Paralelización masiva

### 🤖 **Auto-Optimizados**
- Análisis automático de performance
- Optimización basada en métricas
- Configuración dinámica

### 📊 **Métricas Automáticas**
- Dashboard en tiempo real
- Estadísticas automáticas
- Reportes generados automáticamente

## 🚀 Comandos Recomendados

### Para Uso Diario
```bash
./qc                    # Ejecución ultra-rápida
./qc status            # Ver estado del sistema
./qc optimize          # Optimización automática
```

### Para CI/CD
```bash
./quality-check.sh     # Ejecución básica
./quality-check.sh --no-cache  # Sin cache
```

### Para Debugging
```bash
./qc status            # Ver estado completo
./quality-cache.sh invalidate backend_deps  # Invalidar específico
./qc                   # Re-ejecutar
```

### Para Monitoreo
```bash
./quality-monitor.sh dashboard  # Dashboard una vez
./quality-monitor.sh stats      # Estadísticas
```

¡Todos los comandos son **completamente automáticos** y **ultra-rápidos**! 🚀 