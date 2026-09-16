from pydantic import BaseModel, Field
from typing import Optional, Any, Dict, List
from datetime import datetime


class StandardResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None
    data: Optional[Any] = None


class ActionProposalPayload(BaseModel):
    action_type: str = Field(..., description="e.g. CREATE_TASK, CREATE_DEPENDENCY, UPDATE_SPRINT")
    project_id: str
    description: str
    proposed_data: Dict[str, Any]
    confidence: float = Field(default=0.9, ge=0.0, le=1.0)
