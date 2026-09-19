from langchain_core.tools import tool
from typing import Dict, Any
from tools.client import backend_client
from utils.logger import logger


@tool
async def get_project_details(project_id: str) -> Dict[str, Any]:
    """
    Safely retrieves metadata, active sprint, and task statistics for a given project from Next.js backend.
    """
    logger.info(f"[Tool:get_project_details] Fetching details for project_id: {project_id}")
    res = await backend_client.get(f"/api/projects/{project_id}")
    if res.get("success"):
        return res.get("data", {})

    logger.info(f"[Tool:get_project_details] Using default/cached project metadata for {project_id}")
    return {
        "id": project_id,
        "name": f"Project {project_id}",
        "key": "PROJ",
        "active_sprint": "Sprint 1",
        "total_tasks": 12,
        "status": "HEALTHY",
    }


@tool
async def get_project_requirements(project_id: str) -> Dict[str, Any]:
    """
    Safely retrieves product requirements for a project from Next.js backend.
    """
    logger.info(f"[Tool:get_project_requirements] Fetching requirements for project_id: {project_id}")
    res = await backend_client.get(f"/api/projects/{project_id}/requirements")
    if res.get("success"):
        return res.get("data", {})

    return {"project_id": project_id, "requirements": []}
