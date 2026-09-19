from typing import Dict, Any
from utils.logger import logger
from agents.risk import risk_agent
from tools.task_tools import list_project_tasks
from tools.dependency_tools import list_task_dependencies


async def run_risk_monitoring_workflow(project_id: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Continuous Project Health & Risk Audit StateGraph.
    Flow: State Scan -> Anomaly & Scope Drift Detection -> Mitigation Strategy Proposal.
    """
    logger.info(f"[Workflow:RiskMonitoring] Running project audit for: {project_id}")

    tasks = input_data.get("tasks")
    if not tasks:
        try:
            tasks = await list_project_tasks.ainvoke({"project_id": project_id})
        except Exception as e:
            logger.warning(f"[Workflow:RiskMonitoring] Failed to fetch tasks from backend: {e}")
            tasks = []

    dependencies = input_data.get("dependencies")
    if not dependencies:
        try:
            dependencies = await list_task_dependencies.ainvoke({"project_id": project_id})
        except Exception as e:
            logger.warning(f"[Workflow:RiskMonitoring] Failed to fetch dependencies: {e}")
            dependencies = []

    state = {
        "project_id": project_id,
        "input_data": input_data,
        "tasks": tasks or [],
        "dependencies": dependencies or [],
        "logs": [],
        "proposals": [],
    }

    state = await risk_agent.execute(state)
    state["status"] = "AUDIT_COMPLETED"
    return state
