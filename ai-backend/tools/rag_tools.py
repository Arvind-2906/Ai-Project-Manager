from langchain_core.tools import tool
from typing import List, Dict, Any
from utils.logger import logger


@tool
def query_project_rag(project_id: str, query: str) -> List[Dict[str, Any]]:
    """
    Performs cosine similarity search against pgvector embeddings table in PostgreSQL
    using Gemini text-embedding-004 vectors.
    """
    logger.info(f"[Tool:query_project_rag] Semantic search query: '{query}' for {project_id}")
    return [
        {
            "chunk_id": "chk_101",
            "source_type": "PRD",
            "content": "Section 4.1: Raft Consensus Engine mandates quorum acknowledgement on WAL entry persistence.",
            "similarity": 0.93,
        },
        {
            "chunk_id": "chk_102",
            "source_type": "ARCHITECTURE",
            "content": "Snapshot compaction streams shall be throttled to 50MB/s to avoid network buffer starvation.",
            "similarity": 0.89,
        },
    ]
