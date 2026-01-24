import os
import shutil
from datetime import datetime
from pypdf import PdfReader
from docx import Document
import hashlib
from typing import List, Dict

def create_directories():
    """Create necessary directories if they don't exist"""
    os.makedirs("uploads", exist_ok=True)
    os.makedirs("vector_store", exist_ok=True)

def get_file_hash(file_content: bytes) -> str:
    """Generate unique hash for file content"""
    return hashlib.md5(file_content).hexdigest()

def extract_text_from_pdf(file_path: str) -> List[Dict[str, any]]:
    """Extract text from PDF file with page numbers"""
    try:
        reader = PdfReader(file_path)
        pages_data = []
        for page_num, page in enumerate(reader.pages, start=1):
            text = page.extract_text()
            if text.strip():  # Only add non-empty pages
                pages_data.append({
                    "text": text,
                    "page": page_num
                })
        return pages_data
    except Exception as e:
        raise Exception(f"Error reading PDF: {str(e)}")

def extract_text_from_docx(file_path: str) -> List[Dict[str, any]]:
    """Extract text from DOCX file"""
    try:
        doc = Document(file_path)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return [{"text": text, "page": None}]  # DOCX doesn't have page numbers
    except Exception as e:
        raise Exception(f"Error reading DOCX: {str(e)}")

def extract_text_from_txt(file_path: str) -> List[Dict[str, any]]:
    """Extract text from TXT file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()
        return [{"text": text, "page": None}]
    except Exception as e:
        raise Exception(f"Error reading TXT: {str(e)}")

def extract_text_from_file(file_path: str, file_extension: str) -> List[Dict[str, any]]:
    """Extract text based on file type with page numbers"""
    if file_extension == ".pdf":
        return extract_text_from_pdf(file_path)
    elif file_extension == ".docx":
        return extract_text_from_docx(file_path)
    elif file_extension == ".txt":
        return extract_text_from_txt(file_path)
    else:
        raise ValueError(f"Unsupported file type: {file_extension}")

def get_confidence_level(score: float) -> str:
    """Determine confidence level from score"""
    from app.config import settings
    if score >= settings.HIGH_CONFIDENCE:
        return "high"
    elif score >= settings.MEDIUM_CONFIDENCE:
        return "medium"
    else:
        return "low"

def clean_uploads_folder():
    """Clean uploads folder"""
    if os.path.exists("uploads"):
        shutil.rmtree("uploads")
    os.makedirs("uploads")
