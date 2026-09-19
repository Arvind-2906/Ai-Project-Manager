from typing import Dict, Any
from langgraph.graph import StateGraph, END
from workflows.state import SwarmState
from agents.supervisor import supervisor_agent
from agents.product import product_agent
from agents.task import task_agent
from agents.dependency import dependency_agent
from agents.sprint import sprint_agent
from agents.risk import risk_agent
from schemas.supervisor import SupervisorAction
from utils.logger import logger


def build_supervisor_graph():
    """
    Compiles the Master LangGraph StateGraph connecting:
    Supervisor -> Product -> Task -> Dependency -> Sprint -> Risk -> Human Approval Gate.
    """
    graph = StateGraph(SwarmState)

    # Node: Supervisor
    async def supervisor_node(state: SwarmState) -> SwarmState:
        decision = await supervisor_agent.decide_next_step(state)
        return {
            **state,
            "supervisor_decision": decision.model_dump(),
            "next_step": decision.next_action.value,
        }

    # Node: Product Agent
    async def product_node(state: SwarmState) -> SwarmState:
        return await product_agent.execute(state)

    # Node: Task Decomposer Agent
    async def task_node(state: SwarmState) -> SwarmState:
        return await task_agent.execute(state)

    # Node: Dependency Agent
    async def dependency_node(state: SwarmState) -> SwarmState:
        return await dependency_agent.execute(state)

    # Node: Sprint Planner Agent
    async def sprint_node(state: SwarmState) -> SwarmState:
        return await sprint_agent.execute(state)

    # Node: Risk Agent
    async def risk_node(state: SwarmState) -> SwarmState:
        return await risk_agent.execute(state)

    # Node: Human Approval Gate
    async def human_approval_node(state: SwarmState) -> SwarmState:
        logs = state.get("logs", [])
        logs.append({
            "agent": "SUPERVISOR",
            "message": "Human-in-the-loop checkpoint reached. Actions halted awaiting engineering lead approval.",
        })
        return {
            **state,
            "status": "AWAITING_HUMAN_APPROVAL",
            "current_step": "CHECKPOINT_HUMAN_APPROVAL",
            "logs": logs,
        }

    # Register Nodes
    graph.add_node("supervisor", supervisor_node)
    graph.add_node("product_agent", product_node)
    graph.add_node("task_agent", task_node)
    graph.add_node("dependency_agent", dependency_node)
    graph.add_node("sprint_agent", sprint_node)
    graph.add_node("risk_agent", risk_node)
    graph.add_node("human_approval_gate", human_approval_node)

    # Entry point
    graph.set_entry_point("supervisor")

    # Routing condition from supervisor
    def route_from_supervisor(state: SwarmState) -> str:
        next_step = state.get("next_step")
        logger.info(f"[SupervisorGraph] Routing on next_step='{next_step}'")
        if next_step == SupervisorAction.ROUTE_TO_PRODUCT.value:
            return "product_agent"
        elif next_step == SupervisorAction.ROUTE_TO_TASK.value:
            return "task_agent"
        elif next_step == SupervisorAction.ROUTE_TO_DEPENDENCY.value:
            return "dependency_agent"
        elif next_step == SupervisorAction.ROUTE_TO_SPRINT.value:
            return "sprint_agent"
        elif next_step == SupervisorAction.ROUTE_TO_RISK.value:
            return "risk_agent"
        elif next_step == SupervisorAction.REQUEST_HUMAN_APPROVAL.value:
            return "human_approval_gate"
        else:
            return END

    graph.add_conditional_edges(
        "supervisor",
        route_from_supervisor,
        {
            "product_agent": "product_agent",
            "task_agent": "task_agent",
            "dependency_agent": "dependency_agent",
            "sprint_agent": "sprint_agent",
            "risk_agent": "risk_agent",
            "human_approval_gate": "human_approval_gate",
            END: END,
        },
    )

    # Loop back to supervisor after agent executes to evaluate next state
    graph.add_edge("product_agent", "supervisor")
    graph.add_edge("task_agent", "supervisor")
    graph.add_edge("dependency_agent", "supervisor")
    graph.add_edge("sprint_agent", "supervisor")
    graph.add_edge("risk_agent", "supervisor")
    graph.add_edge("human_approval_gate", END)

    return graph.compile()


supervisor_graph = build_supervisor_graph()


async def run_supervisor_workflow(
    project_id: str,
    input_data: Dict[str, Any],
    workflow_type: str = "SUPERVISOR",
) -> Dict[str, Any]:
    """
    Executes the compiled LangGraph supervisor state machine.
    """
    logger.info(f"[SupervisorWorkflow] Starting supervisor graph for project: {project_id}")

    initial_state: SwarmState = {
        "project_id": project_id,
        "workflow_type": workflow_type,
        "input_data": input_data,
        "prd": input_data.get("prd"),
        "tasks": input_data.get("tasks", []),
        "dependencies": input_data.get("dependencies"),
        "sprint_plan": input_data.get("sprint_plan"),
        "risk_analysis": input_data.get("risk_analysis"),
        "proposals": [],
        "logs": [],
        "current_step": "START",
        "status": "RUNNING",
    }

    result = await supervisor_graph.ainvoke(initial_state, config={"recursion_limit": 25})
    return result
