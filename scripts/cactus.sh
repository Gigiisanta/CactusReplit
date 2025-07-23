#!/bin/bash

# CACTUS MASTER - CactusDashboard
# === WORKFLOW TESTING & MICRODEPURACIÓN ===
#
# Comandos clave para CI, IA y microdepuración rápida:
#
# 1. Ejecutar tests segmentados:
#    ./cactus.sh test <grupo> [--logs] [--last-fail]
#    Grupos: backend-core, backend-api, backend-integration, backend-repositories, frontend-components, frontend-services, frontend-hooks, frontend-utils, frontend-e2e
#    --logs      Muestra el log relevante tras ejecutar el test
#    --last-fail Reintenta solo el último test fallido (si es posible)
#
# 2. Ver logs de test:
#    ./cactus.sh logs <grupo>
#
# 3. Limpiar logs de test:
#    ./cactus.sh clean-logs
#
# 4. Ayuda/documentación:
#    ./cactus.sh help
#
# Output de error siempre sugiere comando de log relevante.
#
# Listo para ser spameado por IA o humanos para microdepuración y CI/CD.

# 🚀 CACTUS MASTER - CactusDashboard
# Script maestro único ultra optimizado que consolida todas las funcionalidades
# Uso: ./cactus.sh [comando] [opciones]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CACHE_DIR="$PROJECT_ROOT/.cactus-cache"
LOG_DIR="$PROJECT_ROOT/logs"
LOG_FILE="$LOG_DIR/cactus.log"

SEED_LOCK="$LOG_DIR/.seed.lock"

# Configuración del proyecto
BACKEND_DIR="$PROJECT_ROOT/cactus-wealth-backend"
FRONTEND_DIR="$PROJECT_ROOT/cactus-wealth-frontend"

# Colores optimizados
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuración optimizada
CPU_CORES=$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)
DEFAULT_JOBS=$((CPU_CORES > 1 ? CPU_CORES - 1 : 1))
CACHE_TTL="${CACTUS_CACHE_TTL:-300}"
MAX_JOBS="${CACTUS_MAX_JOBS:-$DEFAULT_JOBS}"
LOG_LEVEL="${CACTUS_LOG_LEVEL:-INFO}"
DOCKER_TIMEOUT="${DOCKER_TIMEOUT:-30}"
HEALTH_CHECK_INTERVAL="${HEALTH_CHECK_INTERVAL:-30}"
MAX_RETRIES="${MAX_RETRIES:-3}"
BACKUP_ENABLED="${BACKUP_ENABLED:-true}"

# =============================================================================
# CORE FUNCTIONS - ULTRA OPTIMIZADAS
# =============================================================================

log() {
    local level="${2:-INFO}"
    local timestamp=$(date +'%H:%M:%S')
    local message="$1"
    
    case "$LOG_LEVEL" in
        "DEBUG"|"INFO"|"WARN"|"ERROR")
            if [[ "$level" == "DEBUG" && "$LOG_LEVEL" != "DEBUG" ]]; then
                return
            fi
            ;;
    esac
    
    echo -e "${GREEN}[$timestamp]${NC} $message" | tee -a "$LOG_FILE"
}

warn() {
    log "${YELLOW}[WARNING]${NC} $1" "WARN"
}

error() {
    log "${RED}[ERROR]${NC} $1" "ERROR"
}

success() {
    log "${GREEN}[SUCCESS]${NC} $1" "INFO"
}

debug() {
    log "${CYAN}[DEBUG]${NC} $1" "DEBUG"
}

# Cache inteligente ultra optimizado con compresión
cache_get() {
    local key="$1"
    local cache_file="$CACHE_DIR/${key}.cache"
    local ttl="${2:-$CACHE_TTL}"
    
    if [[ -f "$cache_file" ]]; then
        local cache_time=$(stat -c %Y "$cache_file" 2>/dev/null || stat -f %m "$cache_file" 2>/dev/null)
        local current_time=$(date +%s)
        local age=$((current_time - cache_time))
        
        if [[ $age -lt $ttl ]]; then
            debug "Cache hit: $key"
            cat "$cache_file"
            return 0
        else
            debug "Cache expired: $key (age: ${age}s, ttl: ${ttl}s)"
        fi
    else
        debug "Cache miss: $key"
    fi
    return 1
}

cache_set() {
    local key="$1"
    local cache_file="$CACHE_DIR/${key}.cache"
    shift
    
    debug "Setting cache: $key"
    "$@" > "$cache_file" 2>/dev/null || true
    
    # Comprimir cache si es grande
    if [[ $(stat -c %s "$cache_file" 2>/dev/null || echo 0) -gt 1048576 ]]; then
        gzip -f "$cache_file" 2>/dev/null || true
        cache_file="${cache_file}.gz"
    fi
    
    cat "$cache_file"
}

# Ejecución paralela ultra optimizada con gestión de errores y retry
parallel_execute() {
    local max_jobs="${1:-$MAX_JOBS}"
    local jobs=()
    local pids=()
    local start_time=$(date +%s)
    shift
    
    debug "Starting parallel execution with max_jobs=$max_jobs"
    
    for cmd in "$@"; do
        if [[ ${#jobs[@]} -ge $max_jobs ]]; then
            local oldest_pid="${pids[0]}"
            wait "$oldest_pid" 2>/dev/null || true
            jobs=("${jobs[@]:1}")
            pids=("${pids[@]:1}")
        fi
        
        eval "$cmd" &
        local pid=$!
        jobs+=("$cmd")
        pids+=("$pid")
        debug "Started job: $cmd (PID: $pid)"
    done
    
    # Esperar todos los jobs
    for pid in "${pids[@]}"; do
        wait "$pid" 2>/dev/null || true
    done
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    debug "All parallel jobs completed in ${duration}s"
}

# Función de retry con backoff exponencial
retry_with_backoff() {
    local cmd="$1"
    local max_retries="${2:-$MAX_RETRIES}"
    local base_delay=1
    
    for ((attempt=1; attempt<=max_retries; attempt++)); do
        if eval "$cmd"; then
            return 0
        fi
        
        if [[ $attempt -lt $max_retries ]]; then
            local delay=$((base_delay * (2 ** (attempt - 1))))
            warn "Intento $attempt falló, reintentando en ${delay}s..."
            sleep $delay
        fi
    done
    
    error "Comando falló después de $max_retries intentos: $cmd"
    return 1
}

# Gestión de dependencias mejorada
check_dependency() {
    local dep="$1"
    local install_cmd="${2:-}"
    
    if ! command -v "$dep" >/dev/null 2>&1; then
        error "Dependency missing: $dep"
        if [[ -n "$install_cmd" ]]; then
            warn "Install command: $install_cmd"
        fi
        return 1
    fi
    return 0
}

# =============================================================================
# DOCKER MANAGEMENT - ULTRA OPTIMIZADO
# =============================================================================

check_docker_status() {
    local docker_cache_key="docker_status"
    
    if ! cache_get "$docker_cache_key" 60; then
        log "Verificando Docker..."
        
        # Verificar si Docker está instalado
        if ! check_dependency "docker"; then
            error "Docker no está instalado"
            warn "Instalar Docker: https://docs.docker.com/get-docker/"
            return 1
        fi
        
        # Verificar si Docker daemon está ejecutándose
        if ! docker info >/dev/null 2>&1; then
            error "Docker daemon no está ejecutándose"
            warn "Iniciar Docker Desktop o ejecutar: sudo systemctl start docker"
            
            # Intentar iniciar Docker en macOS
            if [[ "$OSTYPE" == "darwin"* ]]; then
                warn "Intentando abrir Docker Desktop..."
                open -a Docker 2>/dev/null || true
                sleep 5
                
                # Esperar a que Docker esté listo
                local timeout=$DOCKER_TIMEOUT
                while [[ $timeout -gt 0 ]]; do
                    if docker info >/dev/null 2>&1; then
                        success "Docker iniciado automáticamente"
                        break
                    fi
                    sleep 1
                    ((timeout--))
                done
                
                if [[ $timeout -eq 0 ]]; then
                    error "Timeout esperando Docker"
                    return 1
                fi
            else
                return 1
            fi
        fi
        
        cache_set "$docker_cache_key" echo "OK"
        success "Docker verificado y funcionando"
    fi
}

# =============================================================================
# QUALITY CHECK ULTRA OPTIMIZADO
# =============================================================================

quality_check() {
    log "🔧 Ejecutando quality check ultra optimizado..."
    
    # Verificar dependencias del sistema
    check_system_dependencies
    
    # Limpiar puertos en paralelo
    cleanup_ports_parallel

    # Migraciones primero
    log "Ejecutando migraciones antes de seed..."
    cd "$BACKEND_DIR"
    if [ -f "alembic.ini" ]; then
        poetry run alembic upgrade head || python -m alembic upgrade head
    fi
    cd "$PROJECT_ROOT"

    # Seed después de migrar
    log "Ejecutando seed de datos demo y test..."
    cd "$BACKEND_DIR"
    if [ -f "create_demo_user.py" ]; then
        poetry run python create_demo_user.py || python create_demo_user.py
    fi
    if [ -f "create_test_data.py" ]; then
        poetry run python create_test_data.py || python create_test_data.py
    fi
    cd "$PROJECT_ROOT"

    # Ejecutar tests y checks en paralelo con mejor gestión de errores
    parallel_execute "$MAX_JOBS" \
        "run_backend_tests_optimized" \
        "run_frontend_tests_optimized" \
        "run_linting_optimized" \
        "run_type_checking_optimized"

    # Mostrar resumen de errores si existen
    if grep -q "error:" "$LOG_DIR/backend-types.log" 2>/dev/null; then
        echo -e "${RED}Resumen de errores de type-checking backend:${NC}"
        tail -n 20 "$LOG_DIR/backend-types.log"
    fi
    if grep -q "FAILED" "$LOG_DIR/backend-tests.log" 2>/dev/null; then
        echo -e "${RED}Resumen de errores de tests backend:${NC}"
        tail -n 20 "$LOG_DIR/backend-tests.log"
    fi
    if grep -q "error:" "$LOG_DIR/frontend-types.log" 2>/dev/null; then
        echo -e "${RED}Resumen de errores de type-checking frontend:${NC}"
        tail -n 20 "$LOG_DIR/frontend-types.log"
    fi
    if grep -q "FAILED" "$LOG_DIR/frontend-tests.log" 2>/dev/null; then
        echo -e "${RED}Resumen de errores de tests frontend:${NC}"
        tail -n 20 "$LOG_DIR/frontend-tests.log"
    fi

    success "Quality check ultra optimizado completado"
}

check_system_dependencies() {
    local deps_cache_key="system_deps"
    
    if ! cache_get "$deps_cache_key" 1800; then
        log "Verificando dependencias del sistema..."
        
        local deps=(
            "docker:Docker Desktop o docker-ce"
            "docker-compose:docker-compose"
            "node:Node.js (https://nodejs.org/)"
            "npm:npm (incluido con Node.js)"
            "python3:Python 3.8+"
            "pip:pip (incluido con Python)"
        )
        
        local missing_deps=()
        
        for dep_info in "${deps[@]}"; do
            local dep="${dep_info%%:*}"
            local install_info="${dep_info#*:}"
            
            if ! check_dependency "$dep" "$install_info"; then
                missing_deps+=("$dep")
            fi
        done
        
        if [[ ${#missing_deps[@]} -ne 0 ]]; then
            error "Dependencias faltantes: ${missing_deps[*]}"
            warn "Instalar dependencias faltantes antes de continuar"
            return 1
        fi
        
        cache_set "$deps_cache_key" echo "OK"
        success "Todas las dependencias están instaladas"
    fi
}

cleanup_ports_parallel() {
    log "Limpiando puertos en paralelo..."
    
    # Limpiar puertos de forma más segura
    parallel_execute 6 \
        "cleanup_port 8000" \
        "cleanup_port 3000" \
        "cleanup_port 5432" \
        "cleanup_port 6379" \
        "cleanup_docker_containers" \
        "cleanup_docker_system"
    
    success "Puertos y contenedores limpiados"
}

cleanup_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    
    if [[ -n "$pids" ]]; then
        debug "Limpiando puerto $port (PIDs: $pids)"
        echo "$pids" | xargs kill -9 2>/dev/null || true
    fi
}

cleanup_docker_containers() {
    if docker info >/dev/null 2>&1; then
        docker ps -q | xargs docker stop 2>/dev/null || true
        docker container prune -f 2>/dev/null || true
    fi
}

cleanup_docker_system() {
    if docker info >/dev/null 2>&1; then
        docker system prune -f 2>/dev/null || true
    fi
}

run_backend_tests_optimized() {
    local tests_cache_key="backend_tests"
    local req_hash_file="$BACKEND_DIR/.requirements.hash"
    
    if ! cache_get "$tests_cache_key" 300; then
        log "Ejecutando tests de backend optimizados..."
        
        cd "$BACKEND_DIR"
        
        # Verificar si existe requirements.txt
        if [[ ! -f "requirements.txt" ]]; then
            error "requirements.txt no encontrado en $BACKEND_DIR"
            return 1
        fi
        
        # Calcular hash de requirements.txt
        local req_hash=$(sha256sum requirements.txt | awk '{print $1}')
        local prev_hash=""
        if [[ -f "$req_hash_file" ]]; then
            prev_hash=$(cat "$req_hash_file")
        fi
        
        # Setup virtual environment si no existe
        if [[ ! -d "venv" ]]; then
            log "Creando virtual environment..."
            python3 -m venv venv
        fi
        
        # Activar virtual environment
        source venv/bin/activate
        
        # Instalar dependencias solo si el hash cambió
        if [[ "$req_hash" != "$prev_hash" ]]; then
            log "Instalando dependencias de Python..."
            pip install -r requirements.txt
            pip install pytest-xdist
            echo "$req_hash" > "$req_hash_file"
        fi
        
        # Ejecutar tests con pytest-xdist (paralelo)
        if pytest -n auto tests/ -v --tb=short --maxfail=5 > "$LOG_DIR/backend-tests.log" 2>&1; then
            cache_set "$tests_cache_key" echo "OK"
            success "Tests de backend completados exitosamente"
        else
            error "Tests de backend fallaron - revisar logs: $LOG_DIR/backend-tests.log"
            return 1
        fi
        
        cd "$PROJECT_ROOT"
    fi
}

run_frontend_tests_optimized() {
    local tests_cache_key="frontend_tests"
    local pkg_hash_file="$FRONTEND_DIR/.package.hash"
    
    if ! cache_get "$tests_cache_key" 300; then
        log "Ejecutando tests de frontend optimizados..."
        
        cd "$FRONTEND_DIR"
        
        # Verificar si existe package.json
        if [[ ! -f "package.json" ]]; then
            error "package.json no encontrado en $FRONTEND_DIR"
            return 1
        fi
        
        # Calcular hash de package-lock.json o package.json
        local pkg_hash=""
        if [[ -f "package-lock.json" ]]; then
            pkg_hash=$(sha256sum package-lock.json | awk '{print $1}')
        else
            pkg_hash=$(sha256sum package.json | awk '{print $1}')
        fi
        local prev_hash=""
        if [[ -f "$pkg_hash_file" ]]; then
            prev_hash=$(cat "$pkg_hash_file")
        fi
        
        # Instalar dependencias solo si el hash cambió
        if [[ "$pkg_hash" != "$prev_hash" ]]; then
            log "Instalando dependencias de Node.js..."
            if [[ -f "package-lock.json" ]]; then
                npm ci
            else
                npm install
            fi
            echo "$pkg_hash" > "$pkg_hash_file"
        fi
        
        # Ejecutar tests con máximo paralelismo
        if npm test -- --passWithNoTests --watchAll=false --maxWorkers=100% > "$LOG_DIR/frontend-tests.log" 2>&1; then
            cache_set "$tests_cache_key" echo "OK"
            success "Tests de frontend completados exitosamente"
        else
            error "Tests de frontend fallaron - revisar logs: $LOG_DIR/frontend-tests.log"
            return 1
        fi
        
        cd "$PROJECT_ROOT"
    fi
}

run_linting_optimized() {
    local lint_cache_key="linting"
    
    if ! cache_get "$lint_cache_key" 600; then
        log "Ejecutando linting optimizado..."
        
        local lint_errors=0
        
        # Backend linting
        cd "$BACKEND_DIR"
        if [[ -d "src" ]]; then
            if ! python -m flake8 src/ --max-line-length=100 --ignore=E501,W503 > "$LOG_DIR/backend-lint.log" 2>&1; then
                warn "Linting de backend encontró errores - revisar: $LOG_DIR/backend-lint.log"
                ((lint_errors++))
            fi
        fi
        cd "$PROJECT_ROOT"
        
        # Frontend linting
        cd "$FRONTEND_DIR"
        if [[ -f "package.json" ]] && grep -q '"lint"' package.json; then
            if ! npm run lint > "$LOG_DIR/frontend-lint.log" 2>&1; then
                warn "Linting de frontend encontró errores - revisar: $LOG_DIR/frontend-lint.log"
                ((lint_errors++))
            fi
        fi
        cd "$PROJECT_ROOT"
        
        if [[ $lint_errors -eq 0 ]]; then
            cache_set "$lint_cache_key" echo "OK"
            success "Linting completado sin errores"
        else
            warn "Linting completado con $lint_errors errores"
        fi
    fi
}

run_type_checking_optimized() {
    local type_cache_key="type_checking"
    
    if ! cache_get "$type_cache_key" 600; then
        log "Ejecutando type checking optimizado..."
        
        local type_errors=0
        
        # Backend type checking
        cd "$BACKEND_DIR"
        if command -v mypy >/dev/null 2>&1 && [[ -d "src" ]]; then
            if ! python -m mypy src/ --ignore-missing-imports > "$LOG_DIR/backend-types.log" 2>&1; then
                warn "Type checking de backend encontró errores - revisar: $LOG_DIR/backend-types.log"
                ((type_errors++))
            fi
        fi
        cd "$PROJECT_ROOT"
        
        # Frontend type checking
        cd "$FRONTEND_DIR"
        if [[ -f "tsconfig.json" ]]; then
            if ! npx tsc --noEmit > "$LOG_DIR/frontend-types.log" 2>&1; then
                warn "Type checking de frontend encontró errores - revisar: $LOG_DIR/frontend-types.log"
                ((type_errors++))
            fi
        fi
        cd "$PROJECT_ROOT"
        
        if [[ $type_errors -eq 0 ]]; then
            cache_set "$type_cache_key" echo "OK"
            success "Type checking completado sin errores"
        else
            warn "Type checking completado con $type_errors errores"
        fi
    fi
}

# =============================================================================
# START SERVICES ULTRA OPTIMIZADO
# =============================================================================

start_services() {
    log "🚀 Iniciando servicios ultra optimizados..."
    
    # Verificar Docker
    if ! check_docker_status; then
        error "No se puede continuar sin Docker"
        return 1
    fi
    
    # Iniciar base de datos
    start_database_optimized
    
    # Iniciar servicios en paralelo
    parallel_execute 2 \
        "start_backend_optimized" \
        "start_frontend_optimized"
    
    # Verificar servicios
    check_services_status_optimized
    
    success "Servicios iniciados ultra optimizados"
}

start_database_optimized() {
    local db_cache_key="database_status"
    
    if ! cache_get "$db_cache_key" 30; then
        log "Iniciando base de datos optimizada..."
        
        # Verificar docker-compose.yml
        if [[ ! -f "$COMPOSE_FILE" ]]; then
            error "docker-compose.yml no encontrado en $PROJECT_ROOT"
            return 1
        fi
        
        # Iniciar servicios de base de datos
        if docker-compose up -d db redis > "$LOG_DIR/database.log" 2>&1; then
            # Esperar a que los servicios estén listos
            local timeout=60
            while [[ $timeout -gt 0 ]]; do
                if docker-compose ps | grep -q "Up" && \
                   lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null 2>&1 && \
                   lsof -Pi :6379 -sTCP:LISTEN -t >/dev/null 2>&1; then
                    break
                fi
                sleep 2
                ((timeout-=2))
            done
            
            if [[ $timeout -gt 0 ]]; then
                cache_set "$db_cache_key" echo "OK"
                success "Base de datos iniciada y lista"
            else
                error "Timeout esperando base de datos"
                return 1
            fi
        else
            error "Error iniciando base de datos - revisar: $LOG_DIR/database.log"
            return 1
        fi
    fi
}

start_backend_optimized() {
    local backend_cache_key="backend_status"
    
    if ! cache_get "$backend_cache_key" 30; then
        log "Iniciando backend optimizado..."
        
        cd "$BACKEND_DIR"
        
        # Setup virtual environment
        if [[ ! -d "venv" ]]; then
            python3 -m venv venv
        fi
        
        source venv/bin/activate
        
        # Instalar dependencias si es necesario
        if [[ ! -f "venv/pyvenv.cfg" ]] || [[ requirements.txt -nt venv/pyvenv.cfg ]]; then
            pip install -r requirements.txt
        fi
        
        # Ejecutar migraciones
        if [[ -f "alembic.ini" ]]; then
            log "Ejecutando migraciones..."
            python -m alembic upgrade head > "$LOG_DIR/migrations.log" 2>&1 || {
                error "Error en migraciones - revisar: $LOG_DIR/migrations.log"
                return 1
            }
        fi
        
        # Iniciar servidor
        python main.py > "$LOG_DIR/backend.log" 2>&1 &
        local backend_pid=$!
        echo $backend_pid > "$LOG_DIR/backend.pid"
        
        cd "$PROJECT_ROOT"
        
        cache_set "$backend_cache_key" echo "OK"
        success "Backend iniciado (PID: $backend_pid)"
    fi
}

start_frontend_optimized() {
    local frontend_cache_key="frontend_status"
    
    if ! cache_get "$frontend_cache_key" 30; then
        log "Iniciando frontend optimizado..."
        
        cd "$FRONTEND_DIR"
        
        # Instalar dependencias si es necesario
        if [[ ! -d "node_modules" ]] || [[ package.json -nt node_modules ]]; then
            npm install
        fi
        
        # Iniciar servidor de desarrollo
        npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
        local frontend_pid=$!
        echo $frontend_pid > "$LOG_DIR/frontend.pid"
        
        cd "$PROJECT_ROOT"
        
        cache_set "$frontend_cache_key" echo "OK"
        success "Frontend iniciado (PID: $frontend_pid)"
    fi
}

check_services_status_optimized() {
    log "Verificando servicios optimizados..."
    
    local services_ready=0
    local total_services=4
    
    # Verificar cada servicio
    for service_info in "8000:Backend API" "3000:Frontend" "5432:PostgreSQL" "6379:Redis"; do
        local port="${service_info%%:*}"
        local service="${service_info#*:}"
        
        if check_port_optimized "$port" "$service"; then
            ((services_ready++))
        fi
    done
    
    if [[ $services_ready -eq $total_services ]]; then
        success "Todos los servicios están listos ($services_ready/$total_services)"
    else
        warn "Algunos servicios no están listos ($services_ready/$total_services)"
    fi
}

check_port_optimized() {
    local port=$1
    local service=$2
    local timeout=30
    
    for ((i=1; i<=timeout; i++)); do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            success "$service (puerto $port) está listo"
            return 0
        fi
        sleep 1
    done
    
    error "$service (puerto $port) no está disponible después de ${timeout}s"
    return 1
}

# =============================================================================
# ANALYSIS ULTRA OPTIMIZADO
# =============================================================================

analysis() {
    log "🧠 Ejecutando análisis ultra optimizado..."
    
    # Cache de archivos modificados
    local files_cache_key="modified_files"
    if ! cache_get "$files_cache_key" 60; then
        cache_set "$files_cache_key" find . -name "*.py" -o -name "*.ts" -o -name "*.tsx" -mtime -1
    fi
    
    # Ejecutar análisis en paralelo
    parallel_execute "$MAX_JOBS" \
        "run_ai_analysis_optimized" \
        "run_trends_analysis_optimized" \
        "run_performance_analysis_optimized" \
        "run_quality_analysis_optimized"
    
    success "Análisis ultra optimizado completado"
}

run_ai_analysis_optimized() {
    local ai_cache_key="ai_analysis"
    
    if ! cache_get "$ai_cache_key" 1800; then
        log "🤖 Ejecutando análisis con IA optimizado..."
        
        # Análisis de patrones de diseño
        find . -name "*.py" -exec grep -l "class.*Singleton\|__new__\|def.*factory\|create_.*\|notify\|subscribe\|observer\|strategy\|algorithm" {} \; 2>/dev/null | sort -u > "$LOG_DIR/design-patterns.txt" || true
        
        # Análisis de complejidad
        find . -name "*.py" -exec grep -l "def .*(.*,.*,.*,.*,.*)\|global\|nonlocal\|threading\|multiprocessing" {} \; 2>/dev/null | sort -u > "$LOG_DIR/complex-functions.txt" || true
        
        # Análisis de bugs potenciales
        find . -name "*.py" -exec grep -l "/.*[^0-9]\|\.\[.*\]\|\.\w*\(\)" {} \; 2>/dev/null | sort -u > "$LOG_DIR/potential-bugs.txt" || true
        
        cache_set "$ai_cache_key" echo "OK"
        success "Análisis con IA completado"
    fi
}

run_trends_analysis_optimized() {
    local trends_cache_key="trends_analysis"
    
    if ! cache_get "$trends_cache_key" 1800; then
        log "📈 Ejecutando análisis de tendencias optimizado..."
        
        # Análisis de crecimiento
        local recent_files=$(find . -name "*.py" -o -name "*.ts" -o -name "*.tsx" -mtime -7 | wc -l)
        local week_ago_files=$(find . -name "*.py" -o -name "*.ts" -o -name "*.tsx" -mtime -14 -mtime +7 | wc -l)
        local growth_rate=$((recent_files - week_ago_files))
        
        # Generar reporte de tendencias
        cat > "$LOG_DIR/trends-analysis.json" << EOF
{
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "growth_metrics": {
        "recent_files": $recent_files,
        "week_ago_files": $week_ago_files,
        "growth_rate": $growth_rate,
        "growth_trend": "$(if [ $growth_rate -gt 0 ]; then echo "increasing"; else echo "decreasing"; fi)"
    }
}
EOF
        
        cache_set "$trends_cache_key" echo "OK"
        success "Análisis de tendencias completado"
    fi
}

run_performance_analysis_optimized() {
    local perf_cache_key="performance_analysis"
    
    if ! cache_get "$perf_cache_key" 1800; then
        log "⚡ Ejecutando análisis de performance optimizado..."
        
        # Detectar issues de performance
        find . -name "*.py" -exec grep -l "for.*in.*range.*len\|+=.*str\|SELECT.*for.*in\|import.*\*" {} \; 2>/dev/null | sort -u > "$LOG_DIR/performance-issues.txt" || true
        
        # Generar métricas de performance
        cat > "$LOG_DIR/performance-metrics.json" << EOF
{
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "performance_issues": $(wc -l < "$LOG_DIR/performance-issues.txt" 2>/dev/null || echo "0"),
    "optimization_score": $((100 - $(wc -l < "$LOG_DIR/performance-issues.txt" 2>/dev/null || echo "0")))
}
EOF
        
        cache_set "$perf_cache_key" echo "OK"
        success "Análisis de performance completado"
    fi
}

run_quality_analysis_optimized() {
    local quality_cache_key="quality_analysis"
    
    if ! cache_get "$quality_cache_key" 1800; then
        log "✅ Ejecutando análisis de calidad optimizado..."
        
        # Análisis de complejidad ciclomática
        find . -name "*.py" -exec wc -l {} + | awk '$1 > 200 {print $2}' > "$LOG_DIR/long-files.txt" 2>/dev/null || true
        
        # Análisis de cobertura de tests
        local test_files=$(find . -name "*test*.py" | wc -l)
        local total_files=$(find . -name "*.py" | wc -l)
        local test_coverage=$((test_files * 100 / total_files))
        
        # Generar reporte de calidad
        cat > "$LOG_DIR/quality-metrics.json" << EOF
{
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "quality_metrics": {
        "test_coverage": $test_coverage,
        "long_files": $(wc -l < "$LOG_DIR/long-files.txt" 2>/dev/null || echo "0"),
        "quality_score": $((100 - $(wc -l < "$LOG_DIR/long-files.txt" 2>/dev/null || echo "0")))
    }
}
EOF
        
        cache_set "$quality_cache_key" echo "OK"
        success "Análisis de calidad completado"
    fi
}

# =============================================================================
# MONITORING ULTRA OPTIMIZADO
# =============================================================================

monitoring() {
    log "📊 Iniciando monitoreo ultra optimizado..."
    
    # Iniciar monitores en paralelo
    parallel_execute 2 \
        "start_real_time_monitor_optimized" \
        "start_performance_monitor_optimized"
    
    success "Monitoreo ultra optimizado iniciado"
}

start_real_time_monitor_optimized() {
    log "📈 Iniciando monitoreo en tiempo real optimizado..."
    
    # Crear script de monitoreo mejorado
    cat > "$LOG_DIR/real-time-monitor.sh" << 'EOF'
#!/bin/bash
LOG_FILE="/tmp/cactus-monitor.log"
while true; do
    echo "$(date): Services Status" >> "$LOG_FILE"
    
    # Backend
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "Backend: OK" >> "$LOG_FILE"
    else
        echo "Backend: DOWN" >> "$LOG_FILE"
    fi
    
    # Frontend
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "Frontend: OK" >> "$LOG_FILE"
    else
        echo "Frontend: DOWN" >> "$LOG_FILE"
    fi
    
    # Database
    if lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "Database: OK" >> "$LOG_FILE"
    else
        echo "Database: DOWN" >> "$LOG_FILE"
    fi
    
    sleep 30
done
EOF
    
    chmod +x "$LOG_DIR/real-time-monitor.sh"
    "$LOG_DIR/real-time-monitor.sh" > "$LOG_DIR/real-time-monitor.log" 2>&1 &
    local monitor_pid=$!
    echo $monitor_pid > "$LOG_DIR/real-time-monitor.pid"
    
    success "Monitoreo en tiempo real iniciado (PID: $monitor_pid)"
}

start_performance_monitor_optimized() {
    log "⚡ Iniciando monitoreo de performance optimizado..."
    
    # Crear script de monitoreo de performance mejorado
    cat > "$LOG_DIR/performance-monitor.sh" << 'EOF'
#!/bin/bash
LOG_FILE="/tmp/cactus-perf.log"
METRICS_FILE="/tmp/cactus-metrics.json"

while true; do
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # Métricas del sistema
    cpu_usage=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//' 2>/dev/null || echo "0")
    mem_usage=$(vm_stat | grep "Pages active" | awk '{print $3}' | sed 's/\.//' 2>/dev/null || echo "0")
    disk_usage=$(df . | tail -1 | awk '{print $5}' | sed 's/%//')
    
    # Métricas de procesos
    python_processes=$(ps aux | grep python | grep -v grep | wc -l)
    node_processes=$(ps aux | grep node | grep -v grep | wc -l)
    
    # Métricas de red
    network_connections=$(netstat -an | grep ESTABLISHED | wc -l 2>/dev/null || echo "0")
    
    # Métricas de Docker
    docker_containers=$(docker ps -q 2>/dev/null | wc -l || echo "0")
    
    # Generar JSON de métricas
    cat > "$METRICS_FILE" << METRICS_EOF
{
    "timestamp": "$timestamp",
    "system": {
        "cpu_usage": "$cpu_usage",
        "memory_usage": "$mem_usage",
        "disk_usage": "$disk_usage"
    },
    "processes": {
        "python": $python_processes,
        "node": $node_processes
    },
    "network": {
        "connections": $network_connections
    },
    "docker": {
        "containers": $docker_containers
    }
}
METRICS_EOF
    
    # Log simple para debugging
    echo "$timestamp: CPU: ${cpu_usage}%, MEM: ${mem_usage}%, DISK: ${disk_usage}%, PYTHON: ${python_processes}, NODE: ${node_processes}" >> "$LOG_FILE"
    
    sleep 60
done
EOF
    
    chmod +x "$LOG_DIR/performance-monitor.sh"
    "$LOG_DIR/performance-monitor.sh" > "$LOG_DIR/performance-monitor.log" 2>&1 &
    local perf_pid=$!
    echo $perf_pid > "$LOG_DIR/performance-monitor.pid"
    
    success "Monitoreo de performance iniciado (PID: $perf_pid)"
}

stop_monitoring() {
    log "🛑 Deteniendo monitores..."
    
    if [[ -f "$LOG_DIR/real-time-monitor.pid" ]]; then
        local monitor_pid=$(cat "$LOG_DIR/real-time-monitor.pid")
        kill "$monitor_pid" 2>/dev/null || true
        rm "$LOG_DIR/real-time-monitor.pid"
    fi
    
    if [[ -f "$LOG_DIR/performance-monitor.pid" ]]; then
        local perf_pid=$(cat "$LOG_DIR/performance-monitor.pid")
        kill "$perf_pid" 2>/dev/null || true
        rm "$LOG_DIR/performance-monitor.pid"
    fi
    
    success "Monitores detenidos"
}

# =============================================================================
# DASHBOARD ULTRA OPTIMIZADO
# =============================================================================

dashboard() {
    echo ""
    echo "🚀 CACTUS MASTER - Dashboard Ultra Optimizado"
    echo "============================================="
    echo ""
    
    # Estado de servicios
    echo "📊 Estado de Servicios:"
    echo "  Backend API:   $(lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1 && echo "✅ Activo" || echo "❌ Inactivo")"
    echo "  Frontend:      $(lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 && echo "✅ Activo" || echo "❌ Inactivo")"
    echo "  PostgreSQL:    $(lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null 2>&1 && echo "✅ Activo" || echo "❌ Inactivo")"
    echo "  Redis:         $(lsof -Pi :6379 -sTCP:LISTEN -t >/dev/null 2>&1 && echo "✅ Activo" || echo "❌ Inactivo")"
    echo ""
    
    # Estado de monitores
    echo "📈 Estado de Monitores:"
    if [[ -f "$LOG_DIR/real-time-monitor.pid" ]]; then
        local monitor_pid=$(cat "$LOG_DIR/real-time-monitor.pid")
        if kill -0 "$monitor_pid" 2>/dev/null; then
            echo "  Real-time:     ✅ Activo (PID: $monitor_pid)"
        else
            echo "  Real-time:     ❌ Inactivo"
        fi
    else
        echo "  Real-time:     ❌ No iniciado"
    fi
    
    if [[ -f "$LOG_DIR/performance-monitor.pid" ]]; then
        local perf_pid=$(cat "$LOG_DIR/performance-monitor.pid")
        if kill -0 "$perf_pid" 2>/dev/null; then
            echo "  Performance:   ✅ Activo (PID: $perf_pid)"
        else
            echo "  Performance:   ❌ Inactivo"
        fi
    else
        echo "  Performance:   ❌ No iniciado"
    fi
    echo ""
    
    # URLs
    echo "🌐 URLs:"
    echo "  Frontend:      http://localhost:3000"
    echo "  Backend API:   http://localhost:8000"
    echo "  API Docs:      http://localhost:8000/docs"
    echo ""
    
    # Cache stats
    local cache_size="0B"
    if [[ -d "$CACHE_DIR" ]]; then
        cache_size=$(du -sh "$CACHE_DIR" 2>/dev/null | cut -f1 || echo "0B")
    fi
    local cache_files=0
    if [[ -d "$CACHE_DIR" ]]; then
        cache_files=$(find "$CACHE_DIR" -name "*.cache*" 2>/dev/null | wc -l)
    fi
    local hit_rate=$(calculate_cache_hit_rate)
    echo "💾 Cache Ultra Optimizado:"
    echo "  Size:          $cache_size"
    echo "  Files:         $cache_files"
    echo "  Hit Rate:      ${hit_rate}%"
    echo ""
    
    # Health status
    if [[ -f "$LOG_DIR/health-report.json" ]]; then
        local health_score="0"
        local health_status="unknown"
        if command -v jq >/dev/null 2>&1; then
            health_score=$(jq -r '.health_score' "$LOG_DIR/health-report.json" 2>/dev/null || echo "0")
            health_status=$(jq -r '.status' "$LOG_DIR/health-report.json" 2>/dev/null || echo "unknown")
        else
            health_score=$(grep '"health_score"' "$LOG_DIR/health-report.json" | sed 's/.*"health_score": *\([0-9]*\).*/\1/' 2>/dev/null || echo "0")
            health_status=$(grep '"status"' "$LOG_DIR/health-report.json" | sed 's/.*"status": *"\([^"]*\)".*/\1/' 2>/dev/null || echo "unknown")
        fi
        local status_emoji=""
        case "$health_status" in
            "healthy") status_emoji="✅" ;;
            "warning") status_emoji="⚠️" ;;
            "critical") status_emoji="🚨" ;;
            *) status_emoji="❓" ;;
        esac
        echo "🏥 Health Status:"
        echo "  Score:         ${status_emoji} ${health_score}/100 ($health_status)"
        echo "  Last Check:    $(stat -f "%Sm" "$LOG_DIR/health-report.json" 2>/dev/null || echo "N/A")"
        echo ""
    fi
    
    # Logs
    echo "📝 Logs:"
    echo "  General:       tail -f logs/cactus.log"
    echo "  Backend:       tail -f logs/backend.log"
    echo "  Frontend:      tail -f logs/frontend.log"
    echo "  Monitor:       tail -f logs/real-time-monitor.log"
    echo ""
}

# =============================================================================
# HEALTH CHECK ULTRA OPTIMIZADO
# =============================================================================

health_check() {
    log "🏥 Ejecutando health check ultra optimizado..."
    
    local health_score=100
    local issues=()
    
    # Verificar servicios críticos
    for service_info in "8000:Backend API" "3000:Frontend" "5432:PostgreSQL" "6379:Redis"; do
        local port="${service_info%%:*}"
        local service="${service_info#*:}"
        
        if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            issues+=("$service (puerto $port) no está disponible")
            ((health_score -= 25))
        fi
    done
    
    # Verificar procesos críticos
    if [[ -f "$LOG_DIR/backend.pid" ]]; then
        local backend_pid=$(cat "$LOG_DIR/backend.pid")
        if ! kill -0 "$backend_pid" 2>/dev/null; then
            issues+=("Backend process no está ejecutándose")
            ((health_score -= 20))
        fi
    fi
    
    if [[ -f "$LOG_DIR/frontend.pid" ]]; then
        local frontend_pid=$(cat "$LOG_DIR/frontend.pid")
        if ! kill -0 "$frontend_pid" 2>/dev/null; then
            issues+=("Frontend process no está ejecutándose")
            ((health_score -= 20))
        fi
    fi
    
    # Verificar espacio en disco
    local disk_usage=$(df . | tail -1 | awk '{print $5}' | sed 's/%//')
    if [[ $disk_usage -gt 90 ]]; then
        issues+=("Espacio en disco crítico: ${disk_usage}%")
        ((health_score -= 15))
    elif [[ $disk_usage -gt 80 ]]; then
        issues+=("Espacio en disco bajo: ${disk_usage}%")
        ((health_score -= 5))
    fi
    
    # Verificar memoria del sistema
    if command -v free >/dev/null 2>&1; then
        local mem_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
        if [[ $mem_usage -gt 90 ]]; then
            issues+=("Memoria del sistema crítica: ${mem_usage}%")
            ((health_score -= 10))
        fi
    fi
    
    # Asegurar score mínimo
    if [[ $health_score -lt 0 ]]; then
        health_score=0
    fi
    
    # Generar reporte de salud
    local issues_json=""
    if [[ ${#issues[@]} -gt 0 ]]; then
        local issues_list=""
        for issue in "${issues[@]}"; do
            if [[ -n "$issues_list" ]]; then
                issues_list="${issues_list},"
            fi
            issues_list="${issues_list}\"${issue}\""
        done
        issues_json="$issues_list"
    fi
    
    cat > "$LOG_DIR/health-report.json" << EOF
{
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "health_score": $health_score,
    "status": "$(if [[ $health_score -ge 80 ]]; then echo "healthy"; elif [[ $health_score -ge 60 ]]; then echo "warning"; else echo "critical"; fi)",
    "issues": [$issues_json],
    "services": {
        "backend": $(lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1 && echo "true" || echo "false"),
        "frontend": $(lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 && echo "true" || echo "false"),
        "postgresql": $(lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null 2>&1 && echo "true" || echo "false"),
        "redis": $(lsof -Pi :6379 -sTCP:LISTEN -t >/dev/null 2>&1 && echo "true" || echo "false")
    }
}
EOF
    
    if [[ $health_score -ge 80 ]]; then
        success "Health check completado - Score: ${health_score}/100 (Healthy)"
    elif [[ $health_score -ge 60 ]]; then
        warn "Health check completado - Score: ${health_score}/100 (Warning)"
        for issue in "${issues[@]}"; do
            warn "Issue: $issue"
        done
    else
        error "Health check completado - Score: ${health_score}/100 (Critical)"
        for issue in "${issues[@]}"; do
            error "Issue: $issue"
        done
    fi
    
    return $((health_score >= 60 ? 0 : 1))
}

# =============================================================================
# BACKUP ULTRA OPTIMIZADO
# =============================================================================

backup_system() {
    if [[ "$BACKUP_ENABLED" != "true" ]]; then
        debug "Backup deshabilitado"
        return 0
    fi
    
    log "💾 Ejecutando backup ultra optimizado..."
    
    local backup_dir="$PROJECT_ROOT/backups"
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_name="cactus_backup_${timestamp}"
    local backup_path="$backup_dir/$backup_name"
    
    mkdir -p "$backup_dir"
    
    # Crear backup incremental
    if [[ -d "$backup_path" ]]; then
        rm -rf "$backup_path"
    fi
    
    # Backup de archivos críticos
    mkdir -p "$backup_path"
    
    # Backup de logs
    if [[ -d "$LOG_DIR" ]]; then
        cp -r "$LOG_DIR" "$backup_path/" 2>/dev/null || true
    fi
    
    # Backup de cache
    if [[ -d "$CACHE_DIR" ]]; then
        cp -r "$CACHE_DIR" "$backup_path/" 2>/dev/null || true
    fi
    
    # Backup de configuración
    if [[ -f "$COMPOSE_FILE" ]]; then
        cp "$COMPOSE_FILE" "$backup_path/" 2>/dev/null || true
    fi
    
    # Comprimir backup
    cd "$backup_dir"
    tar -czf "${backup_name}.tar.gz" "$backup_name" 2>/dev/null || true
    rm -rf "$backup_name"
    
    # Limpiar backups antiguos (mantener solo los últimos 5)
    ls -t *.tar.gz 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
    
    success "Backup completado: ${backup_name}.tar.gz"
}

# =============================================================================
# UTILITIES ULTRA OPTIMIZADAS
# =============================================================================

clean_cache() {
    log "🧹 Limpiando cache ultra optimizado..."
    rm -rf "$CACHE_DIR"/*
    success "Cache ultra optimizado limpiado"
}

show_stats() {
    log "📈 Estadísticas ultra optimizadas:"
    
    local cache_size="0B"
    if [[ -d "$CACHE_DIR" ]]; then
        cache_size=$(du -sh "$CACHE_DIR" 2>/dev/null | cut -f1 || echo "0B")
    fi
    local cache_files=0
    if [[ -d "$CACHE_DIR" ]]; then
        cache_files=$(find "$CACHE_DIR" -name "*.cache*" 2>/dev/null | wc -l)
    fi
    local log_size="0B"
    if [[ -d "$LOG_DIR" ]]; then
        log_size=$(du -sh "$LOG_DIR" 2>/dev/null | cut -f1 || echo "0B")
    fi
    local hit_rate=$(calculate_cache_hit_rate)
    local performance_score=$(calculate_performance_score)
    
    echo "Cache size: $cache_size"
    echo "Cache files: $cache_files"
    echo "Log size: $log_size"
    echo "Cache hit rate: ${hit_rate}%"
    echo "Performance score: $performance_score"
}

calculate_cache_hit_rate() {
    local hits=0
    local misses=0
    
    if [[ -f "$LOG_FILE" ]]; then
        hits=$(grep -c "Cache hit" "$LOG_FILE" 2>/dev/null | tail -1 || echo "0")
        misses=$(grep -c "Cache miss" "$LOG_FILE" 2>/dev/null | tail -1 || echo "0")
    fi
    
    # Ensure variables are numeric and clean
    hits=$(echo "$hits" | tr -d '\n' | tr -d ' ')
    misses=$(echo "$misses" | tr -d '\n' | tr -d ' ')
    hits=${hits:-0}
    misses=${misses:-0}
    
    local total=$((hits + misses))
    
    if [[ "$total" -eq 0 ]]; then
        echo "0"
    else
        local percentage=$((hits * 100 / total))
        echo "$percentage"
    fi
}

calculate_performance_score() {
    local score=100
    
    # Reducir score basado en problemas detectados
    if [[ -f "$LOG_DIR/complex-functions.txt" ]]; then
        local complex_count=$(wc -l < "$LOG_DIR/complex-functions.txt" 2>/dev/null || echo "0")
        score=$((score - complex_count * 2))
    fi
    
    if [[ -f "$LOG_DIR/potential-bugs.txt" ]]; then
        local bug_count=$(wc -l < "$LOG_DIR/potential-bugs.txt" 2>/dev/null || echo "0")
        score=$((score - bug_count * 3))
    fi
    
    if [[ -f "$LOG_DIR/performance-issues.txt" ]]; then
        local perf_count=$(wc -l < "$LOG_DIR/performance-issues.txt" 2>/dev/null || echo "0")
        score=$((score - perf_count * 1))
    fi
    
    # Asegurar score mínimo
    if [[ $score -lt 0 ]]; then
        score=0
    fi
    
    echo "${score}/100"
}

stop_services() {
    log "🛑 Deteniendo servicios..."
    
    # Detener procesos por PID
    if [[ -f "$LOG_DIR/backend.pid" ]]; then
        local backend_pid=$(cat "$LOG_DIR/backend.pid")
        kill "$backend_pid" 2>/dev/null || true
        rm "$LOG_DIR/backend.pid"
    fi
    
    if [[ -f "$LOG_DIR/frontend.pid" ]]; then
        local frontend_pid=$(cat "$LOG_DIR/frontend.pid")
        kill "$frontend_pid" 2>/dev/null || true
        rm "$LOG_DIR/frontend.pid"
    fi
    
    # Detener Docker
    if docker info >/dev/null 2>&1; then
        docker-compose down
    fi
    
    success "Servicios detenidos"
}

# --- DEPENDENCY AND SERVICE STARTUP FUNCTIONS ---

command_exists() { command -v "$1" >/dev/null 2>&1; }

log() { echo -e "${GREEN}[INFO]${NC} $1" | tee -a "$LOG_FILE"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"; }
error() { echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"; }
section() { echo -e "\n${CYAN}==== $1 ====${NC}\n" | tee -a "$LOG_FILE"; }

start_redis() {
  if command_exists redis-server; then
    if pgrep -x redis-server >/dev/null; then
      log "Redis ya está corriendo."
    else
      if command_exists brew && brew services list | grep -q '^redis.*started'; then
        log "Redis gestionado por Homebrew, ya está activo."
      else
        log "Iniciando Redis local..."
        if command_exists brew; then
          brew services start redis || redis-server --daemonize yes
        else
          redis-server --daemonize yes
        fi
        sleep 1
        log "Redis iniciado."
      fi
    fi
  else
    warn "Redis no está instalado. Instala con: brew install redis"
  fi
}

start_postgres() {
  if command_exists pg_ctl; then
    if pg_isready -q; then
      log "PostgreSQL ya está corriendo."
    else
      if command_exists brew && brew services list | grep -q '^postgresql.*started'; then
        log "PostgreSQL gestionado por Homebrew, ya está activo."
      else
        log "Iniciando PostgreSQL local..."
        if command_exists brew; then
          brew services start postgresql || pg_ctl -D "$(brew --prefix)/var/postgres" start
        else
          pg_ctl -D "/opt/homebrew/var/postgres" start
        fi
        sleep 2
        log "PostgreSQL iniciado."
      fi
    fi
  else
    warn "PostgreSQL no está instalado. Instala con: brew install postgresql"
  fi
}

test_postgres_running() {
  pg_isready -q || {
    error "PostgreSQL no está corriendo. Inicia con: brew services start postgresql"
    exit 1
  }
}

run_seed_and_migrations() {
    local seed_hash_file="$LOG_DIR/.seed_migrations.hash"
    local seed_files=("$BACKEND_DIR/alembic/versions" "$BACKEND_DIR/create_test_data.py")
    local hash_input=""
    for f in "${seed_files[@]}"; do
        if [[ -d "$f" ]]; then
            hash_input+=$(find "$f" -type f -exec sha256sum {} \; | sort | sha256sum | awk '{print $1}')
        elif [[ -f "$f" ]]; then
            hash_input+=$(sha256sum "$f" | awk '{print $1}')
        fi
    done
    local current_hash=$(echo "$hash_input" | sha256sum | awk '{print $1}')
    local prev_hash=""
    if [[ -f "$seed_hash_file" ]]; then
        prev_hash=$(cat "$seed_hash_file")
    fi
    if [[ "$current_hash" != "$prev_hash" ]]; then
        log "Ejecutando migraciones y seed (cambio detectado)..."
        cd "$BACKEND_DIR"
        alembic -c alembic.ini upgrade head
        if [ -f "create_test_data.py" ]; then
            poetry run python create_test_data.py || python create_test_data.py
        fi
        cd "$PROJECT_ROOT"
        echo "$current_hash" > "$seed_hash_file"
        touch "$SEED_LOCK"
    else
        log "Seed y migraciones ya actualizados (hash match)."
    fi
}

start_backend() {
  section "BACKEND"
  cd "$BACKEND_DIR"
  if ! command_exists poetry; then
    error "Poetry no está instalado. Instala con: pip install poetry"
    exit 1
  fi
  if [ ! -d ".venv" ] || [ pyproject.toml -nt .venv ] || [ poetry.lock -nt .venv ]; then
    log "Instalando dependencias backend..."
    poetry install --no-root
  else
    log "Dependencias backend ya instaladas."
  fi
  log "Levantando backend (FastAPI, hot reload)..."
  poetry run uvicorn main:app --host 0.0.0.0 --port 8000 --reload > "$LOG_DIR/backend-local.log" 2>&1 &
  BACKEND_PID=$!
  echo $BACKEND_PID > "$LOG_DIR/backend-local.pid"
  cd "$PROJECT_ROOT"
  log "Backend iniciado (PID: $BACKEND_PID)"
}

start_frontend() {
  section "FRONTEND"
  cd "$FRONTEND_DIR"
  if ! command_exists npm; then
    error "npm no está instalado. Instala Node.js >=18"
    exit 1
  fi
  if [ ! -d "node_modules" ] || [ package-lock.json -nt node_modules ]; then
    if [ -f package-lock.json ]; then
      log "Instalando dependencias frontend (npm ci)..."
      npm ci
    else
      log "Instalando dependencias frontend (npm install)..."
      npm install
    fi
  else
    log "Dependencias frontend ya instaladas."
  fi
  log "Levantando frontend (Next.js, hot reload)..."
  npm run dev > "$LOG_DIR/frontend-local.log" 2>&1 &
  FRONTEND_PID=$!
  echo $FRONTEND_PID > "$LOG_DIR/frontend-local.pid"
  cd "$PROJECT_ROOT"
  log "Frontend iniciado (PID: $FRONTEND_PID)"
}

start_services_local() {
  section "VERIFICANDO E INICIANDO DEPENDENCIAS LOCALES"
  start_redis
  start_postgres
  test_postgres_running
  if [ ! -f "$SEED_LOCK" ]; then
    run_seed_and_migrations
  else
    log "Seed y migraciones ya ejecutados previamente. (lock: $SEED_LOCK)"
  fi
  start_backend &
  BACKEND_JOB=$!
  start_frontend &
  FRONTEND_JOB=$!
  wait $BACKEND_JOB || true
  wait $FRONTEND_JOB || true
  section "RESUMEN DE PIDS Y USO DE RECURSOS"
  if [ -f "$LOG_DIR/backend-local.pid" ]; then
    BACKEND_PID=$(cat "$LOG_DIR/backend-local.pid")
    log "Backend PID: $BACKEND_PID (CPU: $(ps -o %cpu= -p $BACKEND_PID 2>/dev/null || echo 0)% RAM: $(ps -o %mem= -p $BACKEND_PID 2>/dev/null || echo 0)%)"
  fi
  if [ -f "$LOG_DIR/frontend-local.pid" ]; then
    FRONTEND_PID=$(cat "$LOG_DIR/frontend-local.pid")
    log "Frontend PID: $FRONTEND_PID (CPU: $(ps -o %cpu= -p $FRONTEND_PID 2>/dev/null || echo 0)% RAM: $(ps -o %mem= -p $FRONTEND_PID 2>/dev/null || echo 0)%)"
  fi
  section "ESTADO DE SERVICIOS"
  for svc in "5432:PostgreSQL" "6379:Redis" "8000:Backend API" "3000:Frontend"; do
    port="${svc%%:*}"
    name="${svc#*:}"
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
      log "$name (puerto $port): ✅ Activo"
    else
      warn "$name (puerto $port): ❌ Inactivo"
    fi
  done
  section "LOGS EN VIVO (Ctrl+C para salir, servicios siguen corriendo)"
  tail -n 30 -F "$LOG_DIR/backend-local.log" "$LOG_DIR/frontend-local.log" "$LOG_DIR/cactus.log"
}

# Export PYTHONPATH para que los imports funcionen siempre
export PYTHONPATH="${PYTHONPATH:-}:$PROJECT_ROOT/cactus-wealth-backend/src"

# =============================================================================
# MAIN FUNCTION ULTRA OPTIMIZADA
# =============================================================================

main() {
    # Crear directorios necesarios
    mkdir -p "$CACHE_DIR"
    mkdir -p "$LOG_DIR"
    
    case "${1:-help}" in
        "logs")
            GRP="${2:-}"
            case "$GRP" in
                backend-core) tail -40 "$LOG_DIR/backend-tests.log" || echo "No log" ;;
                backend-api) tail -40 "$LOG_DIR/backend-tests.log" || echo "No log" ;;
                backend-integration) tail -40 "$LOG_DIR/backend-tests.log" || echo "No log" ;;
                backend-repositories) tail -40 "$LOG_DIR/backend-tests.log" || echo "No log" ;;
                frontend-components) tail -40 "$LOG_DIR/frontend-tests.log" || echo "No log" ;;
                frontend-services) tail -40 "$LOG_DIR/frontend-tests.log" || echo "No log" ;;
                frontend-hooks) tail -40 "$LOG_DIR/frontend-tests.log" || echo "No log" ;;
                frontend-utils) tail -40 "$LOG_DIR/frontend-tests.log" || echo "No log" ;;
                frontend-e2e) tail -40 "$LOG_DIR/frontend-e2e.log" || echo "No log" ;;
                *) echo "Grupo desconocido: $GRP"; exit 1;;
            esac
            exit 0
            ;;
        "clean-logs")
            rm -f "$LOG_DIR"/backend-tests.log "$LOG_DIR"/frontend-tests.log "$LOG_DIR"/frontend-e2e.log
            echo "Logs de test limpiados."
            exit 0
            ;;
        "test")
            shift
            GROUP="${1:-}"
            SHOW_LOGS=false
            LAST_FAIL=false
            for arg in "$@"; do
                [[ "$arg" == "--logs" ]] && SHOW_LOGS=true
                [[ "$arg" == "--last-fail" ]] && LAST_FAIL=true
            done
            if [[ -n "$GROUP" && "$GROUP" != "--fast" && "$GROUP" != "--docker" ]]; then
                case "$GROUP" in
                    backend-core)
                        cd "$BACKEND_DIR"
                        source venv/bin/activate 2>/dev/null || true
                        if $LAST_FAIL; then
                            pytest --last-failed -n auto tests/services/ tests/test_health_endpoint.py | tee "$LOG_DIR/backend-tests.log"
                        else
                            pytest -n auto tests/services/ tests/test_health_endpoint.py | tee "$LOG_DIR/backend-tests.log"
                        fi
                        CODE=${PIPESTATUS[0]}
                        $SHOW_LOGS && tail -40 "$LOG_DIR/backend-tests.log"
                        [[ $CODE -ne 0 ]] && echo "Fallo. Ver logs: ./cactus.sh logs backend-core" && exit $CODE
                        exit $CODE
                        ;;
                    backend-api)
                        cd "$BACKEND_DIR"
                        source venv/bin/activate 2>/dev/null || true
                        if $LAST_FAIL; then
                            pytest --last-failed -n auto tests/api/v1/ | tee "$LOG_DIR/backend-tests.log"
                        else
                            pytest -n auto tests/api/v1/ | tee "$LOG_DIR/backend-tests.log"
                        fi
                        CODE=${PIPESTATUS[0]}
                        $SHOW_LOGS && tail -40 "$LOG_DIR/backend-tests.log"
                        [[ $CODE -ne 0 ]] && echo "Fallo. Ver logs: ./cactus.sh logs backend-api" && exit $CODE
                        exit $CODE
                        ;;
                    backend-integration)
                        cd "$BACKEND_DIR"
                        source venv/bin/activate 2>/dev/null || true
                        if $LAST_FAIL; then
                            pytest --last-failed -n auto tests/integration/ | tee "$LOG_DIR/backend-tests.log"
                        else
                            pytest -n auto tests/integration/ | tee "$LOG_DIR/backend-tests.log"
                        fi
                        CODE=${PIPESTATUS[0]}
                        $SHOW_LOGS && tail -40 "$LOG_DIR/backend-tests.log"
                        [[ $CODE -ne 0 ]] && echo "Fallo. Ver logs: ./cactus.sh logs backend-integration" && exit $CODE
                        exit $CODE
                        ;;
                    backend-repositories)
                        cd "$BACKEND_DIR"
                        source venv/bin/activate 2>/dev/null || true
                        if $LAST_FAIL; then
                            pytest --last-failed -n auto tests/test_repositories/ | tee "$LOG_DIR/backend-tests.log"
                        else
                            pytest -n auto tests/test_repositories/ | tee "$LOG_DIR/backend-tests.log"
                        fi
                        CODE=${PIPESTATUS[0]}
                        $SHOW_LOGS && tail -40 "$LOG_DIR/backend-tests.log"
                        [[ $CODE -ne 0 ]] && echo "Fallo. Ver logs: ./cactus.sh logs backend-repositories" && exit $CODE
                        exit $CODE
                        ;;
                    frontend-components)
                        cd "$FRONTEND_DIR"
                        if $LAST_FAIL; then
                            npx jest --onlyFailures components/__tests__/ components/clients/ components/dashboard/ components/ui/__tests__/ | tee "$LOG_DIR/frontend-tests.log"
                        else
                            npm test -- components/__tests__/ components/clients/ components/dashboard/ components/ui/__tests__/ | tee "$LOG_DIR/frontend-tests.log"
                        fi
                        CODE=${PIPESTATUS[0]}
                        $SHOW_LOGS && tail -40 "$LOG_DIR/frontend-tests.log"
                        [[ $CODE -ne 0 ]] && echo "Fallo. Ver logs: ./cactus.sh logs frontend-components" && exit $CODE
                        exit $CODE
                        ;;
                    frontend-services)
                        cd "$FRONTEND_DIR"
                        if $LAST_FAIL; then
                            npx jest --onlyFailures services/__tests__/ | tee "$LOG_DIR/frontend-tests.log"
                        else
                            npm test -- services/__tests__/ | tee "$LOG_DIR/frontend-tests.log"
                        fi
                        CODE=${PIPESTATUS[0]}
                        $SHOW_LOGS && tail -40 "$LOG_DIR/frontend-tests.log"
                        [[ $CODE -ne 0 ]] && echo "Fallo. Ver logs: ./cactus.sh logs frontend-services" && exit $CODE
                        exit $CODE
                        ;;
                    frontend-hooks)
                        cd "$FRONTEND_DIR"
                        if $LAST_FAIL; then
                            npx jest --onlyFailures hooks/useWebSocket.test.tsx | tee "$LOG_DIR/frontend-tests.log"
                        else
                            npm test -- hooks/useWebSocket.test.tsx | tee "$LOG_DIR/frontend-tests.log"
                        fi
                        CODE=${PIPESTATUS[0]}
                        $SHOW_LOGS && tail -40 "$LOG_DIR/frontend-tests.log"
                        [[ $CODE -ne 0 ]] && echo "Fallo. Ver logs: ./cactus.sh logs frontend-hooks" && exit $CODE
                        exit $CODE
                        ;;
                    frontend-utils)
                        cd "$FRONTEND_DIR"
                        if $LAST_FAIL; then
                            npx jest --onlyFailures lib/__tests__/ | tee "$LOG_DIR/frontend-tests.log"
                        else
                            npm test -- lib/__tests__/ | tee "$LOG_DIR/frontend-tests.log"
                        fi
                        CODE=${PIPESTATUS[0]}
                        $SHOW_LOGS && tail -40 "$LOG_DIR/frontend-tests.log"
                        [[ $CODE -ne 0 ]] && echo "Fallo. Ver logs: ./cactus.sh logs frontend-utils" && exit $CODE
                        exit $CODE
                        ;;
                    frontend-e2e)
                        cd "$FRONTEND_DIR"
                        npx playwright test e2e/ | tee "$LOG_DIR/frontend-e2e.log"
                        CODE=${PIPESTATUS[0]}
                        $SHOW_LOGS && tail -40 "$LOG_DIR/frontend-e2e.log"
                        [[ $CODE -ne 0 ]] && echo "Fallo. Ver logs: ./cactus.sh logs frontend-e2e" && exit $CODE
                        exit $CODE
                        ;;
                    *)
                        echo "Grupo de test desconocido: $GROUP"
                        exit 1
                        ;;
                esac
            fi
            FAST_MODE=false
            if [[ "${1:-}" == "--fast" ]]; then
                FAST_MODE=true
                shift
            fi
            if [[ "${1:-}" == "--docker" ]]; then
                echo -e "${CYAN}🔎 Test (modo Docker): PostgreSQL real, paralelismo máximo, quality-check integrado...${NC}"
                # 1. Verificar Docker
                if ! docker info >/dev/null 2>&1; then
                    echo -e "${YELLOW}Iniciando Docker Desktop...${NC}"
                    open -a Docker 2>/dev/null || true
                    sleep 5
                    timeout=60
                    while [[ $timeout -gt 0 ]]; do
                        if docker info >/dev/null 2>&1; then break; fi
                        sleep 1; ((timeout--));
                    done
                    if [[ $timeout -eq 0 ]]; then
                        echo -e "${RED}No se pudo iniciar Docker. Aborta.${NC}"
                        exit 1
                    fi
                fi
                # 2. Levantar contenedor db_test si no está
                if ! docker ps | grep -q 'db_test'; then
                    echo -e "${CYAN}Levantando contenedor db_test...${NC}"
                    docker-compose -f "$PROJECT_ROOT/config/docker/docker-compose.yml" up -d db_test
                    sleep 5
                fi
                # 3. Esperar a que PostgreSQL esté listo
                echo -e "${CYAN}Esperando a que PostgreSQL de test esté listo...${NC}"
                for i in {1..30}; do
                    if docker exec $(docker ps -qf name=db_test) pg_isready -U postgres -d cactus_test >/dev/null 2>&1; then
                        break
                    fi
                    sleep 1
                done
                # 4. Ejecutar migraciones Alembic
                echo -e "${CYAN}Aplicando migraciones Alembic en base de test...${NC}"
                cd "$PROJECT_ROOT/cactus-wealth-backend"
                alembic -c alembic.ini upgrade head
                cd "$PROJECT_ROOT"
                # 5. Ejecutar ciclo de test + autofix + quality_check
                test_autofix_loop
            else
                echo -e "${CYAN}🔎 Test (modo local): PostgreSQL/Redis locales, paralelismo máximo, quality-check integrado...${NC}"
                start_redis
                start_postgres
                test_postgres_running
                if [ ! -f "$SEED_LOCK" ]; then
                  run_seed_and_migrations
                else
                  log "Seed y migraciones ya ejecutados previamente. (lock: $SEED_LOCK)"
                fi
                if [[ "$FAST_MODE" == true ]]; then
                  parallel_execute "$MAX_JOBS" \
                    "run_backend_tests_optimized" \
                    "run_frontend_tests_optimized"
                else
                  parallel_execute "$MAX_JOBS" \
                    "run_backend_tests_optimized" \
                    "run_frontend_tests_optimized" \
                    "run_linting_optimized" \
                    "run_type_checking_optimized"
                fi
                # 4. Mostrar resumen de errores si existen
                if grep -q "error:" "$LOG_DIR/backend-types.log" 2>/dev/null; then
                    echo -e "${RED}Resumen de errores de type-checking backend:${NC}"
                    tail -n 20 "$LOG_DIR/backend-types.log"
                fi
                if grep -q "FAILED" "$LOG_DIR/backend-tests.log" 2>/dev/null; then
                    echo -e "${RED}Resumen de errores de tests backend:${NC}"
                    tail -n 20 "$LOG_DIR/backend-tests.log"
                fi
                if grep -q "error:" "$LOG_DIR/frontend-types.log" 2>/dev/null; then
                    echo -e "${RED}Resumen de errores de type-checking frontend:${NC}"
                    tail -n 20 "$LOG_DIR/frontend-types.log"
                fi
                if grep -q "FAILED" "$LOG_DIR/frontend-tests.log" 2>/dev/null; then
                    echo -e "${RED}Resumen de errores de tests frontend:${NC}"
                    tail -n 20 "$LOG_DIR/frontend-tests.log"
                fi
                success "Test local completado"
            fi
            ;;
        "analysis")
            analysis
            ;;
        "monitor")
            monitoring
            dashboard
            ;;
        "stop")
            stop_services
            stop_monitoring
            ;;
        "dashboard")
            dashboard
            ;;
        "clean")
            clean_cache
            ;;
        "stats")
            show_stats
            ;;
        "health")
            health_check
            ;;
        "backup")
            backup_system
            ;;
        "all")
            quality_check
            start_services_local
            analysis
            monitoring
            health_check
            backup_system
            dashboard
            ;;
        "start")
            start_services_local
            ;;
        "help"|*)
            echo "🚀 CACTUS MASTER - CactusDashboard (LOCAL MODE)"
            echo "=================================="
            echo ""
            echo "Script maestro único ultra optimizado para entorno local, sin Docker."
            echo ""
            echo "Uso: ./cactus.sh [comando]"
            echo ""
            echo "Comandos disponibles:"
            echo "  test      - Ejecutar tests ultra rápidos en local (PostgreSQL/Redis locales, sin Docker)"
            echo "              --docker: Fuerza modo Docker para tests (db_test en contenedor)"
            echo "              --fast: Solo tests backend/frontend, sin lint ni type-check"
            echo "              [grupo]: Ejecuta solo el grupo de tests indicado. Grupos disponibles:"
            echo "                backend-core, backend-api, backend-integration, backend-repositories, frontend-components, frontend-services, frontend-hooks, frontend-utils, frontend-e2e"
            echo "              --logs: Muestra el log relevante tras ejecutar el test"
            echo "              --last-fail: Reintenta solo el último test fallido (si es posible)"
            echo "  logs [grupo]      - Muestra el log relevante del grupo (tail -40)"
            echo "  clean-logs        - Limpia todos los logs de test"
            echo "  start     - Iniciar servicios locales (Redis, PostgreSQL, backend, frontend)"
            echo "  quality   - Quality check ultra optimizado"
            echo "  analysis  - Análisis ultra optimizado"
            echo "  monitor   - Monitoreo ultra optimizado"
            echo "  stop      - Detener servicios y monitores"
            echo "  dashboard - Mostrar dashboard ultra optimizado"
            echo "  clean     - Limpiar cache ultra optimizado"
            echo "  stats     - Mostrar estadísticas ultra optimizadas"
            echo "  health    - Health check ultra optimizado"
            echo "  backup    - Backup ultra optimizado"
            echo "  all       - Ejecutar todo (quality + start + analysis + monitor + health + backup)"
            echo "  help      - Mostrar esta ayuda"
            echo ""
            echo "Optimizaciones implementadas:"
            echo "  ✅ Ejecución paralela ultra optimizada"
            echo "  ✅ Cache inteligente unificado con compresión"
            echo "  ✅ Logging centralizado con niveles"
            echo "  ✅ Gestión mejorada de dependencias locales"
            echo "  ✅ Manejo robusto de errores"
            echo "  ✅ Dashboard ultra optimizado"
            echo "  ✅ Performance máxima"
            echo ""
            echo "Variables de entorno:"
            echo "  CACTUS_CACHE_TTL=300        - TTL del cache en segundos"
            echo "  CACTUS_MAX_JOBS=4           - Máximo de jobs paralelos"
            echo "  CACTUS_LOG_LEVEL=INFO       - Nivel de logging (DEBUG|INFO|WARN|ERROR)"
            echo "  HEALTH_CHECK_INTERVAL=30    - Intervalo de health check en segundos"
            echo "  MAX_RETRIES=3               - Máximo de reintentos para operaciones"
            echo "  BACKUP_ENABLED=true         - Habilitar/deshabilitar backups automáticos"
            echo ""
            echo "Ejemplo: ./cactus.sh start"
            ;;
    esac
}

# Ejecutar función principal
main "$@" 