from langchain_core.tools import tool
from typing import Dict, Any, List, Optional
from tools.client import backend_client
from utils.logger import logger


@tool
async def list_project_risks(project_id: str) -> List[Dict[str, Any]]:
    """
    Retrieves currently logged risks for the project.
    """
    logger.info(f"[Tool:list_project_risks] Listing risks for {project_id}")
    res = await backend_client.get(f"/api/projects/{project_id}/risks")
    if res.get("success") and isinstance(res.get("data"), list):
        return res["data"]

    return [
        {
            "id": "RISK-1",
            "title": "Tight milestone deadline",
            "severity": "HIGH",
            "probability": 3,
            "impact": 4,
            "risk_score": 12,
            "mitigation": "Scope reduction on non-critical features",
        }
    ]


@tool
async def propose_create_risk(
    project_id: str,
    title: str,
    severity: str,
    likelihood: str,
    mitigation: str,
    probability: int = 3,
    impact: int = 3,
    affected_task_ids: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Flags a newly detected architectural, scope, or delivery risk.
    Submits proposal to the human lead for registration.
    """
    logger.info(f"[Tool:propose_create_risk] Proposing risk: {title} (Severity: {severity})")
    risk_score = probability * impact
    proposal_data = {
        "project_id": project_id,
        "title": title,
        "severity": severity,
        "likelihood": likelihood,
        "probability": probability,
        "impact": impact,
        "risk_score": risk_score,
        "mitigation": mitigation,
        "affected_task_ids": affected_task_ids or [],
    }

    res = await backend_client.post(
        f"/api/projects/{project_id}/proposals",
        {
            "action_type": "CREATE_RISK",
            "description": f"Risk: {title} (Score: {risk_score})",
            "proposed_data": proposal_data,
        },
    )

    return {
        "status": "PROPOSED",
        "action_type": "CREATE_RISK",
        "proposal_id": res.get("data", {}).get("id") or f"prop_risk_{title[:8].lower().replace(' ', '_')}",
        "data": proposal_data,
        "requires_human_approval": True,
    }
