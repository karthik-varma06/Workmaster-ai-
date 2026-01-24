"""
Practice Question Generator
Generates quiz questions from uploaded study materials
"""
from typing import List, Dict, Optional
import random
import requests
import json
import os
from app.config import settings


class PracticeGenerator:
    def __init__(self):
        self.api_key = settings.OPENROUTER_API_KEY
        self.api_base = "https://openrouter.ai/api/v1/chat/completions"
        self.model = settings.LLM_MODEL
        
    def generate_questions(
        self,
        topic: str,
        content: str,
        num_questions: int = 5,
        difficulty: str = "medium"
    ) -> List[Dict]:
        """Generate practice questions from content"""
        
        prompt = f"""Based on the following educational content, generate {num_questions} {difficulty} difficulty multiple-choice questions for student practice.

Content:
{content[:3000]}

For each question, provide:
1. Question text
2. Four options (A, B, C, D)
3. Correct answer (letter)
4. Brief explanation

Format as JSON array:
[
  {{
    "question": "...",
    "options": {{"A": "...", "B": "...", "C": "...", "D": "..."}},
    "correct_answer": "A",
    "explanation": "..."
  }}
]

Make questions that test understanding, not just memorization.
Topic focus: {topic}

IMPORTANT: Return ONLY the JSON array, no additional text or markdown formatting."""
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "HTTP-Referer": settings.SITE_URL,
                "X-Title": settings.SITE_NAME,
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": self.model,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an expert educational content creator. Always respond with valid JSON arrays only."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.7,
                "max_tokens": 2500
            }
            
            response = requests.post(
                self.api_base,
                headers=headers,
                json=payload,
                timeout=60
            )
            
            if response.status_code != 200:
                print(f"API Error: {response.status_code} - {response.text}")
                return self._get_fallback_questions(topic, num_questions)
            
            result = response.json()
            content = result["choices"][0]["message"]["content"]
            
            # Clean up response - remove markdown code blocks if present
            content = content.strip()
            if content.startswith("```json"):
                content = content[7:]
            elif content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            
            # Parse JSON
            try:
                questions = json.loads(content)
            except json.JSONDecodeError:
                # Try to extract JSON array from response
                start_idx = content.find('[')
                end_idx = content.rfind(']') + 1
                if start_idx != -1 and end_idx > start_idx:
                    questions = json.loads(content[start_idx:end_idx])
                else:
                    raise
            
            # Validate and add metadata
            valid_questions = []
            for i, q in enumerate(questions):
                if isinstance(q, dict) and "question" in q and "options" in q:
                    q["id"] = i + 1
                    q["topic"] = topic
                    q["difficulty"] = difficulty
                    
                    # Ensure correct_answer exists
                    if "correct_answer" not in q:
                        q["correct_answer"] = "A"
                    
                    # Ensure explanation exists
                    if "explanation" not in q:
                        q["explanation"] = "No explanation provided."
                    
                    valid_questions.append(q)
            
            if len(valid_questions) == 0:
                print("No valid questions generated, using fallback")
                return self._get_fallback_questions(topic, num_questions)
            
            return valid_questions[:num_questions]
            
        except Exception as e:
            print(f"Error generating questions: {e}")
            import traceback
            traceback.print_exc()
            return self._get_fallback_questions(topic, num_questions)
    
    def _get_fallback_questions(self, topic: str, num_questions: int) -> List[Dict]:
        """Fallback questions if API fails"""
        fallback_templates = [
            {
                "question": f"What is the main concept of {topic}?",
                "options": {
                    "A": f"Understanding the fundamentals of {topic}",
                    "B": f"Advanced applications of {topic}",
                    "C": f"Historical context of {topic}",
                    "D": f"Future trends in {topic}"
                },
                "correct_answer": "A",
                "explanation": f"The main concept focuses on understanding the fundamentals of {topic}."
            },
            {
                "question": f"Which of the following best describes {topic}?",
                "options": {
                    "A": "A theoretical framework",
                    "B": "A practical methodology",
                    "C": "A comprehensive approach",
                    "D": "All of the above"
                },
                "correct_answer": "D",
                "explanation": f"{topic} encompasses theoretical, practical, and comprehensive aspects."
            },
            {
                "question": f"What is an important application of {topic}?",
                "options": {
                    "A": "Real-world problem solving",
                    "B": "Academic research",
                    "C": "Industry implementation",
                    "D": "All of the above"
                },
                "correct_answer": "D",
                "explanation": f"{topic} has applications across various domains."
            },
            {
                "question": f"Which skill is most important when studying {topic}?",
                "options": {
                    "A": "Critical thinking",
                    "B": "Memorization",
                    "C": "Pattern recognition",
                    "D": "Creative application"
                },
                "correct_answer": "A",
                "explanation": "Critical thinking helps in deep understanding of any subject."
            },
            {
                "question": f"How can you best learn {topic}?",
                "options": {
                    "A": "Practice and application",
                    "B": "Reading only",
                    "C": "Watching videos only",
                    "D": "Listening to lectures only"
                },
                "correct_answer": "A",
                "explanation": "Active practice and application lead to better understanding."
            }
        ]
        
        selected_questions = []
        for i in range(min(num_questions, len(fallback_templates))):
            q = fallback_templates[i].copy()
            q["id"] = i + 1
            q["topic"] = topic
            q["difficulty"] = "medium"
            selected_questions.append(q)
        
        # If we need more questions, repeat with variations
        while len(selected_questions) < num_questions:
            idx = len(selected_questions)
            template_idx = idx % len(fallback_templates)
            q = fallback_templates[template_idx].copy()
            q["id"] = idx + 1
            q["topic"] = topic
            q["difficulty"] = "medium"
            selected_questions.append(q)
        
        return selected_questions[:num_questions]
    
    def generate_from_documents(
        self,
        rag_engine,
        topic: Optional[str] = None,
        num_questions: int = 5,
        difficulty: str = "medium"
    ) -> List[Dict]:
        """Generate questions from uploaded documents"""
        
        try:
            if topic:
                # Get relevant content for topic
                query = f"Explain {topic} in detail with key concepts and examples"
                answer, sources, confidence = rag_engine.query(query, "student")
                
                if confidence > 0.3 and answer:
                    content = answer
                else:
                    # Use source documents directly if answer confidence is low
                    content = f"Study material about {topic}. Generate questions that test understanding of key concepts."
            else:
                # Get general content from documents
                query = "Summarize the main topics and key concepts from the study materials"
                answer, sources, confidence = rag_engine.query(query, "student")
                
                if confidence > 0.3 and answer:
                    content = answer
                    # Try to extract topic from answer
                    topic = "Study Materials"
                else:
                    content = "General study materials covering various topics"
                    topic = "General Topics"
            
            return self.generate_questions(
                topic or "General Topics",
                content,
                num_questions,
                difficulty
            )
            
        except Exception as e:
            print(f"Error generating questions from documents: {e}")
            import traceback
            traceback.print_exc()
            return self._get_fallback_questions(topic or "General Topics", num_questions)


# Global instance
practice_generator = PracticeGenerator()
