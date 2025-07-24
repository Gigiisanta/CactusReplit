#!/bin/bash

# CactusDashboard Replit Setup Verification Script

echo "🔍 Verificando configuración de Replit Agent para CactusDashboard..."
echo "================================================================"

# Check if required files exist
echo "📁 Verificando archivos requeridos..."

required_files=(
    "replit.md"
    ".replit"
    "cactus-wealth-backend/main.py"
    "cactus-wealth-backend/requirements.txt"
    "cactus-wealth-frontend/package.json"
    "cactus-wealth-frontend/next.config.js"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file - OK"
    else
        echo "❌ $file - FALTANTE"
        exit 1
    fi
done

# Check Python backend structure
echo ""
echo "🐍 Verificando estructura del backend Python..."

python_files=(
    "cactus-wealth-backend/src/cactus_wealth/__init__.py"
    "cactus-wealth-backend/src/cactus_wealth/core/__init__.py"
    "cactus-wealth-backend/src/cactus_wealth/core/config.py"
    "cactus-wealth-backend/src/cactus_wealth/api/__init__.py"
    "cactus-wealth-backend/src/cactus_wealth/api/v1/__init__.py"
    "cactus-wealth-backend/src/cactus_wealth/api/v1/api.py"
    "cactus-wealth-backend/src/cactus_wealth/api/v1/endpoints/__init__.py"
    "cactus-wealth-backend/src/cactus_wealth/api/v1/endpoints/health.py"
    "cactus-wealth-backend/src/cactus_wealth/database.py"
)

for file in "${python_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file - OK"
    else
        echo "❌ $file - FALTANTE"
        exit 1
    fi
done

# Check Node.js frontend structure
echo ""
echo "🟢 Verificando estructura del frontend Node.js..."

if [ -f "cactus-wealth-frontend/package.json" ]; then
    echo "✅ package.json - OK"
    # Check if it has required scripts
    if grep -q '"dev"' "cactus-wealth-frontend/package.json"; then
        echo "✅ Script 'dev' encontrado"
    else
        echo "❌ Script 'dev' faltante en package.json"
        exit 1
    fi
else
    echo "❌ package.json - FALTANTE"
    exit 1
fi

# Check .replit configuration
echo ""
echo "⚙️ Verificando configuración .replit..."

if grep -q "Start Full Stack" ".replit"; then
    echo "✅ Workflow 'Start Full Stack' configurado"
else
    echo "❌ Workflow 'Start Full Stack' faltante"
    exit 1
fi

if grep -q "nodejs-20" ".replit"; then
    echo "✅ Módulo Node.js 20 configurado"
else
    echo "❌ Módulo Node.js 20 faltante"
    exit 1
fi

if grep -q "python-3.12" ".replit"; then
    echo "✅ Módulo Python 3.12 configurado"
else
    echo "❌ Módulo Python 3.12 faltante"
    exit 1
fi

# Check ports configuration
if grep -q "localPort = 3000" ".replit"; then
    echo "✅ Puerto 3000 configurado para frontend"
else
    echo "❌ Puerto 3000 faltante"
    exit 1
fi

if grep -q "localPort = 8000" ".replit"; then
    echo "✅ Puerto 8000 configurado para backend"
else
    echo "❌ Puerto 8000 faltante"
    exit 1
fi

# Check replit.md content
echo ""
echo "📖 Verificando contenido de replit.md..."

if grep -q "CactusDashboard" "replit.md"; then
    echo "✅ Descripción del proyecto encontrada"
else
    echo "❌ Descripción del proyecto faltante"
    exit 1
fi

if grep -q "TypeScript/JavaScript" "replit.md"; then
    echo "✅ Lenguaje principal especificado"
else
    echo "❌ Lenguaje principal faltante"
    exit 1
fi

if grep -q "Python" "replit.md"; then
    echo "✅ Lenguaje secundario especificado"
else
    echo "❌ Lenguaje secundario faltante"
    exit 1
fi

echo ""
echo "🎉 ¡Verificación completada exitosamente!"
echo "================================================================"
echo ""
echo "📋 Próximos pasos:"
echo "1. Sube tu repositorio a GitHub"
echo "2. Ve a replit.com/import"
echo "3. Selecciona 'GitHub' → 'Agent App'"
echo "4. Pega la URL de tu repositorio"
echo "5. El Agent debería reconocer el proyecto como compatible"
echo ""
echo "🔧 Si el Agent aún no aparece:"
echo "- Verifica que estés usando la pestaña 'Agent App' en el importador"
echo "- Asegúrate de que el repositorio sea público o tengas permisos"
echo "- Revisa que no haya errores en la validación automática"
echo ""
echo "🚀 Una vez importado, podrás usar comandos como:"
echo "- 'Configura la base de datos y ejecuta las migraciones'"
echo "- 'Añade un nuevo endpoint para autenticación'"
echo "- 'Crea un nuevo componente React para el dashboard'"
echo "- 'Optimiza el proceso de build para producción'" 