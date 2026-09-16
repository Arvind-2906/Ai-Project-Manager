from typing import Dict, Any
from utils.logger import logger
from agents.sprint import sprint_agent
from agents.risk import risk_agent


async def run_sprint_planning_workflow(project_id: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sprint Planning Multi-Agent StateGraph.
    Flow: Backlog Analysis -> Sprint Agent (Velocity / Capacity) -> Risk Agent (Overload check).
    """
    logger.info(f"[Workflow:SprintPlanning] Planning sprint for project: {project_id}")

    state = {
        "project_id": project_id,
        "input_data": input_data,
        "logs": [],
        "proposals": [],
        "tasks": input_data.get("tasks", [
            {"id": "DCE-120", "points": 5},
            {"id": "DCE-121", "points": 8},
            {"id": "DCE-122", "points": 3},
        ]),
    }

    # Step 1: Sprint Agent balances velocity
    state = await sprint_agent.execute(state)

    # Step 2: Risk Agent audits capacity hazard
    state = await risk_agent.execute(state)

    state["status"] = "AWAITING_HUMAN_APPROVAL"
    return state
