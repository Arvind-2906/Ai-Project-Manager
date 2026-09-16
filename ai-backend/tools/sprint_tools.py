from langchain_core.tools import tool
from typing import Dict, Any, List
from utils.logger import logger


@tool
def propose_sprint_plan(
    project_id: str,
    sprint_name: str,
    target_story_points: int,
    task_ids: List[str],
    sprint_goal: str,
) -> Dict[str, Any]:
    """
    Proposes an optimized sprint allocation based on team velocity and dependency order.
    Requires human approval.
    """
    logger.info(f"[Tool:propose_sprint_plan] Proposing sprint: {sprint_name} with {target_story_points} pts")
    return {
        "status": "PROPOSED",
        "action_type": "CREATE_SPRINT",
        "sprint_name": sprint_name,
        "goal": sprint_goal,
        "committed_points": target_story_points,
        "task_count": len(task_ids),
        "requires_human_approval": True,
    }
