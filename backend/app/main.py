from __future__ import annotations

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.api.routers.public_auth import router as public_auth_router
from app.core.config import settings
from app.scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    start_scheduler()
    yield
    # Shutdown
    stop_scheduler()

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    cors = settings.cors_origins_list()
    if cors:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=cors,
            allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$"
            if settings.environment == "development"
            else None,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    elif settings.environment == "development":
        # Dev-friendly default: allow localhost on any port (Vite may use 8080/8081/etc.)
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[],
            allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$",
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    # Public auth aliases (no /api prefix): /login, /register
    # Keeps existing /api/auth/* unchanged.
    app.include_router(public_auth_router)

    app.include_router(api_router, prefix="/api")
    return app


app = create_app()

