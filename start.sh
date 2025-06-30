#!/bin/bash

# =============================================================================
# 🌵 CACTUS WEALTH - DEVELOPMENT CONSOLE
# =============================================================================
# Ultra-potent development environment for full-stack Cactus Wealth project
# Author: DevOps Engineer
# Version: 1.0.0
# =============================================================================

set -e  # Exit on any error

# ANSI Color Codes
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly MAGENTA='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m' # No Color
readonly BOLD='\033[1m'

# Project Configuration
readonly PROJECT_NAME="cactus-wealth"
readonly TMUX_SESSION="cactus-dev"
readonly BACKEND_DIR="./cactus-wealth-backend"
readonly FRONTEND_DIR="./cactus-wealth-frontend"
readonly COMPOSE_FILE="docker-compose.yml"
readonly DB_NAME="cactus_db"
readonly DB_USER="cactus_user"
readonly BACKEND_URL="http://localhost:8000"

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

print_banner() {
    echo -e "${CYAN}${BOLD}"
    echo "  ██████╗  █████╗  ██████╗████████╗██╗   ██╗███████╗"
    echo " ██╔════╝ ██╔══██╗██╔════╝╚══██╔══╝██║   ██║██╔════╝"
    echo " ██║  ███╗███████║██║        ██║   ██║   ██║███████╗"
    echo " ██║   ██║██╔══██║██║        ██║   ██║   ██║╚════██║"
    echo " ╚██████╔╝██║  ██║╚██████╗   ██║   ╚██████╔╝███████║"
    echo "  ╚═════╝ ╚═╝  ╚═╝ ╚═════╝   ╚═╝    ╚═════╝ ╚══════╝"
    echo -e "${NC}"
    echo -e "${WHITE}${BOLD}🌵 Welcome to the Cactus Wealth Development Console!${NC}"
    echo -e "${CYAN}Type '${YELLOW}help${CYAN}' to see available commands.${NC}"
    echo ""
}

log_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

log_success() {
    echo -e "${GREEN}✅ ${1}${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  ${1}${NC}"
}

log_error() {
    echo -e "${RED}❌ ${1}${NC}"
}

log_command() {
    echo -e "${MAGENTA}🔧 ${1}${NC}"
}

log_cleanup() {
    echo -e "${CYAN}🧹 ${1}${NC}"
}

# =============================================================================
# NETWORK & LAN CONFIGURATION
# =============================================================================

# Función para detectar la IP local en la LAN
# DEVUELVE: La dirección IP a stdout.
# LOGS: Imprime logs de diagnóstico a stderr.
get_local_ip() {
    log_info "🔍 Detectando dirección IP local para configuración LAN..." >&2
    
    local ip_address=""
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        log_info "ℹ️ Sistema: macOS - Detectando IP en interfaces de red..." >&2
        # Intenta con Wi-Fi (en0) primero, luego Ethernet (en1)
        ip_address=$(ipconfig getifaddr en0 2>/dev/null)
        if [ -n "$ip_address" ] && [[ "$ip_address" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            log_info "📶 IP detectada en WiFi (en0): $ip_address" >&2
        else
            # Probar Ethernet (en1 o en2)
            for interface in en1 en2 en3; do
                ip_address=$(ipconfig getifaddr $interface 2>/dev/null)
                if [ -n "$ip_address" ] && [[ "$ip_address" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
                    log_info "🔌 IP detectada en Ethernet ($interface): $ip_address" >&2
                    break
                fi
            done
        fi
        
        # Fallback: usar route para encontrar la IP de la interfaz por defecto
        if [ -z "$ip_address" ]; then
            local default_interface=$(route get default 2>/dev/null | grep interface | awk '{print $2}')
            if [ -n "$default_interface" ]; then
                ip_address=$(ipconfig getifaddr "$default_interface" 2>/dev/null)
                if [ -n "$ip_address" ]; then
                    log_info "🛣️ IP detectada en interfaz por defecto ($default_interface): $ip_address" >&2
                fi
            fi
        fi

    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        log_info "ℹ️ Sistema: Linux - Detectando IP..." >&2
        ip_address=$(hostname -I | awk '{print $1}')
        log_info "🐧 IP detectada: $ip_address" >&2
    fi

    if [ -z "$ip_address" ]; then
        log_warning "⚠️ No se pudo detectar automáticamente la IP local. Usando 'localhost'." >&2
        echo "localhost"
    else
        log_success "✅ IP LAN válida detectada: $ip_address" >&2
        echo "$ip_address"
    fi
}

setup_lan_environment() {
    local local_ip="$1"
    
    if [ -z "$local_ip" ]; then
        log_error "IP local no proporcionada para setup_lan_environment"
        return 1
    fi
    
    log_command "🌐 Configurando entorno para acceso LAN..."
    
    # Crear .env.local para el frontend con configuración LAN
    log_info "📝 Creando configuración de entorno LAN para frontend..."
    
    cat > "$FRONTEND_DIR/.env.local" << EOF
# =============================================================================
# 🌵 CACTUS WEALTH - CONFIGURACIÓN LAN 
# =============================================================================
# Auto-generado por start.sh para acceso desde red local
# IP del servidor: $local_ip
# Fecha: $(date)
# =============================================================================

# API Base URL - Apunta al backend en la IP local del servidor
NEXT_PUBLIC_API_BASE_URL=http://$local_ip:8000/api/v1

# App URL - URL del frontend para enlaces y redirecciones
NEXT_PUBLIC_APP_URL=http://$local_ip:3000

# Deshabilitar telemetría de Next.js
NEXT_TELEMETRY_DISABLED=1

# Configuración de desarrollo
NODE_ENV=development
EOF
    
    if [ $? -eq 0 ]; then
        log_success "✅ Archivo .env.local creado exitosamente"
        log_info "📍 API URL configurada: ${CYAN}http://$local_ip:8000/api/v1${NC}"
        log_info "📍 App URL configurada: ${CYAN}http://$local_ip:3000${NC}"
    else
        log_error "❌ Error al crear .env.local"
        return 1
    fi
    
    return 0
}

# =============================================================================
# ENVIRONMENT CLEANUP FUNCTIONS
# =============================================================================

kill_processes_on_port() {
    local port=$1
    local process_name=$2
    
    if command -v lsof &> /dev/null; then
        # Use lsof (more reliable)
        local pids=$(lsof -ti:$port 2>/dev/null)
        if [ -n "$pids" ]; then
            log_cleanup "Killing $process_name processes on port $port (PIDs: $pids)"
            echo "$pids" | xargs kill -9 2>/dev/null || true
            sleep 1
        fi
    else
        # Fallback for systems without lsof
        log_warning "lsof not available, using netstat fallback"
        local pids=$(netstat -tlnp 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d'/' -f1 2>/dev/null)
        if [ -n "$pids" ]; then
            log_cleanup "Killing $process_name processes on port $port"
            echo "$pids" | xargs kill -9 2>/dev/null || true
            sleep 1
        fi
    fi
}

cleanup_node_processes() {
    log_cleanup "Cleaning up Node.js/npm processes..."
    
    # Kill any running npm/node processes that might conflict
    pkill -f "npm.*dev" 2>/dev/null || true
    pkill -f "next.*dev" 2>/dev/null || true
    pkill -f "node.*next" 2>/dev/null || true
    
    # Clean npm cache if needed
    if [ -d "$FRONTEND_DIR/node_modules" ]; then
        log_cleanup "Clearing npm cache..."
        cd "$FRONTEND_DIR" && npm cache clean --force 2>/dev/null || true
        cd - > /dev/null
    fi
}

cleanup_docker_resources() {
    log_cleanup "Cleaning up Docker resources..."
    
    # Stop and remove any containers with project name
    local containers=$(docker ps -a --filter name="$PROJECT_NAME" --format "{{.ID}}" 2>/dev/null)
    if [ -n "$containers" ]; then
        log_cleanup "Removing existing project containers..."
        echo "$containers" | xargs docker rm -f 2>/dev/null || true
    fi
    
    # Clean up orphaned containers from docker-compose
    if [ -f "$COMPOSE_FILE" ]; then
        docker-compose down --remove-orphans 2>/dev/null || true
    fi
    
    # Remove unused networks (but keep system ones)
    docker network prune -f 2>/dev/null || true
    
    # Clean up any dangling volumes (optional - uncomment if needed)
    # docker volume prune -f 2>/dev/null || true
}

cleanup_tmux_sessions() {
    log_cleanup "Cleaning up tmux sessions..."
    
    # Kill all tmux sessions related to the project
    tmux list-sessions 2>/dev/null | grep "$TMUX_SESSION" | cut -d: -f1 | xargs -I{} tmux kill-session -t {} 2>/dev/null || true
    
    # Also kill any cactus-related sessions
    tmux list-sessions 2>/dev/null | grep -i "cactus" | cut -d: -f1 | xargs -I{} tmux kill-session -t {} 2>/dev/null || true
}

cleanup_ports() {
    log_cleanup "Cleaning up ports..."
    
    # Kill processes on key ports
    kill_processes_on_port 3000 "Frontend (Next.js)"
    kill_processes_on_port 8000 "Backend (FastAPI)"
    kill_processes_on_port 5432 "PostgreSQL"
    kill_processes_on_port 6379 "Redis (if used)"
    
    # Wait a moment for ports to be fully released
    sleep 2
}

verify_ports_free() {
    log_info "Verifying ports are free..."
    
    local ports=(3000 8000 5432)
    local occupied_ports=()
    
    for port in "${ports[@]}"; do
        if command -v lsof &> /dev/null; then
            if lsof -i:$port &> /dev/null; then
                occupied_ports+=($port)
            fi
        elif command -v netstat &> /dev/null; then
            if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
                occupied_ports+=($port)
            fi
        fi
    done
    
    if [ ${#occupied_ports[@]} -ne 0 ]; then
        log_warning "Ports still occupied: ${occupied_ports[*]}"
        log_info "Attempting force cleanup..."
        for port in "${occupied_ports[@]}"; do
            kill_processes_on_port $port "Remaining process"
        done
        sleep 2
    else
        log_success "All required ports are free!"
    fi
}

clean_environment() {
    log_command "🧹 PERFORMING COMPLETE ENVIRONMENT CLEANUP"
    echo -e "${YELLOW}${BOLD}This ensures a pristine start every time!${NC}"
    echo ""
    
    # Step 1: Kill tmux sessions first
    cleanup_tmux_sessions
    
    # Step 2: Stop and clean Docker resources
    cleanup_docker_resources
    
    # Step 3: Clean up Node.js processes
    cleanup_node_processes
    
    # Step 4: Free up ports
    cleanup_ports
    
    # Step 5: Verify everything is clean
    verify_ports_free
    
    # Step 6: Clean temporary files (optional)
    log_cleanup "Cleaning temporary files..."
    find . -name "*.tmp" -delete 2>/dev/null || true
    find . -name ".DS_Store" -delete 2>/dev/null || true
    
    log_success "Environment cleanup completed! 🎯"
    echo ""
}

# =============================================================================
# DEPENDENCY VERIFICATION
# =============================================================================

check_docker_daemon() {
    log_info "Checking Docker daemon status..."
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        log_warning "Docker daemon is not running!"
        
        # Detect OS and try to start Docker
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS - try to start Docker Desktop
            log_info "Attempting to start Docker Desktop on macOS..."
            
            # Check if Docker Desktop app exists
            if [ -d "/Applications/Docker.app" ]; then
                log_command "Starting Docker Desktop..."
                open -a Docker &
                
                # Wait for Docker to start (with timeout)
                local timeout=60
                local count=0
                log_info "Waiting for Docker daemon to start (timeout: ${timeout}s)..."
                
                while ! docker info &> /dev/null; do
                    if [ $count -ge $timeout ]; then
                        echo ""
                        log_error "Docker failed to start within ${timeout} seconds"
                        log_info "Troubleshooting steps:"
                        echo -e "  ${YELLOW}1.${NC} Manually open Docker Desktop"
                        echo -e "  ${YELLOW}2.${NC} Wait for Docker whale icon in menu bar"
                        echo -e "  ${YELLOW}3.${NC} Try running '${CYAN}docker${NC}' command again"
                        echo -e "  ${YELLOW}4.${NC} If issues persist, restart Docker Desktop"
                        return 1
                    fi
                    echo -ne "\r${CYAN}⏳ Starting Docker Desktop... ${count}s (Docker whale should appear in menu bar)${NC}"
                    sleep 2
                    ((count+=2))
                done
                echo ""
                log_success "Docker daemon is now running!"
                sleep 2  # Give Docker a moment to fully initialize
                
            else
                log_error "Docker Desktop not found in /Applications/"
                log_info "Please install Docker Desktop from: https://docs.docker.com/desktop/install/mac-install/"
                return 1
            fi
            
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux - try to start Docker service
            log_info "Attempting to start Docker service on Linux..."
            if command -v systemctl &> /dev/null; then
                sudo systemctl start docker
                sleep 3
                if docker info &> /dev/null; then
                    log_success "Docker service started!"
                else
                    log_error "Failed to start Docker service"
                    return 1
                fi
            else
                log_error "Cannot start Docker automatically on this Linux system"
                log_info "Please start Docker manually: sudo service docker start"
                return 1
            fi
            
        else
            log_error "Unknown OS type: $OSTYPE"
            log_info "Please start Docker manually and try again"
            return 1
        fi
        
    else
        log_success "Docker daemon is running!"
    fi
    
    return 0
}

check_dependencies() {
    log_info "Checking system dependencies..."
    
    local missing_deps=()
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        missing_deps+=("docker-compose")
    fi
    
    # Check tmux
    if ! command -v tmux &> /dev/null; then
        missing_deps+=("tmux")
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    fi
    
    # Check poetry (for backend)
    if ! command -v poetry &> /dev/null; then
        missing_deps+=("poetry")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing dependencies detected:"
        for dep in "${missing_deps[@]}"; do
            echo -e "${RED}  - ${dep}${NC}"
        done
        echo ""
        log_info "Please install the missing dependencies before continuing."
        return 1
    fi
    
    log_success "All dependencies are installed!"
    
    # Check Docker daemon after dependencies
    if ! check_docker_daemon; then
        return 1
    fi
    
    return 0
}

# =============================================================================
# SERVICE MANAGEMENT
# =============================================================================

start_services() {
    log_command "Starting Cactus Wealth Development Environment (Localhost Mode)..."
    
    # Check Docker daemon first
    if ! check_docker_daemon; then
        log_error "Cannot start services without Docker daemon"
        return 1
    fi
    
    # ALWAYS perform complete cleanup first
    clean_environment
    
    # Check if docker-compose.yml exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "docker-compose.yml not found in current directory!"
        return 1
    fi
    
    # Remove any existing LAN configuration
    if [ -f "$FRONTEND_DIR/.env.local" ]; then
        log_info "🗑️  Removiendo configuración LAN previa..."
        rm -f "$FRONTEND_DIR/.env.local"
    fi
    
    log_command "Starting Docker services in the background..."
    
    # Start Docker services with better error handling
    if ! docker-compose up -d; then
        log_error "Failed to start Docker services"
        log_info "Check your docker-compose.yml and try again"
        log_info "You can also try: docker-compose logs for more details"
        return 1
    fi
    
    # Wait a moment for services to start
    sleep 3
    
    log_command "Creating tmux session '$TMUX_SESSION'..."
    
    # Kill existing session if it exists
    tmux has-session -t "$TMUX_SESSION" 2>/dev/null && tmux kill-session -t "$TMUX_SESSION"
    
    # Create new tmux session with 3 panes
    tmux new-session -d -s "$TMUX_SESSION" -x 120 -y 40
    
    # Split window into 3 panes
    tmux split-window -h -t "$TMUX_SESSION"
    tmux split-window -v -t "$TMUX_SESSION:0.1"
    
    # Configure pane 0 (left): Backend logs
    tmux send-keys -t "$TMUX_SESSION:0.0" "echo 'Backend Logs (docker-compose logs -f backend):'; docker-compose logs -f backend" C-m
    
    # Configure pane 1 (top-right): Frontend development server
    tmux send-keys -t "$TMUX_SESSION:0.1" "cd $FRONTEND_DIR && echo 'Starting Frontend Development Server...' && npm run dev" C-m
    
    # Configure pane 2 (bottom-right): Interactive shell
    tmux send-keys -t "$TMUX_SESSION:0.2" "echo 'Interactive Shell - Ready for commands!'" C-m
    
    # Set pane titles
    tmux select-pane -t "$TMUX_SESSION:0.0" -T "Backend Logs"
    tmux select-pane -t "$TMUX_SESSION:0.1" -T "Frontend Server"
    tmux select-pane -t "$TMUX_SESSION:0.2" -T "Shell"
    
    log_success "Development environment started in LOCALHOST mode!"
    log_info "Tmux session '$TMUX_SESSION' created with 3 panes."
    log_info "Use '${YELLOW}logs${NC}' command to attach to the tmux session."
    
    echo ""
    echo -e "${GREEN}${BOLD}🚀 Services Status (Localhost):${NC}"
    echo -e "  ${CYAN}Frontend:${NC} http://localhost:3000 (Next.js)"
    echo -e "  ${CYAN}Backend:${NC}  http://localhost:8000 (FastAPI)"
    echo -e "  ${CYAN}Database:${NC} PostgreSQL on localhost:5432"
    echo -e "  ${CYAN}Logs:${NC}     Use '${YELLOW}logs${NC}' to monitor all services"
    echo ""
    echo -e "${YELLOW}⏳ Services are starting up... Use '${CYAN}api-test${YELLOW}' to verify backend health.${NC}"
    echo -e "${BLUE}💡 Para acceso LAN, usa '${YELLOW}start:lan${BLUE}' en su lugar.${NC}"
}

start_lan_services() {
    log_command "🌐 Starting Cactus Wealth LAN Server Mode..."
    
    # Check Docker daemon first
    if ! check_docker_daemon; then
        log_error "Cannot start services without Docker daemon"
        return 1
    fi
    
    # ALWAYS perform complete cleanup first
    clean_environment
    
    # Check if docker-compose.yml exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "docker-compose.yml not found in current directory!"
        return 1
    fi
    
    # Get local IP for LAN configuration
    log_command "🔍 Configurando acceso LAN..."
    local local_ip
    local_ip=$(get_local_ip)
    
    if [ -z "$local_ip" ]; then
        log_error "No se pudo obtener la IP local. Cancelando inicio LAN."
        return 1
    fi
    
    # Setup LAN environment configuration
    if ! setup_lan_environment "$local_ip"; then
        log_error "Error al configurar entorno LAN"
        return 1
    fi
    
    log_command "Starting Docker services in the background..."
    
    # Start Docker services with better error handling
    if ! docker-compose up -d; then
        log_error "Failed to start Docker services"
        log_info "Check your docker-compose.yml and try again"
        log_info "You can also try: docker-compose logs for more details"
        return 1
    fi
    
    # Wait a moment for services to start
    sleep 3
    
    log_command "Creating tmux session '$TMUX_SESSION'..."
    
    # Kill existing session if it exists
    tmux has-session -t "$TMUX_SESSION" 2>/dev/null && tmux kill-session -t "$TMUX_SESSION"
    
    # Create new tmux session with 3 panes
    tmux new-session -d -s "$TMUX_SESSION" -x 120 -y 40
    
    # Split window into 3 panes
    tmux split-window -h -t "$TMUX_SESSION"
    tmux split-window -v -t "$TMUX_SESSION:0.1"
    
    # Configure pane 0 (left): Backend logs
    tmux send-keys -t "$TMUX_SESSION:0.0" "echo 'Backend Logs (docker-compose logs -f backend):'; docker-compose logs -f backend" C-m
    
    # Configure pane 1 (top-right): Frontend development server with LAN binding
    tmux send-keys -t "$TMUX_SESSION:0.1" "cd $FRONTEND_DIR && echo 'Starting Frontend Development Server (LAN Mode)...' && npm run dev -- --hostname 0.0.0.0" C-m
    
    # Configure pane 2 (bottom-right): Interactive shell
    tmux send-keys -t "$TMUX_SESSION:0.2" "echo 'Interactive Shell - Ready for commands!'" C-m
    
    # Set pane titles
    tmux select-pane -t "$TMUX_SESSION:0.0" -T "Backend Logs"
    tmux select-pane -t "$TMUX_SESSION:0.1" -T "Frontend Server (LAN)"
    tmux select-pane -t "$TMUX_SESSION:0.2" -T "Shell"
    
    log_success "✅ Servidor Cactus Wealth iniciado en MODO DE RED LOCAL!"
    log_info "Tmux session '$TMUX_SESSION' created with 3 panes."
    log_info "Use '${YELLOW}logs${NC}' command to attach to the tmux session."
    
    echo ""
    echo -e "${GREEN}${BOLD}🌐 CACTUS WEALTH - SERVIDOR LAN ACTIVO${NC}"
    echo -e "${WHITE}${BOLD}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}${BOLD}📍 URL de Acceso para el Equipo:${NC}"
    echo -e "   ${WHITE}${BOLD}http://${local_ip}:3000${NC}"
    echo ""
    echo -e "${GREEN}${BOLD}🚀 Services Status (LAN Mode):${NC}"
    echo -e "  ${CYAN}Frontend:${NC} http://${local_ip}:3000 (Accesible desde toda la LAN)"
    echo -e "  ${CYAN}Backend:${NC}  http://${local_ip}:8000 (API accesible desde toda la LAN)"
    echo -e "  ${CYAN}Database:${NC} PostgreSQL on localhost:5432"
    echo -e "  ${CYAN}Logs:${NC}     Use '${YELLOW}logs${NC}' to monitor all services"
    echo ""
    echo -e "${YELLOW}${BOLD}📋 Instrucciones para el Equipo:${NC}"
    echo -e "  ${WHITE}1.${NC} Comparte esta URL con tu equipo: ${CYAN}${BOLD}http://${local_ip}:3000${NC}"
    echo -e "  ${WHITE}2.${NC} Asegúrate de que tu firewall permite conexiones en el puerto 3000"
    echo -e "  ${WHITE}3.${NC} El equipo puede acceder desde cualquier dispositivo en la misma red WiFi/Ethernet"
    echo ""
    echo -e "${RED}${BOLD}🛡️  Configuración del Firewall:${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo -e "  ${YELLOW}macOS:${NC} System Preferences > Security & Privacy > Firewall"
        echo -e "         Añadir excepción para el puerto 3000"
    else
        echo -e "  ${YELLOW}Linux:${NC} sudo ufw allow 3000/tcp"
        echo -e "         o configurar iptables según tu distribución"
    fi
    echo ""
    echo -e "${BLUE}⏳ Services are starting up... Use '${CYAN}api-test${BLUE}' to verify backend health.${NC}"
    echo -e "${WHITE}${BOLD}═══════════════════════════════════════════════════════════${NC}"
}

stop_services() {
    log_command "Stopping all services..."
    
    # Use our comprehensive cleanup functions
    cleanup_tmux_sessions
    cleanup_docker_resources
    cleanup_node_processes
    cleanup_ports
    
    log_success "All services stopped and cleaned!"
}

restart_services() {
    log_command "Restarting all services..."
    stop_services
    sleep 2
    start_services
}

restart_lan_services() {
    log_command "🌐 Restarting all services in LAN mode..."
    stop_services
    sleep 2
    start_lan_services
}

rebuild_services() {
    log_command "Rebuilding Docker images..."
    
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "docker-compose.yml not found!"
        return 1
    fi
    
    docker-compose build --no-cache
    log_success "Docker images rebuilt!"
    
    restart_services
}

# =============================================================================
# DEBUGGING TOOLS
# =============================================================================

# =============================================================================
# ADVANCED OBSERVABILITY & DEBUGGING SYSTEM
# =============================================================================

# Enhanced error highlighting for log output
highlight_errors() {
    grep --line-buffered -E "(ERROR|FATAL|CRITICAL|Exception|Traceback|Failed|failed|FAILED)" --color=always |
    sed -u 's/\(ERROR\|FATAL\|CRITICAL\)/\x1b[41;1;37m&\x1b[0m/g' |
    sed -u 's/\(WARNING\|WARN\)/\x1b[43;1;30m&\x1b[0m/g' |
    sed -u 's/\(Exception\|Traceback\)/\x1b[45;1;37m&\x1b[0m/g'
}

# Enhanced info highlighting for log output  
highlight_info() {
    grep --line-buffered -E "(INFO|DEBUG|Starting|Started|Success|Completed|Ready)" --color=always |
    sed -u 's/\(SUCCESS\|Success\|Completed\|Ready\)/\x1b[42;1;37m&\x1b[0m/g' |
    sed -u 's/\(INFO\|Starting\|Started\)/\x1b[44;1;37m&\x1b[0m/g'
}

# Combined highlighting pipeline
highlight_logs() {
    sed -u 's/\(ERROR\|FATAL\|CRITICAL\)/\x1b[41;1;37m&\x1b[0m/g' |
    sed -u 's/\(WARNING\|WARN\)/\x1b[43;1;30m&\x1b[0m/g' |
    sed -u 's/\(Exception\|Traceback\|Failed\|failed\|FAILED\)/\x1b[45;1;37m&\x1b[0m/g' |
    sed -u 's/\(SUCCESS\|Success\|Completed\|Ready\)/\x1b[42;1;30m&\x1b[0m/g' |
    sed -u 's/\(INFO\|Starting\|Started\)/\x1b[46;1;30m&\x1b[0m/g' |
    sed -u 's/\(DEBUG\)/\x1b[47;1;30m&\x1b[0m/g'
}

# Create God View - Multi-service tmux layout
create_god_view() {
    local session_name="cactus-god-view"
    
    log_command "🚀 Launching Cactus God View - Multi-Service Debugging Console"
    
    # Kill existing god view session if it exists
    tmux kill-session -t "$session_name" 2>/dev/null || true
    
    # Create new session with main window
    tmux new-session -d -s "$session_name" -n "god-view"
    
    # Split into 4 panes (2x2 grid)
    tmux split-window -h -t "$session_name:0"
    tmux split-window -v -t "$session_name:0.0"
    tmux split-window -v -t "$session_name:0.1"
    
    # Setup pane titles and commands
    tmux send-keys -t "$session_name:0.0" "echo -e '${CYAN}${BOLD}=== BACKEND LOGS ===${NC}'" C-m
    tmux send-keys -t "$session_name:0.0" "docker-compose logs -f backend 2>&1 | sed -u 's/\(ERROR\|FATAL\|CRITICAL\)/\x1b[41;1;37m&\x1b[0m/g' | sed -u 's/\(WARNING\|WARN\)/\x1b[43;1;30m&\x1b[0m/g'" C-m
    
    tmux send-keys -t "$session_name:0.1" "echo -e '${GREEN}${BOLD}=== DATABASE LOGS ===${NC}'" C-m  
    tmux send-keys -t "$session_name:0.1" "docker-compose logs -f db 2>&1 | sed -u 's/\(ERROR\|FATAL\|CRITICAL\)/\x1b[41;1;37m&\x1b[0m/g'" C-m
    
    tmux send-keys -t "$session_name:0.2" "echo -e '${YELLOW}${BOLD}=== ARQ WORKER LOGS ===${NC}'" C-m
    tmux send-keys -t "$session_name:0.2" "docker-compose logs -f arq_worker 2>&1 | sed -u 's/\(ERROR\|FATAL\|CRITICAL\)/\x1b[41;1;37m&\x1b[0m/g' | sed -u 's/\(SUCCESS\|Success\|Completed\)/\x1b[42;1;30m&\x1b[0m/g'" C-m
    
    tmux send-keys -t "$session_name:0.3" "echo -e '${MAGENTA}${BOLD}=== REDIS LOGS ===${NC}'" C-m
    tmux send-keys -t "$session_name:0.3" "docker-compose logs -f redis 2>&1" C-m
    
    # Set pane borders and labels
    tmux set-option -t "$session_name" status-bg black
    tmux set-option -t "$session_name" status-fg white
    tmux set-option -t "$session_name" status-left "#[fg=green,bold][GOD VIEW] "
    tmux set-option -t "$session_name" status-right "#[fg=yellow]%Y-%m-%d %H:%M:%S"
    
    log_success "🌟 God View created! Attaching to session..."
    log_info "Use 'Ctrl+B, D' to detach | 'Ctrl+B, Q' to show pane numbers"
    
    # Attach to the session
    tmux attach-session -t "$session_name"
}

# Enhanced stats monitoring with sub-commands
show_container_stats() {
    local args="$*"
    local mode
    
    # Parse first argument as mode
    if [ -n "$args" ]; then
        mode=$(echo "$args" | awk '{print $1}')
    else
        mode=""
    fi
    
    log_command "📊 Container Resource Monitoring"
    
    # Check if any containers are running
    local running_containers=$(docker-compose ps --format json 2>/dev/null | jq -r '.Name' 2>/dev/null || docker-compose ps --format table | tail -n +2 | awk '{print $1}' | grep -v '^$')
    
    if [ -z "$running_containers" ]; then
        log_warning "No containers are currently running. Use '${YELLOW}start${NC}' command first."
        return 1
    fi
    
    echo -e "${CYAN}${BOLD}"
    echo "┌─────────────────────────────────────────────────────────────────────────────┐"
    echo "│                          🌵 CACTUS WEALTH STATS                            │"  
    echo "├─────────────────────────────────────────────────────────────────────────────┤"
    echo "│ Container Resource Usage (CPU/Memory/Network/Block I/O)                    │"
    echo "└─────────────────────────────────────────────────────────────────────────────┘"
    echo -e "${NC}"
    
    case "$mode" in
        "watch"|"live"|"w")
            log_info "Live monitoring mode - Press Ctrl+C to exit"
            log_info "Updates every 2 seconds with color-coded alerts"
            sleep 1
            # Live stats with alerts (red for high CPU/Memory usage)
            docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}" $(echo "$running_containers" | tr '\n' ' ')
            ;;
        "once"|"o"|"")
            log_info "One-time snapshot - Use 'stats watch' for live monitoring"
            # Show stats once and exit
            timeout 3 docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}" $(echo "$running_containers" | tr '\n' ' ')
            echo ""
            echo -e "${YELLOW}💡 TIP: Use '${GREEN}stats watch${YELLOW}' for live monitoring${NC}"
            ;;
        "help"|"h")
            echo -e "${YELLOW}Stats sub-commands:${NC}"
            echo -e "  ${GREEN}stats${NC}       - One-time resource snapshot"
            echo -e "  ${GREEN}stats watch${NC} - Live monitoring (updates every 2s)"
            echo -e "  ${GREEN}stats once${NC}  - One-time snapshot (alias)"
            echo -e "  ${GREEN}stats help${NC}  - Show this help"
            ;;
        *)
            log_warning "Unknown stats sub-command: '$mode'"
            echo -e "${YELLOW}Available sub-commands: once, watch, help${NC}"
            ;;
    esac
}

# Advanced logs command handler with sub-commands
handle_logs_command() {
    local args="$*"
    local subcommand
    
    # Parse first argument as subcommand
    if [ -n "$args" ]; then
        subcommand=$(echo "$args" | awk '{print $1}')
    else
        subcommand=""
    fi
    
    case "$subcommand" in
        "all"|"god"|"godview")
            create_god_view
            ;;
        "backend"|"be")
            log_command "📋 Backend Logs (Enhanced with Error Highlighting)"
            if docker-compose ps backend | grep -q "Up"; then
                log_info "Press Ctrl+C to exit logs. Errors will be highlighted in RED."
                docker-compose logs -f backend 2>&1 | highlight_logs
            else
                log_error "Backend container is not running. Use '${YELLOW}start${NC}' command first."
            fi
            ;;
        "database"|"db")
            log_command "🗄️  Database Logs (Enhanced with Error Highlighting)" 
            if docker-compose ps db | grep -q "Up"; then
                log_info "Press Ctrl+C to exit logs. Errors will be highlighted in RED."
                docker-compose logs -f db 2>&1 | highlight_logs
            else
                log_error "Database container is not running. Use '${YELLOW}start${NC}' command first."
            fi
            ;;
        "worker"|"arq")
            log_command "⚙️  ARQ Worker Logs (Enhanced with Error Highlighting)"
            if docker-compose ps arq_worker | grep -q "Up"; then
                log_info "Press Ctrl+C to exit logs. Errors will be highlighted in RED."
                docker-compose logs -f arq_worker 2>&1 | highlight_logs
            else
                log_error "ARQ Worker container is not running. Use '${YELLOW}start${NC}' command first."
            fi
            ;;
        "redis")
            log_command "📡 Redis Logs"
            if docker-compose ps redis | grep -q "Up"; then
                log_info "Press Ctrl+C to exit logs."
                docker-compose logs -f redis
            else
                log_error "Redis container is not running. Use '${YELLOW}start${NC}' command first."
            fi
            ;;
        "errors"|"err")
            log_command "🚨 Error-Only Logs (All Services)"
            log_info "Showing only ERROR, WARNING, EXCEPTION logs from all services..."
            docker-compose logs -f 2>&1 | grep -E "(ERROR|WARNING|WARN|Exception|Traceback|FAILED|Failed|failed)" | highlight_logs
            ;;
        "live"|"watch")
            log_command "🔍 Live Log Monitoring (All Services with Highlighting)"
            log_info "Real-time monitoring of all services. Press Ctrl+C to exit."
            docker-compose logs -f 2>&1 | highlight_logs
            ;;
        "")
            # Default behavior - attach to tmux session (backward compatibility)
            attach_to_logs
            ;;
        *)
            log_warning "Unknown logs sub-command: '$subcommand'"
            echo -e "${YELLOW}Available sub-commands:${NC}"
            echo -e "  ${GREEN}logs${NC}           - Attach to tmux session (default)"
            echo -e "  ${GREEN}logs all${NC}       - 🌟 God View (multi-panel tmux)"
            echo -e "  ${GREEN}logs backend${NC}   - Backend logs with error highlighting"
            echo -e "  ${GREEN}logs database${NC}  - Database logs with error highlighting"  
            echo -e "  ${GREEN}logs worker${NC}    - ARQ Worker logs with error highlighting"
            echo -e "  ${GREEN}logs redis${NC}     - Redis logs"
            echo -e "  ${GREEN}logs errors${NC}    - Error-only logs from all services"
            echo -e "  ${GREEN}logs live${NC}      - Live monitoring of all services"
            ;;
    esac
}

# Legacy function for backward compatibility
attach_to_logs() {
    if tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
        log_info "Attaching to tmux session '$TMUX_SESSION'..."
        log_info "Use 'Ctrl+B, D' to detach from tmux session."
        tmux attach-session -t "$TMUX_SESSION"
    else
        log_warning "No active tmux session found. Use '${YELLOW}start${NC}' command first."
        echo -e "${CYAN}💡 TIP: Try '${YELLOW}logs all${CYAN}' for the enhanced God View!${NC}"
    fi
}

connect_to_database() {
    log_command "Connecting to database: $DB_NAME as user: $DB_USER"
    
    # Check if database container is running
    if ! docker-compose ps db | grep -q "Up"; then
        log_error "Database container is not running. Use '${YELLOW}start${NC}' command first."
        return 1
    fi
    
    # Connect to PostgreSQL
    docker-compose exec db psql -U "$DB_USER" -d "$DB_NAME"
}

api_health_test() {
    log_command "Testing API health endpoint..."
    
    # Check if backend is running
    if ! docker-compose ps backend | grep -q "Up"; then
        log_error "Backend container is not running. Use '${YELLOW}start${NC}' command first."
        return 1
    fi
    
    echo -e "${CYAN}Sending request to: ${BACKEND_URL}/health${NC}"
    
    # Perform health check
    if curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health" | grep -q "200"; then
        log_success "API is healthy! ✨"
        echo -e "${GREEN}Response:${NC}"
        curl -s "$BACKEND_URL/health" | python3 -m json.tool 2>/dev/null || curl -s "$BACKEND_URL/health"
    else
        log_error "API health check failed. Check backend logs."
        echo -e "${YELLOW}Full response:${NC}"
        curl -v "$BACKEND_URL/health" 2>&1 || true
    fi
}

# =============================================================================
# TESTING & QUALITY ASSURANCE
# =============================================================================

log_test_start() {
    echo -e "${CYAN}${BOLD}🧪 ${1}${NC}"
}

log_test_success() {
    echo -e "${GREEN}${BOLD}✅ PASSED${NC} - ${1}"
}

log_test_failure() {
    echo -e "${RED}${BOLD}❌ FAILED${NC} - ${1}"
}

log_test_info() {
    echo -e "${BLUE}🔍 ${1}${NC}"
}

check_services_running() {
    if ! docker-compose ps backend | grep -q "Up" || ! docker-compose ps db | grep -q "Up"; then
        log_error "Services are not running. Use '${YELLOW}start${NC}' command first."
        return 1
    fi
    return 0
}

run_backend_tests() {
    log_test_start "Running Backend Tests (pytest)"
    
    # Check if backend container is running
    if ! check_services_running; then
        return 1
    fi
    
    log_test_info "Executing pytest inside backend container..."
    
    if docker-compose exec -T backend poetry run pytest tests/ -v --tb=short; then
        log_test_success "Backend tests completed"
        return 0
    else
        log_test_failure "Backend tests failed"
        return 1
    fi
}

run_frontend_tests() {
    log_test_start "Running Frontend Tests (Jest/Vitest)"
    
    if [ ! -d "$FRONTEND_DIR" ]; then
        log_error "Frontend directory not found: $FRONTEND_DIR"
        return 1
    fi
    
    log_test_info "Executing npm test in frontend directory..."
    
    cd "$FRONTEND_DIR"
    if npm test; then
        log_test_success "Frontend tests completed"
        cd ..
        return 0
    else
        log_test_failure "Frontend tests failed"
        cd ..
        return 1
    fi
}

run_e2e_tests() {
    log_test_start "Running End-to-End Tests (Playwright)"
    
    # Check if services are running
    if ! check_services_running; then
        return 1
    fi
    
    # Wait for frontend to be ready
    log_test_info "Waiting for frontend to be ready..."
    local timeout=30
    local count=0
    
    while ! curl -s http://localhost:3000 > /dev/null; do
        if [ $count -ge $timeout ]; then
            log_test_failure "Frontend not ready after ${timeout}s"
            return 1
        fi
        sleep 1
        ((count++))
    done
    
    log_test_info "Frontend is ready, starting E2E tests..."
    
    if [ ! -d "$FRONTEND_DIR" ]; then
        log_error "Frontend directory not found: $FRONTEND_DIR"
        return 1
    fi
    
    cd "$FRONTEND_DIR"
    if npx playwright test; then
        log_test_success "E2E tests completed"
        cd ..
        return 0
    else
        log_test_failure "E2E tests failed"
        cd ..
        return 1
    fi
}

format_code() {
    log_test_start "Formatting Code (Ruff + Prettier)"
    
    local format_failed=false
    
    # Format backend with Ruff
    log_test_info "Formatting backend code with Ruff..."
    if docker-compose exec -T backend poetry run ruff format .; then
        log_test_success "Backend code formatted"
    else
        log_test_failure "Backend formatting failed"
        format_failed=true
    fi
    
    # Format frontend with Prettier
    log_test_info "Formatting frontend code with Prettier..."
    if [ -d "$FRONTEND_DIR" ]; then
        cd "$FRONTEND_DIR"
        if npm run format; then
            log_test_success "Frontend code formatted"
        else
            log_test_failure "Frontend formatting failed"
            format_failed=true
        fi
        cd ..
    fi
    
    if [ "$format_failed" = true ]; then
        return 1
    fi
    
    log_test_success "Code formatting completed"
    return 0
}

lint_code() {
    log_test_start "Linting Code (Ruff + ESLint)"
    
    local lint_failed=false
    
    # Lint backend with Ruff
    log_test_info "Linting backend code with Ruff..."
    if docker-compose exec -T backend poetry run ruff check .; then
        log_test_success "Backend linting passed"
    else
        log_test_failure "Backend linting failed"
        lint_failed=true
    fi
    
    # Lint frontend with ESLint
    log_test_info "Linting frontend code with ESLint..."
    if [ -d "$FRONTEND_DIR" ]; then
        cd "$FRONTEND_DIR"
        if npm run lint; then
            log_test_success "Frontend linting passed"
        else
            log_test_failure "Frontend linting failed"
            lint_failed=true
        fi
        cd ..
    fi
    
    if [ "$lint_failed" = true ]; then
        return 1
    fi
    
    log_test_success "Code linting completed"
    return 0
}

run_quality_check() {
    log_test_start "Running Complete Quality Check"
    echo -e "${YELLOW}${BOLD}🔥 This is the HOLY GRAIL of code quality!${NC}"
    echo ""
    
    local start_time=$(date +%s)
    local steps=("format_code" "lint_code" "run_backend_tests" "run_frontend_tests" "run_e2e_tests")
    local step_names=("Code Formatting" "Code Linting" "Backend Tests" "Frontend Tests" "E2E Tests")
    local failed_step=""
    
    for i in "${!steps[@]}"; do
        echo -e "${CYAN}${BOLD}Step $((i+1))/5: ${step_names[i]}${NC}"
        echo -e "${CYAN}────────────────────────────────────────${NC}"
        
        if ! ${steps[i]}; then
            failed_step="${step_names[i]}"
            break
        fi
        
        echo ""
    done
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════${NC}"
    
    if [ -n "$failed_step" ]; then
        log_test_failure "Quality check failed at: $failed_step"
        echo -e "${RED}${BOLD}💥 Fix the issues above before proceeding!${NC}"
        return 1
    else
        log_test_success "All quality checks passed! 🎉"
        echo -e "${GREEN}${BOLD}🚀 Your code is ready for integration!${NC}"
        echo -e "${CYAN}⏱️  Total time: ${duration}s${NC}"
        return 0
    fi
}

# =============================================================================
# DATABASE MANAGEMENT
# =============================================================================

db_migrate() {
    log_command "Running database migrations..."
    
    # Check if backend container is running
    if ! check_services_running; then
        return 1
    fi
    
    log_info "Executing Alembic upgrade head..."
    
    if docker-compose exec -T backend poetry run alembic upgrade head; then
        log_success "Database migrations completed successfully! ✨"
        return 0
    else
        log_error "Database migration failed!"
        log_info "Check the migration files and database connection"
        return 1
    fi
}

db_new_migration() {
    local migration_name="$1"
    
    if [ -z "$migration_name" ]; then
        log_error "Migration name is required!"
        log_info "Usage: db:new-migration <migration_name>"
        log_info "Example: db:new-migration add_user_preferences"
        return 1
    fi
    
    # Check if backend container is running
    if ! check_services_running; then
        return 1
    fi
    
    log_command "Creating new migration: $migration_name"
    
    if docker-compose exec -T backend poetry run alembic revision --autogenerate -m "$migration_name"; then
        log_success "Migration file created successfully!"
        log_info "Review the generated migration file before running db:migrate"
        log_info "Location: cactus-wealth-backend/alembic/versions/"
        return 0
    else
        log_error "Failed to create migration!"
        return 1
    fi
}

db_reset() {
    log_command "🚨 DATABASE RESET - This will destroy all data!"
    echo -e "${RED}${BOLD}WARNING: This operation will:${NC}"
    echo -e "  ${RED}• Stop all services${NC}"
    echo -e "  ${RED}• Delete the database container and volume${NC}"
    echo -e "  ${RED}• Recreate a fresh database${NC}"
    echo -e "  ${RED}• Run all migrations${NC}"
    echo -e "  ${RED}• Seed test data (if available)${NC}"
    echo ""
    
    read -p "Are you absolutely sure? Type 'RESET' to confirm: " confirmation
    
    if [ "$confirmation" != "RESET" ]; then
        log_info "Database reset cancelled."
        return 0
    fi
    
    log_command "Starting database reset process..."
    
    # Step 1: Stop services
    log_info "Step 1/6: Stopping services..."
    docker-compose stop
    
    # Step 2: Remove database container
    log_info "Step 2/6: Removing database container..."
    docker-compose rm -f db
    
    # Step 3: Remove database volume
    log_info "Step 3/6: Removing database volume..."
    local volume_name="${PROJECT_NAME}_postgres_data"
    docker volume rm "$volume_name" 2>/dev/null || true
    
    # Step 4: Recreate database container
    log_info "Step 4/6: Recreating database container..."
    docker-compose up -d db
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    sleep 10
    
    # Step 5: Run migrations
    log_info "Step 5/6: Running migrations..."
    if ! db_migrate; then
        log_error "Failed to run migrations after reset!"
        return 1
    fi
    
    # Step 6: Seed test data (if script exists)
    log_info "Step 6/6: Seeding test data..."
    if [ -f "$BACKEND_DIR/create_test_data.py" ]; then
        log_info "Found test data script, executing..."
        if docker-compose exec -T backend python create_test_data.py; then
            log_success "Test data seeded successfully!"
        else
            log_warning "Test data seeding failed, but reset completed"
        fi
    else
        log_info "No test data script found, skipping..."
    fi
    
    log_success "Database reset completed! 🎯"
    log_info "You may want to restart services with: start"
    
    return 0
}

# =============================================================================
# QUALITY AUTOMATION & GIT HOOKS
# =============================================================================

quality_install_hooks() {
    log_command "Installing Git hooks for automated code quality..."
    
    # Check if frontend directory exists
    if [ ! -d "$FRONTEND_DIR" ]; then
        log_error "Frontend directory not found: $FRONTEND_DIR"
        return 1
    fi
    
    # Check if package.json exists
    if [ ! -f "$FRONTEND_DIR/package.json" ]; then
        log_error "package.json not found in frontend directory"
        return 1
    fi
    
    cd "$FRONTEND_DIR"
    
    log_info "Step 1/5: Installing husky and lint-staged..."
    if ! npm install --save-dev husky lint-staged; then
        log_error "Failed to install husky and lint-staged"
        cd ..
        return 1
    fi
    
    log_info "Step 2/5: Configuring lint-staged in package.json..."
    
    # Create a temporary script to add lint-staged config
    cat > /tmp/add_lint_staged.js << 'EOF'
const fs = require('fs');
const path = process.argv[2];
const packageJson = JSON.parse(fs.readFileSync(path, 'utf8'));

packageJson['lint-staged'] = {
  "*.{js,jsx,ts,tsx}": ["prettier --write", "eslint --fix"],
  "*.{json,md,yml,yaml}": ["prettier --write"]
};

packageJson.scripts = packageJson.scripts || {};
packageJson.scripts['lint-staged'] = 'lint-staged';

fs.writeFileSync(path, JSON.stringify(packageJson, null, 2) + '\n');
console.log('✅ lint-staged configuration added to package.json');
EOF
    
    if node /tmp/add_lint_staged.js package.json; then
        log_success "lint-staged configuration added!"
    else
        log_error "Failed to configure lint-staged"
        cd ..
        return 1
    fi
    
    rm /tmp/add_lint_staged.js
    
    log_info "Step 3/5: Initializing husky..."
    if ! npx husky install; then
        log_error "Failed to initialize husky"
        cd ..
        return 1
    fi
    
    log_info "Step 4/5: Creating pre-commit hook..."
    mkdir -p .husky
    cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run lint-staged for frontend
cd cactus-wealth-frontend && npm run lint-staged

# Run backend formatting check
cd ../cactus-wealth-backend
if docker-compose ps backend | grep -q "Up"; then
    echo "🐍 Checking backend code formatting..."
    if ! docker-compose exec -T backend poetry run ruff check --diff .; then
        echo "❌ Backend code formatting issues detected!"
        echo "💡 Run 'format' command to fix automatically"
        exit 1
    fi
else
    echo "⚠️  Backend container not running, skipping backend checks"
fi
EOF
    
    chmod +x .husky/pre-commit
    
    log_info "Step 5/5: Adding prepare script to package.json..."
    cat > /tmp/add_prepare.js << 'EOF'
const fs = require('fs');
const path = process.argv[2];
const packageJson = JSON.parse(fs.readFileSync(path, 'utf8'));

packageJson.scripts = packageJson.scripts || {};
packageJson.scripts.prepare = 'husky install';

fs.writeFileSync(path, JSON.stringify(packageJson, null, 2) + '\n');
console.log('✅ prepare script added to package.json');
EOF
    
    node /tmp/add_prepare.js package.json
    rm /tmp/add_prepare.js
    
    cd ..
    
    log_success "Git hooks installed successfully! 🎣"
    echo -e "${GREEN}${BOLD}✨ Quality automation is now active!${NC}"
    echo -e "${CYAN}Features enabled:${NC}"
    echo -e "  • ${GREEN}Automatic code formatting before commits${NC}"
    echo -e "  • ${GREEN}ESLint fixes for JavaScript/TypeScript${NC}"
    echo -e "  • ${GREEN}Backend Ruff formatting validation${NC}"
    echo -e "  • ${GREEN}Prettier formatting for JSON, MD, YAML${NC}"
    echo ""
    log_info "Your next commits will automatically format code! 🚀"
    
    return 0
}

# =============================================================================
# DEPENDENCY MANAGEMENT
# =============================================================================

deps_audit() {
    log_command "Running security audit on all dependencies..."
    
    local audit_failed=false
    
    # Frontend audit
    log_info "🔍 Auditing frontend dependencies (npm audit)..."
    if [ -d "$FRONTEND_DIR" ]; then
        cd "$FRONTEND_DIR"
        echo -e "${CYAN}📦 Frontend Audit Results:${NC}"
        echo -e "${CYAN}═══════════════════════════${NC}"
        if npm audit; then
            log_success "Frontend dependencies are secure!"
        else
            log_warning "Frontend dependencies have security issues"
            log_info "Run 'npm audit fix' to attempt automatic fixes"
            audit_failed=true
        fi
        cd ..
        echo ""
    else
        log_warning "Frontend directory not found, skipping frontend audit"
    fi
    
    # Backend audit
    log_info "🔍 Auditing backend dependencies (poetry check)..."
    if [ -d "$BACKEND_DIR" ]; then
        cd "$BACKEND_DIR"
        echo -e "${CYAN}🐍 Backend Audit Results:${NC}"
        echo -e "${CYAN}═══════════════════════════${NC}"
        if poetry check; then
            log_success "Backend dependencies are valid!"
        else
            log_warning "Backend dependencies have issues"
            audit_failed=true
        fi
        
        # Additional poetry security audit if available
        log_info "Checking for poetry security plugins..."
        if poetry run safety --version &>/dev/null; then
            log_info "Running safety security scan..."
            if poetry run safety check; then
                log_success "No known security vulnerabilities found!"
            else
                log_warning "Security vulnerabilities detected in backend dependencies"
                audit_failed=true
            fi
        else
            log_info "💡 Tip: Install 'safety' for enhanced security scanning:"
            log_info "   poetry add --group dev safety"
        fi
        cd ..
        echo ""
    else
        log_warning "Backend directory not found, skipping backend audit"
    fi
    
    if [ "$audit_failed" = true ]; then
        log_error "Security audit completed with issues found"
        echo -e "${YELLOW}${BOLD}🛡️  Recommended actions:${NC}"
        echo -e "  • Review all reported vulnerabilities"
        echo -e "  • Update vulnerable packages to safe versions"
        echo -e "  • Consider using 'deps:update-interactive' for guided updates"
        return 1
    else
        log_success "All dependencies passed security audit! 🛡️"
        return 0
    fi
}

deps_update_interactive() {
    log_command "Interactive dependency updates..."
    
    # Frontend updates
    log_info "🔍 Checking frontend dependency updates..."
    if [ -d "$FRONTEND_DIR" ]; then
        cd "$FRONTEND_DIR"
        
        # Check if npm-check-updates is available
        if ! command -v ncu &> /dev/null; then
            log_info "Installing npm-check-updates globally..."
            npm install -g npm-check-updates
        fi
        
        echo -e "${CYAN}📦 Frontend Update Analysis:${NC}"
        echo -e "${CYAN}═══════════════════════════${NC}"
        log_info "Available updates for frontend dependencies:"
        ncu
        
        echo ""
        read -p "Do you want to run interactive frontend updates? (y/N): " update_frontend
        if [[ "$update_frontend" =~ ^[Yy]$ ]]; then
            log_info "Starting interactive frontend updates..."
            ncu -i
            log_info "Don't forget to run 'npm install' after updates!"
        fi
        cd ..
        echo ""
    else
        log_warning "Frontend directory not found, skipping frontend updates"
    fi
    
    # Backend updates
    log_info "🔍 Backend dependency management..."
    if [ -d "$BACKEND_DIR" ]; then
        echo -e "${CYAN}🐍 Backend Dependencies Info:${NC}"
        echo -e "${CYAN}═══════════════════════════${NC}"
        log_info "Current backend dependency status:"
        cd "$BACKEND_DIR"
        poetry show --outdated
        cd ..
        
        echo ""
        echo -e "${YELLOW}${BOLD}⚠️  Backend Update Notice:${NC}"
        echo -e "  • Backend dependencies should be updated carefully"
        echo -e "  • Review CHANGELOG and breaking changes before updating"
        echo -e "  • Test thoroughly after any updates"
        echo ""
        echo -e "${CYAN}Manual update commands:${NC}"
        echo -e "  • ${YELLOW}poetry update${NC} - Update all dependencies"
        echo -e "  • ${YELLOW}poetry update <package>${NC} - Update specific package"
        echo -e "  • ${YELLOW}poetry add <package>@latest${NC} - Add/update to latest version"
        
    else
        log_warning "Backend directory not found, skipping backend analysis"
    fi
    
    log_success "Dependency analysis completed!"
    log_info "Remember to test thoroughly after any updates"
    
    return 0
}

# =============================================================================
# STATIC CODE ANALYSIS
# =============================================================================

analyze_dead_code() {
    log_command "🔧 Analyzing codebase for unused code..."
    local vulture_failed=false
    local ts_prune_failed=false

    # --- Backend Analysis ---
    log_info "ℹ 🔍 Analyzing backend for dead code (vulture)..."
    if [ ! -f "$BACKEND_DIR/pyproject.toml" ]; then
        log_warning "pyproject.toml not found in $BACKEND_DIR. Skipping backend analysis."
    else
        # Asegurarse que vulture está instalado en el grupo dev sin reinstalar todo cada vez
        (cd "$BACKEND_DIR" && poetry run vulture --version > /dev/null 2>&1 || (log_info "Installing vulture..." && poetry add vulture --group dev))
        
        # Ejecutar vulture apuntando SOLO a los directorios de código fuente y tests
        if ! (cd "$BACKEND_DIR" && poetry run vulture src/ tests/ --min-confidence 80); then
            log_warning "Vulture found potential dead code in the backend."
            vulture_failed=true
        else
            log_success "✅ No significant dead code found in the backend."
        fi
    fi
    
    # --- Frontend Analysis ---
    log_info "ℹ 🔍 Analyzing frontend for dead code (ts-prune)..."
    if [ ! -f "$FRONTEND_DIR/package.json" ]; then
        log_warning "package.json not found in $FRONTEND_DIR. Skipping frontend analysis."
    else
        # Asegurarse que ts-prune está instalado
        (cd "$FRONTEND_DIR" && npm list ts-prune > /dev/null 2>&1 || (log_info "Installing ts-prune..." && npm install --save-dev ts-prune))
        
        if ! (cd "$FRONTEND_DIR" && npx ts-prune); then
            log_warning "ts-prune found potential dead code in the frontend."
            ts_prune_failed=true
        else
            log_success "✅ No significant dead code found in the frontend."
        fi
    fi

    echo # Salto de línea

    if [ "$vulture_failed" = true ] || [ "$ts_prune_failed" = true ]; then
        log_error "🔥 Dead code analysis finished with warnings. Please review the output above."
        return 1
    else
        log_success "🎉 Dead code analysis completed successfully. Code looks clean!"
    fi
}

# =============================================================================
# HELP SYSTEM
# =============================================================================

show_help() {
    echo -e "${CYAN}${BOLD}🌵 Cactus Wealth - Development Console${NC}"
    echo -e "${WHITE}Available Commands:${NC}"
    echo ""
    
    echo -e "${YELLOW}${BOLD}🚀 Development Services:${NC}"
    echo -e "${GREEN}  start${NC}      - Start all services (Localhost mode)"
    echo -e "${GREEN}  start:lan${NC}  - 🌐 Start LAN server mode (accesible desde toda la red)"
    echo -e "${GREEN}  stop${NC}       - Stop all services and containers"
    echo -e "${GREEN}  restart${NC}    - Restart all services (stop + start)"
    echo -e "${GREEN}  restart:lan${NC}- 🌐 Restart in LAN mode"
    echo -e "${GREEN}  rebuild${NC}    - Rebuild Docker images and restart services"
    echo -e "${GREEN}  logs [cmd]${NC}  - 🌟 Advanced logging system with sub-commands"
    echo -e "${GREEN}  stats${NC}      - 📊 Real-time container resource monitoring"
    echo ""
    
    echo -e "${YELLOW}${BOLD}🧪 Testing & Quality:${NC}"
    echo -e "${GREEN}  test:be${NC}    - Run backend tests (pytest in Docker)"
    echo -e "${GREEN}  test:fe${NC}    - Run frontend tests (Jest/Vitest)"
    echo -e "${GREEN}  test:e2e${NC}   - Run end-to-end tests (Playwright)"
    echo -e "${GREEN}  format${NC}     - Format code (Ruff + Prettier)"
    echo -e "${GREEN}  lint${NC}       - Lint code (Ruff + ESLint)"
    echo -e "${RED}${BOLD}  check${NC}${RED}${BOLD}      - 🔥 RUN ALL QUALITY CHECKS (Holy Grail!)${NC}"
    echo ""
    
    echo -e "${YELLOW}${BOLD}🗃️  Database Management:${NC}"
    echo -e "${GREEN}  db:migrate${NC} - Apply pending database migrations"
    echo -e "${GREEN}  db:new-migration <name>${NC} - Create new migration file"
    echo -e "${RED}${BOLD}  db:reset${NC}   - ${RED}🚨 DESTRUCTIVE: Reset database completely${NC}"
    echo ""
    
    echo -e "${YELLOW}${BOLD}🛡️  Maintenance & Analysis:${NC}"
    echo -e "${GREEN}  quality:install-hooks${NC} - Setup automated pre-commit quality checks"
    echo -e "${GREEN}  deps:audit${NC} - Security audit of all dependencies"
    echo -e "${GREEN}  deps:update-interactive${NC} - Interactive dependency updates"
    echo -e "${GREEN}  analyze:dead-code${NC} - Find unused code (vulture + ts-prune)"
    echo ""
    
    echo -e "${YELLOW}${BOLD}🔍 Advanced Observability & Debugging:${NC}"
    echo -e "${GREEN}  logs${NC}           - Attach to tmux session (legacy mode)"
    echo -e "${GREEN}  logs all${NC}       - 🌟 God View: Multi-panel tmux with all services"
    echo -e "${GREEN}  logs backend${NC}   - Backend logs with error highlighting"
    echo -e "${GREEN}  logs database${NC}  - Database logs with error highlighting"
    echo -e "${GREEN}  logs worker${NC}    - ARQ Worker logs with error highlighting"
    echo -e "${GREEN}  logs redis${NC}     - Redis logs"
    echo -e "${GREEN}  logs errors${NC}    - Error-only logs from all services"
    echo -e "${GREEN}  logs live${NC}      - Live monitoring with highlighting"
    echo -e "${GREEN}  stats${NC}          - 📊 Real-time container resource monitoring"
    echo ""
    
    echo -e "${YELLOW}${BOLD}🛠️  Debug & Utils:${NC}"
    echo -e "${GREEN}  clean${NC}      - 🧹 Force cleanup environment (ports, processes, containers)"
    echo -e "${GREEN}  docker${NC}     - 🐳 Check and start Docker daemon if needed"
    echo -e "${GREEN}  db${NC}         - Connect to the PostgreSQL database shell"
    echo -e "${GREEN}  api-test${NC}   - Test the backend API health endpoint"
    echo -e "${GREEN}  help${NC}       - Show this help message"
    echo -e "${GREEN}  exit${NC}       - Exit the development console"
    echo ""
    
    echo -e "${YELLOW}${BOLD}🌐 Modo Servidor LAN:${NC}"
    echo -e "  • ${CYAN}${BOLD}start:lan${NC} configura automáticamente la aplicación para acceso desde toda la red local"
    echo -e "  • Detecta automáticamente tu IP local (192.168.x.x, 10.x.x.x, etc.)"
    echo -e "  • Configura CORS y variables de entorno para permitir acceso remoto"
    echo -e "  • Ideal para demos, trabajo colaborativo o acceso desde múltiples dispositivos"
    echo -e "  • ⚠️  Asegúrate de que tu firewall permite conexiones en el puerto 3000"
    echo ""
    
    echo -e "${YELLOW}${BOLD}💡 Pro Tips:${NC}"
    echo -e "  • ${CYAN}${BOLD}start${NC} (localhost) vs ${CYAN}${BOLD}start:lan${NC} (red local)"
    echo -e "  • ${CYAN}${BOLD}start${NC} command automatically cleans environment first! 🧹"
    echo -e "  • ${CYAN}${BOLD}start${NC} can automatically start Docker Desktop if needed 🐳"
    echo -e "  • Use ${CYAN}Ctrl+B, D${NC} to detach from tmux session"
    echo -e "  • ${RED}${BOLD}🌟 logs all${NC} creates God View with 4-panel monitoring!"
    echo -e "  • ${RED}${BOLD}🚨 logs errors${NC} shows only critical issues across all services"
    echo -e "  • ${RED}${BOLD}📊 stats${NC} provides real-time resource monitoring like htop for containers"
    echo -e "  • Run ${RED}${BOLD}check${NC} before every commit/push"
    echo -e "  • Use ${CYAN}quality:install-hooks${NC} for automated quality on every commit 🎣"
    echo -e "  • Use ${CYAN}deps:audit${NC} regularly to check for security vulnerabilities 🛡️"
    echo -e "  • Run ${CYAN}analyze:dead-code${NC} to find unused code and clean up 🔬"
    echo -e "  • ${RED}${BOLD}db:reset${NC} is destructive - use with extreme caution!"
    echo ""
    
    echo -e "${YELLOW}${BOLD}🔗 Service URLs:${NC}"
    echo -e "  • Frontend: ${CYAN}http://localhost:3000${NC}"
    echo -e "  • Backend API: ${CYAN}http://localhost:8000${NC}"
    echo -e "  • Database: ${CYAN}PostgreSQL on localhost:5432${NC}"
    echo ""
}

# =============================================================================
# MAIN INTERACTIVE LOOP
# =============================================================================

main_loop() {
    local prompt="${CYAN}🌵 ${YELLOW}CactusDev${CYAN}> ${NC}"
    
    while true; do
        echo -en "$prompt"
        read -r command args
        
        case "$command" in
            # Development Services
            "start")
                start_services
                ;;
            "start:lan")
                start_lan_services
                ;;
            "stop")
                stop_services
                ;;
            "restart")
                restart_services
                ;;
            "restart:lan")
                restart_lan_services
                ;;
            "rebuild")
                rebuild_services
                ;;
            "logs")
                handle_logs_command $args
                ;;
            "stats")
                show_container_stats $args
                ;;
            
            # Testing & Quality
            "test:be")
                run_backend_tests
                ;;
            "test:fe")
                run_frontend_tests
                ;;
            "test:e2e")
                run_e2e_tests
                ;;
            "format")
                format_code
                ;;
            "lint")
                lint_code
                ;;
            "check")
                run_quality_check
                ;;
            
            # Database Management
            "db:migrate")
                db_migrate
                ;;
            "db:new-migration")
                db_new_migration "$args"
                ;;
            "db:reset")
                db_reset
                ;;
            
            # Quality Automation & Maintenance
            "quality:install-hooks")
                quality_install_hooks
                ;;
            "deps:audit")
                deps_audit
                ;;
            "deps:update-interactive")
                deps_update_interactive
                ;;
            "analyze:dead-code")
                analyze_dead_code
                ;;
            
            # Debug & Utils
            "clean")
                clean_environment
                ;;
            "docker")
                check_docker_daemon
                ;;
            "db")
                connect_to_database
                ;;
            "api-test")
                api_health_test
                ;;
            "help"|"h"|"?")
                show_help
                ;;
            "exit"|"quit"|"q")
                log_info "Goodbye! 👋"
                break
                ;;
            "")
                # Empty command, do nothing
                ;;
            *)
                log_warning "Unknown command: '$command'"
                echo -e "Type '${YELLOW}help${NC}' to see available commands."
                ;;
        esac
        
        echo ""  # Add spacing between commands
    done
}

# =============================================================================
# ENTRY POINT
# =============================================================================

main() {
    # Clear screen and show banner
    clear
    print_banner
    
    # Check dependencies
    if ! check_dependencies; then
        exit 1
    fi
    
    echo ""
    
    # Start interactive loop
    main_loop
}

# Script execution starts here
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 