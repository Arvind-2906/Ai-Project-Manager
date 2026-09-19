from typing import Dict, Any, Optional
from langchain_core.messages import SystemMessage, HumanMessage
from services.llm_service import get_structured_llm
from schemas.supervisor import (
    SupervisorDecision,
    SupervisorAction,
)
from prompts.supervisor import SUPERVISOR_AGENT_SYSTEM_PROMPT
from utils.logger import logger


class SupervisorAgent:
    """
    Supervisor Agent acts as the central coordinator in the LangGraph swarm.
    It inspects project state, decides which agent executes next, and enforces
    the human-in-the-loop governance checkpoint.
    """
    def __init__(self):
        self.name = "PM Supervisor Agent"

    def _determine_next_action_fallback(self, state: Dict[str, Any]) -> SupervisorDecision:
        prd = state.get("prd")
        tasks = state.get("tasks", [])
        dependencies = state.get("dependencies")
        sprint_plan = state.get("sprint_plan")
        risk_analysis = state.get("risk_analysis")
        proposals = state.get("proposals", [])
        current_step = state.get("current_step", "START")

        # Check for unapproved proposals
        unapproved_proposals = [p for p in proposals if p.get("requires_human_approval") and not p.get("approved")]

        if not prd:
            return SupervisorDecision(
                next_action=SupervisorAction.ROUTE_TO_PRODUCT,
                target_agent="product_agent",
                reasoning="No PRD found. Routing to Product Agent to synthesize requirements.",
                requires_human_approval=False,
            )
        elif not tasks:
            return SupervisorDecision(
                next_action=SupervisorAction.ROUTE_TO_TASK,
                target_agent="task_agent",
                reasoning="PRD exists but tasks are not decomposed. Routing to Task Agent.",
                requires_human_approval=False,
            )
        elif not dependencies:
            return SupervisorDecision(
                next_action=SupervisorAction.ROUTE_TO_DEPENDENCY,
                target_agent="dependency_agent",
                reasoning="Tasks decomposed but dependencies unmapped. Routing to Dependency Agent.",
                requires_human_approval=False,
            )
        elif not sprint_plan and state.get("workflow_type") == "SPRINT_PLANNING":
            return SupervisorDecision(
                next_action=SupervisorAction.ROUTE_TO_SPRINT,
                target_agent="sprint_agent",
                reasoning="Sprint planning requested. Routing to Sprint Planner Agent.",
                requires_human_approval=False,
            )
        elif not risk_analysis and state.get("workflow_type") == "RISK_MONITORING":
            return SupervisorDecision(
                next_action=SupervisorAction.ROUTE_TO_RISK,
                target_agent="risk_agent",
                reasoning="Risk analysis requested. Routing to Risk Agent.",
                requires_human_approval=False,
            )
        elif unapproved_proposals and current_step != "CHECKPOINT_HUMAN_APPROVAL":
            return SupervisorDecision(
                next_action=SupervisorAction.REQUEST_HUMAN_APPROVAL,
                target_agent=None,
                reasoning=f"{len(unapproved_proposals)} proposals pending human engineering lead approval.",
                requires_human_approval=True,
            )
        else:
            return SupervisorDecision(
                next_action=SupervisorAction.COMPLETE,
                target_agent=None,
                reasoning="All workflow milestones achieved and approved.",
                requires_human_approval=False,
            )

    async def decide_next_step(self, state: Dict[str, Any]) -> SupervisorDecision:
        project_id = state.get("project_id", "default_proj")
        logger.info(f"[{self.name}] Evaluating state for project: {project_id}")

        decision: Optional[SupervisorDecision] = None

        try:
            structured_llm = get_structured_llm(SupervisorDecision, temperature=0.0)
            messages = [
                SystemMessage(content=SUPERVISOR_AGENT_SYSTEM_PROMPT),
                HumanMessage(
                    content=f"Project ID: {project_id}\nState Summary: "
                    f"has_prd={bool(state.get('prd'))}, "
                    f"tasks_count={len(state.get('tasks', []))}, "
                    f"has_dependencies={bool(state.get('dependencies'))}, "
                    f"has_sprint={bool(state.get('sprint_plan'))}, "
                    f"has_risks={bool(state.get('risk_analysis'))}, "
                    f"proposals_count={len(state.get('proposals', []))}, "
                    f"current_step={state.get('current_step')}\n"
                    "Determine the next action and target agent."
                ),
            ]
            response = await structured_llm.ainvoke(messages)
            if isinstance(response, SupervisorDecision):
                decision = response
            elif isinstance(response, dict):
                decision = SupervisorDecision(**response)
        except Exception as exc:
            logger.warning(f"[{self.name}] LLM invocation failed ({exc}). Using state evaluation fallback.")

        if not decision:
            decision = self._determine_next_action_fallback(state)

        logs = state.get("logs", [])
        logs.append({
            "agent": "SUPERVISOR",
            "message": f"Decision: {decision.next_action.value} -> {decision.target_agent or 'N/A'}. Reason: {decision.reasoning}",
        })
        state["logs"] = logs

        return decision

    async def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        decision = await self.decide_next_step(state)
        return {
            **state,
            "supervisor_decision": decision.model_dump(),
            "next_step": decision.next_action.value,
        }


supervisor_agent = SupervisorAgent()
