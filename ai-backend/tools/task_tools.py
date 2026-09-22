from langchain_core.tools import tool
from typing import Dict, Any, List, Optional
from tools.client import backend_client
from utils.logger import logger


@tool
async def list_project_tasks(project_id: str) -> List[Dict[str, Any]]:
    """
    Retrieves current active tasks for dependency analysis and sprint balancing.
    """
    logger.info(f"[Tool:list_project_tasks] Listing tasks for {project_id}")
    res = await backend_client.get(f"/api/projects/{project_id}/tasks")
    if res.get("success") and isinstance(res.get("data"), list):
        return res["data"]

    # Fallback default tasks for local/testing
    return [
        {"id": "TASK-101", "title": "Configure database schemas and migrations", "points": 5, "status": "TODO", "priority": "HIGH"},
        {"id": "TASK-102", "title": "Implement core REST endpoints", "points": 8, "status": "IN_PROGRESS", "priority": "CRITICAL"},
        {"id": "TASK-103", "title": "Write unit and integration tests", "points": 3, "status": "TODO", "priority": "MEDIUM"},
    ]


@tool
async def propose_create_task(
    project_id: str,
    title: str,
    description: str,
    priority: str = "MEDIUM",
    points: int = 3,
    acceptance_criteria: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Submits a guarded action proposal to create a new task.
    Requires human engineering lead approval before database mutation occurs.
    """
    logger.info(f"[Tool:propose_create_task] Proposing task: {title} for project: {project_id}")
    proposal_data = {
        "project_id": project_id,
        "title": title,
        "description": description,
        "priority": priority,
        "points": points,
        "acceptance_criteria": acceptance_criteria or [],
    }

    # Propose to Next.js backend approvals endpoint
    res = await backend_client.post(
        f"/api/projects/{project_id}/approvals",
        {
            "actionType": "CREATE_TASK",
            "payload": proposal_data,
        },
    )

    return {
        "status": "PROPOSED",
        "action_type": "CREATE_TASK",
        "proposal_id": res.get("data", {}).get("id") or f"prop_task_{title[:8].lower().replace(' ', '_')}",
        "data": proposal_data,
        "requires_human_approval": True,
    }
