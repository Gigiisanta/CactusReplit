from fastapi import APIRouter

from cactus_wealth.api.v1.endpoints import health, login, users, clients, portfolios, dashboard, reports, investment_accounts, insurance_policies, notifications, model_portfolios, assets

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(login.router, prefix="/login", tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(clients.router, prefix="/clients", tags=["clients"])
api_router.include_router(portfolios.router, prefix="/portfolios", tags=["portfolios"])
api_router.include_router(model_portfolios.router, prefix="/model-portfolios", tags=["model-portfolios"])
api_router.include_router(assets.router, prefix="/assets", tags=["assets"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(investment_accounts.router, tags=["investment-accounts"])
api_router.include_router(insurance_policies.router, tags=["insurance-policies"])
api_router.include_router(notifications.router, tags=["notifications"]) 