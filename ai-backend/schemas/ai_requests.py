from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from schemas.product import ProductArchitectureProposal
from schemas.task_decomp import WorkBreakdownProposal
from schemas.dependency import DependencyAnalysisResult
from schemas.sprint import SprintPlanProposal
from schemas.risk import RiskAnalysisResult
from schemas.supervisor import SupervisorDecision


class ProjectCreateAIRequest(BaseModel):
    project_id: str = Field(..., description="Project ID")
    raw_idea: str = Field(..., description="Natural language project concept or user requirements")
    business_context: Optional[str] = Field(default="", description="Strategic goals or company context")
    constraints: Optional[List[str]] = Field(default_factory=list, description="Technical or regulatory constraints")
    target_audience: Optional[str] = Field(default="", description="Target personas or user base")


class ProjectCreateAIResponse(BaseModel):
    project_id: str
    prd: ProductArchitectureProposal
    work_breakdown: WorkBreakdownProposal
    dependencies: DependencyAnalysisResult
    status: str = Field(default="AWAITING_HUMAN_APPROVAL")
    requires_approval: bool = Field(default=True)
    logs: List[Dict[str, Any]] = Field(default_factory=list)


class SprintPlanAIRequest(BaseModel):
    project_id: str = Field(..., description="Project ID")
    sprint_name: Optional[str] = Field(default=None, description="Sprint name (optional, auto-generated if omitted)")
    team_capacity_points: Optional[int] = Field(default=40, ge=5, le=200, description="Total story points team can commit")
    duration_weeks: Optional[int] = Field(default=2, ge=1, le=4, description="Sprint length in weeks")
    priorities: Optional[List[str]] = Field(default_factory=list, description="Focus areas or high-priority feature tags")


class SprintPlanAIResponse(BaseModel):
    project_id: str
    sprint_plan: SprintPlanProposal
    status: str = Field(default="AWAITING_HUMAN_APPROVAL")
    requires_approval: bool = Field(default=True)
    logs: List[Dict[str, Any]] = Field(default_factory=list)


class RiskAnalyzeAIRequest(BaseModel):
    project_id: str = Field(..., description="Project ID")
    scope: Optional[str] = Field(default="FULL_PROJECT", description="Analysis scope: FULL_PROJECT, ACTIVE_SPRINT, DEPENDENCIES")
    risk_threshold: Optional[int] = Field(default=5, ge=1, le=25, description="Only report risks with score >= threshold")


class RiskAnalyzeAIResponse(BaseModel):
    project_id: str
    risk_analysis: RiskAnalysisResult
    status: str = Field(default="COMPLETED")
    requires_approval: bool = Field(default=False)
    logs: List[Dict[str, Any]] = Field(default_factory=list)


class SupervisorAnalyzeAIRequest(BaseModel):
    project_id: str = Field(..., description="Project ID")
    trigger_event: Optional[str] = Field(default="PERIODIC_AUDIT", description="Event triggering supervisor")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Contextual project telemetry")


class SupervisorAnalyzeAIResponse(BaseModel):
    project_id: str
    decision: SupervisorDecision
    status: str = Field(default="DECIDED")
    recommended_next_step: str
    logs: List[Dict[str, Any]] = Field(default_factory=list)
