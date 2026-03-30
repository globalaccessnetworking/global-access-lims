#!/bin/bash

# Bacteriophage LIMS - Linux VPS Setup Script (Ubuntu/Debian)
# This script installs Node.js, PostgreSQL, Nginx, and PM2.

echo "--- Updating System Packages ---"
sudo apt update && sudo apt upgrade -y

echo "--- Installing Essential Build Tools ---"
sudo apt install -y build-essential git curl wget libpng-dev libjpeg-dev libwebp-dev

echo "--- Installing Node.js (v20 LTS) ---"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

echo "--- Installing PostgreSQL ---"
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql

echo "--- Installing PM2 (Process Manager) ---"
sudo npm install -g pm2

echo "--- Installing Nginx (Reverse Proxy) ---"
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

echo "--- Initializing Project Directories ---"
# Note: You should run this script from the project root after cloning
npm install
cd server && npm install
cd ../client && npm install

echo "--- Setup Complete! ---"
echo "Next steps:"
echo "1. Configure your PostgreSQL database and user."
echo "2. Copy .env.example to .env and update DB credentials."
echo "3. Run 'pm2 start ecosystem.config.js' to start the LIMS."
echo "4. Configure Nginx to point to your backend/frontend ports."
