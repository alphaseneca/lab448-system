# Lab448 – Local Development Guide (No Docker)

This guide walks you through setting up the Lab448 system for development **without Docker**. This allows for faster startup times and **hot reloading** (automatic updates when you change code).

---

## 1. Prerequisites

You need the following installed on your machine:

- **Node.js** (v18 or newer)
- **npm** (comes with Node.js)
- **PostgreSQL** (v14 or newer)

---

## 2. PostgreSQL Setup

1.  **Install PostgreSQL**: Download and install it from [postgresql.org](https://www.postgresql.org/download/).
2.  **Create Database**: Open `pgAdmin` or use the command line (`psql`) to create a new database:
    ```sql
    CREATE DATABASE lab448_database;
    ```
3.  **Note your credentials**: You will need your PostgreSQL username (usually `postgres`) and password.

---

## 3. Project Configuration

### 3.1 Backend Setup
1.  Navigate to the `backend` folder:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file from the example:
    - **Windows (PowerShell)**: `Copy-Item .env.example .env`
    - **Linux/bash**: `cp .env.example .env`
4.  Edit `backend/.env` and update the `DATABASE_URL`:
    ```env
    DATABASE_URL="postgresql://lab448_admin:YOUR_PASSWORD@localhost:5432/lab448_database?schema=public"
    ```

### 3.2 Frontend Setup
1.  Navigate to the `frontend` folder:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

---

## 4. One-Time Database Initialization

Before running the app for the first time, you must sync the database and seed the roles:

```bash
cd backend
npm run db:sync
npm run db:seed-roles
npm run db:seed-categories
```

**Create the first admin user**:
```bash
node src/scripts/create-admin.js admin@example.com YourSecurePassword Administrator
```

---

## 5. Running the App (Fast Mode)

Instead of using Docker, use the provided script in the project root to start both the backend and frontend with one command.

### Windows
Run the batch file:
```powershell
.\run-dev.bat
```

### Linux / macOS
Make the script executable and run it:
```bash
chmod +x run-dev.sh
./run-dev.sh
```

### What this does:
- Starts the **Backend** on [http://localhost:4000](http://localhost:4000) (with `nodemon` for hot-reloads).
- Starts the **Frontend** on [http://localhost:5173](http://localhost:5173) (with Vite).
- You can access the app at [http://localhost:5173](http://localhost:5173).

---

## 6. Accessing Logs

- **Backend**: Logs will appear in the terminal window where you ran the script. If you use a process manager like `pm2` later, use `pm2 logs`.
- **Frontend**: Vite logs (build errors, etc.) will also appear in the same or adjacent terminal window.

### Seeing Database Logs
To see SQL queries in the terminal, ensure `NODE_ENV` is not set to `production` in `backend/.env`. Sequelize will log all queries to the console by default.
