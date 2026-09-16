from typing import Dict, Any
from utils.logger import logger


class SprintAgent:
    """
    Sprint Agent evaluates historical velocity, unassigned backlog tasks,
    and capacity constraints to propose balanced sprint commitments.
    """
    def __init__(self):
        self.name = "Sprint Agent"

    async def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        tasks = state.get("tasks", [])
        total_points = sum(t.get("points", 3) for t in tasks)
        logger.info(f"[{self.name}] Planning sprint for {total_points} total story points")

        sprint_plan = {
            "name": "Sprint 5 - Snapshot Replication",
            "goal": "Deliver core compaction pipeline and gRPC snapshot exchange",
            "committed_points": min(total_points, 34),
            "buffer_points": 4,
        }

        logs = state.get("logs", [])
        logs.append({
            "agent": "SPRINT",
            "message": f"Proposed {sprint_plan['name']} with {sprint_plan['committed_points']} committed points.",
        })

        return {
            **state,
            "sprint_plan": sprint_plan,
            "logs": logs,
        }


sprint_agent = SprintAgent()
