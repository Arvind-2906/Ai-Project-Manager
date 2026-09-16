from langchain_core.tools import tool
from typing import Dict, Any
from utils.logger import logger


@tool
def send_team_notification(
    project_id: str,
    channel: str,
    title: str,
    message: str,
) -> Dict[str, Any]:
    """
    Broadcasts a notification to team members or SSE stream.
    """
    logger.info(f"[Tool:send_team_notification] Notifying channel: {channel} - {title}")
    return {"status": "DELIVERED", "channel": channel, "title": title}
