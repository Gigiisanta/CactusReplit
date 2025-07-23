# 🔄 Migration Guide - Consolidated Optimizer

## Resumen de Migración

Se ha migrado desde scripts optimizados individuales a un **Consolidated Optimizer** que combina todas las funcionalidades en una sola herramienta.

## Cambios Principales

### Antes (Scripts Individuales)
```bash
./scripts/quality/quality-check-optimized.sh
./scripts/dev/start-optimized.sh start
./scripts/ultra-master-optimized.sh analysis
./scripts/performance/script-optimizer.sh stats
```

### Después (Consolidated Optimizer)
```bash
./scripts/optimized/consolidated-optimizer.sh quality
./scripts/optimized/consolidated-optimizer.sh start
./scripts/optimized/consolidated-optimizer.sh analysis
./scripts/optimized/consolidated-optimizer.sh stats
```

## Aliases Disponibles

Para mantener compatibilidad, se han creado aliases:

```bash
./scripts/aliases/qc.sh          # Quality check
./scripts/aliases/start.sh       # Start services
./scripts/aliases/analysis.sh    # Analysis
./scripts/aliases/monitor.sh     # Monitoring
./scripts/aliases/dashboard.sh   # Dashboard
```

## Comandos Consolidados

| Función | Comando Consolidado |
|---------|-------------------|
| Quality Check | `consolidated-optimizer.sh quality` |
| Start Services | `consolidated-optimizer.sh start` |
| Analysis | `consolidated-optimizer.sh analysis` |
| Monitoring | `consolidated-optimizer.sh monitor` |
| Dashboard | `consolidated-optimizer.sh dashboard` |
| Stop Monitoring | `consolidated-optimizer.sh stop` |
| Clean Cache | `consolidated-optimizer.sh clean` |
| Statistics | `consolidated-optimizer.sh stats` |
| All Operations | `consolidated-optimizer.sh all` |

## Beneficios de la Consolidación

1. **Un solo punto de entrada** para todas las operaciones
2. **Cache unificado** para mejor rendimiento
3. **Menos archivos** para mantener
4. **Consistencia** en logging y configuración
5. **Mejor organización** del código

## Rollback

Si necesitas volver a los scripts individuales:

```bash
# Restaurar desde backup
cp .migration-backup/quality-check-optimized.sh scripts/quality/
cp .migration-backup/start-optimized.sh scripts/dev/
cp .migration-backup/ultra-master-optimized.sh scripts/
cp .migration-backup/script-optimizer.sh scripts/performance/
```

## Cache Consolidado

El nuevo sistema usa un cache consolidado:
- **Ubicación**: `.consolidated-cache/`
- **Logs**: `logs/consolidated-optimizer.log`

---

*Migración completada el Sun Jul 20 21:49:35 -03 2025*
