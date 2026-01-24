from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import os
import shutil
from datetime import datetime
import asyncio
import logging
from app.knowledge_gaps import knowledge_gap_tracker
from app.student_analytics import student_analytics
from app.practice_generator import practice_generator

from app.config import settings
from app.models import (
    UploadResponse, ChatRequest, ChatResponse,
    DocumentInfo, UserType
)
from app.rag_engine import rag_engine
from app.utils import (
    create_directories, extract_text_from_file,
    get_confidence_level, get_file_hash
)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="WorkMaster AI API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create necessary directories on startup
create_directories()
logger.info("=" * 70)
logger.info("🚀 WorkMaster AI Backend Starting...")
logger.info("=" * 70)

@app.get("/")
async def root():
    logger.info("🏠 Root endpoint accessed")
    return {"message": "WorkMaster AI API is running", "status": "healthy"}

@app.post("/api/upload", response_model=UploadResponse)
async def upload_documents(
    files: List[UploadFile] = File(...),
    user_type: str = "student"
):
    """Upload and process multiple documents"""
    logger.info("=" * 70)
    logger.info(f"📤 Upload request received - {len(files)} files, user_type: {user_type}")
    logger.info("=" * 70)
    
    results = {
        "total_files": len(files),
        "successful": 0,
        "failed": 0,
        "details": []
    }
    
    # Process files in batches
    for i in range(0, len(files), settings.BATCH_SIZE):
        batch = files[i:i + settings.BATCH_SIZE]
        logger.info(f"📦 Processing batch {i//settings.BATCH_SIZE + 1}")
        
        for file in batch:
            start_time = datetime.now()
            logger.info(f"📄 Processing file: {file.filename}")
            
            file_detail = {
                "filename": file.filename,
                "status": "processing",
                "error": None,
                "chunks": 0,
                "time": "0s"
            }
            
            file_path = None
            try:
                # Validate file type
                file_extension = os.path.splitext(file.filename)[1].lower()
                if file_extension not in [".pdf", ".docx", ".txt"]:
                    raise ValueError(f"Unsupported file type: {file_extension}")
                
                logger.info(f"✅ File type validated: {file_extension}")
                
                # Save file temporarily
                file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
                with open(file_path, "wb") as buffer:
                    content = await file.read()
                    buffer.write(content)
                
                logger.info(f"💾 File saved temporarily: {len(content)} bytes")
                
                # Extract text WITH PAGE NUMBERS
                logger.info("📝 Extracting text from file...")
                pages_data = extract_text_from_file(file_path, file_extension)
                
                if not pages_data or not any(p["text"].strip() for p in pages_data):
                    raise ValueError("No text content found in document")
                
                total_text_length = sum(len(p["text"]) for p in pages_data)
                logger.info(f"✅ Text extracted: {total_text_length} characters from {len(pages_data)} pages")
                
                # Process document with page data
                metadata = {
                    "filename": file.filename,
                    "upload_date": datetime.now().isoformat(),
                    "file_type": file_extension,
                    "user_type": user_type  # ✅ Store user type
                }
                
                chunk_count = rag_engine.process_document(pages_data, metadata)
                
                # Clean up uploaded file
                if os.path.exists(file_path):
                    os.remove(file_path)
                
                # Update results
                processing_time = (datetime.now() - start_time).total_seconds()
                file_detail["status"] = "success"
                file_detail["chunks"] = chunk_count
                file_detail["time"] = f"{processing_time:.2f}s"
                results["successful"] += 1
                
                logger.info(f"✅ File processed successfully: {file.filename} ({processing_time:.2f}s)")
                
            except Exception as e:
                logger.error(f"❌ Error processing file {file.filename}: {str(e)}")
                file_detail["status"] = "failed"
                file_detail["error"] = str(e)
                results["failed"] += 1
                
                # Clean up if file exists
                if file_path and os.path.exists(file_path):
                    os.remove(file_path)
            
            results["details"].append(file_detail)
    
    logger.info("=" * 70)
    logger.info(f"📊 Upload completed - Success: {results['successful']}, Failed: {results['failed']}")
    logger.info("=" * 70)
    
    return results
@app.get("/api/student-analytics")
async def get_student_analytics():
    """Get student's weak topics and study analytics"""
    logger.info("📊 Student analytics requested")
    try:
        weak_topics = student_analytics.get_weak_topics(limit=20)
        statistics = student_analytics.get_statistics()
        recommendations = student_analytics.get_study_recommendations()
        
        logger.info(f"✅ Returning {len(weak_topics)} weak topics")
        return {
            "weak_topics": weak_topics,
            "statistics": statistics,
            "recommendations": recommendations
        }
    except Exception as e:
        logger.error(f"❌ Error fetching student analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/student-analytics")
async def clear_student_analytics():
    """Clear student analytics data"""
    logger.info("🗑️ Clearing student analytics")
    try:
        student_analytics.clear_analytics()
        return {"message": "Student analytics cleared successfully"}
    except Exception as e:
        logger.error(f"❌ Error clearing analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/api/practice-quiz/generate")
async def generate_practice_quiz(
    topic: Optional[str] = Query(None),
    num_questions: int = Query(5, ge=1, le=20),
    difficulty: str = Query("medium", regex="^(easy|medium|hard)$")
):
    """Generate practice quiz questions"""
    logger.info(f"📝 Generating {num_questions} {difficulty} questions for topic: {topic or 'General'}")
    try:
        questions = practice_generator.generate_from_documents(
            rag_engine,
            topic,
            num_questions,
            difficulty
        )
        
        logger.info(f"✅ Generated {len(questions)} questions")
        return {
            "questions": questions,
            "total": len(questions)
        }
    except Exception as e:
        logger.error(f"❌ Error generating quiz: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/practice-quiz/topics")
async def get_available_topics():
    """Get available topics from student's documents"""
    logger.info("📚 Fetching available topics for quiz")
    try:
        # Get topics from student analytics
        analytics = student_analytics.get_statistics()
        weak_topics = student_analytics.get_weak_topics(limit=10)
        
        # Get document-based topics
        documents = rag_engine.get_all_documents()
        student_docs = [doc for doc in documents if doc.get("user_type") == "student"]
        
        topics = {
            "weak_topics": [t["topic"] for t in weak_topics],
            "all_topics": list(student_analytics.analytics_data.get("topics", {}).keys())[:20],
            "document_count": len(student_docs)
        }
        
        logger.info(f"✅ Found {len(topics['all_topics'])} topics")
        return topics
    except Exception as e:
        logger.error(f"❌ Error fetching topics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Handle chat queries"""
    logger.info("=" * 70)
    logger.info(f"💬 Chat request - User: {request.user_type.value}, Query: {request.query[:50]}...")
    try:
        answer, sources, confidence = rag_engine.query(
            request.query,
            request.user_type.value
        )
        
        confidence_level = get_confidence_level(confidence)
        ask_human = (
            request.user_type == UserType.COMPANY and
            confidence < settings.MEDIUM_CONFIDENCE
        )
        
        # ✅ Track for company users (knowledge gaps)
        if request.user_type == UserType.COMPANY:
            source_names = [s.document for s in sources]
            knowledge_gap_tracker.track_query(
                query=request.query,
                confidence=confidence,
                answer=answer,
                sources=source_names,
                user_type=request.user_type.value
            )
        
        # ✅ Track for students (weak topics)
        if request.user_type == UserType.STUDENT:
            source_names = [s.document for s in sources]
            student_analytics.track_query(
                query=request.query,
                confidence=confidence,
                topic=None,  # Auto-extract
                sources=source_names
            )
        
        logger.info(f"✅ Response generated - Confidence: {confidence_level} ({confidence:.2%})")
        logger.info(f"📚 Sources: {len(sources)}")
        logger.info("=" * 70)
        
        return ChatResponse(
            answer=answer,
            sources=sources,
            confidence=confidence,
            confidence_level=confidence_level,
            ask_human=ask_human
        )
        
    except Exception as e:
        logger.error(f"❌ Error in chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

    
@app.get("/api/knowledge-gaps")
async def get_knowledge_gaps(
    min_confidence: float = Query(0.0, ge=0.0, le=1.0),
    max_confidence: float = Query(0.7, ge=0.0, le=1.0),
    limit: int = Query(50, ge=1, le=100)
):
    """Get knowledge gaps - questions with low confidence answers"""
    logger.info(f"📊 Knowledge gaps requested (conf: {min_confidence}-{max_confidence})")
    
    try:
        gaps = knowledge_gap_tracker.get_gaps(min_confidence, max_confidence, limit)
        logger.info(f"✅ Returning {len(gaps)} knowledge gaps")
        return {
            "gaps": gaps,
            "statistics": knowledge_gap_tracker.get_statistics()
        }
    except Exception as e:
        logger.error(f"❌ Error fetching knowledge gaps: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/knowledge-gaps")
async def clear_knowledge_gaps():
    """Clear all knowledge gaps"""
    logger.info("🗑️ Clearing all knowledge gaps")
    
    try:
        knowledge_gap_tracker.clear_gaps()
        return {"message": "All knowledge gaps cleared successfully"}
    except Exception as e:
        logger.error(f"❌ Error clearing knowledge gaps: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/documents", response_model=List[DocumentInfo])
async def get_documents(user_type: Optional[str] = Query(None)):
    """Get documents filtered by user type"""
    logger.info(f"📋 Documents list requested for user_type: {user_type}")
    
    try:
        all_documents = rag_engine.get_all_documents()
        
        # ✅ Filter by user_type if provided
        if user_type:
            filtered_docs = [doc for doc in all_documents if doc.get("user_type") == user_type]
            logger.info(f"✅ Returning {len(filtered_docs)} documents for {user_type} (filtered from {len(all_documents)} total)")
            return filtered_docs
        
        logger.info(f"✅ Returning all {len(all_documents)} documents")
        return all_documents
        
    except Exception as e:
        logger.error(f"❌ Error fetching documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/documents/{filename}")
async def delete_document(filename: str):
    """Delete a document completely from vector store"""
    logger.info(f"🗑️ Delete request for: {filename}")
    
    try:
        success = rag_engine.delete_document(filename)
        
        if success:
            logger.info(f"✅ Document deleted: {filename}")
            return {"message": f"Document {filename} deleted successfully", "success": True}
        else:
            logger.warning(f"⚠️ Document not found: {filename}")
            raise HTTPException(status_code=404, detail=f"Document {filename} not found")
            
    except Exception as e:
        logger.error(f"❌ Error deleting document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    logger.info("🌟 Starting Uvicorn server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
