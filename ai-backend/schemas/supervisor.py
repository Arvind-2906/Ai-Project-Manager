from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


class SupervisorAction(str, Enum):
    ROUTE_TO_PRODUCT = "ROUTE_TO_PRODUCT"
    ROUTE_TO_TASK = "ROUTE_TO_TASK"
    ROUTE_TO_DEPENDENCY = "ROUTE_TO_DEPENDENCY"
    ROUTE_TO_SPRINT = "ROUTE_TO_SPRINT"
    ROUTE_TO_RISK = "ROUTE_TO_RISK"
    REQUEST_HUMAN_APPROVAL = "REQUEST_HUMAN_APPROVAL"
    COMPLETE = "COMPLETE"


class SupervisorDecision(BaseModel):
    next_action: SupervisorAction = Field(..., description="Action selected by supervisor")
    target_agent: Optional[str] = Field(default=None, description="Name of sub-agent to invoke, if applicable")
    reasoning: str = Field(..., description="Justification and state inspection summary")
    confidence: float = Field(default=0.95, ge=0.0, le=1.0, description="Confidence in routing decision")
    requires_human_approval: bool = Field(default=False, description="True if next step halts for human lead sign-off")


class SupervisorAnalysisRequest(BaseModel):
    project_id: str = Field(..., description="Associated project ID")
    trigger_event: str = Field(default="MANUAL_TRIGGER", description="Event triggering supervisor analysis (e.g. PROJECT_CREATED, SPRINT_PLANNED, RISK_CHECK)")
    context: Dict[str, Any] = Field(default_factory=dict, description="Current project state or payload")


class SupervisorAnalysisResponse(BaseModel):
    project_id: str = Field(..., description="Project ID")
    decision: SupervisorDecision = Field(..., description="Routing decision from supervisor")
    status: str = Field(default="DECIDED", description="Status of supervisor evaluation")
    workflow_state_summary: Optional[Dict[str, Any]] = Field(default=None, description="High-level summary of active workflow")
