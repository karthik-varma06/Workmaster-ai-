from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List, Optional
import os
from datetime import datetime
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
    get_confidence_level
)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create necessary directories on startup
create_directories()
logger.info("=" * 70)
logger.info("🚀 WorkMaster AI Backend Starting...")
logger.info("=" * 70)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    logger.info("🔍 Running startup validations...")
    
    try:
        # Check FAISS files existence
        vector_store_dir = settings.VECTOR_STORE_DIR
        index_path = os.path.join(vector_store_dir, "faiss_index.faiss")
        metadata_path = os.path.join(vector_store_dir, "metadata.pkl")
        
        if os.path.exists(index_path) and os.path.exists(metadata_path):
            logger.info(f"✅ Vector store files found at {vector_store_dir}")
        else:
            logger.info(f"⚠️ No existing vector store found at {vector_store_dir}")
        
        # Check RAG engine and document count
        doc_count = len(rag_engine.get_all_documents())
        logger.info(f"📊 Current documents in vector store: {doc_count}")
        
        if doc_count == 0:
            logger.warning("⚠️ Vector store is empty - no documents loaded")
        
        logger.info("✅ Startup validations completed")
        
    except Exception as e:
        logger.error(f"❌ Startup validation error: {e}")
        logger.warning("⚠️ Continuing with warnings...")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down WorkMaster AI Backend...")


# Initialize FastAPI app with lifespan
app = FastAPI(title="WorkMaster AI API", version="1.0.0", lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    """Health check endpoint to verify system status and component availability."""
    try:
        doc_count = len(rag_engine.get_all_documents())
        vector_store_empty = doc_count == 0
        
        # Check embedding model availability
        embedding_model_loaded = False
        try:
            # Verify embeddings model is initialized by checking if it can generate embeddings
            if hasattr(rag_engine, 'embeddings') and rag_engine.embeddings is not None:
                embedding_model_loaded = True
                logger.info("✅ Embedding model is loaded and available")
            else:
                logger.warning("⚠️ Embedding model not properly initialized")
        except Exception as e:
            logger.error(f"❌ Embedding model check failed: {e}")
        
        # Check LLM availability by testing initialization
        llm_available = False
        try:
            # Check if LLM is initialized (don't actually call it, just verify setup)
            if hasattr(rag_engine, 'llm') and rag_engine.llm is not None:
                llm_available = True
                logger.info("✅ LLM is initialized and available")
            else:
                logger.warning("⚠️ LLM not properly initialized")
        except Exception as e:
            logger.error(f"❌ LLM availability check failed: {e}")
        
        logger.info(f"🏥 Health check: {doc_count} documents, embeddings={embedding_model_loaded}, llm={llm_available}")
        
        return {
            "success": True,
            "status": "healthy" if embedding_model_loaded and llm_available else "degraded",
            "data": {
                "documents_loaded": doc_count,
                "vector_store_empty": vector_store_empty,
                "embedding_model_loaded": embedding_model_loaded,
                "llm_available": llm_available,
                "timestamp": datetime.now().isoformat()
            }
        }
    except Exception as e:
        logger.error(f"❌ Health check failed: {e}")
        return {
            "success": False,
            "status": "unhealthy",
            "error": str(e)
        }


@app.get("/")
async def root():
    """Root endpoint."""
    logger.info("🏠 Root endpoint accessed")
    return {
        "success": True,
        "data": {
            "message": "WorkMaster AI API is running",
            "status": "healthy"
        }
    }

@app.post("/api/upload", response_model=UploadResponse)
async def upload_documents(
    files: List[UploadFile] = File(...),
    user_type: str = "student"
) -> UploadResponse:
    """Upload and process multiple documents.
    
    Accepts PDF, DOCX, and TXT files. Each file is extracted, chunked,
    and added to the vector store with metadata including user_type and page numbers.
    
    Args:
        files: List of files to upload (must be PDF, DOCX, or TXT).
        user_type: User type ('student' or 'company') to associate with documents.
        
    Returns:
        UploadResponse with summary of successful and failed uploads.
        
    Note:
        Files are processed in batches. Each file is stored with metadata
        including filename, upload_date, file_type, user_type, and chunk_count.
    """
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
    difficulty: str = Query("medium", pattern="^(easy|medium|hard)$")
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
    """Handle chat queries with improved error handling."""
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
        
        # Track for company users (knowledge gaps)
        if request.user_type == UserType.COMPANY:
            try:
                source_names = [s.document for s in sources]
                knowledge_gap_tracker.track_query(
                    query=request.query,
                    confidence=confidence,
                    answer=answer,
                    sources=source_names,
                    user_type=request.user_type.value
                )
            except Exception as e:
                logger.warning(f"⚠️ Could not track knowledge gap: {e}")
        
        # Track for students (weak topics)
        if request.user_type == UserType.STUDENT:
            try:
                source_names = [s.document for s in sources]
                student_analytics.track_query(
                    query=request.query,
                    confidence=confidence,
                    topic=None,
                    sources=source_names
                )
            except Exception as e:
                logger.warning(f"⚠️ Could not track student analytics: {e}")
        
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
        logger.exception(f"❌ Error in chat endpoint")
        error_message = str(e)
        
        # Return more specific error messages
        if "500" in error_message or "Internal Server" in error_message:
            error_message = "The AI service encountered an error. Please try again."
        elif "timeout" in error_message.lower():
            error_message = "The request took too long. Please try with a simpler question."
        
        raise HTTPException(status_code=500, detail=error_message)

    
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
    """Delete a document completely from vector store."""
    logger.info(f"🗑️ Delete request for: {filename}")
    
    try:
        success = rag_engine.delete_document(filename)
        
        if success:
            logger.info(f"✅ Document deleted: {filename}")
            return {
                "success": True,
                "data": {
                    "message": f"Document {filename} deleted successfully"
                }
            }
        else:
            logger.warning(f"⚠️ Document not found: {filename}")
            raise HTTPException(status_code=404, detail=f"Document {filename} not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"❌ Error deleting document")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/reset-vector-store")
async def reset_vector_store():
    """Reset the vector store completely.
    
    Clears FAISS index and metadata.pkl, reinitializing an empty vector store.
    Use with caution - this operation cannot be undone.
    """
    logger.info("🔄 Reset vector store request received")
    
    try:
        vector_store_dir = settings.VECTOR_STORE_DIR
        index_path = os.path.join(vector_store_dir, "faiss_index.faiss")
        metadata_path = os.path.join(vector_store_dir, "metadata.pkl")
        
        # Delete FAISS index files if they exist
        if os.path.exists(index_path):
            try:
                os.remove(index_path)
                logger.info(f"🗑️ Deleted FAISS index: {index_path}")
            except Exception as e:
                logger.error(f"❌ Failed to delete FAISS index: {e}")
                raise
        
        # Delete metadata file if it exists
        if os.path.exists(metadata_path):
            try:
                os.remove(metadata_path)
                logger.info(f"🗑️ Deleted metadata: {metadata_path}")
            except Exception as e:
                logger.error(f"❌ Failed to delete metadata: {e}")
                raise
        
        # Reinitialize empty vector store
        rag_engine.vector_store.store = None
        rag_engine.documents_metadata = []
        
        logger.info("✅ Vector store reset successfully - initialized empty store")
        
        return {
            "success": True,
            "data": {
                "message": "Vector store reset successfully"
            }
        }
        
    except Exception as e:
        logger.exception(f"❌ Error resetting vector store")
        raise HTTPException(status_code=500, detail=f"Failed to reset vector store: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    logger.info("🌟 Starting Uvicorn server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
