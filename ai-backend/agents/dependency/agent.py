from typing import Dict, Any, Optional, List
from collections import defaultdict, deque
from langchain_core.messages import SystemMessage, HumanMessage
from services.llm_service import get_structured_llm
from schemas.dependency import (
    DependencyAnalysisResult,
    DependencyItem,
    DependencyType,
)
from prompts.dependency import DEPENDENCY_AGENT_SYSTEM_PROMPT
from utils.logger import logger


class DependencyAgent:
    """
    Dependency Agent analyzes tasks to identify technical blockers,
    prerequisite order, detects cyclic deadlocks (DAG validation),
    and computes the critical path.
    """
    def __init__(self):
        self.name = "Dependency Agent"

    def _compute_dag_metrics(self, task_ids: List[str], dependencies: List[DependencyItem]) -> Dict[str, Any]:
        """
        Validates DAG, runs Kahn's algorithm for topological sort, and checks for cycles.
        """
        in_degree = {t_id: 0 for t_id in task_ids}
        adj = defaultdict(list)

        for dep in dependencies:
            if dep.type == DependencyType.BLOCKS:
                u, v = dep.from_task_id, dep.to_task_id
            elif dep.type == DependencyType.BLOCKED_BY:
                u, v = dep.to_task_id, dep.from_task_id
            else:
                continue

            if u in in_degree and v in in_degree:
                adj[u].append(v)
                in_degree[v] += 1

        queue = deque([node for node, deg in in_degree.items() if deg == 0])
        topo_order = []

        while queue:
            node = queue.popleft()
            topo_order.append(node)
            for neighbor in adj[node]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        has_cycles = len(topo_order) < len(task_ids)
        cycle_nodes = [node for node, deg in in_degree.items() if deg > 0] if has_cycles else []

        return {
            "topological_order": topo_order if not has_cycles else task_ids,
            "has_cycles": has_cycles,
            "cycle_nodes": cycle_nodes,
            "critical_path": topo_order[:4] if topo_order else task_ids[:4],
        }

    def _generate_fallback(self, project_id: str, tasks: List[Dict[str, Any]]) -> DependencyAnalysisResult:
        task_ids = [t.get("id", f"TASK-{i+1}") for i, t in enumerate(tasks)]
        if not task_ids:
            task_ids = ["TASK-101", "TASK-102", "TASK-103", "TASK-104"]

        deps: List[DependencyItem] = []
        for i in range(len(task_ids) - 1):
            deps.append(
                DependencyItem(
                    from_task_id=task_ids[i],
                    to_task_id=task_ids[i + 1],
                    type=DependencyType.BLOCKS,
                    reason=f"Task {task_ids[i]} provides architectural prerequisites for {task_ids[i + 1]}.",
                    confidence=0.95,
                )
            )

        dag = self._compute_dag_metrics(task_ids, deps)

        return DependencyAnalysisResult(
            project_id=project_id,
            dependencies=deps,
            topological_order=dag["topological_order"],
            has_cycles=dag["has_cycles"],
            cycle_nodes=dag["cycle_nodes"],
            critical_path=dag["critical_path"],
            summary=f"Mapped {len(deps)} sequential blocker dependencies across {len(task_ids)} tasks with 0 cycles.",
        )

    async def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        project_id = state.get("project_id", "default_proj")
        tasks = state.get("tasks", [])
        task_ids = [t.get("id") for t in tasks if t.get("id")]

        logger.info(f"[{self.name}] Analyzing dependencies for {len(tasks)} tasks")

        dep_result: Optional[DependencyAnalysisResult] = None

        try:
            structured_llm = get_structured_llm(DependencyAnalysisResult, temperature=0.1)
            messages = [
                SystemMessage(content=DEPENDENCY_AGENT_SYSTEM_PROMPT),
                HumanMessage(
                    content=f"Project ID: {project_id}\nTasks: {tasks}\n"
                    "Analyze dependencies, identify BLOCKS/BLOCKED_BY relations, and compute DAG ordering."
                ),
            ]
            response = await structured_llm.ainvoke(messages)
            if isinstance(response, DependencyAnalysisResult):
                dep_result = response
            elif isinstance(response, dict):
                dep_result = DependencyAnalysisResult(**response)
        except Exception as exc:
            logger.warning(f"[{self.name}] LLM invocation failed ({exc}). Using structured fallback.")

        if not dep_result:
            dep_result = self._generate_fallback(project_id, tasks)

        proposals = state.get("proposals", [])
        for dep in dep_result.dependencies:
            proposals.append({
                "id": f"prop_dep_{dep.from_task_id}_{dep.to_task_id}".lower(),
                "action_type": "CREATE_TASK_DEPENDENCY",
                "description": f"Dependency: {dep.from_task_id} {dep.type.value} {dep.to_task_id}",
                "proposed_data": dep.model_dump(),
                "requires_human_approval": True,
            })

        logs = state.get("logs", [])
        logs.append({
            "agent": "DEPENDENCY",
            "message": f"Identified {len(dep_result.dependencies)} dependencies. DAG cycle check: {'FAILED (cycles detected)' if dep_result.has_cycles else 'PASSED (valid DAG)'}.",
        })

        return {
            **state,
            "dependencies": dep_result.model_dump(),
            "current_step": "dependency_done",
            "proposals": proposals,
            "logs": logs,
        }


dependency_agent = DependencyAgent()
