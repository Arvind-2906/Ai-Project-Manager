from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


class DependencyType(str, Enum):
    BLOCKS = "BLOCKS"
    BLOCKED_BY = "BLOCKED_BY"
    RELATES_TO = "RELATES_TO"


class DependencyItem(BaseModel):
    from_task_id: str = Field(..., description="Source task identifier (the blocker or relation origin)")
    to_task_id: str = Field(..., description="Target task identifier (the blocked task or relation target)")
    type: DependencyType = Field(default=DependencyType.BLOCKS, description="Relationship type")
    reason: str = Field(..., description="Technical rationale for the dependency")
    confidence: float = Field(default=0.9, ge=0.0, le=1.0, description="Agent confidence score")


class DependencyAnalysisResult(BaseModel):
    project_id: str = Field(..., description="Associated project ID")
    dependencies: List[DependencyItem] = Field(default_factory=list, description="List of identified dependencies")
    topological_order: List[str] = Field(default_factory=list, description="Sequenced task IDs respecting dependency order")
    has_cycles: bool = Field(default=False, description="Flag indicating cyclic deadlock detected")
    cycle_nodes: List[str] = Field(default_factory=list, description="Tasks involved in cyclic dependencies if any")
    critical_path: List[str] = Field(default_factory=list, description="Longest sequential chain of blocking tasks")
    summary: str = Field(..., description="High-level dependency analysis summary")
