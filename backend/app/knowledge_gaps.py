import os
import json
from datetime import datetime
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)

class KnowledgeGapTracker:
    """Tracks questions that the system couldn't answer well"""
    
    def __init__(self, data_file: str = "knowledge_gaps.json"):
        self.data_file = data_file
        self.gaps = self.load_gaps()
    
    def load_gaps(self) -> List[Dict]:
        """Load existing knowledge gaps from file"""
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading knowledge gaps: {e}")
                return []
        return []
    
    def save_gaps(self):
        """Save knowledge gaps to file"""
        try:
            with open(self.data_file, 'w', encoding='utf-8') as f:
                json.dump(self.gaps, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Error saving knowledge gaps: {e}")
    
    def track_query(self, query: str, confidence: float, answer: str, sources: List[str], user_type: str):
        """Track a query and its confidence level"""
        
        # Only track company queries with low/medium confidence
        if user_type == "company" and confidence < 0.7:
            
            gap = {
                "query": query,
                "confidence": confidence,
                "answer": answer[:200],  # First 200 chars
                "sources_count": len(sources),
                "timestamp": datetime.now().isoformat(),
                "user_type": user_type
            }
            
            # Check if similar question already exists
            similar_found = False
            for existing_gap in self.gaps:
                if existing_gap["query"].lower() == query.lower():
                    # Update if confidence is lower
                    if confidence < existing_gap["confidence"]:
                        existing_gap.update(gap)
                    similar_found = True
                    break
            
            if not similar_found:
                self.gaps.append(gap)
            
            # Keep only last 100 gaps
            if len(self.gaps) > 100:
                self.gaps = self.gaps[-100:]
            
            self.save_gaps()
            logger.info(f"📊 Knowledge gap tracked: {query[:50]}... (confidence: {confidence:.2%})")
    
    def get_gaps(self, min_confidence: float = 0.0, max_confidence: float = 0.7, limit: int = 50) -> List[Dict]:
        """Get knowledge gaps filtered by confidence range"""
        
        filtered_gaps = [
            gap for gap in self.gaps
            if min_confidence <= gap["confidence"] <= max_confidence
        ]
        
        # Sort by confidence (lowest first) and timestamp (newest first)
        filtered_gaps.sort(key=lambda x: (x["confidence"], -datetime.fromisoformat(x["timestamp"]).timestamp()))
        
        return filtered_gaps[:limit]
    
    def get_statistics(self) -> Dict:
        """Get statistics about knowledge gaps"""
        
        if not self.gaps:
            return {
                "total_gaps": 0,
                "critical_gaps": 0,
                "medium_gaps": 0,
                "avg_confidence": 0.0
            }
        
        total = len(self.gaps)
        critical = len([g for g in self.gaps if g["confidence"] < 0.3])
        medium = len([g for g in self.gaps if 0.3 <= g["confidence"] < 0.6])
        avg_confidence = sum(g["confidence"] for g in self.gaps) / total if total > 0 else 0
        
        return {
            "total_gaps": total,
            "critical_gaps": critical,
            "medium_gaps": medium,
            "low_gaps": total - critical - medium,
            "avg_confidence": round(avg_confidence, 2)
        }
    
    def clear_gaps(self):
        """Clear all knowledge gaps"""
        self.gaps = []
        self.save_gaps()
        logger.info("🗑️ All knowledge gaps cleared")

# Global tracker instance
knowledge_gap_tracker = KnowledgeGapTracker()
