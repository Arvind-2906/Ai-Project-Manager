from typing import Dict, Any
from utils.logger import logger


class SupervisorAgent:
    """
    Supervisor Agent coordinates the multi-agent swarm state machine in LangGraph.
    It inspects project goals, routes execution to specialized agents, and guards human approval gates.
    """
    def __init__(self):
        self.name = "Supervisor Agent"

    async def decide_next_step(self, state: Dict[str, Any]) -> str:
        workflow_type = state.get("workflow_type", "PROJECT_CREATION")
        current_step = state.get("current_step", "START")

        logger.info(f"[{self.name}] Routing state for workflow {workflow_type}, current_step={current_step}")

        if current_step == "START":
            return "product_agent"
        elif current_step == "product_done":
            return "task_agent"
        elif current_step == "task_done":
            return "dependency_agent"
        elif current_step == "dependency_done":
            return "human_approval_gate"
        return "complete"


supervisor_agent = SupervisorAgent()
