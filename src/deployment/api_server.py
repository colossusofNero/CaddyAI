"""
FastAPI server for deploying golf AI models as REST API endpoints.
Provides endpoints for NER, dialogue management, and recommendations.
"""

import asyncio
import time
import uuid
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
import uvicorn

from ..models.golf_ner import GolfEntityExtractor
from ..dialogue.context_manager import DialogueContextManager, ShotContext
from ..prediction.smart_defaults import SmartDefaultsEngine
from ..training.continuous_learning import ContinuousLearningPipeline, FeedbackData


# Pydantic models for API requests/responses
class NERRequest(BaseModel):
    text: str = Field(..., description="Text to analyze for golf entities")
    user_id: Optional[str] = None


class NERResponse(BaseModel):
    entities: Dict[str, List[str]] = Field(..., description="Extracted golf entities")
    processing_time: float = Field(..., description="Processing time in seconds")


class RecommendationRequest(BaseModel):
    user_id: str = Field(..., description="User identifier")
    distance: float = Field(..., description="Distance to target in yards")
    conditions: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Playing conditions")
    hazards: Optional[List[str]] = Field(default_factory=list, description="Nearby hazards")
    user_message: Optional[str] = Field(None, description="User's natural language input")


class RecommendationResponse(BaseModel):
    recommended_club: str = Field(..., description="Recommended golf club")
    confidence: float = Field(..., description="Confidence score 0-1")
    explanation: str = Field(..., description="Human-readable explanation")
    adjustments: Dict[str, Any] = Field(..., description="Environmental adjustments")
    alternatives: List[str] = Field(..., description="Alternative club options")
    processing_time: float = Field(..., description="Processing time in seconds")


class ContextRequest(BaseModel):
    user_id: str = Field(..., description="User identifier")
    course_name: Optional[str] = None
    weather_conditions: Optional[Dict[str, Any]] = None


class FeedbackRequest(BaseModel):
    user_id: str = Field(..., description="User identifier")
    session_id: str = Field(..., description="Session identifier")
    feedback_type: str = Field(..., description="Type of feedback: 'recommendation', 'prediction', 'entity_recognition'")
    original_input: str = Field(..., description="Original user input")
    model_output: Any = Field(..., description="Model's output")
    user_feedback: str = Field(..., description="User feedback: 'correct', 'incorrect', 'excellent', 'good', 'poor', etc.")
    corrected_output: Optional[Any] = None
    context: Optional[Dict[str, Any]] = None


class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    version: str
    models_loaded: Dict[str, bool]
    uptime_seconds: float


# FastAPI app setup
app = FastAPI(
    title="Golf AI API",
    description="Machine learning enhanced golf recommendation system",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Global variables for models and services
entity_extractor: Optional[GolfEntityExtractor] = None
context_manager: DialogueContextManager = DialogueContextManager()
defaults_engine: SmartDefaultsEngine = SmartDefaultsEngine()
continuous_learning: Optional[ContinuousLearningPipeline] = None

# Server startup time for uptime calculation
server_start_time = time.time()

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Dependency for authentication (placeholder)
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify API token (placeholder implementation)"""
    # In production, implement proper JWT validation
    if not credentials.token:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    return credentials.token


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize models and services on startup"""
    global entity_extractor, continuous_learning

    logger.info("Starting Golf AI API server...")

    try:
        # Load NER model
        logger.info("Loading NER model...")
        entity_extractor = GolfEntityExtractor()
        # Note: In production, load from saved model path
        # entity_extractor = GolfEntityExtractor("./models/trained/golf_ner_model")

        # Initialize continuous learning
        logger.info("Starting continuous learning pipeline...")
        continuous_learning = ContinuousLearningPipeline()
        continuous_learning.start_continuous_learning()

        logger.info("Golf AI API server startup complete")

    except Exception as e:
        logger.error(f"Error during startup: {e}")
        raise


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Golf AI API server...")

    if continuous_learning:
        continuous_learning.stop_continuous_learning()

    logger.info("Golf AI API server shutdown complete")


# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    uptime = time.time() - server_start_time

    models_loaded = {
        "entity_extractor": entity_extractor is not None,
        "context_manager": context_manager is not None,
        "defaults_engine": defaults_engine is not None,
        "continuous_learning": continuous_learning is not None and continuous_learning.is_running
    }

    return HealthResponse(
        status="healthy" if all(models_loaded.values()) else "partial",
        timestamp=datetime.now(),
        version="1.0.0",
        models_loaded=models_loaded,
        uptime_seconds=uptime
    )


# NER endpoint
@app.post("/api/v1/extract-entities", response_model=NERResponse)
async def extract_entities(request: NERRequest, token: str = Depends(verify_token)):
    """Extract golf entities from natural language text"""
    start_time = time.time()

    try:
        if not entity_extractor:
            raise HTTPException(status_code=503, detail="NER model not available")

        # Extract entities
        entities = entity_extractor.extract_entities(request.text)

        # Add to conversation context if user_id provided
        if request.user_id:
            context_manager.add_user_message(request.user_id, request.text, entities)

        processing_time = time.time() - start_time

        return NERResponse(
            entities=entities,
            processing_time=processing_time
        )

    except Exception as e:
        logger.error(f"Error in entity extraction: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Recommendation endpoint
@app.post("/api/v1/recommend", response_model=RecommendationResponse)
async def get_recommendation(request: RecommendationRequest, token: str = Depends(verify_token)):
    """Get golf club recommendation with environmental adjustments"""
    start_time = time.time()

    try:
        # Extract entities from user message if provided
        extracted_entities = {}
        if request.user_message and entity_extractor:
            extracted_entities = entity_extractor.extract_entities(request.user_message)

        # Add shot context
        shot_context = context_manager.add_shot_context(
            distance_to_pin=request.distance,
            conditions=request.conditions,
            hazards=request.hazards
        )

        # Get environmental predictions
        latitude = request.conditions.get("latitude", 40.0)
        longitude = request.conditions.get("longitude", -95.0)
        course_name = request.conditions.get("course_name")

        conditions_prediction = defaults_engine.predict_conditions(
            latitude, longitude, course_name
        )

        # Get basic club recommendation (simplified logic)
        recommended_club = _get_basic_club_recommendation(request.distance)

        # Apply environmental adjustments
        env_factors = conditions_prediction.get("environmental_factors")
        if env_factors:
            adjustment_result = defaults_engine.auto_adjust_for_conditions(
                request.distance, recommended_club, env_factors
            )
            recommended_club = adjustment_result["recommended_club"]
            adjustments = adjustment_result["adjustment_breakdown"]
            confidence = adjustment_result["confidence_level"]
        else:
            adjustments = {}
            confidence = 0.8

        # Generate explanation
        explanation = _generate_recommendation_explanation(
            recommended_club, request.distance, request.conditions, adjustments
        )

        # Get alternative clubs
        alternatives = _get_alternative_clubs(recommended_club)

        # Add to conversation context
        context_manager.add_assistant_message(
            explanation,
            {"club": recommended_club, "distance": request.distance, "adjustments": adjustments}
        )

        processing_time = time.time() - start_time

        return RecommendationResponse(
            recommended_club=recommended_club,
            confidence=confidence,
            explanation=explanation,
            adjustments=adjustments,
            alternatives=alternatives,
            processing_time=processing_time
        )

    except Exception as e:
        logger.error(f"Error in recommendation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Context management endpoint
@app.post("/api/v1/start-round")
async def start_round(request: ContextRequest, token: str = Depends(verify_token)):
    """Start a new golf round context"""
    try:
        round_id = context_manager.start_round(
            request.user_id,
            request.course_name,
            request.weather_conditions
        )

        return {"round_id": round_id, "status": "started"}

    except Exception as e:
        logger.error(f"Error starting round: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Feedback endpoint
@app.post("/api/v1/feedback")
async def submit_feedback(request: FeedbackRequest, background_tasks: BackgroundTasks,
                         token: str = Depends(verify_token)):
    """Submit feedback for continuous learning"""
    try:
        feedback = FeedbackData(
            user_id=request.user_id,
            session_id=request.session_id,
            timestamp=datetime.now(),
            feedback_type=request.feedback_type,
            original_input=request.original_input,
            model_output=request.model_output,
            user_feedback=request.user_feedback,
            corrected_output=request.corrected_output,
            context=request.context
        )

        # Submit feedback to continuous learning pipeline
        if continuous_learning:
            background_tasks.add_task(continuous_learning.collect_feedback, feedback)

        return {"status": "feedback_received", "feedback_id": str(uuid.uuid4())}

    except Exception as e:
        logger.error(f"Error submitting feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Model status endpoint
@app.get("/api/v1/status")
async def get_model_status(token: str = Depends(verify_token)):
    """Get current model status and performance metrics"""
    try:
        status = {
            "models": {
                "ner_model": {"loaded": entity_extractor is not None, "type": "distilbert-based"},
                "context_manager": {"active": True, "conversation_history_size": len(context_manager.conversation_history)},
                "defaults_engine": {"loaded": True, "type": "rule-based-with-ml"},
            },
            "continuous_learning": continuous_learning.get_learning_status() if continuous_learning else None,
            "server_uptime": time.time() - server_start_time
        }

        return status

    except Exception as e:
        logger.error(f"Error getting status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Prediction defaults endpoint
@app.get("/api/v1/predict-conditions")
async def predict_conditions(latitude: float, longitude: float, course_name: Optional[str] = None,
                           token: str = Depends(verify_token)):
    """Predict playing conditions for a location"""
    try:
        conditions = defaults_engine.predict_conditions(latitude, longitude, course_name)
        return conditions

    except Exception as e:
        logger.error(f"Error predicting conditions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Hazard patterns endpoint
@app.get("/api/v1/hazard-patterns")
async def get_hazard_patterns(course_name: str, hole_number: Optional[int] = None,
                            token: str = Depends(verify_token)):
    """Get predicted hazard patterns for a course/hole"""
    try:
        hazards = defaults_engine.predict_hazard_patterns(course_name, hole_number)
        return {"course_name": course_name, "hole_number": hole_number, "hazards": hazards}

    except Exception as e:
        logger.error(f"Error getting hazard patterns: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Metrics endpoint
@app.get("/api/v1/metrics")
async def get_metrics(token: str = Depends(verify_token)):
    """Get system and model performance metrics"""
    try:
        metrics = {
            "api_metrics": {
                "uptime_seconds": time.time() - server_start_time,
                "requests_processed": 0,  # Would track in production
            },
            "model_metrics": continuous_learning.get_learning_status() if continuous_learning else {}
        }

        return metrics

    except Exception as e:
        logger.error(f"Error getting metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Utility functions
def _get_basic_club_recommendation(distance: float) -> str:
    """Get basic club recommendation based on distance"""
    if distance <= 30:
        return "lob wedge"
    elif distance <= 50:
        return "sand wedge"
    elif distance <= 80:
        return "gap wedge"
    elif distance <= 110:
        return "pitching wedge"
    elif distance <= 130:
        return "9-iron"
    elif distance <= 145:
        return "8-iron"
    elif distance <= 160:
        return "7-iron"
    elif distance <= 175:
        return "6-iron"
    elif distance <= 190:
        return "5-iron"
    elif distance <= 210:
        return "4-iron"
    elif distance <= 230:
        return "hybrid"
    elif distance <= 250:
        return "3-wood"
    else:
        return "driver"


def _generate_recommendation_explanation(club: str, distance: float, conditions: Dict, adjustments: Dict) -> str:
    """Generate human-readable explanation for recommendation"""
    explanation = f"For {distance} yards, I recommend your {club}."

    if adjustments:
        adj_parts = []
        if adjustments.get("temperature", 0) > 2:
            adj_parts.append("warm temperatures will add distance")
        elif adjustments.get("temperature", 0) < -2:
            adj_parts.append("cold temperatures will reduce distance")

        if adjustments.get("wind", 0) > 5:
            adj_parts.append("strong winds will affect ball flight")

        if adjustments.get("altitude", 0) > 5:
            adj_parts.append("high altitude will add distance")

        if adj_parts:
            explanation += f" Note that {', '.join(adj_parts)}."

    if conditions.get("hazards"):
        explanation += f" Watch out for {', '.join(conditions['hazards'])}."

    return explanation


def _get_alternative_clubs(primary_club: str) -> List[str]:
    """Get alternative club options"""
    club_progression = [
        "lob wedge", "sand wedge", "gap wedge", "pitching wedge",
        "9-iron", "8-iron", "7-iron", "6-iron", "5-iron", "4-iron",
        "3-iron", "hybrid", "5-wood", "3-wood", "driver"
    ]

    try:
        index = club_progression.index(primary_club)
        alternatives = []

        if index > 0:
            alternatives.append(club_progression[index - 1])
        if index < len(club_progression) - 1:
            alternatives.append(club_progression[index + 1])

        return alternatives

    except ValueError:
        return ["7-iron", "8-iron"]  # Default alternatives


# Main server runner
if __name__ == "__main__":
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )