from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional


class Settings(BaseSettings):
    # Application Config
    PROJECT_NAME: str = "AI Project Manager Swarm"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Gemini & AI Config
    GEMINI_API_KEY: str = Field(default="", env="GEMINI_API_KEY")
    GEMINI_MODEL: str = Field(default="gemini-1.5-pro", env="GEMINI_MODEL")
    GEMINI_EMBEDDING_MODEL: str = Field(default="text-embedding-004", env="GEMINI_EMBEDDING_MODEL")

    # Main Backend (Next.js) Integration
    NEXTJS_BACKEND_URL: str = Field(default="http://localhost:3000", env="NEXTJS_BACKEND_URL")
    INTERNAL_SECRET_KEY: str = Field(default="internal_agent_secret_key_change_me", env="INTERNAL_SECRET_KEY")

    # Redis Cache & Bus
    REDIS_URL: str = Field(default="redis://localhost:6379", env="REDIS_URL")

    # PostgreSQL Database URL
    DATABASE_URL: Optional[str] = Field(default=None, env="DATABASE_URL")

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
