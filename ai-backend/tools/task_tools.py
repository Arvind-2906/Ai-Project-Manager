from langchain_core.tools import tool
from typing import Dict, Any, List
from utils.logger import logger


@tool
def propose_create_task(
    project_id: str,
    title: str,
    description: str,
    priority: str = "MEDIUM",
    points: int = 3,
    acceptance_criteria: List[str] = None,
) -> Dict[str, Any]:
    """
    Submits a guarded action proposal to create a new task.
    Requires human engineering lead approval before database mutation occurs.
    """
    logger.info(f"[Tool:propose_create_task] Proposing task: {title} for project: {project_id}")
    return {
        "status": "PROPOSED",
        "action_type": "CREATE_TASK",
        "proposal_id": f"prop_task_{title[:8].lower().replace(' ', '_')}",
        "data": {
            "project_id": project_id,
            "title": title,
            "description": description,
            "priority": priority,
            "points": points,
            "acceptance_criteria": acceptance_criteria or [],
        },
        "requires_human_approval": True,
    }


@tool
def list_project_tasks(project_id: str) -> List[Dict[str, Any]]:
    """
    Retrieves current active tasks for dependency analysis and sprint balancing.
    """
    logger.info(f"[Tool:list_project_tasks] Listing tasks for {project_id}")
    return [
        {"id": "DCE-103", "title": "Configure pgvector vector store", "points": 5, "status": "TODO"},
        {"id": "DCE-104", "title": "Implement Raft Log Compaction", "points": 8, "status": "IN_PROGRESS"},
    ]
