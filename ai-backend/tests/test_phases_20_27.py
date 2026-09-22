import asyncio
import sys
import os

# Add ai-backend to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from main import app
from config.settings import settings
from schemas import (
    ProductArchitectureProposal,
    WorkBreakdownProposal,
    DependencyAnalysisResult,
    SprintPlanProposal,
    RiskAnalysisResult,
    SupervisorDecision,
    ProjectCreateAIRequest,
    SprintPlanAIRequest,
    RiskAnalyzeAIRequest,
    SupervisorAnalyzeAIRequest,
)
from services.llm_service import get_gemini_chat_model, get_structured_llm
from agents import (
    product_agent,
    task_agent,
    dependency_agent,
    sprint_agent,
    risk_agent,
    supervisor_agent,
)
from workflows import (
    build_supervisor_graph,
    supervisor_graph,
    run_project_creation_workflow,
    run_sprint_planning_workflow,
    run_risk_monitoring_workflow,
    run_supervisor_workflow,
)
from tools import (
    get_project_details,
    list_project_tasks,
    propose_create_task,
    list_task_dependencies,
    propose_task_dependency,
    list_project_sprints,
    propose_sprint_plan,
    list_project_risks,
    propose_create_risk,
)


def test_schemas():
    print("Testing Pydantic Schemas...")
    prd = product_agent._generate_fallback("Test Idea")
    assert isinstance(prd, ProductArchitectureProposal)
    assert len(prd.requirements) > 0

    wbs = task_agent._generate_fallback("proj-1", "Test Project")
    assert isinstance(wbs, WorkBreakdownProposal)
    assert wbs.total_tasks > 0

    deps = dependency_agent._generate_fallback("proj-1", [{"id": "T1"}, {"id": "T2"}])
    assert isinstance(deps, DependencyAnalysisResult)
    assert len(deps.dependencies) > 0

    sprint = sprint_agent._generate_fallback("proj-1", [{"id": "T1", "points": 5}])
    assert isinstance(sprint, SprintPlanProposal)
    assert sprint.capacity.committed_points == 5

    risk = risk_agent._generate_fallback("proj-1", [{"id": "T1"}])
    assert isinstance(risk, RiskAnalysisResult)
    assert len(risk.risks) > 0

    print("[OK] All Pydantic Schemas Validated Successfully!")


def test_llm_service():
    print("Testing Centralized LLM Service...")
    model = get_gemini_chat_model()
    assert model is not None

    structured = get_structured_llm(ProductArchitectureProposal)
    assert structured is not None
    print("[OK] LLM Service & Structured Output Configuration Initialized Successfully!")


async def test_tools():
    print("Testing Controlled Tools...")
    proj = await get_project_details.ainvoke({"project_id": "test_proj"})
    assert "project_id" in proj or "id" in proj

    tasks = await list_project_tasks.ainvoke({"project_id": "test_proj"})
    assert isinstance(tasks, list)

    prop_task = await propose_create_task.ainvoke({
        "project_id": "test_proj",
        "title": "Build Test Suite",
        "description": "Integration tests",
    })
    assert prop_task["requires_human_approval"] is True

    deps = await list_task_dependencies.ainvoke({"project_id": "test_proj"})
    assert isinstance(deps, list)

    prop_dep = await propose_task_dependency.ainvoke({
        "project_id": "test_proj",
        "from_task_id": "T1",
        "to_task_id": "T2",
    })
    assert prop_dep["requires_human_approval"] is True

    sprints = await list_project_sprints.ainvoke({"project_id": "test_proj"})
    assert isinstance(sprints, list)

    prop_sprint = await propose_sprint_plan.ainvoke({
        "project_id": "test_proj",
        "sprint_name": "Sprint Alpha",
        "target_story_points": 21,
        "task_ids": ["T1", "T2"],
        "sprint_goal": "Alpha release",
    })
    assert prop_sprint["requires_human_approval"] is True

    risks = await list_project_risks.ainvoke({"project_id": "test_proj"})
    assert isinstance(risks, list)

    prop_risk = await propose_create_risk.ainvoke({
        "project_id": "test_proj",
        "title": "Scope creep",
        "severity": "HIGH",
        "likelihood": "LIKELY",
        "mitigation": "Scope freeze",
    })
    assert prop_risk["requires_human_approval"] is True
    print("[OK] All Controlled Tools Executed & Validated Successfully!")


async def test_agents():
    print("Testing Specialized Agents...")
    base_state = {
        "project_id": "test_proj_agents",
        "input_data": {"raw_idea": "Autonomous Task Orchestration"},
        "logs": [],
        "proposals": [],
    }

    # 1. Product Agent
    state_p = await product_agent.execute(base_state)
    assert "prd" in state_p
    assert len(state_p["proposals"]) > 0

    # 2. Task Agent
    state_t = await task_agent.execute(state_p)
    assert "work_breakdown" in state_t
    assert "tasks" in state_t
    assert len(state_t["tasks"]) > 0

    # 3. Dependency Agent
    state_d = await dependency_agent.execute(state_t)
    assert "dependencies" in state_d

    # 4. Sprint Agent
    state_s = await sprint_agent.execute(state_d)
    assert "sprint_plan" in state_s

    # 5. Risk Agent
    state_r = await risk_agent.execute(state_s)
    assert "risk_analysis" in state_r

    # 6. Supervisor Agent
    decision = await supervisor_agent.decide_next_step(state_r)
    assert isinstance(decision, SupervisorDecision)
    print("[OK] All 6 Specialized Agents Executed & Validated Successfully!")


async def test_langgraph_workflows():
    print("Testing LangGraph Workflows & State Machine...")
    # Verify graph compilation
    graph = build_supervisor_graph()
    assert graph is not None

    # Run Project Creation sub-workflow
    p_result = await run_project_creation_workflow("proj_wf_test", {"raw_idea": "Realtime Collab Engine"})
    assert p_result["status"] == "AWAITING_HUMAN_APPROVAL"
    assert "prd" in p_result
    assert "work_breakdown" in p_result
    assert "dependencies" in p_result

    # Run Sprint Planning sub-workflow
    s_result = await run_sprint_planning_workflow("proj_wf_test", {"team_capacity_points": 30})
    assert s_result["status"] == "AWAITING_HUMAN_APPROVAL"
    assert "sprint_plan" in s_result

    # Run Risk Monitoring sub-workflow
    r_result = await run_risk_monitoring_workflow("proj_wf_test", {})
    assert r_result["status"] == "AUDIT_COMPLETED"
    assert "risk_analysis" in r_result

    print("[OK] LangGraph StateGraphs Compiled and Executed Successfully!")


def test_fastapi_endpoints():
    print("Testing FastAPI Application & Endpoints...")
    client = TestClient(app)

    headers = {"x-internal-secret": settings.INTERNAL_API_SECRET}

    # 1. GET /health (public, no auth required)
    res = client.get("/health")
    assert res.status_code == 200, f"GET /health failed: {res.text}"
    data = res.json()
    assert data["status"] == "HEALTHY"
    print("  [OK] GET /health -> 200 HEALTHY")

    # 2. POST /ai/project/create
    res = client.post(
        "/ai/project/create",
        json={
            "project_id": "test_proj_fastapi",
            "raw_idea": "Build distributed event-driven message bus",
            "business_context": "Fintech payment processing",
        },
        headers=headers,
    )
    assert res.status_code == 200, f"POST /ai/project/create failed: {res.text}"
    p_data = res.json()
    assert p_data["status"] == "AWAITING_HUMAN_APPROVAL"
    assert p_data["requires_approval"] is True
    assert "prd" in p_data
    assert "work_breakdown" in p_data
    assert "dependencies" in p_data
    print("  [OK] POST /ai/project/create -> 200 OK (PRD, WBS, DAG, Approval Gated)")

    # 3. POST /ai/sprint/plan
    res = client.post(
        "/ai/sprint/plan",
        json={
            "project_id": "test_proj_fastapi",
            "sprint_name": "Sprint 1",
            "team_capacity_points": 35,
        },
        headers=headers,
    )
    assert res.status_code == 200, f"POST /ai/sprint/plan failed: {res.text}"
    s_data = res.json()
    assert s_data["status"] == "AWAITING_HUMAN_APPROVAL"
    assert "sprint_plan" in s_data
    print("  [OK] POST /ai/sprint/plan -> 200 OK (Capacity Calculated, Approval Gated)")

    # 4. POST /ai/risk/analyze
    res = client.post(
        "/ai/risk/analyze",
        json={
            "project_id": "test_proj_fastapi",
            "risk_threshold": 5,
        },
        headers=headers,
    )
    assert res.status_code == 200, f"POST /ai/risk/analyze failed: {res.text}"
    r_data = res.json()
    assert r_data["status"] == "COMPLETED"
    assert "risk_analysis" in r_data
    print("  [OK] POST /ai/risk/analyze -> 200 OK (Quantitative Risk Scoring)")

    # 5. POST /ai/supervisor/analyze
    res = client.post(
        "/ai/supervisor/analyze",
        json={
            "project_id": "test_proj_fastapi",
            "trigger_event": "MANUAL_CHECK",
        },
        headers=headers,
    )
    assert res.status_code == 200, f"POST /ai/supervisor/analyze failed: {res.text}"
    sup_data = res.json()
    assert sup_data["status"] == "DECIDED"
    assert "decision" in sup_data
    print("  [OK] POST /ai/supervisor/analyze -> 200 OK (Dynamic Routing Decision)")

    print("[OK] All FastAPI Endpoints Tested & Verified Successfully!")


async def run_async_tests():
    await test_tools()
    await test_agents()
    await test_langgraph_workflows()


def main():
    print("=" * 70)
    print("VERIFICATION SUITE: PHASES 20 - 27")
    print("FastAPI Foundation, Gemini Integration & LangGraph Multi-Agent Suite")
    print("=" * 70)
    test_schemas()
    test_llm_service()
    asyncio.run(run_async_tests())
    test_fastapi_endpoints()
    print("=" * 70)
    print("ALL TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 70)


if __name__ == "__main__":
    main()
