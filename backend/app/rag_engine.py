import os
from typing import List, Tuple, Dict, Optional
from abc import ABC, abstractmethod
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.prompts import PromptTemplate
from langchain.docstore.document import Document
from app.config import settings
from app.models import SourceCitation
import numpy as np
import pickle
import logging
import time

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BaseVectorStore(ABC):
    """Abstract base class for vector store implementations."""
    
    @abstractmethod
    def save_local(self, path: str) -> None:
        """Save vector store to local disk."""
        pass
    
    @abstractmethod
    def load_local(self, path: str) -> bool:
        """Load vector store from local disk. Returns True if successful."""
        pass
    
    @abstractmethod
    def add_documents(self, documents: List[Document]) -> None:
        """Add documents to vector store."""
        pass
    
    @abstractmethod
    def similarity_search_with_score(self, query: str, k: int = 4) -> List[Tuple[Document, float]]:
        """Search for similar documents with scores."""
        pass
    
    @abstractmethod
    def as_retriever(self, **kwargs):
        """Get retriever from vector store."""
        pass
    
    @abstractmethod
    def get_documents(self) -> List[Document]:
        """Get all documents from vector store."""
        pass
    
    @abstractmethod
    def is_empty(self) -> bool:
        """Check if vector store is empty."""
        pass


class FaissVectorStore(BaseVectorStore):
    """FAISS vector store implementation."""
    
    def __init__(self, embeddings):
        """Initialize FAISS vector store.
        
        Args:
            embeddings: HuggingFaceEmbeddings instance for encoding documents.
        """
        self.embeddings = embeddings
        self.store = None
    
    def save_local(self, path: str) -> None:
        """Save FAISS index to disk.
        
        Args:
            path: Directory path to save FAISS index and metadata.
        """
        if self.store:
            os.makedirs(path, exist_ok=True)
            self.store.save_local(path, "faiss_index")
            logger.info(f"💾 FAISS vector store saved to {path}")
    
    def load_local(self, path: str) -> bool:
        """Load FAISS index from disk.
        
        Args:
            path: Directory path containing FAISS index files.
            
        Returns:
            True if load successful, False if index files not found or error occurred.
        """
        try:
            index_path = os.path.join(path, "faiss_index.faiss")
            if os.path.exists(index_path):
                self.store = FAISS.load_local(
                    path,
                    self.embeddings,
                    "faiss_index",
                    allow_dangerous_deserialization=True
                )
                return True
            return False
        except Exception as e:
            logger.error(f"❌ Failed to load FAISS vector store: {e}")
            return False
    
    def add_documents(self, documents: List[Document]) -> None:
        """Add documents to vector store.
        
        Creates new store if empty, otherwise appends to existing store.
        
        Args:
            documents: List of langchain Document objects to add.
        """
        if not documents:
            logger.warning("⚠️ No documents to add")
            return
        
        if self.store is None:
            self.store = FAISS.from_documents(documents, self.embeddings)
            logger.info(f"✅ Created new FAISS vector store with {len(documents)} documents")
        else:
            self.store.add_documents(documents)
            logger.info(f"✅ Added {len(documents)} documents to existing FAISS vector store")
    
    def similarity_search_with_score(self, query: str, k: int = 4) -> List[Tuple[Document, float]]:
        """Search for similar documents."""
        if self.store is None:
            return []
        return self.store.similarity_search_with_score(query, k=k)
    
    def as_retriever(self, **kwargs):
        """Get retriever from FAISS store."""
        if self.store is None:
            raise RuntimeError("Vector store not initialized")
        return self.store.as_retriever(**kwargs)
    
    def get_documents(self) -> List[Document]:
        """Get all documents from vector store."""
        if self.store is None or not hasattr(self.store, 'docstore'):
            return []
        
        documents = []
        try:
            for doc_id in self.store.docstore._dict:
                documents.append(self.store.docstore._dict[doc_id])
        except Exception as e:
            logger.error(f"❌ Error retrieving documents: {e}")
        return documents
    
    def is_empty(self) -> bool:
        """Check if vector store is empty."""
        return self.store is None or len(self.get_documents()) == 0
    
    def rebuild_from_documents(self, documents: List[Document]) -> None:
        """Rebuild vector store from scratch with given documents."""
        if documents:
            self.store = FAISS.from_documents(documents, self.embeddings)
            logger.info(f"✅ Rebuilt FAISS vector store with {len(documents)} documents")
        else:
            self.store = None
            logger.info("📭 Cleared FAISS vector store")

class RAGEngine:
    """RAG (Retrieval-Augmented Generation) Engine for answering questions based on documents.
    
    This engine combines document retrieval with LLM generation to provide
    accurate answers with source citations.
    """
    
    def __init__(self, vector_store: Optional[BaseVectorStore] = None):
        """Initialize RAG Engine.
        
        Args:
            vector_store: Custom vector store implementation. If None, uses FaissVectorStore.
        """
        logger.info("🚀 Initializing RAG Engine...")
        
        logger.info("📦 Loading embedding model...")
        self.embeddings = HuggingFaceEmbeddings(
            model_name=settings.EMBEDDING_MODEL,
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )
        logger.info("✅ Embedding model loaded successfully")
        
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            separators=["\n\n", "\n", ". ", "? ", "! ", " ", ""],
            length_function=len
        )
        
        logger.info("🤖 Initializing LLM connection...")
        self.llm = ChatOpenAI(
            model=settings.LLM_MODEL,
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.OPENROUTER_API_KEY,
            temperature=0.1,
            max_tokens=1000,
            default_headers={
                "HTTP-Referer": settings.SITE_URL,
                "X-Title": settings.SITE_NAME
            }
        )
        logger.info("✅ LLM connection established")
        
        # Initialize vector store (abstraction layer)
        self.vector_store = vector_store or FaissVectorStore(self.embeddings)
        
        self.documents_metadata = []
        self.load_vector_store()
        
        logger.info("✅ RAG Engine initialized successfully")
    
    def load_vector_store(self) -> None:
        """Load existing vector store or create new one."""
        logger.info("📂 Loading vector store...")
        metadata_path = os.path.join(settings.VECTOR_STORE_DIR, "metadata.pkl")
        
        try:
            # Create directory if it doesn't exist
            os.makedirs(settings.VECTOR_STORE_DIR, exist_ok=True)
            
            # Try to load vector store
            if self.vector_store.load_local(settings.VECTOR_STORE_DIR):
                # Load metadata if it exists
                if os.path.exists(metadata_path):
                    with open(metadata_path, 'rb') as f:
                        self.documents_metadata = pickle.load(f)
                    logger.info(f"✅ Loaded {len(self.documents_metadata)} documents from vector store")
                else:
                    logger.warning("⚠️ Vector store found but metadata missing")
                    self.documents_metadata = []
            else:
                logger.info("📝 No existing vector store found, will create new one")
                self.documents_metadata = []
        except Exception as e:
            logger.error(f"❌ Error loading vector store: {e}")
            self.documents_metadata = []
    
    def save_vector_store(self) -> None:
        """Save vector store and metadata to disk."""
        try:
            os.makedirs(settings.VECTOR_STORE_DIR, exist_ok=True)
            self.vector_store.save_local(settings.VECTOR_STORE_DIR)
            
            metadata_path = os.path.join(settings.VECTOR_STORE_DIR, "metadata.pkl")
            with open(metadata_path, 'wb') as f:
                pickle.dump(self.documents_metadata, f)
            logger.info("✅ Vector store and metadata saved successfully")
        except Exception as e:
            logger.error(f"❌ Error saving vector store: {e}")
            raise
    
    def process_document(self, pages_data: List[dict], metadata: dict) -> int:
        """Process and add document to vector store with page tracking.
        
        Splits document pages into chunks, embeds them, and adds to the vector store.
        Maintains page numbers and metadata for proper source attribution.
        
        Args:
            pages_data: List of dicts with 'text' and 'page' keys from file extraction.
            metadata: Document metadata (filename, upload_date, file_type, user_type).
            
        Returns:
            Total number of chunks created and added to vector store.
            
        Raises:
            ValueError: If no text content found in document.
            Exception: If vector store save operation fails.
            
        Note:
            Each chunk is stored with original metadata plus page and chunk index.
        """
        try:
            logger.info(f"📄 Processing document: {metadata['filename']}")
            
            all_documents = []
            total_chunks = 0
            
            # Process each page separately to maintain page numbers
            for page_data in pages_data:
                text = page_data.get("text", "")
                page_num = page_data.get("page")
                
                if not text.strip():
                    continue
                
                chunks = self.text_splitter.split_text(text)
                
                for i, chunk in enumerate(chunks):
                    doc_metadata = {
                        **metadata,
                        "page": page_num,
                        "chunk_index": total_chunks + i,
                        "chunk_text": chunk[:200]
                    }
                    all_documents.append(Document(page_content=chunk, metadata=doc_metadata))
                
                total_chunks += len(chunks)
            
            if not all_documents:
                raise ValueError("No text content found to process")
            
            logger.info(f"✂️ Split into {total_chunks} chunks across {len(pages_data)} pages")
            
            # Add to vector store
            logger.info("🔄 Adding to vector store...")
            self.vector_store.add_documents(all_documents)
            
            # Track document metadata with chunk count
            metadata_with_chunks = {**metadata, "chunk_count": total_chunks}
            
            # Update or add document metadata
            existing_index = None
            for i, doc in enumerate(self.documents_metadata):
                if doc["filename"] == metadata["filename"]:
                    existing_index = i
                    break
            
            if existing_index is not None:
                self.documents_metadata[existing_index] = metadata_with_chunks
                logger.info(f"🔄 Updated existing document metadata")
            else:
                self.documents_metadata.append(metadata_with_chunks)
                logger.info(f"➕ Added new document metadata")
            
            self.save_vector_store()
            logger.info(f"✅ Document processed successfully: {total_chunks} chunks")
            return total_chunks
            
        except Exception as e:
            logger.error(f"❌ Error processing document: {e}")
            raise
    
    def _query_with_retry(self, question: str, docs_with_scores: List[Tuple[Document, float]], confidence: float) -> str:
        """Execute LLM query with retry and timeout handling, with fallback to document chunks.
        
        Attempts to generate an answer using the LLM with retries.
        If all LLM attempts fail (including rate limits), gracefully falls back
        to returning the most relevant document chunk only if confidence >= 0.5.
        
        The function is designed to never raise exceptions - it always returns a valid response string.
        
        Args:
            question: User question to answer.
            docs_with_scores: Retrieved documents with similarity scores for fallback use.
            confidence: Current confidence score from retrieval. Used to gate fallback.
            
        Returns:
            Either LLM-generated answer or formatted fallback document excerpt. Never raises exceptions.
        """
        max_retries = 2
        retry_delay = 1
        
        for attempt in range(max_retries):
            try:
                logger.info(f"🤖 LLM attempt {attempt + 1}/{max_retries}...")
                
                retriever = self.vector_store.as_retriever(
                    search_kwargs={"k": 4, "fetch_k": 10}
                )
                
                # LangChain 0.3: Use create_stuff_documents_chain + create_retrieval_chain
                stuff_chain = create_stuff_documents_chain(self.llm, PromptTemplate(
                    template="{context}\n\nQuestion: {input}\n\nAnswer:",
                    input_variables=["context", "input"]
                ))
                
                qa_chain = create_retrieval_chain(retriever, stuff_chain)
                
                # Attempt LLM call with modern chain invocation
                result = qa_chain.invoke({"input": question})
                answer = result.get("answer", "")
                
                logger.info(f"✅ LLM response generated ({len(answer)} characters)")
                return answer
                
            except Exception as e:
                error_str = str(e).lower()
                
                # Detect rate limit errors
                is_rate_limit = (
                    "429" in str(e) or 
                    "rate" in error_str or 
                    "too many requests" in error_str or
                    "ratelimiterror" in error_str
                )
                
                if is_rate_limit:
                    logger.warning(f"⚠️ Attempt {attempt + 1} - Rate limit detected: {e}")
                elif "timeout" in error_str:
                    logger.warning(f"⚠️ Attempt {attempt + 1} - Timeout: {e}")
                else:
                    logger.warning(f"⚠️ Attempt {attempt + 1} - LLM error: {e}")
                
                # If not the last attempt, retry after delay
                if attempt < max_retries - 1:
                    logger.info(f"⏳ Waiting {retry_delay}s before retry...")
                    time.sleep(retry_delay)
                    continue
                
                # All retries exhausted - use fallback only if confidence >= 0.5
                logger.warning(f"❌ All {max_retries} LLM attempts failed. Confidence: {confidence:.2%}")
                
                if confidence >= 0.5 and docs_with_scores:
                    # Return formatted fallback response from most relevant chunk
                    logger.info("📄 Returning formatted fallback excerpt (confidence >= 0.5)")
                    top_doc = docs_with_scores[0][0]
                    chunk_content = top_doc.page_content
                    filename = top_doc.metadata.get("filename", "Unknown")
                    page_num = top_doc.metadata.get("page", "N/A")
                    
                    # Truncate if too long
                    max_length = 800
                    if len(chunk_content) > max_length:
                        chunk_content = chunk_content[:max_length] + "..."
                    
                    fallback_answer = (
                        "⚠️ The AI model is temporarily rate-limited.\n\n"
                        "Here is the most relevant document excerpt:\n\n"
                        "----------------------------------------\n"
                        f"{chunk_content}\n"
                        "----------------------------------------\n\n"
                        "Source:\n"
                        f"Document: {filename}\n"
                        f"Page: {page_num}"
                    )
                    
                    logger.info(f"📄 Returning fallback excerpt ({len(fallback_answer)} characters)")
                    logger.warning(f"📄 Fallback: {filename} (page {page_num})")
                    return fallback_answer
                else:
                    # Low confidence or no documents - return unavailable message
                    fallback_answer = (
                        "I could not generate an answer because the AI model is temporarily unavailable, "
                        "and no strong matching content was found in your documents."
                    )
                    logger.warning(f"📭 Returning unavailable message (confidence: {confidence:.2%})")
                    return fallback_answer
        
        # Should not reach here, but just in case
        logger.error("❌ Unexpected state: reached end of retry loop without returning")
        return "An unexpected error occurred. Please try again later."
    
    def query(self, question: str, user_type: str) -> Tuple[str, List[SourceCitation], float]:
        """Query the RAG system and get answer with sources.
        
        Retrieves documents matching the user_type, performs similarity search,
        and generates an answer using the LLM with retry logic and fallback handling.
        
        Args:
            question: User question to answer.
            user_type: Type of user ('student' or 'company'). Used to filter documents.
            
        Returns:
            Tuple of (answer_text, sources, confidence_score).
            
        Note:
            - Only documents where metadata["user_type"] == user_type are retrieved
            - If no matching documents found, returns a clean message
            - Always returns a valid tuple, never raises exceptions to caller
        """
        logger.info("=" * 70)
        logger.info(f"❓ Query received: {question[:50]}... (user_type: {user_type})")
        
        try:
            if self.vector_store.is_empty():
                logger.warning("⚠️ No vector store available")
                return (
                    "I don't have any documents uploaded yet. Please upload documents first.",
                    [],
                    0.0
                )
            
            # Create prompt template with emphasis on completeness
            if user_type == "student":
                template = """You are an educational assistant. Use the following context from study materials to answer the question.
When asked to list items (like projects, achievements, etc.), make sure to include ALL items from the context, not just one.
If you cannot find the answer in the context, say "I don't have information about this in your uploaded documents."

Context: {context}

Question: {question}

Answer (be complete and include ALL relevant items):"""
            else:
                template = """You are a business knowledge assistant. Use the following context from company documents to answer the question.
When asked to list items, make sure to include ALL items from the context.
If you cannot find the answer in the context, say "I don't have information about this in your uploaded documents."

Context: {context}

Question: {question}

Answer (be complete and include ALL relevant items):"""
            
            prompt = PromptTemplate(
                template=template,
                input_variables=["context", "question"]
            )
            
            # Get documents with scores
            logger.info("🔍 Searching for relevant documents...")
            docs_with_scores = self.vector_store.similarity_search_with_score(question, k=4)
            
            if not docs_with_scores:
                logger.info("⚠️ No relevant documents found")
                return (
                    "I don't have information about this in your uploaded documents.",
                    [],
                    0.0
                )
            
            # STRICT USER-TYPE ISOLATION - Filter BEFORE processing (early exit)
            logger.info(f"🔎 Filtering documents for user_type: {user_type}")
            filtered_docs_with_scores = [
                (doc, score) for doc, score in docs_with_scores
                if doc.metadata.get("user_type") == user_type
            ]
            
            if not filtered_docs_with_scores:
                logger.warning(f"⚠️ No documents found for user_type: {user_type}")
                return (
                    f"No documents found for this user type.",
                    [],
                    0.0
                )
            
            logger.info(f"📚 Found {len(filtered_docs_with_scores)} documents matching user_type: {user_type}")
            
            # Calculate confidence based on similarity scores
            scores = [score for _, score in filtered_docs_with_scores]
            avg_distance = np.mean(scores)
            
            # Convert distance to confidence
            if avg_distance < 0.7:
                avg_confidence = 0.9
            elif avg_distance < 1.0:
                avg_confidence = 0.75
            elif avg_distance < 1.3:
                avg_confidence = 0.6
            elif avg_distance < 1.6:
                avg_confidence = 0.4
            else:
                avg_confidence = 0.25
            
            logger.info(f"📊 Avg distance: {avg_distance:.3f}, Confidence: {avg_confidence:.2%}")
            
            # Group sources by document name
            docs_by_file: Dict[str, List[int]] = {}
            for doc, _ in filtered_docs_with_scores:
                doc_name = doc.metadata.get("filename", "Unknown")
                page_num = doc.metadata.get("page")
                
                if page_num is not None:
                    if doc_name not in docs_by_file:
                        docs_by_file[doc_name] = []
                    if page_num not in docs_by_file[doc_name]:
                        docs_by_file[doc_name].append(page_num)
            
            # Sort pages for each document
            for doc_name in docs_by_file:
                docs_by_file[doc_name].sort()
            
            # Create SourceCitation objects with grouped pages
            sources = []
            for doc_name, pages in docs_by_file.items():
                sources.append(
                    SourceCitation(
                        document=doc_name,
                        pages=pages,
                        page=None,
                        chunk_text=None
                    )
                )
            
            logger.info(f"✅ Grouped into {len(sources)} documents")
            
            # CONFIDENCE THRESHOLD GUARD - Skip LLM if confidence too low
            if avg_confidence < 0.5:
                logger.warning(f"⚠️ Confidence below threshold ({avg_confidence:.2%}), skipping LLM call")
                return (
                    "I could not find relevant information in the uploaded documents.",
                    [],
                    avg_confidence
                )
            
            # Generate answer with retry logic and fallback handling
            logger.info("🤖 Generating answer with LLM...")
            try:
                answer = self._query_with_retry(question, filtered_docs_with_scores, avg_confidence)
                
                # Adjust confidence based on answer quality
                if "don't have information" in answer.lower():
                    avg_confidence = 0.2
                    logger.info("⚠️ LLM couldn't find answer, lowering confidence")
                
                logger.info(f"✅ Answer generated successfully")
                
            except Exception as e:
                logger.exception(f"❌ Unexpected error in _query_with_retry")
                # This should not happen as _query_with_retry handles all errors
                answer = "An unexpected error occurred. Please try again later."
                avg_confidence = 0.0
            
            logger.info("=" * 70)
            return answer, sources, avg_confidence
            
        except Exception as e:
            logger.exception(f"❌ Unexpected error in query method")
            return (
                "An unexpected error occurred. Please try again later.",
                [],
                0.0
            )
    
    def get_all_documents(self) -> List[dict]:
        """Get list of all uploaded documents.
        
        Returns:
            List of document metadata dictionaries.
        """
        logger.info(f"📋 Retrieving {len(self.documents_metadata)} documents")
        return self.documents_metadata
    
    def delete_document(self, filename: str) -> bool:
        """Delete a document completely from vector store and metadata.
        
        Args:
            filename: Name of document to delete.
            
        Returns:
            True if document was deleted, False if not found.
        """
        logger.info(f"🗑️ Deleting document: {filename}")
        
        try:
            # Check if document exists
            doc_exists = any(d["filename"] == filename for d in self.documents_metadata)
            
            if not doc_exists:
                logger.warning(f"⚠️ Document not found: {filename}")
                return False
            
            # Remove from metadata
            self.documents_metadata = [
                d for d in self.documents_metadata 
                if d["filename"] != filename
            ]
            
            # Rebuild vector store without the deleted document
            try:
                remaining_docs = [
                    doc for doc in self.vector_store.get_documents()
                    if doc.metadata.get("filename") != filename
                ]
                
                if remaining_docs:
                    logger.info(f"📚 Rebuilding with {len(remaining_docs)} documents...")
                    self.vector_store.rebuild_from_documents(remaining_docs)
                    logger.info("✅ Vector store rebuilt successfully")
                else:
                    logger.info("📭 No documents remaining, clearing vector store")
                    self.vector_store.rebuild_from_documents([])
                    
            except Exception as e:
                logger.error(f"❌ Error rebuilding vector store: {e}")
                # Fallback: still save metadata
            
            # Save updated state
            self.save_vector_store()
            logger.info(f"✅ Document deleted successfully: {filename}")
            return True
            
        except Exception as e:
            logger.exception(f"❌ Error deleting document")
            return False


# Global RAG engine instance
logger.info("=" * 50)
logger.info("🎯 Initializing WorkMaster AI RAG Engine")
logger.info("=" * 50)
rag_engine = RAGEngine()
