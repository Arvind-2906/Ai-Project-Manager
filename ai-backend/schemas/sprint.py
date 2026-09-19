from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class SprintTaskAllocation(BaseModel):
    task_id: str = Field(..., description="Task identifier")
    title: str = Field(..., description="Task title")
    points: int = Field(default=3, description="Story points allocated")
    estimated_hours: float = Field(default=4.0, description="Estimated engineering hours")
    assigned_role_or_member: Optional[str] = Field(default=None, description="Suggested assignee or role")
    priority: str = Field(default="MEDIUM", description="Task priority")
    rationale: Optional[str] = Field(default=None, description="Reason for inclusion in this sprint")


class CapacityUtilization(BaseModel):
    team_capacity_points: int = Field(default=40, description="Total story point capacity of the team")
    team_capacity_hours: float = Field(default=160.0, description="Total engineering hours available")
    committed_points: int = Field(default=0, description="Total story points committed in sprint")
    committed_hours: float = Field(default=0.0, description="Total engineering hours committed in sprint")
    utilization_percentage: float = Field(default=0.0, description="Utilization percentage (committed / capacity * 100)")
    is_overloaded: bool = Field(default=False, description="True if committed exceeds capacity")


class SprintPlanProposal(BaseModel):
    project_id: str = Field(..., description="Associated project ID")
    sprint_name: str = Field(..., description="Proposed sprint name, e.g. 'Sprint 1 - Foundation'")
    goal: str = Field(..., description="Clear sprint goal or milestone deliverable")
    duration_weeks: int = Field(default=2, ge=1, le=4, description="Sprint duration in weeks")
    capacity: CapacityUtilization = Field(default_factory=CapacityUtilization, description="Team capacity metrics")
    allocated_tasks: List[SprintTaskAllocation] = Field(default_factory=list, description="Tasks scoped for the sprint")
    deferred_tasks: List[str] = Field(default_factory=list, description="Task IDs deferred to subsequent sprints")
    risks_flagged: List[str] = Field(default_factory=list, description="Sprint risks such as tight deadlines or dependencies")
    summary: str = Field(..., description="Executive summary of the sprint plan")
