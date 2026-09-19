from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


class RiskCategory(str, Enum):
    TECHNICAL = "TECHNICAL"
    TIMELINE = "TIMELINE"
    RESOURCE = "RESOURCE"
    DEPENDENCY = "DEPENDENCY"
    SCOPE = "SCOPE"
    SECURITY = "SECURITY"


class RiskSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RiskLikelihood(str, Enum):
    UNLIKELY = "UNLIKELY"
    POSSIBLE = "POSSIBLE"
    LIKELY = "LIKELY"
    VERY_LIKELY = "VERY_LIKELY"


class RiskItem(BaseModel):
    id: str = Field(..., description="Risk identifier, e.g. 'RISK-10'")
    title: str = Field(..., description="Short description of the hazard or vulnerability")
    description: str = Field(..., description="Detailed explanation of risk causes and consequences")
    category: RiskCategory = Field(default=RiskCategory.TECHNICAL, description="Risk classification")
    probability: int = Field(default=2, ge=1, le=5, description="Probability rating from 1 (rare) to 5 (almost certain)")
    impact: int = Field(default=3, ge=1, le=5, description="Impact rating from 1 (negligible) to 5 (catastrophic)")
    risk_score: int = Field(default=6, description="Quantitative risk score = probability * impact (1 to 25)")
    severity: RiskSeverity = Field(default=RiskSeverity.MEDIUM, description="Calculated severity tier")
    mitigation_plan: str = Field(..., description="Actionable strategy to eliminate, reduce, or transfer risk")
    affected_task_ids: List[str] = Field(default_factory=list, description="IDs of tasks directly exposed to this risk")


class RiskAnalysisResult(BaseModel):
    project_id: str = Field(..., description="Associated project ID")
    risks: List[RiskItem] = Field(default_factory=list, description="Identified project risks with quantitative scores")
    overall_project_risk_score: float = Field(default=0.0, description="Weighted average or aggregate risk score (1-25)")
    overall_risk_level: str = Field(default="MEDIUM", description="Overall project risk rating (LOW, MEDIUM, HIGH, CRITICAL)")
    critical_risk_count: int = Field(default=0, description="Count of risks with score >= 15")
    mitigation_summary: str = Field(..., description="Action items and priority interventions for engineering leads")
