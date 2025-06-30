#!/bin/bash

# 🎯 Script de Reconstrucción Automática del Frontend
# Uso: ./rebuild-frontend.sh

echo "🔄 Reconstruyendo frontend con nuevas dependencias..."

# 1. Detener el contenedor frontend
echo "⏹️  Deteniendo contenedor frontend..."
docker-compose stop frontend

# 2. Eliminar el contenedor anterior (preserva volúmenes)
echo "🗑️  Eliminando contenedor anterior..."
docker-compose rm -f frontend

# 3. Reconstruir la imagen sin caché (forzar reinstalación de dependencias)
echo "🔨 Reconstruyendo imagen..."
docker-compose build --no-cache frontend

# 4. Iniciar el contenedor actualizado
echo "🚀 Iniciando contenedor actualizado..."
docker-compose up -d frontend

# 5. Mostrar logs para confirmar que todo funciona
echo "📋 Mostrando logs del frontend..."
docker-compose logs -f frontend

echo "✅ ¡Proceso completado! El frontend debería estar corriendo con todas las dependencias actualizadas." 