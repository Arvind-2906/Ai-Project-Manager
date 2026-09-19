from typing import Dict, Any
from utils.logger import logger
from agents.sprint import sprint_agent
from agents.risk import risk_agent
from tools.task_tools import list_project_tasks


async def run_sprint_planning_workflow(project_id: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sprint Planning Multi-Agent StateGraph.
    Flow: Backlog Analysis -> Sprint Agent (Velocity / Capacity) -> Risk Agent (Overload check).
    """
    logger.info(f"[Workflow:SprintPlanning] Planning sprint for project: {project_id}")

    tasks = input_data.get("tasks")
    if not tasks:
        try:
            tasks = await list_project_tasks.ainvoke({"project_id": project_id})
        except Exception as e:
            logger.warning(f"[Workflow:SprintPlanning] Failed to fetch tasks from backend: {e}")
            tasks = []

    state = {
        "project_id": project_id,
        "input_data": input_data,
        "logs": [],
        "proposals": [],
        "tasks": tasks or [
            {"id": "TASK-101", "title": "Configure schema", "points": 5, "priority": "HIGH"},
            {"id": "TASK-102", "title": "Implement endpoints", "points": 8, "priority": "CRITICAL"},
            {"id": "TASK-103", "title": "Unit tests", "points": 3, "priority": "MEDIUM"},
        ],
    }

    # Step 1: Sprint Agent balances velocity & proposes sprint plan
    state = await sprint_agent.execute(state)

    # Step 2: Risk Agent audits capacity & overload hazard
    state = await risk_agent.execute(state)

    state["status"] = "AWAITING_HUMAN_APPROVAL"
    state["current_step"] = "CHECKPOINT_HUMAN_APPROVAL"
    return state
