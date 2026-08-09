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

# Load VOLUME_BASE_PATH if available, or fallback to user home ide-projects
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

TARGET_VOL_PATH="${VOLUME_BASE_PATH:-/home/sanampreetsingh/ide-projects}"

# Ensure the workspace volume directory exists and has permissions
mkdir -p "$TARGET_VOL_PATH" 2>/dev/null || true
chmod 777 "$TARGET_VOL_PATH" 2>/dev/null || true


# 1. Build the Blueprint Image
# This is the 'ide-workspace' that the backend will spawn for users
echo "🛠️  Step 1: Building the Master Workspace Image (ide-workspace)..."
docker build -t ide-workspace:latest ./workspace

# 2. Build Frontend Assets & Infrastructure Services
echo "📦 Step 2: Building Frontend Bundle and Infrastructure Services..."
(cd frontend && npm run build)
docker compose build

# 3. Clean up dangling images to save space
echo "🧹 Step 3: Cleaning up build artifacts..."
docker image prune -f

echo "-------------------------------------------------------"
echo "🌐 Step 4: Launching the IDE with force recreation..."
docker compose up -d --force-recreate

echo "-------------------------------------------------------"
echo "🎉 SUCCESS!"
echo "IDE is now live at: http://localhost"
echo "-------------------------------------------------------"
echo "To view logs, run: docker compose logs -f"
