from fastapi import Depends, FastAPI, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import (
    AuthenticationError,
    ConflictError,
    NotFoundError,
    PermissionDeniedError,
)
from app.db.session import get_db

app = FastAPI(title=settings.app_name)
@app.exception_handler(NotFoundError)
async def not_found_error_handler(
    _request: Request,
    exc: NotFoundError,
):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": str(exc)},
    )


@app.exception_handler(PermissionDeniedError)
async def permission_denied_error_handler(
    _request: Request,
    exc: PermissionDeniedError,
):
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={"detail": str(exc)},
    )


@app.exception_handler(ConflictError)
async def conflict_error_handler(
    _request: Request,
    exc: ConflictError,
):
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": str(exc)},
    )


@app.exception_handler(AuthenticationError)
async def authentication_error_handler(
    _request: Request,
    exc: AuthenticationError,
):
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": str(exc)},
    )


@app.exception_handler(NotFoundError)
async def not_found_error_handler(
        request: Request,
        exc: NotFoundError,
):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": str(exc)},
    )


@app.exception_handler(PermissionDeniedError)
async def permission_denied_error_handler(
        request: Request,
        exc: PermissionDeniedError,
):
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={"detail": str(exc)},
    )


@app.exception_handler(ConflictError)
async def conflict_error_handler(
        request: Request,
        exc: ConflictError,
):
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": str(exc)},
    )


@app.exception_handler(AuthenticationError)
async def authentication_error_handler(
        request: Request,
        exc: AuthenticationError,
):
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": str(exc)},
    )


app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "environment": settings.environment,
    }


@app.get("/db-health")
async def db_health_check(db: AsyncSession = Depends(get_db)):
    await db.execute(text("SELECT 1"))
    return {"database": "ok"}
