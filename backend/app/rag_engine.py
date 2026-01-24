import os
from typing import List, Tuple, Dict
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain.docstore.document import Document
from app.config import settings
from app.models import SourceCitation
import numpy as np
import pickle
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RAGEngine:
    def __init__(self):
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
        
        self.vector_store = None
        self.documents_metadata = []
        self.load_vector_store()
        
        logger.info("✅ RAG Engine initialized successfully")
    
    def load_vector_store(self):
        """Load existing vector store or create new one"""
        logger.info("📂 Loading vector store...")
        index_path = os.path.join(settings.VECTOR_STORE_DIR, "faiss_index.faiss")
        metadata_path = os.path.join(settings.VECTOR_STORE_DIR, "metadata.pkl")
        
        if os.path.exists(index_path) and os.path.exists(metadata_path):
            try:
                self.vector_store = FAISS.load_local(
                    settings.VECTOR_STORE_DIR,
                    self.embeddings,
                    "faiss_index",
                    allow_dangerous_deserialization=True
                )
                with open(metadata_path, 'rb') as f:
                    self.documents_metadata = pickle.load(f)
                logger.info(f"✅ Loaded {len(self.documents_metadata)} documents from vector store")
            except Exception as e:
                logger.warning(f"⚠️ Could not load vector store: {e}")
                self.vector_store = None
                self.documents_metadata = []
        else:
            logger.info("📝 No existing vector store found, will create new one")
    
    def save_vector_store(self):
        """Save vector store and metadata"""
        if self.vector_store:
            logger.info("💾 Saving vector store...")
            self.vector_store.save_local(settings.VECTOR_STORE_DIR, "faiss_index")
            metadata_path = os.path.join(settings.VECTOR_STORE_DIR, "metadata.pkl")
            with open(metadata_path, 'wb') as f:
                pickle.dump(self.documents_metadata, f)
            logger.info("✅ Vector store saved successfully")
    
    def process_document(self, pages_data: List[dict], metadata: dict) -> int:
        """Process and add document to vector store with page tracking"""
        logger.info(f"📄 Processing document: {metadata['filename']}")
        
        all_documents = []
        total_chunks = 0
        
        # Process each page separately to maintain page numbers
        for page_data in pages_data:
            text = page_data["text"]
            page_num = page_data["page"]
            
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
        
        logger.info(f"✂️ Split into {total_chunks} chunks across {len(pages_data)} pages")
        
        # Add to vector store
        logger.info("🔄 Adding to vector store...")
        if self.vector_store is None:
            self.vector_store = FAISS.from_documents(all_documents, self.embeddings)
            logger.info("✅ Created new vector store")
        else:
            self.vector_store.add_documents(all_documents)
            logger.info("✅ Added to existing vector store")
        
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
    
    def query(self, question: str, user_type: str) -> Tuple[str, List[SourceCitation], float]:
        """Query the RAG system"""
        logger.info(f"❓ Query received: {question[:50]}...")
        
        if not self.vector_store:
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
        
        logger.info(f"📚 Found {len(docs_with_scores)} relevant documents")
        
        # Calculate confidence based on similarity scores
        scores = [score for _, score in docs_with_scores]
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
        for doc, _ in docs_with_scores:
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
        for source in sources:
            logger.info(f"📄 {source.document}: Pages {source.pages}")
        
        # Create QA chain
        logger.info("🤖 Generating answer with LLM...")
        
        try:
            retriever = self.vector_store.as_retriever(
                search_kwargs={
                    "k": 4,
                    "fetch_k": 10
                }
            )
            
            qa_chain = RetrievalQA.from_chain_type(
                llm=self.llm,
                chain_type="stuff",
                retriever=retriever,
                chain_type_kwargs={"prompt": prompt},
                return_source_documents=False
            )
            
            result = qa_chain.invoke({"query": question})
            answer = result["result"]
            
            logger.info(f"✅ Answer generated successfully: {len(answer)} characters")
            
            # Adjust confidence based on answer quality
            if "don't have information" in answer.lower():
                avg_confidence = 0.2
                logger.info("⚠️ LLM couldn't find answer, lowering confidence")
            
        except Exception as e:
            logger.error(f"❌ Error generating answer: {e}")
            error_str = str(e)
            
            if "500" in error_str or "Internal Server Error" in error_str:
                answer = "The AI service is temporarily unavailable. Please try with a shorter or simpler question."
            elif "token" in error_str.lower():
                answer = "The context is too large. Please try a more specific question."
            elif "timeout" in error_str.lower():
                answer = "The request timed out. Please try again with a simpler question."
            else:
                answer = "Sorry, I encountered an error while generating the answer. Please try again."
            
            avg_confidence = 0.0
        
        return answer, sources, avg_confidence
    
    def get_all_documents(self) -> List[dict]:
        """Get list of all uploaded documents"""
        logger.info(f"📋 Retrieving {len(self.documents_metadata)} documents")
        return self.documents_metadata
    
    def delete_document(self, filename: str) -> bool:
        """Delete a document completely from vector store and metadata"""
        logger.info(f"🗑️ Deleting document: {filename}")
        
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
        if self.vector_store:
            logger.info("🔄 Rebuilding vector store without deleted document...")
            
            remaining_docs = []
            
            try:
                # Access internal docstore to get all documents
                if hasattr(self.vector_store, 'docstore'):
                    for doc_id in self.vector_store.docstore._dict:
                        doc = self.vector_store.docstore._dict[doc_id]
                        if doc.metadata.get("filename") != filename:
                            remaining_docs.append(doc)
                
                if remaining_docs:
                    # Rebuild vector store with remaining documents
                    logger.info(f"📚 Rebuilding with {len(remaining_docs)} documents...")
                    self.vector_store = FAISS.from_documents(remaining_docs, self.embeddings)
                    logger.info("✅ Vector store rebuilt successfully")
                else:
                    # No documents left, clear vector store
                    logger.info("📭 No documents remaining, clearing vector store")
                    self.vector_store = None
                    
            except Exception as e:
                logger.error(f"❌ Error rebuilding vector store: {e}")
                # Fallback: just clear vector store
                self.vector_store = None
        else:
            # No documents left
            logger.info("📭 No documents remaining")
            self.vector_store = None
        
        # Save updated state
        self.save_vector_store()
        logger.info(f"✅ Document deleted successfully: {filename}")
        
        return True

# Global RAG engine instance
logger.info("=" * 50)
logger.info("🎯 Initializing WorkMaster AI RAG Engine")
logger.info("=" * 50)
rag_engine = RAGEngine()
