import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PROJECT_NAME: str = "CivicAid AI"
    VERSION: str = "1.0.0"
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    DEBUG: bool = True

    # CORS
    CORS_ORIGINS: Union[List[str], str] = ["*"]

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            import json
            return json.loads(v)
        return v

    # AI & LLM Abstraction
    LLM_PROVIDER: str = "mock"  # strands, gemini, openai, anthropic, mock
    LLM_MODEL: str = "gemini-1.5-flash"
    LLM_API_KEY: str = ""
    LLM_TEMPERATURE: float = 0.2

    # Strands Agents SDK
    STRANDS_API_KEY: str = ""
    STRANDS_AGENT_ID: str = ""

    # Storage & Seed Paths
    STORAGE_BACKEND: str = "local"
    DATABASE_URL: str = "sqlite:///./civicaid.db"
    LOCAL_DATA_DIR: str = "./data"

    # AWS Cloud Deployment Readiness
    AWS_REGION: str = "ap-south-1"
    AWS_DYNAMODB_TABLE_SCHEMES: str = "CivicAid_Schemes"
    AWS_DYNAMODB_TABLE_USERS: str = "CivicAid_Users"
    AWS_S3_BUCKET_DOCS: str = "civicaid-documents-ap-south-1"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
