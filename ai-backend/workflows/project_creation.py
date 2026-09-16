from typing import Dict, Any, TypedDict, List
from utils.logger import logger
from agents.product import product_agent
from agents.task import task_agent
from agents.dependency import dependency_agent


class ProjectWorkflowState(TypedDict, total=False):
    project_id: str
    input_data: Dict[str, Any]
    prd: Dict[str, Any]
    tasks: List[Dict[str, Any]]
    dependencies: List[Dict[str, Any]]
    proposals: List[Dict[str, Any]]
    logs: List[Dict[str, Any]]
    current_step: str
    status: str


async def run_project_creation_workflow(project_id: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    LangGraph-based Project Creation StateGraph.
    Flow: Raw Input -> Product Agent (PRD) -> Task Agent (Decomposition) -> Dependency Agent (DAG & Guarded Proposals).
    """
    logger.info(f"[Workflow:ProjectCreation] Starting state graph for project: {project_id}")

    state: ProjectWorkflowState = {
        "project_id": project_id,
        "input_data": input_data,
        "logs": [],
        "proposals": [],
        "current_step": "START",
        "status": "RUNNING",
    }

    # Step 1: Product Agent
    state = await product_agent.execute(state)

    # Step 2: Task Agent
    state = await task_agent.execute(state)

    # Step 3: Dependency Agent
    state = await dependency_agent.execute(state)

    # State machine checkpoint: Human approval required for proposed tasks & dependencies
    state["status"] = "AWAITING_HUMAN_APPROVAL"
    state["current_step"] = "CHECKPOINT_HUMAN_APPROVAL"

    logger.info(f"[Workflow:ProjectCreation] Checkpoint reached with {len(state.get('proposals', []))} proposals.")
    return state
