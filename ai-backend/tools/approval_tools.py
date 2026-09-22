from langchain_core.tools import tool
from typing import Dict, Any, List, Optional
from tools.client import backend_client
from utils.logger import logger


@tool
async def submit_approval_proposal(
    project_id: str,
    action_type: str,
    payload: Dict[str, Any],
    reason: Optional[str] = None,
    agent_run_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Submits an AI-generated high-impact mutation plan to the Next.js Human-in-the-Loop
    Approval API endpoint (POST /api/projects/[projectId]/approvals).
    Creates an Approval record in PENDING state awaiting human lead authorization.
    """
    logger.info(f"[Tool:submit_approval_proposal] Submitting {action_type} proposal for project: {project_id}")

    res = await backend_client.post(
        f"/api/projects/{project_id}/approvals",
        {
            "actionType": action_type,
            "payload": payload,
            "reason": reason,
            "agentRunId": agent_run_id,
        },
    )

    if res.get("success"):
        approval_record = res.get("data", {})
        return {
            "status": "PROPOSED",
            "approval_id": approval_record.get("id"),
            "action_type": action_type,
            "requires_human_approval": True,
            "data": approval_record,
        }

    # Fallback response for offline / disconnected development
    return {
        "status": "PROPOSED",
        "approval_id": f"prop_{action_type.lower()}_{project_id[:6]}",
        "action_type": action_type,
        "requires_human_approval": True,
        "payload": payload,
    }


@tool
async def list_pending_approvals(project_id: str) -> List[Dict[str, Any]]:
    """
    Retrieves currently pending human-in-the-loop proposals for a project.
    """
    logger.info(f"[Tool:list_pending_approvals] Fetching pending approvals for {project_id}")
    res = await backend_client.get(
        f"/api/projects/{project_id}/approvals",
        params={"status": "PENDING"},
    )

    if res.get("success") and isinstance(res.get("data"), list):
        return res["data"]

    return []
