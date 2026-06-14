from fastapi import APIRouter

from app.api.v1 import auth, clients, projects, tasks, workspaces

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(workspaces.router)
api_router.include_router(projects.router)
api_router.include_router(tasks.router)
api_router.include_router(clients.router)