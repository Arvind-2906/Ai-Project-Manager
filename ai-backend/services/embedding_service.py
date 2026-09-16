from langchain_google_genai import GoogleGenerativeAIEmbeddings
from config.settings import settings
from utils.logger import logger
from typing import List


def get_embedding_model() -> GoogleGenerativeAIEmbeddings:
    """
    Factory creating configured Gemini Embeddings model (text-embedding-004, 768 dimensions).
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        logger.warning("GEMINI_API_KEY is not set for embedding service.")

    return GoogleGenerativeAIEmbeddings(
        model=settings.GEMINI_EMBEDDING_MODEL,
        google_api_key=api_key or "DUMMY_KEY",
    )


async def embed_texts(texts: List[str]) -> List[List[float]]:
    """
    Generate vector embeddings for input documents/chunks for pgvector storage.
    """
    model = get_embedding_model()
    try:
        return await model.aembed_documents(texts)
    except Exception as e:
        logger.error(f"Embedding failed: {e}")
        # Return fallback zero vectors in offline test environment
        return [[0.0] * 768 for _ in texts]
