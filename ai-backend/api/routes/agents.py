from fastapi import APIRouter, HTTPException, Depends
from schemas.agent import AgentRunRequest, AgentType
from schemas.common import StandardResponse
from agents import (
    supervisor_agent,
    product_agent,
    task_agent,
    dependency_agent,
    sprint_agent,
    risk_agent,
    developer_agent,
    review_agent,
    standup_agent,
)
from api.dependencies import verify_internal_secret

router = APIRouter(prefix="/api/agents", tags=["Agents"])

AGENT_MAP = {
    AgentType.SUPERVISOR: supervisor_agent,
    AgentType.PRODUCT: product_agent,
    AgentType.TASK: task_agent,
    AgentType.DEPENDENCY: dependency_agent,
    AgentType.SPRINT: sprint_agent,
    AgentType.RISK: risk_agent,
    AgentType.DEVELOPER: developer_agent,
    AgentType.REVIEW: review_agent,
    AgentType.STANDUP: standup_agent,
}


@router.post("/run", response_model=StandardResponse)
async def run_single_agent(
    req: AgentRunRequest,
    _auth: bool = Depends(verify_internal_secret),
):
    agent_instance = AGENT_MAP.get(req.agent_type)
    if not agent_instance:
        raise HTTPException(status_code=404, detail=f"Agent '{req.agent_type}' not found.")

    state = {
        "project_id": req.project_id,
        "input_data": {"prompt": req.prompt, **(req.context or {})},
        "logs": [],
    }

    result = await agent_instance.execute(state)
    return StandardResponse(
        success=True,
        message=f"Agent {req.agent_type} executed successfully",
        data=result,
    )
