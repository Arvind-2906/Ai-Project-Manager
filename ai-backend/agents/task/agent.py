from typing import Dict, Any, List
from utils.logger import logger


class TaskAgent:
    """
    Task Agent decomposes PRDs and user stories into atomic engineering tasks,
    allocates story points (Fibonacci), and details acceptance criteria.
    """
    def __init__(self):
        self.name = "Task Agent"

    async def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        prd = state.get("prd", {})
        logger.info(f"[{self.name}] Decomposing PRD '{prd.get('title')}' into tasks")

        tasks = [
            {
                "id": "DCE-120",
                "title": "Build log compaction snapshot writer worker",
                "points": 5,
                "priority": "HIGH",
            },
            {
                "id": "DCE-121",
                "title": "Expose snapshot stream chunk reader gRPC endpoint",
                "points": 8,
                "priority": "CRITICAL",
            },
            {
                "id": "DCE-122",
                "title": "Add integration test verifying compaction with zero message loss",
                "points": 3,
                "priority": "MEDIUM",
            },
        ]

        logs = state.get("logs", [])
        logs.append({
            "agent": "TASK",
            "message": f"Decomposed PRD into {len(tasks)} atomic tasks with Fibonacci estimates.",
        })

        return {
            **state,
            "tasks": tasks,
            "current_step": "task_done",
            "logs": logs,
        }


task_agent = TaskAgent()
