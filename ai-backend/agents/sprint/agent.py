from typing import Dict, Any, Optional, List
from langchain_core.messages import SystemMessage, HumanMessage
from services.llm_service import get_structured_llm
from schemas.sprint import (
    SprintPlanProposal,
    SprintTaskAllocation,
    CapacityUtilization,
)
from prompts.sprint import SPRINT_AGENT_SYSTEM_PROMPT
from utils.logger import logger


class SprintAgent:
    """
    Sprint Planner Agent analyzes backlog tasks, priorities, dependencies,
    and team capacity to propose an optimized sprint commitment.
    """
    def __init__(self):
        self.name = "Sprint Planner Agent"

    def _generate_fallback(
        self,
        project_id: str,
        tasks: List[Dict[str, Any]],
        capacity_points: int = 40,
        sprint_name: Optional[str] = None,
    ) -> SprintPlanProposal:
        allocated: List[SprintTaskAllocation] = []
        deferred: List[str] = []
        committed_pts = 0
        committed_hrs = 0.0

        for t in tasks:
            pts = t.get("points", 3)
            hrs = float(t.get("estimated_hours", 4.0))
            if committed_pts + pts <= capacity_points:
                committed_pts += pts
                committed_hrs += hrs
                allocated.append(
                    SprintTaskAllocation(
                        task_id=t.get("id", "TASK-1"),
                        title=t.get("title", "Task Title"),
                        points=pts,
                        estimated_hours=hrs,
                        assigned_role_or_member=t.get("suggested_role", "Backend Engineer"),
                        priority=t.get("priority", "HIGH"),
                        rationale="Core deliverable for sprint milestone",
                    )
                )
            else:
                deferred.append(t.get("id", "TASK-X"))

        utilization = (committed_pts / capacity_points * 100) if capacity_points > 0 else 0.0

        capacity = CapacityUtilization(
            team_capacity_points=capacity_points,
            team_capacity_hours=float(capacity_points * 4),
            committed_points=committed_pts,
            committed_hours=committed_hrs,
            utilization_percentage=round(utilization, 1),
            is_overloaded=committed_pts > capacity_points,
        )

        name = sprint_name or "Sprint 1 - Foundation & Core Architecture"

        return SprintPlanProposal(
            project_id=project_id,
            sprint_name=name,
            goal="Establish foundational infrastructure and core execution pipeline",
            duration_weeks=2,
            capacity=capacity,
            allocated_tasks=allocated,
            deferred_tasks=deferred,
            risks_flagged=["High task density on Backend Engineer role"] if len(allocated) > 3 else [],
            summary=f"Proposed {name}: {len(allocated)} tasks committed ({committed_pts}/{capacity_points} pts, {capacity.utilization_percentage}% utilization).",
        )

    async def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        project_id = state.get("project_id", "default_proj")
        tasks = state.get("tasks", [])
        input_data = state.get("input_data", {})
        capacity_points = input_data.get("team_capacity_points", 40)
        sprint_name = input_data.get("sprint_name")

        logger.info(f"[{self.name}] Planning sprint for project: {project_id} (Capacity: {capacity_points} pts)")

        sprint_proposal: Optional[SprintPlanProposal] = None

        try:
            structured_llm = get_structured_llm(SprintPlanProposal, temperature=0.1)
            messages = [
                SystemMessage(content=SPRINT_AGENT_SYSTEM_PROMPT),
                HumanMessage(
                    content=f"Project ID: {project_id}\nTasks: {tasks}\n"
                    f"Team Capacity: {capacity_points} story points\nSprint Name: {sprint_name}\n"
                    "Propose a balanced sprint with goal, allocations, and capacity metrics."
                ),
            ]
            response = await structured_llm.ainvoke(messages)
            if isinstance(response, SprintPlanProposal):
                sprint_proposal = response
            elif isinstance(response, dict):
                sprint_proposal = SprintPlanProposal(**response)
        except Exception as exc:
            logger.warning(f"[{self.name}] LLM invocation failed ({exc}). Using structured fallback.")

        if not sprint_proposal:
            sprint_proposal = self._generate_fallback(project_id, tasks, capacity_points, sprint_name)

        proposals = state.get("proposals", [])
        proposals.append({
            "id": f"prop_sprint_{project_id[:8]}",
            "action_type": "CREATE_SPRINT",
            "description": f"Sprint Proposal: {sprint_proposal.sprint_name} ({sprint_proposal.capacity.committed_points} pts)",
            "proposed_data": sprint_proposal.model_dump(),
            "requires_human_approval": True,
        })

        logs = state.get("logs", [])
        logs.append({
            "agent": "SPRINT",
            "message": f"Formulated {sprint_proposal.sprint_name} with {len(sprint_proposal.allocated_tasks)} tasks, {sprint_proposal.capacity.committed_points} story points ({sprint_proposal.capacity.utilization_percentage}% utilization).",
        })

        return {
            **state,
            "sprint_plan": sprint_proposal.model_dump(),
            "current_step": "sprint_done",
            "proposals": proposals,
            "logs": logs,
        }


sprint_agent = SprintAgent()
