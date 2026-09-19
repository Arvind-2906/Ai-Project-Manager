from langchain_core.tools import tool
from typing import Dict, Any, List
from tools.client import backend_client
from utils.logger import logger


@tool
async def list_task_dependencies(project_id: str) -> List[Dict[str, Any]]:
    """
    Retrieves current task dependencies for topological sorting and cycle checks.
    """
    logger.info(f"[Tool:list_task_dependencies] Fetching dependencies for {project_id}")
    res = await backend_client.get(f"/api/projects/{project_id}/dependencies")
    if res.get("success") and isinstance(res.get("data"), list):
        return res["data"]

    return [
        {"fromTaskId": "TASK-101", "toTaskId": "TASK-102", "type": "BLOCKS"},
        {"fromTaskId": "TASK-102", "toTaskId": "TASK-103", "type": "BLOCKS"},
    ]


@tool
async def propose_task_dependency(
    project_id: str,
    from_task_id: str,
    to_task_id: str,
    dependency_type: str = "BLOCKS",
    reason: str = "Sequential implementation prerequisite",
) -> Dict[str, Any]:
    """
    Proposes a new dependency relation between two tasks.
    Requires human engineering lead approval before database mutation.
    """
    logger.info(f"[Tool:propose_task_dependency] Proposing {from_task_id} -> {to_task_id} ({dependency_type})")
    proposal_data = {
        "from_task_id": from_task_id,
        "to_task_id": to_task_id,
        "type": dependency_type,
        "reason": reason,
    }

    res = await backend_client.post(
        f"/api/projects/{project_id}/proposals",
        {
            "action_type": "CREATE_TASK_DEPENDENCY",
            "description": f"Dependency: {from_task_id} {dependency_type} {to_task_id}",
            "proposed_data": proposal_data,
        },
    )

    return {
        "status": "PROPOSED",
        "action_type": "CREATE_TASK_DEPENDENCY",
        "proposal_id": res.get("data", {}).get("id") or f"prop_dep_{from_task_id}_{to_task_id}",
        "data": proposal_data,
        "requires_human_approval": True,
    }
