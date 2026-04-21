from fastapi import APIRouter

from app.api.routers import auth
from app.api.routers import admin_auth
from app.api.routers import admin_results
from app.api.routers import admin_manage
from app.api.routers import bets
from app.api.routers import color
from app.api.routers import health
from app.api.routers import matches
from app.api.routers import payments
from app.api.routers import realtime
from app.api.routers import users
from app.api.routers import withdrawals
from app.api.routers import stats

api_router = APIRouter()
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(admin_auth.router)
api_router.include_router(admin_results.router)
api_router.include_router(admin_manage.router)
api_router.include_router(health.router, tags=["health"])
api_router.include_router(matches.router)
api_router.include_router(users.router)
api_router.include_router(payments.router)
api_router.include_router(bets.router)
api_router.include_router(color.router)
api_router.include_router(withdrawals.router)
api_router.include_router(realtime.router)
api_router.include_router(stats.router, tags=["stats"])
