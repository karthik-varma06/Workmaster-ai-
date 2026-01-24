from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class UserType(str, Enum):
    STUDENT = "student"
    COMPANY = "company"

class SourceCitation(BaseModel):
    """Source citation with grouped page numbers"""
    document: str = Field(..., description="Document filename")
    pages: Optional[List[int]] = Field(None, description="List of page numbers (grouped)")
    page: Optional[int] = Field(None, description="Single page number (legacy)")
    chunk_text: Optional[str] = Field(None, description="Text preview (optional)")

class UploadResponse(BaseModel):
    total_files: int
    successful: int
    failed: int
    details: List[dict]

class ChatRequest(BaseModel):
    query: str
    user_type: UserType = UserType.STUDENT
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceCitation]
    confidence: float
    confidence_level: str
    ask_human: bool = False

class DocumentInfo(BaseModel):
    filename: str
    upload_date: str
    file_type: str
    user_type: str
    chunk_count: int
