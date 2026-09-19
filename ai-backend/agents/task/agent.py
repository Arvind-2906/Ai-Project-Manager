from typing import Dict, Any, Optional, List
from langchain_core.messages import SystemMessage, HumanMessage
from services.llm_service import get_structured_llm
from schemas.task_decomp import (
    WorkBreakdownProposal,
    EpicProposal,
    FeatureProposal,
    UserStoryProposal,
    TaskProposal,
    TaskPriority,
)
from prompts.task import TASK_AGENT_SYSTEM_PROMPT
from utils.logger import logger


class TaskAgent:
    """
    Task Decomposer Agent breaks approved PRDs and requirements hierarchically into:
    Epics -> Features -> User Stories -> Tasks, allocating Fibonacci points and hours.
    """
    def __init__(self):
        self.name = "Task Decomposer Agent"

    def _generate_fallback(self, project_id: str, prd_title: str) -> WorkBreakdownProposal:
        tasks_story_1 = [
            TaskProposal(
                id="TASK-101",
                title="Design PostgreSQL relational schema & Prisma models",
                description="Model core tables with foreign keys, indexes, and soft-delete semantics.",
                priority=TaskPriority.HIGH,
                points=5,
                estimated_hours=6.0,
                acceptance_criteria=[
                    "Prisma schema validates with no syntax errors",
                    "Migration runs cleanly on Neon database",
                ],
                suggested_role="Backend Engineer",
                tags=["database", "prisma"],
            ),
            TaskProposal(
                id="TASK-102",
                title="Implement CRUD service handlers and Zod validation",
                description="Create service layer functions with Zod schema verification.",
                priority=TaskPriority.HIGH,
                points=8,
                estimated_hours=10.0,
                acceptance_criteria=[
                    "All routes validate request payloads",
                    "Unit tests cover happy path and edge cases",
                ],
                suggested_role="Backend Engineer",
                tags=["backend", "api"],
            ),
        ]

        tasks_story_2 = [
            TaskProposal(
                id="TASK-103",
                title="Integrate LangGraph orchestration workflow",
                description="Build StateGraph linking multi-agent nodes with conditional routing.",
                priority=TaskPriority.CRITICAL,
                points=8,
                estimated_hours=12.0,
                acceptance_criteria=[
                    "State transitions seamlessly through agent nodes",
                    "Proposals are gated for human review",
                ],
                suggested_role="AI / ML Engineer",
                tags=["langgraph", "ai"],
            ),
            TaskProposal(
                id="TASK-104",
                title="Add telemetry and audit logging",
                description="Record all agent actions and tool invocations into structured logs.",
                priority=TaskPriority.MEDIUM,
                points=3,
                estimated_hours=4.0,
                acceptance_criteria=[
                    "Structured JSON logs generated per agent run",
                    "Execution metrics captured",
                ],
                suggested_role="DevOps Engineer",
                tags=["observability", "logging"],
            ),
        ]

        story_1 = UserStoryProposal(
            id="STORY-1",
            title="Backend Data & Storage Layer",
            user_role="Backend Developer",
            action="define models and data contracts",
            benefit="all services have a single source of truth",
            acceptance_criteria=["Prisma models generated", "Database migrations applied"],
            tasks=tasks_story_1,
        )

        story_2 = UserStoryProposal(
            id="STORY-2",
            title="Autonomous Multi-Agent Orchestration",
            user_role="AI Engineer",
            action="coordinate specialized agents",
            benefit="complex tasks are broken down automatically",
            acceptance_criteria=["LangGraph state machine operational", "Human approvals enforced"],
            tasks=tasks_story_2,
        )

        feature = FeatureProposal(
            id="FEAT-1",
            title="Core Platform Foundation",
            description="Foundation infrastructure, data persistence, and agent swarm runtime.",
            stories=[story_1, story_2],
        )

        epic = EpicProposal(
            id="EPIC-1",
            title=f"Platform Architecture for {prd_title}",
            description="End-to-end implementation of foundational services and agent workflows.",
            features=[feature],
        )

        all_tasks = tasks_story_1 + tasks_story_2
        total_pts = sum(t.points for t in all_tasks)
        total_hrs = sum(t.estimated_hours for t in all_tasks)

        return WorkBreakdownProposal(
            project_id=project_id,
            summary=f"Hierarchical work breakdown for {prd_title}",
            epics=[epic],
            total_epics=1,
            total_features=1,
            total_stories=2,
            total_tasks=len(all_tasks),
            total_points=total_pts,
            total_estimated_hours=total_hrs,
        )

    async def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        project_id = state.get("project_id", "default_proj")
        prd = state.get("prd", {})
        prd_title = prd.get("project_name") or prd.get("title") or "Project Initiative"

        logger.info(f"[{self.name}] Decomposing work for PRD: {prd_title}")

        wbs_proposal: Optional[WorkBreakdownProposal] = None

        try:
            structured_llm = get_structured_llm(WorkBreakdownProposal, temperature=0.1)
            messages = [
                SystemMessage(content=TASK_AGENT_SYSTEM_PROMPT),
                HumanMessage(
                    content=f"Project ID: {project_id}\nPRD Data: {prd}\n"
                    "Break requirements down into Epics -> Features -> User Stories -> Tasks with points and hours."
                ),
            ]
            response = await structured_llm.ainvoke(messages)
            if isinstance(response, WorkBreakdownProposal):
                wbs_proposal = response
            elif isinstance(response, dict):
                wbs_proposal = WorkBreakdownProposal(**response)
        except Exception as exc:
            logger.warning(f"[{self.name}] LLM invocation failed ({exc}). Using structured fallback.")

        if not wbs_proposal:
            wbs_proposal = self._generate_fallback(project_id, prd_title)

        # Flatten tasks for downstream agents
        flat_tasks: List[Dict[str, Any]] = []
        for epic in wbs_proposal.epics:
            for feat in epic.features:
                for story in feat.stories:
                    for task in story.tasks:
                        flat_tasks.append({
                            "id": task.id,
                            "title": task.title,
                            "description": task.description,
                            "priority": task.priority.value if hasattr(task.priority, "value") else str(task.priority),
                            "points": task.points,
                            "estimated_hours": task.estimated_hours,
                            "acceptance_criteria": task.acceptance_criteria,
                            "suggested_role": task.suggested_role,
                            "tags": task.tags,
                            "story_id": story.id,
                            "feature_id": feat.id,
                            "epic_id": epic.id,
                        })

        proposals = state.get("proposals", [])
        proposals.append({
            "id": f"prop_wbs_{project_id[:8]}",
            "action_type": "CREATE_WORK_BREAKDOWN",
            "description": f"Hierarchical Work Breakdown: {wbs_proposal.total_tasks} tasks ({wbs_proposal.total_points} pts)",
            "proposed_data": wbs_proposal.model_dump(),
            "requires_human_approval": True,
        })

        logs = state.get("logs", [])
        logs.append({
            "agent": "TASK",
            "message": f"Decomposed PRD into {wbs_proposal.total_epics} epics, {wbs_proposal.total_tasks} tasks, totalling {wbs_proposal.total_points} story points.",
        })

        return {
            **state,
            "work_breakdown": wbs_proposal.model_dump(),
            "tasks": flat_tasks,
            "current_step": "task_done",
            "proposals": proposals,
            "logs": logs,
        }


task_agent = TaskAgent()
