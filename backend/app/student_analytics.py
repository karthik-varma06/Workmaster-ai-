"""
Student Analytics Module
Tracks weak topics, study patterns, and provides personalized recommendations
"""
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import json
import os

class StudentAnalytics:
    def __init__(self):
        self.analytics_file = "data/student_analytics.json"
        self.analytics_data = self._load_analytics()
        
    def _load_analytics(self) -> Dict:
        """Load analytics data from file"""
        if os.path.exists(self.analytics_file):
            try:
                with open(self.analytics_file, 'r') as f:
                    return json.load(f)
            except:
                return self._init_analytics()
        return self._init_analytics()
    
    def _init_analytics(self) -> Dict:
        """Initialize empty analytics structure"""
        return {
            "queries": [],
            "topics": {},
            "weak_topics": [],
            "study_sessions": []
        }
    
    def _save_analytics(self):
        """Save analytics data to file"""
        os.makedirs(os.path.dirname(self.analytics_file), exist_ok=True)
        with open(self.analytics_file, 'w') as f:
            json.dump(self.analytics_data, f, indent=2)
    
    def track_query(
        self,
        query: str,
        confidence: float,
        topic: Optional[str] = None,
        sources: List[str] = None
    ):
        """Track a student query for analytics"""
        query_data = {
            "query": query,
            "confidence": confidence,
            "topic": topic or self._extract_topic(query),
            "sources": sources or [],
            "timestamp": datetime.now().isoformat(),
            "weak": confidence < 0.6
        }
        
        self.analytics_data["queries"].append(query_data)
        
        # Update topic tracking
        topic_key = query_data["topic"]
        if topic_key not in self.analytics_data["topics"]:
            self.analytics_data["topics"][topic_key] = {
                "count": 0,
                "low_confidence_count": 0,
                "total_confidence": 0,
                "last_asked": None
            }
        
        topic_stats = self.analytics_data["topics"][topic_key]
        topic_stats["count"] += 1
        topic_stats["total_confidence"] += confidence
        topic_stats["last_asked"] = query_data["timestamp"]
        
        if confidence < 0.6:
            topic_stats["low_confidence_count"] += 1
        
        # Update weak topics
        self._update_weak_topics()
        
        # Keep only last 1000 queries
        if len(self.analytics_data["queries"]) > 1000:
            self.analytics_data["queries"] = self.analytics_data["queries"][-1000:]
        
        self._save_analytics()
    
    def _extract_topic(self, query: str) -> str:
        """Extract topic from query (simple keyword extraction)"""
        # Remove common words
        common_words = {'what', 'how', 'why', 'when', 'where', 'is', 'are', 'the', 'a', 'an', 
                       'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'about', 'explain',
                       'tell', 'me', 'can', 'you', 'please', 'help', 'understand'}
        
        words = query.lower().split()
        topic_words = [w for w in words if w not in common_words and len(w) > 3]
        
        if topic_words:
            return ' '.join(topic_words[:3])  # First 3 significant words
        return "General"
    
    def _update_weak_topics(self):
        """Update list of weak topics based on patterns"""
        weak_topics = []
        
        for topic, stats in self.analytics_data["topics"].items():
            if stats["count"] >= 2:  # At least 2 queries
                avg_confidence = stats["total_confidence"] / stats["count"]
                weakness_score = (
                    stats["low_confidence_count"] / stats["count"] * 0.6 +
                    (1 - avg_confidence) * 0.4
                )
                
                if weakness_score > 0.4:  # Weak topic threshold
                    weak_topics.append({
                        "topic": topic,
                        "weakness_score": weakness_score,
                        "query_count": stats["count"],
                        "avg_confidence": avg_confidence,
                        "low_confidence_count": stats["low_confidence_count"],
                        "last_asked": stats["last_asked"]
                    })
        
        # Sort by weakness score
        weak_topics.sort(key=lambda x: x["weakness_score"], reverse=True)
        self.analytics_data["weak_topics"] = weak_topics[:20]  # Top 20 weak topics
    
    def get_weak_topics(self, limit: int = 10) -> List[Dict]:
        """Get student's weak topics"""
        return self.analytics_data["weak_topics"][:limit]
    
    def get_statistics(self) -> Dict:
        """Get overall statistics"""
        queries = self.analytics_data["queries"]
        
        if not queries:
            return {
                "total_queries": 0,
                "weak_queries": 0,
                "avg_confidence": 0,
                "topics_studied": 0,
                "weak_topics_count": len(self.analytics_data["weak_topics"])
            }
        
        recent_queries = [q for q in queries if self._is_recent(q["timestamp"], days=7)]
        
        return {
            "total_queries": len(queries),
            "recent_queries": len(recent_queries),
            "weak_queries": sum(1 for q in queries if q["weak"]),
            "avg_confidence": sum(q["confidence"] for q in queries) / len(queries),
            "topics_studied": len(self.analytics_data["topics"]),
            "weak_topics_count": len(self.analytics_data["weak_topics"])
        }
    
    def _is_recent(self, timestamp: str, days: int = 7) -> bool:
        """Check if timestamp is within recent days"""
        try:
            query_time = datetime.fromisoformat(timestamp)
            return (datetime.now() - query_time).days <= days
        except:
            return False
    
    def get_study_recommendations(self) -> List[str]:
        """Get personalized study recommendations"""
        recommendations = []
        weak_topics = self.get_weak_topics(5)
        
        if not weak_topics:
            recommendations.append("Great job! Keep up the consistent study habits.")
        else:
            recommendations.append(f"Focus on these {len(weak_topics)} topics for improvement:")
            for topic in weak_topics:
                recommendations.append(
                    f"• {topic['topic']} (Asked {topic['query_count']} times, "
                    f"{topic['avg_confidence']*100:.0f}% confidence)"
                )
        
        return recommendations
    
    def clear_analytics(self):
        """Clear all analytics data"""
        self.analytics_data = self._init_analytics()
        self._save_analytics()

# Global instance
student_analytics = StudentAnalytics()
