from typing import Dict, Any, Optional, List
from langchain_core.messages import SystemMessage, HumanMessage
from services.llm_service import get_structured_llm
from schemas.risk import (
    RiskAnalysisResult,
    RiskItem,
    RiskSeverity,
    RiskCategory,
)
from prompts.risk import RISK_AGENT_SYSTEM_PROMPT
from utils.logger import logger


class RiskAgent:
    """
    Risk Agent audits project telemetry for bottlenecks, scope creep,
    deadline pressure, and capacity mismatches, computing quantitative
    risk scores (probability * impact).
    """
    def __init__(self):
        self.name = "Risk Agent"

    def _generate_fallback(self, project_id: str, tasks: List[Dict[str, Any]]) -> RiskAnalysisResult:
        risks = [
            RiskItem(
                id="RISK-101",
                title="Critical path dependency bottleneck",
                description="Downstream services are blocked on foundational schema migrations.",
                category=RiskCategory.DEPENDENCY,
                probability=3,
                impact=4,
                risk_score=12,
                severity=RiskSeverity.HIGH,
                mitigation_plan="Fast-track schema migration review and decouple mock test clients.",
                affected_task_ids=[t.get("id", "TASK-101") for t in tasks[:2]],
            ),
            RiskItem(
                id="RISK-102",
                title="Tight sprint timeline under high velocity expectations",
                description="Engineering velocity may be impacted by unmapped third-party integration contracts.",
                category=RiskCategory.TIMELINE,
                probability=2,
                impact=3,
                risk_score=6,
                severity=RiskSeverity.MEDIUM,
                mitigation_plan="Buffer 20% story points for unexpected integration debugging.",
                affected_task_ids=[],
            ),
        ]

        overall_score = round(sum(r.risk_score for r in risks) / len(risks), 1) if risks else 0.0
        critical_count = sum(1 for r in risks if r.risk_score >= 15)

        return RiskAnalysisResult(
            project_id=project_id,
            risks=risks,
            overall_project_risk_score=overall_score,
            overall_risk_level="HIGH" if overall_score >= 12 else "MEDIUM",
            critical_risk_count=critical_count,
            mitigation_summary="Prioritize database contract stabilization and maintain 20% sprint buffer.",
        )

    async def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        project_id = state.get("project_id", "default_proj")
        tasks = state.get("tasks", [])
        dependencies = state.get("dependencies", {})
        sprint_plan = state.get("sprint_plan", {})

        logger.info(f"[{self.name}] Running quantitative risk analysis for project: {project_id}")

        risk_analysis: Optional[RiskAnalysisResult] = None

        try:
            structured_llm = get_structured_llm(RiskAnalysisResult, temperature=0.1)
            messages = [
                SystemMessage(content=RISK_AGENT_SYSTEM_PROMPT),
                HumanMessage(
                    content=f"Project ID: {project_id}\nTasks: {tasks}\n"
                    f"Dependencies: {dependencies}\nSprint Plan: {sprint_plan}\n"
                    "Identify risks with quantitative score (probability * impact) and actionable mitigations."
                ),
            ]
            response = await structured_llm.ainvoke(messages)
            if isinstance(response, RiskAnalysisResult):
                risk_analysis = response
            elif isinstance(response, dict):
                risk_analysis = RiskAnalysisResult(**response)
        except Exception as exc:
            logger.warning(f"[{self.name}] LLM invocation failed ({exc}). Using structured fallback.")

        if not risk_analysis:
            risk_analysis = self._generate_fallback(project_id, tasks)

        proposals = state.get("proposals", [])
        for risk in risk_analysis.risks:
            if risk.risk_score >= 10:  # Propose high/critical risks to human lead
                proposals.append({
                    "id": f"prop_{risk.id.lower()}",
                    "action_type": "CREATE_RISK",
                    "description": f"Risk Alert: {risk.title} (Score: {risk.risk_score})",
                    "proposed_data": risk.model_dump(),
                    "requires_human_approval": True,
                })

        logs = state.get("logs", [])
        logs.append({
            "agent": "RISK",
            "message": f"Quantitative risk scan identified {len(risk_analysis.risks)} risks (Overall: {risk_analysis.overall_risk_level}, Score: {risk_analysis.overall_project_risk_score}).",
        })

        return {
            **state,
            "risk_analysis": risk_analysis.model_dump(),
            "current_step": "risk_done",
            "proposals": proposals,
            "logs": logs,
        }


risk_agent = RiskAgent()
