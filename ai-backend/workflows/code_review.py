from typing import Dict, Any
from utils.logger import logger
from agents.review import review_agent


async def run_code_review_workflow(project_id: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Automated PR & Code Review StateGraph.
    Flow: Ingest PR Diff -> Static & Security Scan -> Acceptance Criteria Match -> Review Report.
    """
    logger.info(f"[Workflow:CodeReview] Reviewing PR for project: {project_id}")

    state = {
        "project_id": project_id,
        "input_data": input_data,
        "pr_number": input_data.get("pr_number", 42),
        "logs": [],
    }

    state = await review_agent.execute(state)
    state["status"] = "REVIEW_COMPLETED"
    return state
