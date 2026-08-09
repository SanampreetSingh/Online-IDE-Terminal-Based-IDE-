# 🚀 Multi-Tenant Cloud IDE (Terminal-Based Cloud Workspace)

[![Docker](https://img.shields.io/badge/Docker-Containers-blue.svg)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-v22-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18-cyan.svg)](https://react.dev/)
[![Nginx](https://img.shields.io/badge/Nginx-Reverse%20Proxy-darkgreen.svg)](https://nginx.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A state-of-the-art **Multi-Tenant Cloud IDE** that enables developers to write code, manage files, execute bash commands in isolated Docker containers, and perform zero-config live web application previews—all directly inside the browser.

---

## ✨ Features Overview

- 🔒 **Container-Isolated Sandboxes:** Each registered user receives a dedicated Debian Linux workspace container (`ide-workspace:latest` with non-root `codeuser`, C++, Python, and Node.js 22 toolchains).
- 📝 **Monaco VS-Dark Code Editor:** Full-featured VS Code-like editor supporting syntax highlighting (JS, TS, C++, Python, HTML, CSS, JSON, Shell, Markdown), tab switching, and `Ctrl+S` auto-save.
- ⚡ **Interactive Terminal Shell:** Real-time terminal shell over WebSockets using `Xterm.js` connected to `node-pty` / Docker execution streams inside the container, with auto-reconnection and permission chown sync.
- 📂 **Real-Time Host Volume Sync:** File tree explorer allows creating, opening, editing, renaming, and deleting files persisted directly on host storage (`/home/sanampreetsingh/ide-projects/<userId>`).
- 🌐 **Zero-Config Dynamic Web Previews:** Reverse-proxies user web applications (Vite, React, Express) on any port (`/preview/<user_id>/?port=5173`) with Nginx cookie port persistence, `<base>` tag injection, and asset URL rewriting.
- 🎨 **Modern Framer Motion Auth System:** Dual sliding panel login/register page with 6-digit Nodemailer email OTP verification, forgot password flow, and Google OAuth JWT cookies.

---

## 🏗️ Architecture & Technology Stack

```text
                                  ┌───────────────────────────────┐
                                  │   Browser / Client Developer  │
                                  └──────────────┬────────────────┘
                                                 │ HTTP / WebSockets (Port 80)
                                                 ▼
                                  ┌───────────────────────────────┐
                                  │   Nginx Gateway (ide-gateway) │
                                  └──────┬─────────────────┬──────┘
                                         │                 │
                      /api/* & /socket.io│                 │ /preview/<user_id>/
                                         ▼                 ▼
                        ┌────────────────────────┐   ┌──────────────────────────────┐
                        │ Express Backend Manager│   │ User Workspace Container     │
                        │ (Container & File API) │   │ (ide-user-<userId>:5173/3000)│
                        └──────────┬─────────────┘   └──────────────────────────────┘
                                   │ Docker Socket
                                   ▼
                        ┌────────────────────────┐
                        │ Docker Engine Daemon   │
                        └────────────────────────┘
```

- **Frontend:** React, Redux Toolkit, Framer Motion, Monaco Editor (`@monaco-editor/react`), Xterm.js, Tailwind CSS, Sonner Toasts.
- **Backend:** Node.js, Express, Dockerode, Socket.io, Mongoose (MongoDB), Bcryptjs, Nodemailer.
- **Infrastructure:** Docker Compose, Nginx Alpine Reverse Proxy, Tini init supervisor.

---

## ⚡ Quick Start & Setup

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- Node.js v18+ (for local development)

### 1-Command Automated Launch

Simply run the included `setup.sh` script to build master images, configure permissions, and launch the Docker Compose stack:

```bash
chmod +x setup.sh
./setup.sh
```

Once the script completes, open your browser and navigate to:
👉 **`http://localhost`**

---

## 🔑 Environment Variables (`.env`)

Create or update `.env` in the root directory with the following variables:

```env
# Infrastructure Ports
HTTP_PORT=80
BACKEND_PORT=5000
DOCKER_RESOLVER=127.0.0.11

# Domain & Networking
DOMAIN_NAME=localhost
CLIENT_MAX_BODY_SIZE=50M
WORKER_CONNECTIONS=1024

# Security & Database
JWT_SECRET=your_super_secret_jwt_key
MONGO_URI=mongodb://localhost:27017/cloud_ide

# Persistent User Workspaces
VOLUME_BASE_PATH=/home/sanampreetsingh/ide-projects

# Email Dispatcher (Nodemailer OTP)
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password

# Google OAuth (Single Client ID definition used by both Backend and Frontend)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}

# Frontend Gateway URL
VITE_GATEWAY_URL=http://localhost
```

---

## 🛠️ API Reference

### Auth Endpoints (`/api/auth`)
- `POST /api/auth/login` - Authenticate with email and password.
- `POST /api/auth/send-otp` - Send 6-digit verification code to user email.
- `POST /api/auth/register` - Create account using name, email, password, and 6-digit OTP.
- `POST /api/auth/forgot-password` - Reset account password with 6-digit OTP.
- `POST /api/auth/google` - Exchange Google OAuth token for JWT session cookie.
- `GET /api/auth/me` - Fetch authenticated user profile.

### Workspace Endpoints (`/api/workspace`)
- `POST /api/workspace/start` - Spawn or resume isolated Docker container.
- `POST /api/workspace/stop` - Stop active user container.
- `GET /api/workspace/status` - Inspect current container lifecycle state.

### File Operations (`/api/files`)
- `GET /api/files/tree` - Retrieve complete workspace directory tree.
- `GET /api/files/read?path=<file>` - Read UTF-8 file contents.
- `POST /api/files/write` - Write text to file (auto-creates parent folders).
- `POST /api/files/create` - Create new file or folder (`type: 'file' | 'directory'`).
- `DELETE /api/files/delete` - Remove file or directory.
- `PUT /api/files/rename` - Move or rename entry.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
