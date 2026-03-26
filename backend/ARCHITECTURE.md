# Backend Architecture Guide — Lab448 System

This document outlines the purpose of the core files and directories within the backend to ensure a maintainable and consistent codebase.

## Core Files

### [server.js](file:///home/aurelius/Documents/lab448-system/backend/src/server.js)
The **entry point** of the application. Its responsibilities include:
- Initializing the Express application.
- Configuring global middleware (CORS, body parsing, logging, security headers).
- Establishing and testing the database connection lifecycle via Sequelize.
- Mounting the main router paths (e.g., `/api`).
- Starting the HTTP server listener.

### [config.js](file:///home/aurelius/Documents/lab448-system/backend/src/config.js)
The **environment & settings** hub.
- All `process.env` lookups and defaulted settings (like `PORT`, `JWT_SECRET`, or `SMS_MESSAGES`) live here.
- It contains system constants that are likely to change based on the environment or business needs (like `QR_LABEL` dimensions or `FRONTDESK_CHARGE`).

## Core Directories

### [models/](file:///home/aurelius/Documents/lab448-system/backend/src/models)
Houses the Sequelize data layer.
- `index.js`: The **single source of truth** for the database connection (`sequelize` instance) and model registration/associations.
- `databaseConfig.js`: Used by both the application and the Sequelize CLI for migrations.

### [routes/](file:///home/aurelius/Documents/lab448-system/backend/src/routes)
Defines the API structure and maps endpoints to controller functions.
- The structure is **flat**; each file represents a domain (e.g., `customer.js`, `repairWorkflow.js`).
- `index.js`: Mounts all domain-specific routers.

### [controllers/](file:///home/aurelius/Documents/lab448-system/backend/src/controllers)
The **business logic** layer.
- Contains the implementation for all API endpoints.
- Handlers are grouped by domain into flat files matching the route structure.

### [utils/](file:///home/aurelius/Documents/lab448-system/backend/src/utils)
Stateless helpers and strict constants.
- `constants.js`: The definitive list of system-wide enums (Roles, Permissions, Statuses) defined by the schema.
- Unlike `config.js`, this folder is for code-level utilities rather than environment-specific settings.

### [middleware/](file:///home/aurelius/Documents/lab448-system/backend/src/middleware)
Custom Express middleware.
- Handles logic like authentication, authorization check (RBAC), and audit logging.
