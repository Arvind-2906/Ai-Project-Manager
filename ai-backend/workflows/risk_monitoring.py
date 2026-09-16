from typing import Dict, Any
from utils.logger import logger
from agents.risk import risk_agent


async def run_risk_monitoring_workflow(project_id: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Continuous Project Health & Risk Audit StateGraph.
    Flow: State Scan -> Anomaly & Scope Drift Detection -> Mitigation Strategy Proposal.
    """
    logger.info(f"[Workflow:RiskMonitoring] Running project audit for: {project_id}")

    state = {
        "project_id": project_id,
        "input_data": input_data,
        "logs": [],
        "proposals": [],
    }

    state = await risk_agent.execute(state)
    state["status"] = "AUDIT_COMPLETED"
    return state
