"""
Context-aware dialogue management system for golf recommendations.
Maintains conversation history, user patterns, and round context.
"""

from typing import List, Dict, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import json
import uuid
from enum import Enum
import numpy as np
from collections import defaultdict, deque


class ShotOutcome(Enum):
    """Possible outcomes for a golf shot"""
    EXCELLENT = "excellent"
    GOOD = "good"
    AVERAGE = "average"
    POOR = "poor"
    MISSED = "missed"


@dataclass
class ShotContext:
    """Represents context for a single golf shot"""
    hole_number: int
    shot_number: int
    distance_to_pin: float
    club_used: Optional[str] = None
    conditions: Dict[str, Any] = None
    hazards: List[str] = None
    recommended_club: Optional[str] = None
    outcome: Optional[ShotOutcome] = None
    user_feedback: Optional[str] = None
    timestamp: datetime = None

    def __post_init__(self):
        if self.conditions is None:
            self.conditions = {}
        if self.hazards is None:
            self.hazards = []
        if self.timestamp is None:
            self.timestamp = datetime.now()


@dataclass
class UserPattern:
    """Tracks user-specific patterns and preferences"""
    user_id: str
    preferred_clubs: Dict[str, float]  # distance -> club preference scores
    typical_distances: Dict[str, float]  # club -> typical distance
    accuracy_patterns: Dict[str, List[float]]  # club -> accuracy scores
    condition_adjustments: Dict[str, float]  # condition -> typical adjustment
    speaking_patterns: Dict[str, int]  # phrase -> frequency
    handicap: Optional[float] = None
    last_updated: datetime = None

    def __post_init__(self):
        if self.last_updated is None:
            self.last_updated = datetime.now()


@dataclass
class RoundContext:
    """Context for an entire golf round"""
    round_id: str
    user_id: str
    course_name: Optional[str] = None
    date: datetime = None
    shots: List[ShotContext] = None
    current_hole: int = 1
    current_shot: int = 1
    weather_conditions: Dict[str, Any] = None
    course_conditions: Dict[str, Any] = None

    def __post_init__(self):
        if self.date is None:
            self.date = datetime.now()
        if self.shots is None:
            self.shots = []
        if self.weather_conditions is None:
            self.weather_conditions = {}
        if self.course_conditions is None:
            self.course_conditions = {}


class DialogueContextManager:
    """Manages conversation context and user patterns"""

    def __init__(self, memory_window: int = 10):
        self.memory_window = memory_window
        self.conversation_history: deque = deque(maxlen=memory_window)
        self.current_round: Optional[RoundContext] = None
        self.user_patterns: Dict[str, UserPattern] = {}
        self.active_sessions: Dict[str, str] = {}  # session_id -> user_id

    def start_round(self, user_id: str, course_name: Optional[str] = None,
                   weather_conditions: Optional[Dict] = None) -> str:
        """Start a new golf round"""
        round_id = str(uuid.uuid4())
        self.current_round = RoundContext(
            round_id=round_id,
            user_id=user_id,
            course_name=course_name,
            weather_conditions=weather_conditions or {}
        )

        # Initialize user patterns if not exists
        if user_id not in self.user_patterns:
            self.user_patterns[user_id] = UserPattern(
                user_id=user_id,
                preferred_clubs={},
                typical_distances={},
                accuracy_patterns=defaultdict(list),
                condition_adjustments={},
                speaking_patterns=defaultdict(int)
            )

        return round_id

    def add_shot_context(self, distance_to_pin: float, conditions: Dict[str, Any] = None,
                        hazards: List[str] = None) -> ShotContext:
        """Add context for a new shot"""
        if not self.current_round:
            raise ValueError("No active round. Start a round first.")

        shot = ShotContext(
            hole_number=self.current_round.current_hole,
            shot_number=self.current_round.current_shot,
            distance_to_pin=distance_to_pin,
            conditions=conditions or {},
            hazards=hazards or []
        )

        self.current_round.shots.append(shot)
        return shot

    def add_user_message(self, user_id: str, message: str, extracted_entities: Dict = None):
        """Add user message to conversation history"""
        conversation_entry = {
            "timestamp": datetime.now(),
            "user_id": user_id,
            "type": "user",
            "message": message,
            "entities": extracted_entities or {}
        }

        self.conversation_history.append(conversation_entry)
        self._update_speaking_patterns(user_id, message)

    def add_assistant_message(self, message: str, recommendation_data: Dict = None):
        """Add assistant message to conversation history"""
        conversation_entry = {
            "timestamp": datetime.now(),
            "type": "assistant",
            "message": message,
            "recommendation_data": recommendation_data or {}
        }

        self.conversation_history.append(conversation_entry)

    def record_shot_outcome(self, club_used: str, outcome: ShotOutcome,
                           user_feedback: Optional[str] = None):
        """Record the outcome of a shot"""
        if not self.current_round or not self.current_round.shots:
            return

        # Update the most recent shot
        current_shot = self.current_round.shots[-1]
        current_shot.club_used = club_used
        current_shot.outcome = outcome
        current_shot.user_feedback = user_feedback

        # Update user patterns
        self._update_user_patterns(current_shot)

        # Move to next shot
        self.current_round.current_shot += 1

    def get_recommendation_context(self) -> Dict[str, Any]:
        """Get current context for making recommendations"""
        context = {
            "conversation_history": list(self.conversation_history),
            "current_round": asdict(self.current_round) if self.current_round else None,
            "user_patterns": None,
            "similar_situations": []
        }

        if self.current_round and self.current_round.user_id in self.user_patterns:
            user_patterns = self.user_patterns[self.current_round.user_id]
            context["user_patterns"] = asdict(user_patterns)

            # Find similar past situations
            context["similar_situations"] = self._find_similar_situations()

        return context

    def get_user_preferences(self, user_id: str, distance: float) -> Dict[str, float]:
        """Get user club preferences for a given distance"""
        if user_id not in self.user_patterns:
            return {}

        patterns = self.user_patterns[user_id]

        # Find clubs typically used for similar distances
        relevant_preferences = {}
        for dist_str, club_scores in patterns.preferred_clubs.items():
            try:
                pattern_distance = float(dist_str)
                if abs(pattern_distance - distance) <= 25:  # Within 25 yards
                    for club, score in club_scores.items():
                        if club not in relevant_preferences:
                            relevant_preferences[club] = []
                        relevant_preferences[club].append(score)
            except ValueError:
                continue

        # Average scores for each club
        averaged_preferences = {}
        for club, scores in relevant_preferences.items():
            averaged_preferences[club] = np.mean(scores)

        return averaged_preferences

    def predict_user_needs(self) -> List[str]:
        """Predict what the user might need based on context"""
        predictions = []

        if not self.current_round:
            predictions.append("Start a new round")
            return predictions

        # Analyze current situation
        if self.current_round.shots:
            last_shot = self.current_round.shots[-1]

            # Predict based on distance
            if last_shot.distance_to_pin > 150:
                predictions.append("Long approach shot advice")
            elif last_shot.distance_to_pin < 30:
                predictions.append("Short game technique")

            # Predict based on hazards
            if "water" in last_shot.hazards:
                predictions.append("Safe play strategy")
            if "bunker" in last_shot.hazards:
                predictions.append("Bunker avoidance")

        # Predict based on conversation history
        recent_topics = self._analyze_recent_topics()
        if "wind" in recent_topics:
            predictions.append("Wind adjustment advice")
        if "accuracy" in recent_topics:
            predictions.append("Accuracy improvement tips")

        return predictions

    def _update_speaking_patterns(self, user_id: str, message: str):
        """Update user speaking pattern analysis"""
        if user_id not in self.user_patterns:
            return

        patterns = self.user_patterns[user_id]

        # Extract common phrases and terms
        words = message.lower().split()
        for i in range(len(words)):
            # Single words
            patterns.speaking_patterns[words[i]] += 1

            # Bigrams
            if i < len(words) - 1:
                bigram = f"{words[i]} {words[i+1]}"
                patterns.speaking_patterns[bigram] += 1

        patterns.last_updated = datetime.now()

    def _update_user_patterns(self, shot: ShotContext):
        """Update user patterns based on shot outcome"""
        if not self.current_round:
            return

        user_id = self.current_round.user_id
        patterns = self.user_patterns[user_id]

        # Update club preferences based on outcome
        distance_key = str(int(shot.distance_to_pin))
        if distance_key not in patterns.preferred_clubs:
            patterns.preferred_clubs[distance_key] = {}

        club = shot.club_used
        if club and club not in patterns.preferred_clubs[distance_key]:
            patterns.preferred_clubs[distance_key][club] = 0.5

        # Adjust preference based on outcome
        if shot.outcome in [ShotOutcome.EXCELLENT, ShotOutcome.GOOD]:
            patterns.preferred_clubs[distance_key][club] += 0.2
        elif shot.outcome in [ShotOutcome.POOR, ShotOutcome.MISSED]:
            patterns.preferred_clubs[distance_key][club] -= 0.1

        # Cap preferences between 0 and 1
        patterns.preferred_clubs[distance_key][club] = max(0, min(1,
            patterns.preferred_clubs[distance_key][club]))

        # Update typical distances
        if club:
            if club not in patterns.typical_distances:
                patterns.typical_distances[club] = []
            patterns.typical_distances[club].append(shot.distance_to_pin)

            # Keep only recent distances (last 20 shots)
            patterns.typical_distances[club] = patterns.typical_distances[club][-20:]

        # Update accuracy patterns
        if shot.outcome and club:
            outcome_score = self._outcome_to_score(shot.outcome)
            patterns.accuracy_patterns[club].append(outcome_score)
            patterns.accuracy_patterns[club] = patterns.accuracy_patterns[club][-20:]

        patterns.last_updated = datetime.now()

    def _outcome_to_score(self, outcome: ShotOutcome) -> float:
        """Convert shot outcome to numeric score"""
        score_map = {
            ShotOutcome.EXCELLENT: 1.0,
            ShotOutcome.GOOD: 0.8,
            ShotOutcome.AVERAGE: 0.6,
            ShotOutcome.POOR: 0.3,
            ShotOutcome.MISSED: 0.0
        }
        return score_map.get(outcome, 0.5)

    def _find_similar_situations(self, limit: int = 3) -> List[Dict]:
        """Find similar past situations for context"""
        if not self.current_round or not self.current_round.shots:
            return []

        current_shot = self.current_round.shots[-1]
        similar_situations = []

        # Search through all past shots in current round
        for shot in self.current_round.shots[:-1]:  # Exclude current shot
            similarity_score = self._calculate_situation_similarity(current_shot, shot)
            if similarity_score > 0.5:  # Threshold for similarity
                similar_situations.append({
                    "shot": asdict(shot),
                    "similarity_score": similarity_score
                })

        # Sort by similarity and return top matches
        similar_situations.sort(key=lambda x: x["similarity_score"], reverse=True)
        return similar_situations[:limit]

    def _calculate_situation_similarity(self, shot1: ShotContext, shot2: ShotContext) -> float:
        """Calculate similarity between two shots"""
        similarity = 0.0
        factors = 0

        # Distance similarity
        distance_diff = abs(shot1.distance_to_pin - shot2.distance_to_pin)
        distance_similarity = max(0, 1 - distance_diff / 100)  # Normalize by 100 yards
        similarity += distance_similarity
        factors += 1

        # Hazard similarity
        common_hazards = set(shot1.hazards) & set(shot2.hazards)
        hazard_similarity = len(common_hazards) / max(1, max(len(shot1.hazards), len(shot2.hazards)))
        similarity += hazard_similarity
        factors += 1

        # Condition similarity (basic implementation)
        if shot1.conditions and shot2.conditions:
            # Simple overlap check
            common_conditions = set(shot1.conditions.keys()) & set(shot2.conditions.keys())
            if common_conditions:
                condition_similarity = len(common_conditions) / max(len(shot1.conditions), len(shot2.conditions))
                similarity += condition_similarity
                factors += 1

        return similarity / factors if factors > 0 else 0.0

    def _analyze_recent_topics(self) -> List[str]:
        """Analyze recent conversation topics"""
        topics = []
        recent_messages = list(self.conversation_history)[-5:]  # Last 5 messages

        for entry in recent_messages:
            message = entry.get("message", "").lower()
            entities = entry.get("entities", {})

            # Extract topics from entities
            for entity_type, entity_list in entities.items():
                topics.extend([entity.lower() for entity in entity_list])

            # Extract topics from message text
            golf_topics = ["wind", "accuracy", "distance", "club", "green", "hazard"]
            for topic in golf_topics:
                if topic in message:
                    topics.append(topic)

        return list(set(topics))

    def save_session(self, filepath: str):
        """Save current session data"""
        session_data = {
            "conversation_history": [
                {**entry, "timestamp": entry["timestamp"].isoformat()}
                for entry in self.conversation_history
            ],
            "current_round": None,
            "user_patterns": {}
        }

        if self.current_round:
            round_data = asdict(self.current_round)
            # Convert datetime objects to ISO format
            round_data["date"] = self.current_round.date.isoformat()
            for shot in round_data["shots"]:
                shot["timestamp"] = shot["timestamp"].isoformat() if shot["timestamp"] else None
            session_data["current_round"] = round_data

        # Convert user patterns
        for user_id, patterns in self.user_patterns.items():
            pattern_data = asdict(patterns)
            pattern_data["last_updated"] = patterns.last_updated.isoformat()
            session_data["user_patterns"][user_id] = pattern_data

        with open(filepath, 'w') as f:
            json.dump(session_data, f, indent=2)

    def load_session(self, filepath: str):
        """Load session data from file"""
        with open(filepath, 'r') as f:
            session_data = json.load(f)

        # Load conversation history
        self.conversation_history.clear()
        for entry in session_data.get("conversation_history", []):
            entry["timestamp"] = datetime.fromisoformat(entry["timestamp"])
            self.conversation_history.append(entry)

        # Load current round
        if session_data.get("current_round"):
            round_data = session_data["current_round"]
            round_data["date"] = datetime.fromisoformat(round_data["date"])

            # Convert shots
            shots = []
            for shot_data in round_data.get("shots", []):
                if shot_data["timestamp"]:
                    shot_data["timestamp"] = datetime.fromisoformat(shot_data["timestamp"])
                if shot_data["outcome"]:
                    shot_data["outcome"] = ShotOutcome(shot_data["outcome"])
                shots.append(ShotContext(**shot_data))

            round_data["shots"] = shots
            self.current_round = RoundContext(**round_data)

        # Load user patterns
        self.user_patterns = {}
        for user_id, pattern_data in session_data.get("user_patterns", {}).items():
            pattern_data["last_updated"] = datetime.fromisoformat(pattern_data["last_updated"])
            self.user_patterns[user_id] = UserPattern(**pattern_data)