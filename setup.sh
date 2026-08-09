#!/bin/bash

set -e  # If anything fails, stop immediately

echo "-------------------------------------------------------"
echo "🚀 Initializing Cloud IDE Orchestration"
echo "-------------------------------------------------------"

# 0. Prerequisites Check & Setup
echo "🔍 Step 0: Checking prerequisites and preparing host..."
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found! Please create it before running."
    exit 1
fi

# Ensure the workspace volume directory exists and has permissions
mkdir -p /home/sanampreet/ide-projects
# 777 ensures the Node container and Workspace container can both read/write to it
chmod 777 /home/sanampreet/ide-projects


# 1. Build the Blueprint Image
# This is the 'ide-workspace' that the backend will spawn for users
echo "🛠️  Step 1: Building the Master Workspace Image (ide-workspace)..."
docker build -t ide-workspace:latest ./workspace

# 2. Build the Infrastructure
# This builds the Gateway (Nginx), Backend (Manager), and Frontend (UI)
echo "📦 Step 2: Building Infrastructure Services..."
docker compose build

# 3. Clean up dangling images to save space
echo "🧹 Step 3: Cleaning up build artifacts..."
docker image prune -f

echo "-------------------------------------------------------"
echo "🌐 Step 4: Launching the IDE..."
docker compose up -d

echo "-------------------------------------------------------"
echo "🎉 SUCCESS!"
echo "IDE is now live at: http://localhost"
echo "-------------------------------------------------------"
echo "To view logs, run: docker compose logs -f"
