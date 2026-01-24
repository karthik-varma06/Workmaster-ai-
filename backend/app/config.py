import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
    SITE_URL = os.getenv("SITE_URL", "http://localhost:3000")
    SITE_NAME = os.getenv("SITE_NAME", "WorkMaster AI")
    
    # Model settings
    LLM_MODEL = "google/gemma-3-27b-it:free"
    EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
    
    # Chunking settings
    CHUNK_SIZE = 512
    CHUNK_OVERLAP = 50
    
    # Processing settings
    BATCH_SIZE = 10
    EMBEDDING_BATCH_SIZE = 32
    
    # Confidence thresholds
    HIGH_CONFIDENCE = 0.8
    MEDIUM_CONFIDENCE = 0.5
    
    # Paths
    UPLOAD_DIR = "uploads"
    VECTOR_STORE_DIR = "vector_store"

settings = Settings()
