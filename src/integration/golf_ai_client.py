"""
Client library for integrating golf AI models into existing systems.
Provides easy-to-use interface for NER, recommendations, and context management.
"""

import asyncio
import aiohttp
import requests
import json
from typing import Dict, List, Optional, Any, Union
from datetime import datetime
import logging
from dataclasses import dataclass, asdict
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class GolfRecommendation:
    """Golf recommendation response"""
    recommended_club: str
    confidence: float
    explanation: str
    adjustments: Dict[str, Any]
    alternatives: List[str]
    processing_time: float


@dataclass
class ExtractedEntities:
    """Extracted golf entities"""
    distances: List[str]
    clubs: List[str]
    hazards: List[str]
    conditions: List[str]
    targets: List[str]
    course_features: List[str]
    shot_types: List[str]
    directions: List[str]
    processing_time: float


@dataclass
class GolfConditions:
    """Golf playing conditions"""
    weather: Dict[str, Any]
    course_conditions: Dict[str, Any]
    environmental_factors: Optional[Dict[str, Any]]
    wind_patterns: Dict[str, Any]
    recommended_adjustments: List[str]


class GolfAIException(Exception):
    """Custom exception for Golf AI client errors"""
    pass


class GolfAIClient:
    """
    Client library for Golf AI services.
    Provides synchronous and asynchronous interfaces.
    """

    def __init__(self,
                 base_url: str = "http://localhost:8000",
                 api_key: Optional[str] = None,
                 timeout: int = 30):
        """
        Initialize Golf AI client

        Args:
            base_url: Base URL of the Golf AI API
            api_key: API authentication key
            timeout: Request timeout in seconds
        """
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.timeout = timeout
        self.session = None

        # Headers for requests
        self.headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'GolfAI-Client/1.0'
        }

        if api_key:
            self.headers['Authorization'] = f'Bearer {api_key}'

    def __enter__(self):
        """Context manager entry"""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        if self.session:
            self.session.close()

    @asynccontextmanager
    async def async_session(self):
        """Async context manager for HTTP session"""
        async with aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=self.timeout),
            headers=self.headers
        ) as session:
            yield session

    # Entity Extraction Methods
    def extract_entities(self, text: str, user_id: Optional[str] = None) -> ExtractedEntities:
        """
        Extract golf entities from natural language text

        Args:
            text: Input text to analyze
            user_id: Optional user identifier for context

        Returns:
            ExtractedEntities: Parsed entities with processing time

        Raises:
            GolfAIException: If the API request fails
        """
        endpoint = f"{self.base_url}/api/v1/extract-entities"

        payload = {
            "text": text,
            "user_id": user_id
        }

        try:
            response = requests.post(
                endpoint,
                json=payload,
                headers=self.headers,
                timeout=self.timeout
            )

            if response.status_code != 200:
                raise GolfAIException(f"API request failed: {response.status_code} - {response.text}")

            data = response.json()
            entities = data['entities']

            return ExtractedEntities(
                distances=entities.get('distances', []),
                clubs=entities.get('clubs', []),
                hazards=entities.get('hazards', []),
                conditions=entities.get('conditions', []),
                targets=entities.get('targets', []),
                course_features=entities.get('course_features', []),
                shot_types=entities.get('shot_types', []),
                directions=entities.get('directions', []),
                processing_time=data['processing_time']
            )

        except requests.RequestException as e:
            raise GolfAIException(f"Network error: {e}")

    async def extract_entities_async(self, text: str, user_id: Optional[str] = None) -> ExtractedEntities:
        """Async version of extract_entities"""
        endpoint = f"{self.base_url}/api/v1/extract-entities"

        payload = {
            "text": text,
            "user_id": user_id
        }

        async with self.async_session() as session:
            try:
                async with session.post(endpoint, json=payload) as response:
                    if response.status != 200:
                        text = await response.text()
                        raise GolfAIException(f"API request failed: {response.status} - {text}")

                    data = await response.json()
                    entities = data['entities']

                    return ExtractedEntities(
                        distances=entities.get('distances', []),
                        clubs=entities.get('clubs', []),
                        hazards=entities.get('hazards', []),
                        conditions=entities.get('conditions', []),
                        targets=entities.get('targets', []),
                        course_features=entities.get('course_features', []),
                        shot_types=entities.get('shot_types', []),
                        directions=entities.get('directions', []),
                        processing_time=data['processing_time']
                    )

            except aiohttp.ClientError as e:
                raise GolfAIException(f"Network error: {e}")

    # Recommendation Methods
    def get_recommendation(self,
                         user_id: str,
                         distance: float,
                         conditions: Optional[Dict[str, Any]] = None,
                         hazards: Optional[List[str]] = None,
                         user_message: Optional[str] = None) -> GolfRecommendation:
        """
        Get golf club recommendation

        Args:
            user_id: User identifier
            distance: Distance to target in yards
            conditions: Playing conditions (weather, course, etc.)
            hazards: List of nearby hazards
            user_message: Natural language input from user

        Returns:
            GolfRecommendation: Club recommendation with explanation

        Raises:
            GolfAIException: If the API request fails
        """
        endpoint = f"{self.base_url}/api/v1/recommend"

        payload = {
            "user_id": user_id,
            "distance": distance,
            "conditions": conditions or {},
            "hazards": hazards or [],
            "user_message": user_message
        }

        try:
            response = requests.post(
                endpoint,
                json=payload,
                headers=self.headers,
                timeout=self.timeout
            )

            if response.status_code != 200:
                raise GolfAIException(f"API request failed: {response.status_code} - {response.text}")

            data = response.json()

            return GolfRecommendation(
                recommended_club=data['recommended_club'],
                confidence=data['confidence'],
                explanation=data['explanation'],
                adjustments=data['adjustments'],
                alternatives=data['alternatives'],
                processing_time=data['processing_time']
            )

        except requests.RequestException as e:
            raise GolfAIException(f"Network error: {e}")

    async def get_recommendation_async(self,
                                     user_id: str,
                                     distance: float,
                                     conditions: Optional[Dict[str, Any]] = None,
                                     hazards: Optional[List[str]] = None,
                                     user_message: Optional[str] = None) -> GolfRecommendation:
        """Async version of get_recommendation"""
        endpoint = f"{self.base_url}/api/v1/recommend"

        payload = {
            "user_id": user_id,
            "distance": distance,
            "conditions": conditions or {},
            "hazards": hazards or [],
            "user_message": user_message
        }

        async with self.async_session() as session:
            try:
                async with session.post(endpoint, json=payload) as response:
                    if response.status != 200:
                        text = await response.text()
                        raise GolfAIException(f"API request failed: {response.status} - {text}")

                    data = await response.json()

                    return GolfRecommendation(
                        recommended_club=data['recommended_club'],
                        confidence=data['confidence'],
                        explanation=data['explanation'],
                        adjustments=data['adjustments'],
                        alternatives=data['alternatives'],
                        processing_time=data['processing_time']
                    )

            except aiohttp.ClientError as e:
                raise GolfAIException(f"Network error: {e}")

    # Context Management Methods
    def start_round(self,
                   user_id: str,
                   course_name: Optional[str] = None,
                   weather_conditions: Optional[Dict[str, Any]] = None) -> str:
        """
        Start a new golf round context

        Args:
            user_id: User identifier
            course_name: Name of the golf course
            weather_conditions: Current weather conditions

        Returns:
            str: Round ID for context tracking

        Raises:
            GolfAIException: If the API request fails
        """
        endpoint = f"{self.base_url}/api/v1/start-round"

        payload = {
            "user_id": user_id,
            "course_name": course_name,
            "weather_conditions": weather_conditions
        }

        try:
            response = requests.post(
                endpoint,
                json=payload,
                headers=self.headers,
                timeout=self.timeout
            )

            if response.status_code != 200:
                raise GolfAIException(f"API request failed: {response.status_code} - {response.text}")

            return response.json()['round_id']

        except requests.RequestException as e:
            raise GolfAIException(f"Network error: {e}")

    # Condition Prediction Methods
    def predict_conditions(self,
                         latitude: float,
                         longitude: float,
                         course_name: Optional[str] = None) -> GolfConditions:
        """
        Predict playing conditions for a location

        Args:
            latitude: Course latitude
            longitude: Course longitude
            course_name: Optional course name for specific data

        Returns:
            GolfConditions: Predicted conditions and adjustments

        Raises:
            GolfAIException: If the API request fails
        """
        endpoint = f"{self.base_url}/api/v1/predict-conditions"

        params = {
            "latitude": latitude,
            "longitude": longitude
        }

        if course_name:
            params["course_name"] = course_name

        try:
            response = requests.get(
                endpoint,
                params=params,
                headers=self.headers,
                timeout=self.timeout
            )

            if response.status_code != 200:
                raise GolfAIException(f"API request failed: {response.status_code} - {response.text}")

            data = response.json()

            return GolfConditions(
                weather=data.get('weather', {}),
                course_conditions=data.get('course_conditions', {}),
                environmental_factors=data.get('environmental_factors'),
                wind_patterns=data.get('wind_patterns', {}),
                recommended_adjustments=data.get('recommended_adjustments', [])
            )

        except requests.RequestException as e:
            raise GolfAIException(f"Network error: {e}")

    def get_hazard_patterns(self,
                          course_name: str,
                          hole_number: Optional[int] = None) -> Dict[str, Any]:
        """
        Get predicted hazard patterns for a course/hole

        Args:
            course_name: Name of the golf course
            hole_number: Optional specific hole number

        Returns:
            Dict: Hazard patterns and information

        Raises:
            GolfAIException: If the API request fails
        """
        endpoint = f"{self.base_url}/api/v1/hazard-patterns"

        params = {"course_name": course_name}
        if hole_number is not None:
            params["hole_number"] = hole_number

        try:
            response = requests.get(
                endpoint,
                params=params,
                headers=self.headers,
                timeout=self.timeout
            )

            if response.status_code != 200:
                raise GolfAIException(f"API request failed: {response.status_code} - {response.text}")

            return response.json()

        except requests.RequestException as e:
            raise GolfAIException(f"Network error: {e}")

    # Feedback Methods
    def submit_feedback(self,
                       user_id: str,
                       session_id: str,
                       feedback_type: str,
                       original_input: str,
                       model_output: Any,
                       user_feedback: str,
                       corrected_output: Optional[Any] = None,
                       context: Optional[Dict[str, Any]] = None) -> str:
        """
        Submit feedback for continuous learning

        Args:
            user_id: User identifier
            session_id: Session identifier
            feedback_type: Type of feedback ('recommendation', 'prediction', 'entity_recognition')
            original_input: Original user input
            model_output: Model's output
            user_feedback: User's feedback ('correct', 'incorrect', 'excellent', 'good', 'poor', etc.)
            corrected_output: Optional corrected output
            context: Optional additional context

        Returns:
            str: Feedback ID

        Raises:
            GolfAIException: If the API request fails
        """
        endpoint = f"{self.base_url}/api/v1/feedback"

        payload = {
            "user_id": user_id,
            "session_id": session_id,
            "feedback_type": feedback_type,
            "original_input": original_input,
            "model_output": model_output,
            "user_feedback": user_feedback,
            "corrected_output": corrected_output,
            "context": context
        }

        try:
            response = requests.post(
                endpoint,
                json=payload,
                headers=self.headers,
                timeout=self.timeout
            )

            if response.status_code != 200:
                raise GolfAIException(f"API request failed: {response.status_code} - {response.text}")

            return response.json()['feedback_id']

        except requests.RequestException as e:
            raise GolfAIException(f"Network error: {e}")

    # Utility Methods
    def health_check(self) -> Dict[str, Any]:
        """
        Check API health status

        Returns:
            Dict: Health status information

        Raises:
            GolfAIException: If the health check fails
        """
        endpoint = f"{self.base_url}/health"

        try:
            response = requests.get(
                endpoint,
                headers=self.headers,
                timeout=self.timeout
            )

            if response.status_code != 200:
                raise GolfAIException(f"Health check failed: {response.status_code} - {response.text}")

            return response.json()

        except requests.RequestException as e:
            raise GolfAIException(f"Network error: {e}")

    def get_status(self) -> Dict[str, Any]:
        """
        Get current system status and performance metrics

        Returns:
            Dict: System status and metrics

        Raises:
            GolfAIException: If the status request fails
        """
        endpoint = f"{self.base_url}/api/v1/status"

        try:
            response = requests.get(
                endpoint,
                headers=self.headers,
                timeout=self.timeout
            )

            if response.status_code != 200:
                raise GolfAIException(f"Status request failed: {response.status_code} - {response.text}")

            return response.json()

        except requests.RequestException as e:
            raise GolfAIException(f"Network error: {e}")


# High-level helper class for common workflows
class GolfAssistant:
    """High-level golf assistant with common workflows"""

    def __init__(self, client: GolfAIClient):
        self.client = client

    def analyze_shot(self,
                    user_id: str,
                    user_input: str,
                    distance: Optional[float] = None,
                    conditions: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Analyze a golf shot request and provide comprehensive recommendation

        Args:
            user_id: User identifier
            user_input: Natural language input from user
            distance: Distance to target (optional, can be extracted from input)
            conditions: Playing conditions

        Returns:
            Dict: Comprehensive analysis with entities, recommendation, and explanation
        """

        # Extract entities from user input
        entities = self.client.extract_entities(user_input, user_id)

        # Determine distance if not provided
        if distance is None:
            if entities.distances:
                try:
                    distance = float(entities.distances[0])
                except ValueError:
                    distance = 150.0  # Default distance
            else:
                distance = 150.0

        # Get recommendation
        recommendation = self.client.get_recommendation(
            user_id=user_id,
            distance=distance,
            conditions=conditions,
            hazards=entities.hazards,
            user_message=user_input
        )

        return {
            "user_input": user_input,
            "extracted_entities": asdict(entities),
            "recommendation": asdict(recommendation),
            "analysis": {
                "identified_distance": distance,
                "identified_hazards": entities.hazards,
                "playing_conditions": conditions or {},
                "confidence_level": recommendation.confidence
            }
        }

    def complete_round_workflow(self,
                              user_id: str,
                              course_name: str,
                              latitude: float,
                              longitude: float) -> Dict[str, Any]:
        """
        Complete workflow for starting a round with condition prediction

        Args:
            user_id: User identifier
            course_name: Golf course name
            latitude: Course latitude
            longitude: Course longitude

        Returns:
            Dict: Round setup information with predictions
        """

        # Predict conditions
        conditions = self.client.predict_conditions(latitude, longitude, course_name)

        # Get hazard patterns
        hazards = self.client.get_hazard_patterns(course_name)

        # Start round context
        round_id = self.client.start_round(
            user_id,
            course_name,
            conditions.weather
        )

        return {
            "round_id": round_id,
            "course_name": course_name,
            "predicted_conditions": asdict(conditions),
            "hazard_patterns": hazards,
            "setup_complete": True,
            "timestamp": datetime.now().isoformat()
        }

    async def batch_analyze_shots(self,
                                user_id: str,
                                shot_requests: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Analyze multiple shots concurrently

        Args:
            user_id: User identifier
            shot_requests: List of shot analysis requests

        Returns:
            List[Dict]: List of shot analyses
        """

        tasks = []
        for request in shot_requests:
            task = self._analyze_shot_async(user_id, request)
            tasks.append(task)

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Handle exceptions
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed_results.append({
                    "error": str(result),
                    "request_index": i,
                    "success": False
                })
            else:
                result["success"] = True
                processed_results.append(result)

        return processed_results

    async def _analyze_shot_async(self, user_id: str, request: Dict[str, Any]) -> Dict[str, Any]:
        """Internal async shot analysis"""
        user_input = request.get("user_input", "")
        distance = request.get("distance")
        conditions = request.get("conditions")

        # Extract entities
        entities = await self.client.extract_entities_async(user_input, user_id)

        # Determine distance
        if distance is None:
            if entities.distances:
                try:
                    distance = float(entities.distances[0])
                except ValueError:
                    distance = 150.0
            else:
                distance = 150.0

        # Get recommendation
        recommendation = await self.client.get_recommendation_async(
            user_id=user_id,
            distance=distance,
            conditions=conditions,
            hazards=entities.hazards,
            user_message=user_input
        )

        return {
            "user_input": user_input,
            "extracted_entities": asdict(entities),
            "recommendation": asdict(recommendation),
            "analysis": {
                "identified_distance": distance,
                "identified_hazards": entities.hazards,
                "playing_conditions": conditions or {},
                "confidence_level": recommendation.confidence
            }
        }


# Example usage and testing
def main():
    """Example usage of the Golf AI client"""

    # Initialize client
    client = GolfAIClient(
        base_url="http://localhost:8000",
        api_key="your-api-key-here"
    )

    # Initialize high-level assistant
    assistant = GolfAssistant(client)

    try:
        # Health check
        health = client.health_check()
        print(f"API Health: {health['status']}")

        # Example 1: Simple entity extraction
        entities = client.extract_entities("I need to hit my 7-iron 150 yards to the pin")
        print(f"Extracted entities: {entities.clubs}, {entities.distances}")

        # Example 2: Get recommendation
        recommendation = client.get_recommendation(
            user_id="user123",
            distance=150.0,
            conditions={"wind_speed": 10, "temperature": 75},
            hazards=["water", "bunker"]
        )
        print(f"Recommended club: {recommendation.recommended_club}")
        print(f"Explanation: {recommendation.explanation}")

        # Example 3: Complete shot analysis
        analysis = assistant.analyze_shot(
            user_id="user123",
            user_input="I'm 140 yards from the pin with a headwind and water short",
            conditions={"wind_speed": 15, "wind_direction": "headwind", "temperature": 68}
        )
        print(f"Shot analysis: {analysis['recommendation']['recommended_club']}")

        # Example 4: Submit feedback
        feedback_id = client.submit_feedback(
            user_id="user123",
            session_id="session456",
            feedback_type="recommendation",
            original_input="I'm 140 yards out",
            model_output={"club": "7-iron"},
            user_feedback="excellent"
        )
        print(f"Feedback submitted: {feedback_id}")

    except GolfAIException as e:
        print(f"Golf AI Error: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")


if __name__ == "__main__":
    main()