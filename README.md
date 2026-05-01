# Fullstack Task Manager

A production-grade task and project management application built as a portfolio showcase.

## Stack

**Backend** — FastAPI · PostgreSQL · SQLAlchemy · JWT auth · WebSockets  
**Frontend** — React 18 · TypeScript · Vite · TanStack Query · Zustand · dnd-kit · Tailwind CSS  
**DevOps** — Docker · Docker Compose · Nginx

## Features

- JWT authentication with role-based access (admin / member)
- Projects with owner / admin / member roles
- Kanban board with drag-and-drop across four columns (To Do → In Progress → Review → Done)
- Real-time task updates via WebSockets (changes appear instantly for all connected users)
- Task fields: title, description, status, priority, assignee, due date
- Auto-sync on reconnect; 3-second WebSocket reconnect backoff
- One-command local setup via Docker Compose

## Quick start (Docker)

```bash
docker compose up --build
```

- Frontend: http://localhost
- Backend API docs: http://localhost:8000/docs

## Local development

### Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

pip install -r requirements.txt

# Create a .env file from the example
cp .env.example .env
# Edit DATABASE_URL to point at your local Postgres instance

uvicorn app.main:app --reload
```

API available at http://localhost:8000  
Interactive docs at http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App available at http://localhost:5173  
The Vite dev server proxies `/api` → `http://localhost:8000`.

## API overview

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Current user info |
| GET | `/api/projects` | List your projects |
| POST | `/api/projects` | Create a project |
| GET | `/api/projects/{id}` | Get project + members |
| PATCH | `/api/projects/{id}` | Update project |
| DELETE | `/api/projects/{id}` | Delete project |
| POST | `/api/projects/{id}/members` | Add a member |
| DELETE | `/api/projects/{id}/members/{uid}` | Remove a member |
| GET | `/api/tasks?project_id=` | List tasks (filterable) |
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks/{id}` | Get a task |
| PATCH | `/api/tasks/{id}` | Update / move a task |
| DELETE | `/api/tasks/{id}` | Delete a task |
| WS | `/api/tasks/ws/{project_id}` | Real-time task events |
| GET | `/api/users` | List all users |

## Project structure

```
fullstack-task-manager/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, router registration
│   │   ├── config.py        # Pydantic settings (env vars)
│   │   ├── database.py      # SQLAlchemy engine + session
│   │   ├── models/          # ORM models: User, Project, ProjectMember, Task
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── routers/         # Route handlers: auth, projects, tasks, users
│   │   ├── services/        # Auth helpers: hashing, JWT, dependencies
│   │   └── websocket/       # WebSocket connection manager
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios API client + per-resource modules
│   │   ├── components/      # KanbanBoard, TaskCard, TaskModal
│   │   ├── hooks/           # useWebSocket
│   │   ├── pages/           # Login, Register, Dashboard, Project
│   │   ├── store/           # Zustand auth store (persisted)
│   │   └── types/           # Shared TypeScript interfaces
│   ├── nginx.conf
│   └── Dockerfile
└── docker-compose.yml
```
