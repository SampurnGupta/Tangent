#!/usr/bin/env bash
# ==============================================================================
# Tangent — Oracle Cloud Always-Free ARM VM Setup Script
# Configures Ollama with Llama 3.2 3B on Ubuntu 22.04 / 24.04 (Ampere A1)
# ==============================================================================

set -euo pipefail

echo "==> 1. Updating packages and installing prerequisites..."
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl ufw

echo "==> 2. Installing Ollama..."
curl -fsSL https://ollama.com/install.sh | sh

echo "==> 3. Configuring Ollama service to listen on all interfaces (port 11434)..."
sudo mkdir -p /etc/systemd/system/ollama.service.d/
cat << 'EOF' | sudo tee /etc/systemd/system/ollama.service.d/override.conf
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_ORIGINS=*"
EOF

sudo systemctl daemon-reload
sudo systemctl restart ollama

echo "==> 4. Pulling Llama 3.2 3B model (~2.0 GB)..."
ollama pull llama3.2:3b

echo "==> 5. Opening firewall port 11434..."
sudo ufw allow 11434/tcp || true
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 11434 -j ACCEPT || true

echo "==> Setup completed successfully!"
echo "Test from local machine: curl http://<YOUR_VM_PUBLIC_IP>:11434/api/tags"
