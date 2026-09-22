from fastapi import Header, HTTPException, status
from config.settings import settings


async def verify_internal_secret(x_internal_secret: str = Header(None)):
    """
    Validates that incoming requests come from the authorized Next.js backend.
    Requires header x-internal-secret to match settings.INTERNAL_API_SECRET.
    """
    expected = settings.INTERNAL_API_SECRET
    if not x_internal_secret or x_internal_secret != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing internal service secret.",
        )
    return True
