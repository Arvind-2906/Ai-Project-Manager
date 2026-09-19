from typing import Dict, Any, Optional
from langchain_core.messages import SystemMessage, HumanMessage
from services.llm_service import get_structured_llm
from schemas.product import (
    ProductArchitectureProposal,
    RequirementItem,
    RequirementType,
    PriorityLevel,
    PersonaItem,
    BusinessGoalItem,
)
from prompts.product import PRODUCT_AGENT_SYSTEM_PROMPT
from utils.logger import logger


class ProductAgent:
    """
    Product Agent synthesizes raw feature requests into structured PRDs,
    identifying personas, business goals, functional/non-functional requirements,
    and technical architecture proposals.
    """
    def __init__(self):
        self.name = "Product Agent"

    def _generate_fallback(self, idea: str, context: Optional[str] = None) -> ProductArchitectureProposal:
        clean_title = idea.strip()[:60] or "Next-Gen Software Platform"
        return ProductArchitectureProposal(
            project_name=clean_title,
            summary=f"Automated product architecture proposal for: {idea}",
            vision=f"Build an enterprise-grade, resilient platform that addresses: {clean_title}",
            personas=[
                PersonaItem(
                    name="Engineering Lead",
                    role="Technical manager driving delivery",
                    pain_points=["Unclear requirements", "Manual tracking overhead"],
                    goals=["Automated task decomposition", "Deterministic sprint execution"],
                ),
                PersonaItem(
                    name="Platform User",
                    role="End user interacting with system",
                    pain_points=["High latency", "Complex workflow navigation"],
                    goals=["Sub-second response times", "Intuitive automation"],
                ),
            ],
            business_goals=[
                BusinessGoalItem(
                    goal="Accelerate sprint delivery cycle",
                    target_metric="30% reduction in lead time",
                    timeframe="Q2",
                ),
                BusinessGoalItem(
                    goal="Maintain enterprise system availability",
                    target_metric="99.95% uptime SLA",
                    timeframe="Q3",
                ),
            ],
            requirements=[
                RequirementItem(
                    id="REQ-1",
                    title=f"Core Execution Engine for {clean_title}",
                    description=f"Implement backend services and processing logic for {clean_title}.",
                    type=RequirementType.FUNCTIONAL,
                    priority=PriorityLevel.CRITICAL,
                    acceptance_criteria=[
                        "Service handles inbound requests asynchronously",
                        "Audit logs persist to storage with zero packet drop",
                    ],
                ),
                RequirementItem(
                    id="REQ-2",
                    title="Real-Time Event Notification Pipeline",
                    description="Broadcast state transitions to connected clients via WebSockets / SSE.",
                    type=RequirementType.FUNCTIONAL,
                    priority=PriorityLevel.HIGH,
                    acceptance_criteria=[
                        "Events emitted within 100ms of state mutation",
                        "Automatic client reconnection with exponential backoff",
                    ],
                ),
                RequirementItem(
                    id="REQ-3",
                    title="Enterprise Latency and Security SLA",
                    description="Enforce P99 latency below 150ms and end-to-end token encryption.",
                    type=RequirementType.NON_FUNCTIONAL,
                    priority=PriorityLevel.HIGH,
                    acceptance_criteria=[
                        "P99 latency < 150ms under 500 concurrent connections",
                        "mTLS / internal secret validation on all inter-service routes",
                    ],
                ),
            ],
            tech_stack_suggestions=["Next.js", "Python FastAPI", "LangGraph", "PostgreSQL", "Redis"],
            metadata={"source": "fallback_generator", "raw_idea": idea},
        )

    async def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        input_data = state.get("input_data", {})
        raw_idea = input_data.get("raw_idea") or input_data.get("prompt") or "Autonomous Engineering Management"
        business_context = input_data.get("business_context", "")

        logger.info(f"[{self.name}] Synthesizing PRD for idea: {raw_idea}")

        prd_proposal: Optional[ProductArchitectureProposal] = None

        try:
            structured_llm = get_structured_llm(ProductArchitectureProposal, temperature=0.2)
            messages = [
                SystemMessage(content=PRODUCT_AGENT_SYSTEM_PROMPT),
                HumanMessage(content=f"Project Idea: {raw_idea}\nContext: {business_context}\nGenerate a complete product architecture proposal."),
            ]
            response = await structured_llm.ainvoke(messages)
            if isinstance(response, ProductArchitectureProposal):
                prd_proposal = response
            elif isinstance(response, dict):
                prd_proposal = ProductArchitectureProposal(**response)
        except Exception as exc:
            logger.warning(f"[{self.name}] LLM invocation failed ({exc}). Using structured fallback.")

        if not prd_proposal:
            prd_proposal = self._generate_fallback(raw_idea, business_context)

        # Record proposal in state
        proposals = state.get("proposals", [])
        proposals.append({
            "id": f"prop_prd_{state.get('project_id', 'proj')[:8]}",
            "action_type": "CREATE_PRD",
            "description": f"Product Architecture Proposal: {prd_proposal.project_name}",
            "proposed_data": prd_proposal.model_dump(),
            "requires_human_approval": True,
        })

        logs = state.get("logs", [])
        logs.append({
            "agent": "PRODUCT",
            "message": f"Synthesized PRD '{prd_proposal.project_name}' with {len(prd_proposal.requirements)} requirements and {len(prd_proposal.personas)} personas.",
        })

        return {
            **state,
            "prd": prd_proposal.model_dump(),
            "current_step": "product_done",
            "proposals": proposals,
            "logs": logs,
        }


product_agent = ProductAgent()
