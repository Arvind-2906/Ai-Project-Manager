from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from enum import Enum


class WorkflowType(str, Enum):
    PROJECT_CREATION = "PROJECT_CREATION"
    SPRINT_PLANNING = "SPRINT_PLANNING"
    RISK_MONITORING = "RISK_MONITORING"
    CODE_REVIEW = "CODE_REVIEW"


class WorkflowRunRequest(BaseModel):
    workflow_type: WorkflowType
    project_id: str
    input_data: Dict[str, Any] = Field(default_factory=dict)


class WorkflowStateSnapshot(BaseModel):
    workflow_id: str
    workflow_type: WorkflowType
    project_id: str
    current_step: str
    logs: List[Dict[str, Any]] = Field(default_factory=list)
    proposals: List[Dict[str, Any]] = Field(default_factory=list)
    completed: bool = False
