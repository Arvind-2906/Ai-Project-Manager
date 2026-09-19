from typing import Type, TypeVar, Optional, Any, Dict
from pydantic import BaseModel
from langchain_google_genai import ChatGoogleGenerativeAI
from config.settings import settings
from utils.logger import logger

T = TypeVar("T", bound=BaseModel)


def get_gemini_chat_model(
    temperature: float = 0.2,
    model_name: Optional[str] = None,
) -> ChatGoogleGenerativeAI:
    """
    Factory creating a configured LangChain ChatGoogleGenerativeAI instance.
    Uses centralized GEMINI_API_KEY and default model from settings.
    """
    selected_model = model_name or settings.GEMINI_MODEL
    api_key = settings.GEMINI_API_KEY

    if not api_key:
        logger.warning("[LLMService] GEMINI_API_KEY is not set. Using fallback mock/dummy mode.")

    return ChatGoogleGenerativeAI(
        model=selected_model,
        google_api_key=api_key or "DUMMY_KEY",
        temperature=temperature,
        convert_system_message_to_human=True,
    )


def get_structured_llm(
    schema: Type[T],
    temperature: float = 0.1,
    model_name: Optional[str] = None,
):
    """
    Returns a Gemini model configured with structured outputs conforming to a Pydantic schema.
    """
    llm = get_gemini_chat_model(temperature=temperature, model_name=model_name)
    try:
        return llm.with_structured_output(schema)
    except Exception as exc:
        logger.error(f"[LLMService] Failed to bind structured output for schema {schema.__name__}: {exc}")
        return llm
