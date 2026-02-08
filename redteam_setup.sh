#!/bin/bash

# ==============================================================================
#  SCRIPT DE PROVISIONAMIENTO: RED TEAM & PURPLE TEAM LAB
#  Autor: DevSecOps Engineer (Automated)
#  Target: Debian / Ubuntu / Kali Linux
#  Version: 1.0.0
# ==============================================================================

# ============================
#  1. CONSTANTES & CONFIG
# ============================
INSTALL_DIR="/opt/redteam"
LOG_FILE="/var/log/redteam_setup.log"
TIMESTAMP=$(date +'%Y-%m-%d %H:%M:%S')

# Colores para output
R='\033[0;31m'
G='\033[0;32m'
Y='\033[1;33m'
B='\033[0;34m'
NC='\033[0m' # No Color

# ============================
#  2. FUNCIONES DE UTILIDAD
# ============================

log() {
    local type="$1"
    local message="$2"
    echo -e "[${TIMESTAMP}] [${type}] ${message}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${B}[INFO]${NC} $1"
    log "INFO" "$1"
}

success() {
    echo -e "${G}[OK]${NC} $1"
    log "SUCCESS" "$1"
}

warn() {
    echo -e "${Y}[WARN]${NC} $1"
    log "WARN" "$1"
}

error() {
    echo -e "${R}[ERROR]${NC} $1"
    log "ERROR" "$1"
    exit 1
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "Este script debe ejecutarse como root (sudo)."
    fi
}

error_handler() {
    local line_no=$1
    local command=$2
    error "Fallo en línea $line_no: comando '$command'"
}

trap 'error_handler ${LINENO} "$BASH_COMMAND"' ERR

# ============================
#  3. INICIO DE CONFIGURACIÓN
# ============================

setup_start() {
    check_root
    info "Iniciando provisionamiento del Laboratorio Red Team..."
    info "Logs guardados en $LOG_FILE"
    
    # Crear estructura de directorios
    if [ ! -d "$INSTALL_DIR" ]; then
        mkdir -p "$INSTALL_DIR"/{recon,c2,post-exploit,purple,payloads}
        success "Directorio $INSTALL_DIR creado."
    fi
}

# ============================
#  4. ACTUALIZACIÓN & DEPS
# ============================

system_update() {
    info "Actualizando repositorios y sistema operativo..."
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq && apt-get upgrade -y -qq
    success "Sistema actualizado."
}

install_dependencies() {
    info "Instalando dependencias base..."
    deps=(
        git curl wget unzip zip
        python3 python3-pip python3-venv
        golang-go build-essential
        apt-transport-https gnupg
        software-properties-common
        jq libpcap-dev
    )
    
    apt-get install -y "${deps[@]}" 2>>"$LOG_FILE"
    success "Dependencias básicas instaladas."
}

install_docker() {
    if ! command -v docker &> /dev/null; then
        info "Instalando Docker & Docker Compose..."
        curl -fsSL https://get.docker.com | sh
        systemctl enable docker
        systemctl start docker
        success "Docker instalado."
    else
        warn "Docker ya está instalado."
    fi
    
    # Docker Compose Plugin (v2)
    apt-get install -y docker-compose-plugin
}

# ============================
#  5. FASE 1: RECONOCIMIENTO
# ============================

install_recon() {
    info "--- FASE: RECONOCIMIENTO ---"
    
    # Nmap & Masscan
    apt-get install -y nmap masscan 2>>"$LOG_FILE"
    success "Nmap & Masscan instalados."

    # Amass (Go)
    if ! command -v amass &> /dev/null; then
        info "Compilando Amass (esto puede tardar)..."
        go install -v github.com/owasp-amass/amass/v4/...@master 2>>"$LOG_FILE"
        # Linkear al PATH si es necesario (GOPATH/bin suele estar en path pero por si acaso)
        ln -sf ~/go/bin/amass /usr/local/bin/amass
        success "Amass instalado."
    fi

    # Sublist3r
    if [ ! -d "$INSTALL_DIR/recon/Sublist3r" ]; then
        info "Clonando Sublist3r..."
        git clone https://github.com/aboul3la/Sublist3r.git "$INSTALL_DIR/recon/Sublist3r" 2>>"$LOG_FILE"
        pip3 install -r "$INSTALL_DIR/recon/Sublist3r/requirements.txt" 2>>"$LOG_FILE"
        success "Sublist3r instalado."
    fi
}

# ============================
#  6. FASE 2: EXPLOTACIÓN & C2
# ============================

install_c2() {
    info "--- FASE: C2 & WEAPONIZATION ---"

    # Metasploit
    if ! command -v msfconsole &> /dev/null; then
        info "Instalando Metasploit Framework..."
        curl https://raw.githubusercontent.com/rapid7/metasploit-omnibus/master/config/templates/metasploit-framework-wrappers/msfupdate.erb > msfinstall
        chmod 755 msfinstall
        ./msfinstall
        rm msfinstall
        success "Metasploit instalado."
    fi

    # Sliver C2
    if [ ! -f "/usr/local/bin/sliver-server" ]; then
        info "Instalando Sliver C2..."
        curl https://sliver.sh/install | bash
        success "Sliver instalado."
    fi
    
    # Covenant (Docker) - Optional
    if [ ! -d "$INSTALL_DIR/c2/Covenant" ]; then
        info "Clonando Covenant (Docker)..."
        git clone --recurse-submodules https://github.com/cobbr/Covenant "$INSTALL_DIR/c2/Covenant" 2>>"$LOG_FILE"
        # No buildeamos automáticamenet para ahorrar tiempo, dejamos listo.
        success "Covenant clonado en $INSTALL_DIR/c2 (Requiere 'docker-compose up')."
    fi
}

# ============================
#  7. FASE 3: POST-EXPLOTACIÓN
# ============================

install_post_exploit() {
    info "--- FASE: POST-EXPLOTACIÓN ---"

    # Impacket
    info "Instalando Impacket..."
    if [ ! -d "$INSTALL_DIR/post-exploit/impacket" ]; then
        git clone https://github.com/fortra/impacket.git "$INSTALL_DIR/post-exploit/impacket" 2>>"$LOG_FILE"
        cd "$INSTALL_DIR/post-exploit/impacket"
        pip3 install . 2>>"$LOG_FILE"
        cd - > /dev/null
        success "Impacket instalado."
    fi

    # BloodHound & Neo4j
    info "Instalando BloodHound & Neo4j..."
    apt-get install -y bloodhound neo4j 2>>"$LOG_FILE"
    # Pip ingestor
    pip3 install bloodhound --break-system-packages 2>>"$LOG_FILE"
    success "BloodHound instalado."

    # Mimikatz (Safety Check: Downloading Malware)
    # Creamos carpeta aislada
    MIMI_DIR="$INSTALL_DIR/post-exploit/mimikatz"
    mkdir -p "$MIMI_DIR"
    info "Descargando Mimikatz (Trunk)..."
    wget -q --show-progress "https://github.com/gentilkiwi/mimikatz/releases/latest/download/mimikatz_trunk.zip" -O "$MIMI_DIR/mimikatz.zip"
    unzip -o "$MIMI_DIR/mimikatz.zip" -d "$MIMI_DIR" > /dev/null
    rm "$MIMI_DIR/mimikatz.zip"
    success "Mimikatz descargado en $MIMI_DIR."

    # Evil-WinRM
    gem install evil-winrm 2>>"$LOG_FILE"
    success "Evil-WinRM instalado."
}

# ============================
#  8. FASE 4: PURPLE TEAM
# ============================

install_purple() {
    info "--- FASE: PURPLE TEAM / EMULACIÓN ---"

    # PowerShell (Required for Atomic Red Team)
    if ! command -v pwsh &> /dev/null; then
        info "Instalando PowerShell para Linux..."
        # Método genérico para Debian/Ubuntu
        # Asumiendo distro compatible con apt packages de Microsoft
        wget -q "https://packages.microsoft.com/config/debian/11/packages-microsoft-prod.deb"
        dpkg -i packages-microsoft-prod.deb
        rm packages-microsoft-prod.deb
        apt-get update
        apt-get install -y powershell
    else 
        success "Powershell ya instalado."
    fi

    # Atomic Red Team
    if [ ! -d "$INSTALL_DIR/purple/atomic-red-team" ]; then
        info "Clonando Atomic Red Team..."
        git clone https://github.com/redcanaryco/atomic-red-team.git "$INSTALL_DIR/purple/atomic-red-team" 2>>"$LOG_FILE"
        
        info "Instalando Invoke-AtomicRedTeam (PowerShell module)..."
        pwsh -c "IEX (IWR 'https://raw.githubusercontent.com/redcanaryco/invoke-atomicredteam/master/install-atomicredteam.ps1' -UseBasicParsing); Install-AtomicRedTeam -getAtomics -Force" 2>>"$LOG_FILE"
        success "Atomic Red Team & Invoke-AtomicRedTeam instalados."
    fi
}

# ============================
#  9. FINALIZACIÓN
# ============================

cleanup() {
    info "Limpiando paquetes..."
    apt-get autoremove -y 2>>"$LOG_FILE"
}

main() {
    setup_start
    system_update
    install_dependencies
    install_docker
    install_recon
    install_c2
    install_post_exploit
    install_purple
    cleanup
    
    echo -e "${G}=================================================${NC}"
    echo -e "${G}   LABORATORIO RED TEAM COMPLETADO CORRECTAMENTE ${NC}"
    echo -e "${G}=================================================${NC}"
    echo -e "Directorio Base: ${B}$INSTALL_DIR${NC}"
    echo -e "Reporte de log:  ${B}$LOG_FILE${NC}"
    echo -e "Recuerda configurar Neo4j ejecutando: ${Y}neo4j console${NC}"
    echo ""
}

main
