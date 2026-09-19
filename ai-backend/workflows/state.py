from typing import TypedDict, List, Dict, Any, Optional


class SwarmState(TypedDict, total=False):
    """
    Centralized LangGraph state schema passed between supervisor and specialized sub-agents.
    """
    project_id: str
    workflow_type: str
    input_data: Dict[str, Any]
    prd: Optional[Dict[str, Any]]
    work_breakdown: Optional[Dict[str, Any]]
    tasks: List[Dict[str, Any]]
    dependencies: Optional[Dict[str, Any]]
    sprint_plan: Optional[Dict[str, Any]]
    risk_analysis: Optional[Dict[str, Any]]
    proposals: List[Dict[str, Any]]
    logs: List[Dict[str, Any]]
    current_step: str
    status: str
    next_step: Optional[str]
    supervisor_decision: Optional[Dict[str, Any]]
