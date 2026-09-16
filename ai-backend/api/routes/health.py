from fastapi import APIRouter
from config.settings import settings
from datetime import datetime

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    return {
        "status": "HEALTHY",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "gemini_configured": bool(settings.GEMINI_API_KEY),
    }
