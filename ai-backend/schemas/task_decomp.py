from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


class TaskPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class TaskProposal(BaseModel):
    id: str = Field(..., description="Task identifier, e.g. 'TASK-101'")
    title: str = Field(..., description="Action-oriented task title")
    description: str = Field(..., description="Technical implementation details and instructions")
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM, description="Task priority")
    points: int = Field(default=3, ge=1, le=21, description="Fibonacci story points (1, 2, 3, 5, 8, 13, 21)")
    estimated_hours: float = Field(default=4.0, ge=0.5, description="Estimated engineering hours")
    acceptance_criteria: List[str] = Field(default_factory=list, description="Measurable validation criteria")
    suggested_role: Optional[str] = Field(default="Backend Engineer", description="Recommended role (Frontend, Backend, DevOps, QA)")
    tags: List[str] = Field(default_factory=list, description="Categorization tags, e.g. ['database', 'api']")


class UserStoryProposal(BaseModel):
    id: str = Field(..., description="Story identifier, e.g. 'STORY-10'")
    title: str = Field(..., description="Story title")
    user_role: str = Field(..., description="Role in 'As a [user_role]'")
    action: str = Field(..., description="Action in 'I want to [action]'")
    benefit: str = Field(..., description="Benefit in 'So that [benefit]'")
    acceptance_criteria: List[str] = Field(default_factory=list, description="Story-level acceptance criteria")
    tasks: List[TaskProposal] = Field(default_factory=list, description="Atomic tasks under this story")


class FeatureProposal(BaseModel):
    id: str = Field(..., description="Feature identifier, e.g. 'FEAT-1'")
    title: str = Field(..., description="Feature name")
    description: str = Field(..., description="Feature scope and goals")
    stories: List[UserStoryProposal] = Field(default_factory=list, description="User stories under this feature")


class EpicProposal(BaseModel):
    id: str = Field(..., description="Epic identifier, e.g. 'EPIC-1'")
    title: str = Field(..., description="Epic name")
    description: str = Field(..., description="Strategic epic description")
    features: List[FeatureProposal] = Field(default_factory=list, description="Features under this epic")


class WorkBreakdownProposal(BaseModel):
    project_id: str = Field(..., description="Associated project ID")
    summary: str = Field(..., description="Summary of work decomposition")
    epics: List[EpicProposal] = Field(default_factory=list, description="Hierarchical epics")
    total_epics: int = Field(default=0, description="Total count of epics")
    total_features: int = Field(default=0, description="Total count of features")
    total_stories: int = Field(default=0, description="Total count of user stories")
    total_tasks: int = Field(default=0, description="Total count of atomic tasks")
    total_points: int = Field(default=0, description="Sum of story points across all tasks")
    total_estimated_hours: float = Field(default=0.0, description="Sum of estimated engineering hours")
