# Lab448 Repair Shop – Deployment Guide

This guide covers running the app in production using **Docker** and exposing it securely via **Cloudflare Tunnel**.

---

## 1. Quick Start (Docker)

Docker Compose runs the backend and PostgreSQL automatically.

1.  **Environment Setup**:
    - **Windows**: `Copy-Item .env.docker.example .env`
    - **Linux**: `cp .env.docker.example .env`
2.  **Edit `.env`**: Set `POSTGRES_PASSWORD`, `JWT_SECRET`, and `HTTP_PORT` (default 8080).
3.  **Create Data Folder**:
    - **Windows/Linux**: `mkdir -p ./data/postgres`
    - **Linux (Permissions)**: `sudo chown -R 999:999 ./data/postgres`
4.  **Start the System**:
    ```bash
    docker compose up -d --build
    ```

---

## 2. First-Time Setup (New DB only)

Run these once if you are starting with a fresh database:

```bash
# Sync database tables
docker compose exec backend npm run db:sync

# Seed initial data
docker compose exec backend npm run db:seed-roles
docker compose exec backend npm run db:seed-categories

# Create admin user
docker compose exec backend node src/scripts/create-admin.js admin@example.com YourPassword Admin
```

---

## 3. Cloudflare Tunnel (Expose to Internet)

To expose your local system to the internet without opening ports on your router:

### 3.1 Installation
- **Windows**: Download `cloudflared-windows-amd64.msi` from [Cloudflare](https://github.com/cloudflare/cloudflared/releases).
- **Linux (Ubuntu/Debian)**:
  ```bash
  curl -L https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
  echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared-ascii.repo.cloudflare.com/cloudflared-pkg-repo $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
  sudo apt-get update && sudo apt-get install cloudflared
  ```

### 3.2 Configuration (Dashboard Method)
1.  Go to [Cloudflare Zero Trust Dashboard](https://dash.cloudflare.com/).
2.  **Networks** -> **Tunnels** -> **Create a Tunnel**.
3.  Install the connector on your machine following the instructions.
4.  **Public Hostname**:
    - **Subdomain**: `repair` (or your choice)
    - **Domain**: `yourdomain.com`
    - **Service Type**: `HTTP`
    - **URL**: `localhost:8080` (or your `HTTP_PORT`)

---

## 4. Viewing Logs

### Docker Logs
- **All services**: `docker compose logs -f`
- **Backend only**: `docker compose logs -f backend`
- **Database only**: `docker compose logs -f postgres`

### Local Setup Logs (Non-Docker)
- Logs for the local development server are printed directly to the terminal where you ran `./run-dev.sh` or `run-dev.bat`.
- If using `run-dev.sh`, you can also check `backend.log` and `frontend.log` in the project root.

---

## 5. Common Commands

| Action | Command |
| :--- | :--- |
| Stop System | `docker compose down` |
| View Status | `docker compose ps` |
| Rebuild App | `docker compose up -d --build` |
| Restart App | `docker compose restart backend` |
| DB Shell | `docker compose exec postgres psql -U lab448_admin -d lab448_database` |

---

## 6. Troubleshooting

- **Port Conflict**: If 8080 is busy, change `HTTP_PORT` in `.env` and restart.
- **Permission Denied (Linux)**: Ensure the `data/postgres` folder is owned by UID 999 (`sudo chown -R 999:999 ./data/postgres`).
- **Cannot Reach API**: Ensure you are using the correct port defined in `HTTP_PORT`.
