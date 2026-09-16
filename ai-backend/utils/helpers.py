import uuid
from datetime import datetime


def generate_uuid(prefix: str = "") -> str:
    unique_id = uuid.uuid4().hex[:10]
    return f"{prefix}_{unique_id}" if prefix else unique_id


def current_iso_timestamp() -> str:
    return datetime.utcnow().isoformat() + "Z"
