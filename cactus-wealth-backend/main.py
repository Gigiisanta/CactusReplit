from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from cactus_wealth.api.v1.api import api_router
from cactus_wealth.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root health endpoint for Docker health checks
@app.get("/health")
def root_health_check() -> dict[str, str]:
    return {"status": "ok"}

app.include_router(api_router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 