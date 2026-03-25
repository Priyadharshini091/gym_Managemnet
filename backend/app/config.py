from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "GymFlow"
    gym_name: str = "FitZone Premium Gym"
    database_url: str = "sqlite:///./gymflow.db"
    secret_key: str = "gymflow-demo-secret-change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    frontend_origin: str = "http://localhost:5173"
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    reminder_window_minutes: int = 60
    currency_symbol: str = "$"
    basic_plan_limit: int = 12
    premium_plan_limit: int = 20
    vip_plan_limit: int = 999
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
