from fastapi import APIRouter, HTTPException, Depends
from sse_starlette.sse import EventSourceResponse
from schemas.workflow import WorkflowRunRequest, WorkflowType
from schemas.common import StandardResponse
from workflows import (
    run_project_creation_workflow,
    run_sprint_planning_workflow,
    run_risk_monitoring_workflow,
    run_code_review_workflow,
)
from api.dependencies import verify_internal_secret
import asyncio
import json

router = APIRouter(prefix="/api/workflows", tags=["Workflows"])

WORKFLOW_HANDLERS = {
    WorkflowType.PROJECT_CREATION: run_project_creation_workflow,
    WorkflowType.SPRINT_PLANNING: run_sprint_planning_workflow,
    WorkflowType.RISK_MONITORING: run_risk_monitoring_workflow,
    WorkflowType.CODE_REVIEW: run_code_review_workflow,
}


@router.post("/run", response_model=StandardResponse)
async def run_workflow(
    req: WorkflowRunRequest,
    _auth: bool = Depends(verify_internal_secret),
):
    handler = WORKFLOW_HANDLERS.get(req.workflow_type)
    if not handler:
        raise HTTPException(status_code=400, detail=f"Workflow '{req.workflow_type}' is not supported.")

    result = await handler(req.project_id, req.input_data)
    return StandardResponse(
        success=True,
        message=f"Workflow '{req.workflow_type}' reached checkpoint.",
        data=result,
    )


@router.post("/stream")
async def stream_workflow(
    req: WorkflowRunRequest,
    _auth: bool = Depends(verify_internal_secret),
):
    """
    Streams multi-agent state changes, reasoning steps, and proposals via Server-Sent Events (SSE).
    """
    async def event_generator():
        yield {
            "event": "start",
            "data": json.dumps({"message": f"Starting {req.workflow_type}", "project_id": req.project_id}),
        }

        handler = WORKFLOW_HANDLERS.get(req.workflow_type)
        if handler:
            result = await handler(req.project_id, req.input_data)
            for log in result.get("logs", []):
                yield {
                    "event": "agent_step",
                    "data": json.dumps(log),
                }
                await asyncio.sleep(0.3)

            for prop in result.get("proposals", []):
                yield {
                    "event": "proposal",
                    "data": json.dumps(prop),
                }

        yield {
            "event": "complete",
            "data": json.dumps({"status": "AWAITING_HUMAN_APPROVAL"}),
        }

    return EventSourceResponse(event_generator())
