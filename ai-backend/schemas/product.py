from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


class RequirementType(str, Enum):
    FUNCTIONAL = "FUNCTIONAL"
    NON_FUNCTIONAL = "NON_FUNCTIONAL"


class PriorityLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class PersonaItem(BaseModel):
    name: str = Field(..., description="Persona title/role, e.g. 'DevOps Engineer'")
    role: str = Field(..., description="Role and context of the persona")
    pain_points: List[str] = Field(default_factory=list, description="Key frustrations or blockers")
    goals: List[str] = Field(default_factory=list, description="What this persona achieves with the product")


class BusinessGoalItem(BaseModel):
    goal: str = Field(..., description="Strategic business objective")
    target_metric: str = Field(..., description="Measurable KPI or target metric")
    timeframe: Optional[str] = Field(default="Q1-Q2", description="Target timeframe for goal achievement")


class RequirementItem(BaseModel):
    id: str = Field(..., description="Unique requirement ID, e.g. 'REQ-1'")
    title: str = Field(..., description="Concise requirement title")
    description: str = Field(..., description="Detailed requirement specification")
    type: RequirementType = Field(default=RequirementType.FUNCTIONAL, description="Functional or Non-functional")
    priority: PriorityLevel = Field(default=PriorityLevel.HIGH, description="Priority level")
    acceptance_criteria: List[str] = Field(default_factory=list, description="Acceptance criteria (Gherkin/bulleted)")


class ProductArchitectureProposal(BaseModel):
    project_name: str = Field(..., description="Product or initiative name")
    summary: str = Field(..., description="Executive summary of the product proposal")
    vision: str = Field(..., description="High-level vision statement")
    personas: List[PersonaItem] = Field(default_factory=list, description="Target user personas")
    business_goals: List[BusinessGoalItem] = Field(default_factory=list, description="Core business goals and metrics")
    requirements: List[RequirementItem] = Field(default_factory=list, description="Decomposed functional & non-functional requirements")
    tech_stack_suggestions: List[str] = Field(default_factory=list, description="Recommended technologies, frameworks, and patterns")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional product context or constraints")
