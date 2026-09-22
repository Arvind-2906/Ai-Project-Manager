import pytest
import sys
import os
from unittest.mock import AsyncMock, patch, MagicMock

# Add ai-backend to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from main import app
from config.settings import settings
from tools.client import backend_client
from tools.approval_tools import submit_approval_proposal, list_pending_approvals
from tools.task_tools import propose_create_task
from tools.sprint_tools import propose_sprint_plan
from tools.risk_tools import propose_create_risk
from tools.dependency_tools import propose_task_dependency
from workflows import (
    run_project_creation_workflow,
    run_sprint_planning_workflow,
    run_risk_monitoring_workflow,
    run_supervisor_workflow,
)


@pytest.fixture
def test_client():
    return TestClient(app)


@pytest.fixture
def auth_headers():
    return {"x-internal-secret": settings.INTERNAL_API_SECRET}


# =====================================================================
# 1. PHASE 29: Next.js <-> FastAPI Internal Security Tests
# =====================================================================

def test_internal_secret_rejection_when_missing(test_client):
    """Endpoints protected by verify_internal_secret must reject requests without x-internal-secret."""
    res = test_client.post(
        "/ai/project/create",
        json={"project_id": "test-p1", "raw_idea": "Build distributed storage"},
    )
    assert res.status_code == 401
    assert "Invalid or missing internal service secret" in res.json().get("detail", "")


def test_internal_secret_rejection_when_invalid(test_client):
    """Endpoints must reject requests with wrong internal secrets."""
    res = test_client.post(
        "/ai/project/create",
        json={"project_id": "test-p1", "raw_idea": "Build distributed storage"},
        headers={"x-internal-secret": "completely-invalid-secret-token"},
    )
    assert res.status_code == 401
    assert "Invalid or missing internal service secret" in res.json().get("detail", "")


def test_internal_secret_acceptance_when_valid(test_client, auth_headers):
    """Endpoints must accept requests that provide the valid x-internal-secret header."""
    res = test_client.post(
        "/ai/project/create",
        json={"project_id": "test-p1", "raw_idea": "Build distributed storage"},
        headers=auth_headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "AWAITING_HUMAN_APPROVAL"
    assert data["requires_approval"] is True


def test_public_health_endpoint_does_not_require_secret(test_client):
    """GET /health is public for container probes and does not require authentication."""
    res = test_client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "HEALTHY"


def test_backend_client_attaches_internal_secret_header():
    """Verify backend_client includes x-internal-secret and proper headers for Next.js communication."""
    assert "x-internal-secret" in backend_client.headers
    assert backend_client.headers["x-internal-secret"] == settings.INTERNAL_API_SECRET
    assert backend_client.headers["Content-Type"] == "application/json"


# =====================================================================
# 2. PHASE 28: Human-in-the-Loop Approval Tools & Mutation Payload Formatting
# =====================================================================

@pytest.mark.asyncio
async def test_submit_approval_proposal_payload_structure():
    """Verifies that submit_approval_proposal formats payload with x-internal-secret and AI_AGENT proposer."""
    with patch("tools.approval_tools.backend_client.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = {
            "success": True,
            "data": {
                "id": "appr-123",
                "actionType": "CREATE_TASK",
                "status": "PENDING",
            },
        }

        res = await submit_approval_proposal.ainvoke({
            "project_id": "proj-hitl-1",
            "action_type": "CREATE_TASK",
            "payload": {"title": "Setup Kafka Broker", "priority": "HIGH"},
            "reason": "Required for distributed streaming",
        })

        assert res["status"] == "PROPOSED"
        assert res["approval_id"] == "appr-123"
        assert res["requires_human_approval"] is True

        mock_post.assert_called_once_with(
            "/api/projects/proj-hitl-1/approvals",
            {
                "actionType": "CREATE_TASK",
                "payload": {"title": "Setup Kafka Broker", "priority": "HIGH"},
                "reason": "Required for distributed streaming",
                "agentRunId": None,
            },
        )


@pytest.mark.asyncio
async def test_list_pending_approvals_queries_backend():
    """Verifies that list_pending_approvals retrieves pending approvals via internal secret."""
    with patch("tools.approval_tools.backend_client.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = {
            "success": True,
            "data": [
                {"id": "appr-1", "actionType": "CREATE_SPRINT", "status": "PENDING"},
                {"id": "appr-2", "actionType": "CREATE_TASK", "status": "PENDING"},
            ],
        }

        res = await list_pending_approvals.ainvoke({"project_id": "proj-hitl-1"})
        assert len(res) == 2
        assert res[0]["actionType"] == "CREATE_SPRINT"
        mock_get.assert_called_once_with(
            "/api/projects/proj-hitl-1/approvals",
            params={"status": "PENDING"},
        )


# =====================================================================
# 3. Controlled Tools Enforce Human Approval Gating
# =====================================================================

@pytest.mark.asyncio
async def test_task_agent_tool_requires_approval():
    """Task proposal tool must return requires_human_approval = True."""
    res = await propose_create_task.ainvoke({
        "project_id": "proj-hitl-1",
        "title": "Configure Redis Cache",
        "description": "Implement cluster caching",
        "priority": "HIGH",
    })
    assert res["requires_human_approval"] is True
    assert res["action_type"] == "CREATE_TASK"
    assert res["data"]["title"] == "Configure Redis Cache"


@pytest.mark.asyncio
async def test_sprint_agent_tool_requires_approval():
    """Sprint proposal tool must return requires_human_approval = True."""
    res = await propose_sprint_plan.ainvoke({
        "project_id": "proj-hitl-1",
        "sprint_name": "Sprint Phoenix",
        "target_story_points": 25,
        "task_ids": ["task-1", "task-2"],
        "sprint_goal": "Deploy MVP architecture",
    })
    assert res["requires_human_approval"] is True
    assert res["action_type"] == "CREATE_SPRINT"
    assert res["data"]["sprint_name"] == "Sprint Phoenix"


@pytest.mark.asyncio
async def test_risk_agent_tool_requires_approval():
    """Risk proposal tool must return requires_human_approval = True."""
    res = await propose_create_risk.ainvoke({
        "project_id": "proj-hitl-1",
        "title": "Database connection pool exhaustion",
        "severity": "HIGH",
        "likelihood": "MEDIUM",
        "mitigation": "Increase PgBouncer pool ceiling",
    })
    assert res["requires_human_approval"] is True
    assert res["action_type"] == "CREATE_RISK"
    assert res["data"]["title"] == "Database connection pool exhaustion"


@pytest.mark.asyncio
async def test_dependency_agent_tool_requires_approval():
    """Dependency proposal tool must return requires_human_approval = True."""
    res = await propose_task_dependency.ainvoke({
        "project_id": "proj-hitl-1",
        "from_task_id": "task-auth",
        "to_task_id": "task-dashboard",
    })
    assert res["requires_human_approval"] is True
    assert res["action_type"] == "CREATE_TASK_DEPENDENCY"
    assert res["data"]["from_task_id"] == "task-auth"
    assert res["data"]["to_task_id"] == "task-dashboard"


# =====================================================================
# 4. Multi-Agent Workflows & Supervisor Dynamic Routing
# =====================================================================

@pytest.mark.asyncio
async def test_project_creation_workflow_hitl_status():
    """Project creation workflow outputs PRD, WBS, and DAG in AWAITING_HUMAN_APPROVAL state."""
    result = await run_project_creation_workflow(
        project_id="proj-hitl-wf",
        input_data={"raw_idea": "Build high-throughput event store", "business_context": "IoT telemetry"},
    )
    assert result["status"] == "AWAITING_HUMAN_APPROVAL"
    assert "prd" in result
    assert "work_breakdown" in result
    assert "dependencies" in result


@pytest.mark.asyncio
async def test_sprint_planning_workflow_hitl_status():
    """Sprint planning workflow outputs sprint proposal in AWAITING_HUMAN_APPROVAL state."""
    result = await run_sprint_planning_workflow(
        project_id="proj-hitl-wf",
        input_data={"team_capacity_points": 40},
    )
    assert result["status"] == "AWAITING_HUMAN_APPROVAL"
    assert "sprint_plan" in result


@pytest.mark.asyncio
async def test_supervisor_workflow_decision():
    """Supervisor agent analyzes telemetry and routes state until it reaches the human approval gate."""
    result = await run_supervisor_workflow(
        project_id="proj-hitl-wf",
        input_data={"trigger_event": "SPRINT_DRIFT", "sprint_drift_score": 7.5},
    )
    assert result["status"] == "AWAITING_HUMAN_APPROVAL"
    assert "prd" in result or "tasks" in result or "dependencies" in result


# =====================================================================
# 5. FastAPI Endpoints Human-in-the-Loop Integration Verification
# =====================================================================

def test_fastapi_sprint_endpoint_requires_approval(test_client, auth_headers):
    """POST /ai/sprint/plan returns requires_approval=True and structured proposal."""
    res = test_client.post(
        "/ai/sprint/plan",
        json={
            "project_id": "proj-hitl-fastapi",
            "sprint_name": "Sprint Alpha",
            "team_capacity_points": 30,
        },
        headers=auth_headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "AWAITING_HUMAN_APPROVAL"
    assert data["requires_approval"] is True
    assert "sprint_plan" in data


def test_fastapi_risk_endpoint_computes_scores(test_client, auth_headers):
    """POST /ai/risk/analyze computes quantitative risk scores without mutating database."""
    res = test_client.post(
        "/ai/risk/analyze",
        json={"project_id": "proj-hitl-fastapi", "risk_threshold": 4},
        headers=auth_headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "COMPLETED"
    assert "risk_analysis" in data
    assert len(data["risk_analysis"]["risks"]) > 0


def test_fastapi_supervisor_endpoint_dynamic_routing(test_client, auth_headers):
    """POST /ai/supervisor/analyze returns autonomous supervisor routing decision."""
    res = test_client.post(
        "/ai/supervisor/analyze",
        json={"project_id": "proj-hitl-fastapi", "trigger_event": "RISK_ALERT"},
        headers=auth_headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "DECIDED"
    assert "decision" in data
    assert "recommended_next_step" in data
