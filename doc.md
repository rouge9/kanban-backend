# Kanban API — Beginner's Guide

A complete explanation of this project: what it does, how it's structured, and what every piece of code means.

---

## What Is This Project?

This is a **REST API** for a Kanban board and project management application. It lets you:

- Register and log in as a user
- Manage Organizations, Teams, and Projects
- Create Boards with Columns, and manage Tasks within those columns
- Assign tasks to users and track their progress
- Secure endpoints with JWT authentication and refresh tokens

It is built with:

| Tool | What it does |
|------|-------------|
| **NestJS** | The main framework — organizes your code into modules |
| **Prisma** | Talks to the database — lets you write TypeScript instead of SQL |
| **PostgreSQL** | The database — stores all your data |
| **Docker** | Runs PostgreSQL and the API in containers for easy development |
| **JWT** | JSON Web Tokens — how users stay "logged in" |
| **Swagger** | Auto-generates API documentation at `/api/docs` |

---

## How a Request Flows Through the App

Understanding this flow is the most important thing for a beginner:

```
HTTP Request
    │
    ▼
main.ts          ← starts the app, sets up Swagger and CORS
    │
    ▼
AppModule        ← the root module, imports everything
    │
    ▼
Controller       ← receives the request, calls the service
    │
    ▼
Guard (optional) ← checks if the user is logged in (JWT)
    │
    ▼
Service          ← contains the business logic
    │
    ▼
PrismaService    ← talks to the database
    │
    ▼
PostgreSQL       ← stores/retrieves data
    │
    ▼
HTTP Response    ← sent back to the client
```

---

## Project Structure

The project follows a standard NestJS modular architecture, but organized around Kanban features:

```
src/
├── main.ts                  ← Entry point, starts the server
├── app.module.ts            ← Root module, wires everything together
│
├── prisma/                  ← Database connection
│   ├── prisma.module.ts
│   └── prisma.service.ts
│
├── auth/                    ← Login, Registration, and JWT authentication
├── users/                   ← User management and profiles
├── organizations/           ← Organization CRUD and memberships
├── teams/                   ← Team management within organizations
├── projects/                ← Projects within organizations/teams
├── boards/                  ← Kanban boards
├── columns/                 ← Columns within a board (e.g., Todo, In Progress)
└── tasks/                   ← Tasks assigned to columns and users
```

---

## Database Layer — Prisma

### `prisma/schema/*`

This project uses a modular Prisma schema. Think of it as a blueprint for your tables.

**Key Models:**

- **User**: Represents a person logging into the app. Contains `email`, `password`, and relations to assigned tasks, teams, projects, and organizations.
- **Organization**: The top-level grouping (like a SaaS tenant/workspace). Has many `OrganizationMember`s (which have `role`s like `ADMIN` or `USER`), `Team`s, and `Project`s.
- **Team**: A subgroup within an organization. Has many `TeamMember`s.
- **Project**: Represents a specific project. Belongs to an organization and optionally a team. Contains `Board`s. *Note: Creating a new project automatically generates a default "Main Board" with "TODO", "IN PROGRESS", and "DONE" columns.*
- **Board**: A Kanban board belonging to a project. Contains `Column`s.
- **Column**: A vertical list on a board (e.g., "To Do", "Done"). Contains `Task`s. Ordered by an `order` integer and has a `color` string for UI customization.
- **Task**: An individual work item. Belongs to a column, can have an `assigneeId` linking it to a `User`, and has an `order` integer for positioning.
- **Session**: Stores refresh tokens for authenticated users to maintain their login session securely.

**Key concepts:**
- `@id @default(uuid())` — Primary keys are UUIDs instead of auto-incrementing integers.
- `@relation(..., onDelete: Cascade)` — If you delete a Board, all its Columns and Tasks are automatically deleted.
- `@@map("table_name")` — Maps the TypeScript model (e.g., `Task`) to the actual lowercase, plural database table (e.g., `tasks`).

---

## Authentication — How Login Works

Authentication answers the question: **"Who are you?"**

This app uses **JWT (JSON Web Tokens)** with a Refresh Token strategy.

1. User sends email + password to `POST /auth/login`.
2. Server checks the password using `bcrypt`.
3. Server creates an **Access Token** (short-lived) and a **Refresh Token** (long-lived).
4. The Refresh Token is hashed and saved in the database under the `Session` model.
5. The client uses the Access Token in the `Authorization: Bearer <token>` header for requests.
6. When the Access Token expires, the client uses the Refresh Token to request a new Access Token.

---

## Kanban & SaaS Features

### SaaS Multi-Tenancy & Access Control

The API is structured to support a multi-tenant SaaS architecture:
- **Automatic Admin**: When a user creates an Organization, they are automatically granted the `ADMIN` role for that specific organization.
- **Strict Boundaries**: Modifying or deleting an organization (or its projects) requires the user to be an `ADMIN` in that specific organization. Global roles do not override this, ensuring complete tenant isolation.
- **Team Management**: Admins can invite new members to their organization by email (`POST /organizations/:id/members`) or remove existing ones, managing access directly within the app.

### Boards, Columns, and Tasks

The core of the app revolves around the Kanban flow.

- **Ordering**: Both `Column` and `Task` have an `order` field. When a user drags and drops a task to a new position or a new column on the frontend, the API updates the `order` and `columnId` of the task to reflect its new placement.
- **Hierarchy**: `Organization -> Project -> Board -> Column -> Task`.
- **Assignees**: A task can optionally have an `assigneeId` linking it to a `User` (a member of the organization).
- **Default Provisioning**: Every new project instantly gets a fully functional board with "TODO", "IN PROGRESS", and "DONE" columns, making onboarding frictionless.

---

## Infrastructure

### `docker-compose.yml` (Development)

This project provides a full local development environment using Docker Compose.

```yaml
services:
  postgres:
    image: postgres:17-alpine
    container_name: kanban_postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: kanban_db
    ports:
      - '5433:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  api:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: kanban-api
    ports:
      - '3000:3000'
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/kanban_db?schema=public
      JWT_SECRET: dev-secret-key
      NODE_ENV: development
    volumes:
      - .:/usr/src/app
      - /usr/src/app/node_modules
    command: npm run start:dev
```

**What this does:**
- `postgres` — Runs PostgreSQL on port `5433` on your host machine to avoid conflicting with local Postgres installations.
- `api` — Runs the NestJS API with hot-reloading. The `volumes` section syncs your local code into the container, so changes happen instantly without rebuilding the image.

### `.env`

You need environment variables to run the app. Example:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/kanban_db?schema=public"
PORT=3000
NODE_ENV=development
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
JWT_REFRESH_EXPIRES_IN="7d"
```

---

## NestJS Core Concepts Explained

### Dependency Injection
NestJS manages creating instances of your classes. You never write `new UsersService()` — you just declare it in the constructor and NestJS injects it:

```typescript
constructor(private tasksService: TasksService) {}
```

### Controllers vs Services
- **Controller** — handles the HTTP layer. It receives requests, extracts data (body, params, query), calls the service, and returns the response. It should contain no business logic.
- **Service** — contains all the business logic. It talks to the database, applies rules, and returns data. It knows nothing about HTTP.

---

## Getting Started

### Prerequisites

- Node.js 18+
- Docker Desktop

### Setup (using Docker Compose)

The easiest way to run the app locally is using Docker Compose, which spins up both the Database and the API at the same time:

```bash
# 1. Start the API and PostgreSQL Database
docker compose up --build
```

If you prefer to run the API on your host machine instead of in Docker:

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL ONLY (requires you to split out the postgres service or run it manually)
docker compose up -d postgres

# 3. Run database migrations (creates tables)
npx prisma migrate dev

# 4. Generate Prisma client
npx prisma generate

# 5. Start the app
npm run start:dev
```

### Common Commands

```bash
# Open database GUI to view your tables visually
npx prisma studio --url "postgresql://postgres:postgres@localhost:5433/kanban_db?schema=public"

# Run in development (auto-restarts on file changes)
npm run start:dev

# Build for production
npm run build
npm run start:prod
```

---

## How to Test the API

1. Start the app with `docker compose up --build` or `npm run start:dev`.
2. Open `http://localhost:3000/api/docs` in your browser to access the Swagger UI.
3. Create a user: Find `POST /users` (or auth register), fill in email and password, and execute.
4. Login: Use `POST /auth/login` to get your `access_token`.
5. Authorize: Click the "Authorize" button at the top of Swagger, paste your token, and click Authorize.
6. Now you can call protected endpoints like `POST /organizations`, `POST /projects`, and `POST /tasks`!
