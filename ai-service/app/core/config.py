import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "NexaVision AI Engine"
    API_V1_STR: str = "/api/v1"
    PORT: int = int(os.getenv("PORT", 8000))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    
    # AI Threshold defaults
    DEFAULT_MATCH_THRESHOLD: float = float(os.getenv("MATCH_THRESHOLD", 0.65))
    LIVENESS_THRESHOLD: float = float(os.getenv("LIVENESS_THRESHOLD", 0.60))
    QUALITY_THRESHOLD: float = float(os.getenv("QUALITY_THRESHOLD", 0.50))
    
    # Model parameters
    EMBEDDING_DIM: int = 128
    
    class Config:
        case_sensitive = True

settings = Settings()
