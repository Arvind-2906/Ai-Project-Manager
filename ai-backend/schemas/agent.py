from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from enum import Enum


class AgentType(str, Enum):
    SUPERVISOR = "SUPERVISOR"
    PRODUCT = "PRODUCT"
    TASK = "TASK"
    DEPENDENCY = "DEPENDENCY"
    SPRINT = "SPRINT"
    RISK = "RISK"
    DEVELOPER = "DEVELOPER"
    REVIEW = "REVIEW"
    STANDUP = "STANDUP"


class AgentRunRequest(BaseModel):
    agent_type: AgentType
    project_id: str
    prompt: str
    context: Optional[Dict[str, Any]] = None


class AgentRunResponse(BaseModel):
    success: bool = True
    agent_type: AgentType
    project_id: str
    result: Any = None
    logs: Optional[List[Dict[str, Any]]] = None


class AgentMessage(BaseModel):
    agent: AgentType
    content: str
    tool_calls: Optional[List[Dict[str, Any]]] = None
    created_at: Optional[str] = None
