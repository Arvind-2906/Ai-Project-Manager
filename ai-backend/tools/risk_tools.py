from langchain_core.tools import tool
from typing import Dict, Any
from utils.logger import logger


@tool
def propose_create_risk(
    project_id: str,
    title: str,
    severity: str,
    likelihood: str,
    mitigation: str,
) -> Dict[str, Any]:
    """
    Flags a newly detected architectural, scope, or delivery risk.
    Submits proposal to the human lead for registration.
    """
    logger.info(f"[Tool:propose_create_risk] Proposing risk: {title} (Severity: {severity})")
    return {
        "status": "PROPOSED",
        "action_type": "CREATE_RISK",
        "title": title,
        "severity": severity,
        "likelihood": likelihood,
        "mitigation": mitigation,
        "requires_human_approval": True,
    }
