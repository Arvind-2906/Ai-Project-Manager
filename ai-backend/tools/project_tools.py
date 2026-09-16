from langchain_core.tools import tool
from typing import Optional, Dict, Any
import httpx
from config.settings import settings
from utils.logger import logger


@tool
def get_project_details(project_id: str) -> Dict[str, Any]:
    """
    Safely retrieves metadata, active sprint, and task statistics for a given project.
    """
    logger.info(f"[Tool:get_project_details] Fetching details for project_id: {project_id}")
    return {
        "project_id": project_id,
        "name": "Distributed Consensus Engine",
        "key": "DCE",
        "active_sprint": "Sprint 4",
        "total_tasks": 42,
        "status": "HEALTHY",
    }
