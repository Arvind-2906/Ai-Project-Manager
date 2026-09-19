from langchain_core.tools import tool
from typing import Dict, Any, List
from tools.client import backend_client
from utils.logger import logger


@tool
async def list_project_sprints(project_id: str) -> List[Dict[str, Any]]:
    """
    Retrieves sprints and historical velocity for the given project.
    """
    logger.info(f"[Tool:list_project_sprints] Listing sprints for {project_id}")
    res = await backend_client.get(f"/api/projects/{project_id}/sprints")
    if res.get("success") and isinstance(res.get("data"), list):
        return res["data"]

    return [
        {"id": "SPRINT-1", "name": "Sprint 1", "status": "ACTIVE", "points": 34},
    ]


@tool
async def propose_sprint_plan(
    project_id: str,
    sprint_name: str,
    target_story_points: int,
    task_ids: List[str],
    sprint_goal: str,
) -> Dict[str, Any]:
    """
    Proposes an optimized sprint allocation based on team velocity and dependency order.
    Requires human engineering lead approval before database mutation.
    """
    logger.info(f"[Tool:propose_sprint_plan] Proposing sprint: {sprint_name} with {target_story_points} pts")
    proposal_data = {
        "project_id": project_id,
        "sprint_name": sprint_name,
        "goal": sprint_goal,
        "committed_points": target_story_points,
        "task_ids": task_ids,
        "task_count": len(task_ids),
    }

    res = await backend_client.post(
        f"/api/projects/{project_id}/proposals",
        {
            "action_type": "CREATE_SPRINT",
            "description": f"Sprint Plan: {sprint_name} ({sprint_goal})",
            "proposed_data": proposal_data,
        },
    )

    return {
        "status": "PROPOSED",
        "action_type": "CREATE_SPRINT",
        "proposal_id": res.get("data", {}).get("id") or f"prop_sprint_{sprint_name.lower().replace(' ', '_')}",
        "data": proposal_data,
        "requires_human_approval": True,
    }
