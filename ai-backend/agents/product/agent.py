from typing import Dict, Any
from utils.logger import logger
from prompts.product import PRODUCT_AGENT_SYSTEM_PROMPT


class ProductAgent:
    """
    Product Agent synthesizes raw feature requests into structured PRDs,
    identifying user stories, non-functional targets, and validation criteria.
    """
    def __init__(self):
        self.name = "Product Agent"

    async def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        idea = state.get("input_data", {}).get("raw_idea", "Autonomous Raft compaction")
        logger.info(f"[{self.name}] Synthesizing PRD for: {idea}")

        prd_data = {
            "title": f"PRD: {idea}",
            "overview": "Automated snapshot stream compaction with zero heartbeat disruption.",
            "user_stories": [
                "As an SRE, I want the system to compact logs once WAL reaches 64MB so disk is never exhausted.",
                "As a cluster peer, I want snapshot transfer to pause if network heartbeat latency exceeds 20ms.",
            ],
            "non_functional_requirements": {
                "latency_p99": "< 5ms",
                "max_bandwidth": "50MB/s",
            },
        }

        logs = state.get("logs", [])
        logs.append({
            "agent": "PRODUCT",
            "message": f"Synthesized PRD with {len(prd_data['user_stories'])} user stories.",
        })

        return {
            **state,
            "prd": prd_data,
            "current_step": "product_done",
            "logs": logs,
        }


product_agent = ProductAgent()
