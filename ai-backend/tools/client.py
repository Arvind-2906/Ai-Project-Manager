import httpx
from typing import Dict, Any, Optional
from config.settings import settings
from utils.logger import logger


class InternalBackendClient:
    """
    HTTP client for calling Next.js backend internal API routes.
    Includes the x-internal-secret header for authorization.
    """
    def __init__(self):
        self.base_url = settings.NEXTJS_BACKEND_URL.rstrip("/")
        self.headers = {
            "x-internal-secret": settings.INTERNAL_API_SECRET,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        self.timeout = 1.0

    async def get(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        url = f"{self.base_url}{endpoint}"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(url, headers=self.headers, params=params)
                if res.is_success:
                    return res.json()
                logger.warning(f"[BackendClient] GET {url} returned {res.status_code}: {res.text}")
                return {"success": False, "status_code": res.status_code, "error": res.text}
        except Exception as exc:
            logger.error(f"[BackendClient] GET {url} failed: {exc}")
            return {"success": False, "error": str(exc)}

    async def post(self, endpoint: str, data: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}{endpoint}"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(url, headers=self.headers, json=data)
                if res.is_success:
                    return res.json()
                logger.warning(f"[BackendClient] POST {url} returned {res.status_code}: {res.text}")
                return {"success": False, "status_code": res.status_code, "error": res.text}
        except Exception as exc:
            logger.error(f"[BackendClient] POST {url} failed: {exc}")
            return {"success": False, "error": str(exc)}


backend_client = InternalBackendClient()
