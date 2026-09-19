from pydantic_settings import BaseSettings
from pydantic import Field, AliasChoices
from typing import Optional
import os


class Settings(BaseSettings):
    # Application Config
    PROJECT_NAME: str = "AI Project Manager Swarm"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Gemini & AI Config
    GEMINI_API_KEY: str = Field(default="", validation_alias=AliasChoices("GEMINI_API_KEY"))
    GEMINI_MODEL: str = Field(default="gemini-2.5-flash", validation_alias=AliasChoices("GEMINI_MODEL"))
    GEMINI_EMBEDDING_MODEL: str = Field(default="gemini-embedding-2", validation_alias=AliasChoices("GEMINI_EMBEDDING_MODEL"))

    # Main Backend (Next.js) Integration
    NEXTJS_BACKEND_URL: str = Field(
        default="http://localhost:3000",
        validation_alias=AliasChoices("NEXTJS_BACKEND_URL", "NEXT_PUBLIC_APP_URL"),
    )
    INTERNAL_API_SECRET: str = Field(
        default="internal_agent_secret_key_change_me",
        validation_alias=AliasChoices("INTERNAL_API_SECRET", "AI_INTERNAL_SECRET_KEY", "INTERNAL_SECRET_KEY"),
    )

    # Redis Cache & Bus
    REDIS_URL: str = Field(default="redis://localhost:6379", validation_alias=AliasChoices("REDIS_URL"))

    # PostgreSQL Database URL
    DATABASE_URL: Optional[str] = Field(default=None, validation_alias=AliasChoices("DATABASE_URL"))

    class Config:
        env_file = [
            os.path.join(os.path.dirname(__file__), "..", "..", ".env"),
            os.path.join(os.path.dirname(__file__), "..", ".env"),
            ".env",
        ]
        extra = "ignore"


settings = Settings()
