from langchain_google_genai import ChatGoogleGenerativeAI
from config.settings import settings
from utils.logger import logger


def get_gemini_chat_model(temperature: float = 0.2, model_name: str = None) -> ChatGoogleGenerativeAI:
    """
    Factory creating a configured LangChain ChatGoogleGenerativeAI instance.
    """
    selected_model = model_name or settings.GEMINI_MODEL
    api_key = settings.GEMINI_API_KEY

    if not api_key:
        logger.warning("GEMINI_API_KEY is not set in environment. Multi-agent calls may fail.")

    return ChatGoogleGenerativeAI(
        model=selected_model,
        google_api_key=api_key or "DUMMY_KEY",
        temperature=temperature,
        convert_system_message_to_human=True,
    )
