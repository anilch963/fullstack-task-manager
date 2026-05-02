from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import Base, engine
from .routers import auth, projects, tasks, users
from . import models  # noqa: F401 — registers all ORM models before create_all

Base.metadata.create_all(bind=engine)

from fastapi.security import OAuth2PasswordBearer
from fastapi.openapi.models import OAuthFlows, OAuthFlowPassword
from fastapi.openapi.utils import get_openapi

app = FastAPI(
    title="Task Manager API",
    description="Full-stack task manager with JWT auth, RBAC, and real-time WebSocket updates.",
    version="1.0.0",
    swagger_ui_parameters={"persistAuthorization": True},
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(users.router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
