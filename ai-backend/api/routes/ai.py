from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
from schemas.ai_requests import (
    ProjectCreateAIRequest,
    ProjectCreateAIResponse,
    SprintPlanAIRequest,
    SprintPlanAIResponse,
    RiskAnalyzeAIRequest,
    RiskAnalyzeAIResponse,
    SupervisorAnalyzeAIRequest,
    SupervisorAnalyzeAIResponse,
)
from schemas.product import ProductArchitectureProposal
from schemas.task_decomp import WorkBreakdownProposal
from schemas.dependency import DependencyAnalysisResult
from schemas.sprint import SprintPlanProposal
from schemas.risk import RiskAnalysisResult
from workflows import (
    run_project_creation_workflow,
    run_sprint_planning_workflow,
    run_risk_monitoring_workflow,
    run_supervisor_workflow,
)
from agents.supervisor import supervisor_agent
from api.dependencies import verify_internal_secret
from utils.logger import logger

router = APIRouter(prefix="/ai", tags=["AI Multi-Agent Swarm"])


@router.post("/project/create", response_model=ProjectCreateAIResponse)
async def create_project_ai(
    req: ProjectCreateAIRequest,
    _auth: bool = Depends(verify_internal_secret),
):
    """
    Executes the Product -> Task -> Dependency agent pipeline to generate a structured
    PRD, hierarchical work breakdown (Epics/Features/Stories/Tasks), and DAG dependency map.
    All actions require human engineering lead approval before database mutation.
    """
    logger.info(f"[Route:POST /ai/project/create] Starting pipeline for project: {req.project_id}")
    input_data = req.model_dump()
    state = await run_project_creation_workflow(req.project_id, input_data)

    prd_data = state.get("prd") or {}
    wbs_data = state.get("work_breakdown") or {}
    dep_data = state.get("dependencies") or {}

    return ProjectCreateAIResponse(
        project_id=req.project_id,
        prd=ProductArchitectureProposal(**prd_data) if isinstance(prd_data, dict) and "project_name" in prd_data else prd_data,
        work_breakdown=WorkBreakdownProposal(**wbs_data) if isinstance(wbs_data, dict) and "epics" in wbs_data else wbs_data,
        dependencies=DependencyAnalysisResult(**dep_data) if isinstance(dep_data, dict) and "dependencies" in dep_data else dep_data,
        status=state.get("status", "AWAITING_HUMAN_APPROVAL"),
        requires_approval=True,
        logs=state.get("logs", []),
    )


@router.post("/sprint/plan", response_model=SprintPlanAIResponse)
async def plan_sprint_ai(
    req: SprintPlanAIRequest,
    _auth: bool = Depends(verify_internal_secret),
):
    """
    Executes the Sprint Planner & Risk agents to formulate a balanced sprint commitment,
    calculate capacity utilization, and flag delivery hazards.
    """
    logger.info(f"[Route:POST /ai/sprint/plan] Planning sprint for project: {req.project_id}")
    input_data = req.model_dump()
    state = await run_sprint_planning_workflow(req.project_id, input_data)

    sprint_data = state.get("sprint_plan") or {}

    return SprintPlanAIResponse(
        project_id=req.project_id,
        sprint_plan=SprintPlanProposal(**sprint_data) if isinstance(sprint_data, dict) and "sprint_name" in sprint_data else sprint_data,
        status=state.get("status", "AWAITING_HUMAN_APPROVAL"),
        requires_approval=True,
        logs=state.get("logs", []),
    )


@router.post("/risk/analyze", response_model=RiskAnalyzeAIResponse)
async def analyze_risk_ai(
    req: RiskAnalyzeAIRequest,
    _auth: bool = Depends(verify_internal_secret),
):
    """
    Executes the Risk Agent to audit project state, computing quantitative risk scores
    (probability * impact) and recommending mitigation actions.
    """
    logger.info(f"[Route:POST /ai/risk/analyze] Auditing risks for project: {req.project_id}")
    input_data = req.model_dump()
    state = await run_risk_monitoring_workflow(req.project_id, input_data)

    risk_data = state.get("risk_analysis") or {}

    return RiskAnalyzeAIResponse(
        project_id=req.project_id,
        risk_analysis=RiskAnalysisResult(**risk_data) if isinstance(risk_data, dict) and "risks" in risk_data else risk_data,
        status="COMPLETED",
        requires_approval=False,
        logs=state.get("logs", []),
    )


@router.post("/supervisor/analyze", response_model=SupervisorAnalyzeAIResponse)
async def analyze_supervisor_ai(
    req: SupervisorAnalyzeAIRequest,
    _auth: bool = Depends(verify_internal_secret),
):
    """
    Executes the PM Supervisor Agent to inspect project health and dynamically route
    control flow to specialized sub-agents.
    """
    logger.info(f"[Route:POST /ai/supervisor/analyze] Supervisor analyzing project: {req.project_id}")
    state = {
        "project_id": req.project_id,
        "workflow_type": req.trigger_event or "SUPERVISOR",
        "input_data": req.context or {},
        "logs": [],
        "current_step": "START",
        **(req.context or {}),
    }

    decision = await supervisor_agent.decide_next_step(state)

    return SupervisorAnalyzeAIResponse(
        project_id=req.project_id,
        decision=decision,
        status="DECIDED",
        recommended_next_step=decision.next_action.value,
        logs=state.get("logs", []),
    )
