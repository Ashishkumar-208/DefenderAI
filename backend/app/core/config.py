from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "DefenderAI"
    SECRET_KEY: str = "defenderai_super_secret_session_key_for_json_web_token_signing"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    DATABASE_URL: str = "sqlite:///./defenderai.db"
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama3-8b-8192"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
