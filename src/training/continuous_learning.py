"""
Continuous learning pipeline for golf AI models.
Implements online learning, model updates, and feedback integration.
"""

import os
import json
import pickle
import threading
import time
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from collections import deque, defaultdict
import numpy as np
import torch
from queue import Queue
import logging
from pathlib import Path

from ..models.golf_ner import GolfNERModel
from ..dialogue.context_manager import DialogueContextManager, ShotOutcome
from ..prediction.smart_defaults import SmartDefaultsEngine
from .trainer import GolfModelTrainer, TrainingConfig


@dataclass
class FeedbackData:
    """User feedback data for continuous learning"""
    user_id: str
    session_id: str
    timestamp: datetime
    feedback_type: str  # "recommendation", "prediction", "entity_recognition"
    original_input: str
    model_output: Any
    user_feedback: str  # "correct", "incorrect", "partial", etc.
    corrected_output: Optional[Any] = None
    confidence_score: Optional[float] = None
    context: Optional[Dict[str, Any]] = None


@dataclass
class ModelPerformanceMetrics:
    """Performance metrics tracking for continuous learning"""
    model_name: str
    accuracy_trend: List[float]
    user_satisfaction_scores: List[float]
    error_patterns: Dict[str, int]
    improvement_suggestions: List[str]
    last_updated: datetime
    performance_threshold: float = 0.8


class ContinuousLearningPipeline:
    """Manages continuous learning for golf AI models"""

    def __init__(self, update_threshold: int = 100, retrain_interval_hours: int = 24):
        self.update_threshold = update_threshold  # Min feedback samples before update
        self.retrain_interval = timedelta(hours=retrain_interval_hours)

        # Feedback storage
        self.feedback_queue = Queue()
        self.feedback_buffer = deque(maxlen=10000)

        # Model management
        self.current_models = {}
        self.model_versions = {}
        self.performance_metrics = {}

        # Learning components
        self.ner_model = None
        self.context_manager = DialogueContextManager()
        self.defaults_engine = SmartDefaultsEngine()

        # Threading for background processing
        self.learning_thread = None
        self.is_running = False

        # Configuration
        self.setup_logging()
        self.load_configuration()

    def setup_logging(self):
        """Setup logging for continuous learning"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('continuous_learning.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)

    def load_configuration(self):
        """Load configuration from file"""
        config_path = Path("configs/continuous_learning_config.json")
        if config_path.exists():
            with open(config_path, 'r') as f:
                config = json.load(f)
                self.update_threshold = config.get("update_threshold", self.update_threshold)
                self.retrain_interval = timedelta(hours=config.get("retrain_interval_hours", 24))

    def start_continuous_learning(self):
        """Start the continuous learning background process"""
        if self.is_running:
            self.logger.warning("Continuous learning already running")
            return

        self.is_running = True
        self.learning_thread = threading.Thread(target=self._continuous_learning_loop)
        self.learning_thread.daemon = True
        self.learning_thread.start()

        self.logger.info("Continuous learning pipeline started")

    def stop_continuous_learning(self):
        """Stop the continuous learning process"""
        self.is_running = False
        if self.learning_thread:
            self.learning_thread.join()
        self.logger.info("Continuous learning pipeline stopped")

    def collect_feedback(self, feedback: FeedbackData):
        """Collect user feedback for model improvement"""
        self.feedback_queue.put(feedback)
        self.feedback_buffer.append(feedback)

        self.logger.info(f"Collected feedback: {feedback.feedback_type} - {feedback.user_feedback}")

    def _continuous_learning_loop(self):
        """Main continuous learning loop"""
        last_retrain = datetime.now()

        while self.is_running:
            try:
                # Process feedback queue
                self._process_feedback_queue()

                # Check if we need to update models
                if self._should_trigger_update():
                    self._trigger_model_update()

                # Check if we need full retraining
                if datetime.now() - last_retrain >= self.retrain_interval:
                    self._trigger_full_retrain()
                    last_retrain = datetime.now()

                # Update performance metrics
                self._update_performance_metrics()

                # Sleep before next iteration
                time.sleep(60)  # Check every minute

            except Exception as e:
                self.logger.error(f"Error in continuous learning loop: {e}")
                time.sleep(300)  # Wait 5 minutes before retrying

    def _process_feedback_queue(self):
        """Process queued feedback data"""
        processed_count = 0

        while not self.feedback_queue.empty() and processed_count < 50:  # Process in batches
            try:
                feedback = self.feedback_queue.get_nowait()
                self._process_single_feedback(feedback)
                processed_count += 1
            except:
                break

    def _process_single_feedback(self, feedback: FeedbackData):
        """Process a single feedback item"""
        if feedback.feedback_type == "entity_recognition":
            self._process_ner_feedback(feedback)
        elif feedback.feedback_type == "recommendation":
            self._process_recommendation_feedback(feedback)
        elif feedback.feedback_type == "prediction":
            self._process_prediction_feedback(feedback)

    def _process_ner_feedback(self, feedback: FeedbackData):
        """Process NER model feedback"""
        if feedback.user_feedback == "incorrect" and feedback.corrected_output:
            # Store corrected NER annotations for retraining
            correction_data = {
                "text": feedback.original_input,
                "original_entities": feedback.model_output,
                "corrected_entities": feedback.corrected_output,
                "user_id": feedback.user_id,
                "timestamp": feedback.timestamp.isoformat()
            }

            # Save to corrections file
            corrections_file = Path("data/corrections/ner_corrections.jsonl")
            corrections_file.parent.mkdir(parents=True, exist_ok=True)

            with open(corrections_file, "a") as f:
                f.write(json.dumps(correction_data) + "\n")

    def _process_recommendation_feedback(self, feedback: FeedbackData):
        """Process recommendation feedback"""
        if feedback.context:
            shot_outcome = None
            if feedback.user_feedback == "excellent":
                shot_outcome = ShotOutcome.EXCELLENT
            elif feedback.user_feedback == "good":
                shot_outcome = ShotOutcome.GOOD
            elif feedback.user_feedback == "poor":
                shot_outcome = ShotOutcome.POOR
            elif feedback.user_feedback == "missed":
                shot_outcome = ShotOutcome.MISSED
            else:
                shot_outcome = ShotOutcome.AVERAGE

            # Update user patterns in context manager
            if shot_outcome and "club_used" in feedback.context:
                self.context_manager.record_shot_outcome(
                    feedback.context["club_used"],
                    shot_outcome,
                    feedback.user_feedback
                )

    def _process_prediction_feedback(self, feedback: FeedbackData):
        """Process prediction/defaults feedback"""
        # Store prediction corrections for model improvement
        prediction_data = {
            "input_conditions": feedback.context,
            "predicted_output": feedback.model_output,
            "actual_outcome": feedback.corrected_output,
            "user_satisfaction": feedback.user_feedback,
            "timestamp": feedback.timestamp.isoformat()
        }

        predictions_file = Path("data/corrections/prediction_corrections.jsonl")
        predictions_file.parent.mkdir(parents=True, exist_ok=True)

        with open(predictions_file, "a") as f:
            f.write(json.dumps(prediction_data) + "\n")

    def _should_trigger_update(self) -> bool:
        """Check if we should trigger a model update"""
        # Check if we have enough feedback
        correction_files = [
            "data/corrections/ner_corrections.jsonl",
            "data/corrections/prediction_corrections.jsonl"
        ]

        total_corrections = 0
        for file_path in correction_files:
            if Path(file_path).exists():
                with open(file_path, 'r') as f:
                    total_corrections += sum(1 for _ in f)

        return total_corrections >= self.update_threshold

    def _trigger_model_update(self):
        """Trigger incremental model update"""
        self.logger.info("Triggering incremental model update...")

        try:
            # Update NER model with corrections
            self._update_ner_model()

            # Update recommendation patterns
            self._update_recommendation_patterns()

            # Clear processed corrections
            self._archive_processed_corrections()

            self.logger.info("Incremental model update completed")

        except Exception as e:
            self.logger.error(f"Error during model update: {e}")

    def _update_ner_model(self):
        """Update NER model with corrected data"""
        corrections_file = Path("data/corrections/ner_corrections.jsonl")
        if not corrections_file.exists():
            return

        # Load corrections
        corrections = []
        with open(corrections_file, 'r') as f:
            for line in f:
                corrections.append(json.loads(line.strip()))

        if len(corrections) < 10:  # Need minimum corrections
            return

        # Create fine-tuning dataset from corrections
        training_data = self._prepare_correction_training_data(corrections)

        # Fine-tune existing model
        if self.ner_model:
            self._fine_tune_ner_model(training_data)

    def _prepare_correction_training_data(self, corrections: List[Dict]) -> List[Dict]:
        """Prepare training data from user corrections"""
        training_examples = []

        for correction in corrections:
            # Convert corrected entities to training format
            text = correction["text"]
            entities = correction["corrected_entities"]

            # Tokenize and create labels
            tokens = text.split()  # Simple tokenization
            labels = ["O"] * len(tokens)

            # Map entities to labels (simplified)
            for entity_info in entities:
                entity_text = entity_info.get("text", "")
                entity_type = entity_info.get("type", "")

                # Find entity in tokens and assign labels
                for i, token in enumerate(tokens):
                    if entity_text.lower() in token.lower():
                        labels[i] = f"B-{entity_type.upper()}"
                        break

            training_examples.append({
                "tokens": tokens,
                "labels": labels,
                "text": text
            })

        return training_examples

    def _fine_tune_ner_model(self, training_data: List[Dict]):
        """Fine-tune NER model with new data"""
        # This would implement actual fine-tuning logic
        # For now, we'll just log the action
        self.logger.info(f"Fine-tuning NER model with {len(training_data)} examples")

    def _update_recommendation_patterns(self):
        """Update recommendation patterns based on feedback"""
        corrections_file = Path("data/corrections/prediction_corrections.jsonl")
        if not corrections_file.exists():
            return

        # Load prediction corrections
        corrections = []
        with open(corrections_file, 'r') as f:
            for line in f:
                corrections.append(json.loads(line.strip()))

        # Analyze patterns and update defaults engine
        self._analyze_recommendation_patterns(corrections)

    def _analyze_recommendation_patterns(self, corrections: List[Dict]):
        """Analyze correction patterns to improve recommendations"""
        pattern_analysis = defaultdict(list)

        for correction in corrections:
            conditions = correction.get("input_conditions", {})
            predicted = correction.get("predicted_output", {})
            actual = correction.get("actual_outcome", {})

            # Group by similar conditions
            condition_key = self._create_condition_key(conditions)
            pattern_analysis[condition_key].append({
                "predicted": predicted,
                "actual": actual,
                "satisfaction": correction.get("user_satisfaction", "average")
            })

        # Update recommendation weights based on patterns
        self._update_recommendation_weights(pattern_analysis)

    def _create_condition_key(self, conditions: Dict[str, Any]) -> str:
        """Create a key for grouping similar conditions"""
        # Simplified condition grouping
        key_parts = []

        if "distance" in conditions:
            distance_range = int(conditions["distance"] / 25) * 25  # Group by 25-yard ranges
            key_parts.append(f"dist_{distance_range}")

        if "wind_speed" in conditions:
            wind_category = "high" if conditions["wind_speed"] > 15 else "low"
            key_parts.append(f"wind_{wind_category}")

        if "temperature" in conditions:
            temp_category = "hot" if conditions["temperature"] > 80 else "cold" if conditions["temperature"] < 60 else "moderate"
            key_parts.append(f"temp_{temp_category}")

        return "_".join(key_parts) if key_parts else "default"

    def _update_recommendation_weights(self, pattern_analysis: Dict[str, List[Dict]]):
        """Update recommendation weights based on pattern analysis"""
        # This would implement actual weight updates
        self.logger.info(f"Updating recommendation weights for {len(pattern_analysis)} pattern groups")

    def _trigger_full_retrain(self):
        """Trigger full model retraining"""
        self.logger.info("Triggering full model retraining...")

        try:
            # Create new training dataset with all feedback
            self._create_updated_training_dataset()

            # Retrain models
            self._retrain_models()

            # Update model versions
            self._update_model_versions()

            self.logger.info("Full model retraining completed")

        except Exception as e:
            self.logger.error(f"Error during full retraining: {e}")

    def _create_updated_training_dataset(self):
        """Create updated training dataset incorporating all feedback"""
        # Load original training data
        original_data_path = Path("data/training/ner_dataset")

        # Load corrections
        corrections_files = [
            "data/corrections/ner_corrections.jsonl",
            "data/corrections/prediction_corrections.jsonl"
        ]

        all_corrections = []
        for file_path in corrections_files:
            if Path(file_path).exists():
                with open(file_path, 'r') as f:
                    for line in f:
                        all_corrections.append(json.loads(line.strip()))

        # Merge original data with corrections
        self.logger.info(f"Merging training data with {len(all_corrections)} corrections")

    def _retrain_models(self):
        """Retrain all models with updated data"""
        config = TrainingConfig(
            num_epochs=3,
            batch_size=16,
            learning_rate=1e-5,  # Lower learning rate for fine-tuning
            use_wandb=False,
            use_mlflow=False
        )

        trainer = GolfModelTrainer(config)

        # Load updated datasets
        datasets = trainer.prepare_datasets("data/training")

        # Retrain NER model
        self.ner_model, results = trainer.train_ner_model(datasets)

        # Save performance metrics
        self._save_retraining_metrics(results)

    def _save_retraining_metrics(self, results):
        """Save retraining performance metrics"""
        metrics = {
            "timestamp": datetime.now().isoformat(),
            "accuracy": results.accuracy,
            "f1_score": results.f1_score,
            "precision": results.precision,
            "recall": results.recall
        }

        metrics_file = Path("data/metrics/retraining_metrics.jsonl")
        metrics_file.parent.mkdir(parents=True, exist_ok=True)

        with open(metrics_file, "a") as f:
            f.write(json.dumps(metrics) + "\n")

    def _update_model_versions(self):
        """Update model version tracking"""
        self.model_versions[datetime.now().isoformat()] = {
            "ner_model_path": "models/trained/golf_ner_model",
            "performance_metrics": self.performance_metrics,
            "training_data_size": self._get_training_data_size()
        }

    def _get_training_data_size(self) -> int:
        """Get current training data size"""
        # This would calculate actual training data size
        return 1000  # Placeholder

    def _update_performance_metrics(self):
        """Update performance metrics tracking"""
        # Analyze recent feedback for performance trends
        recent_feedback = [fb for fb in self.feedback_buffer
                          if fb.timestamp > datetime.now() - timedelta(hours=24)]

        if not recent_feedback:
            return

        # Calculate satisfaction scores
        satisfaction_scores = []
        for fb in recent_feedback:
            if fb.feedback_type == "recommendation":
                if fb.user_feedback == "excellent":
                    satisfaction_scores.append(1.0)
                elif fb.user_feedback == "good":
                    satisfaction_scores.append(0.8)
                elif fb.user_feedback == "average":
                    satisfaction_scores.append(0.6)
                elif fb.user_feedback == "poor":
                    satisfaction_scores.append(0.3)
                else:
                    satisfaction_scores.append(0.0)

        if satisfaction_scores:
            avg_satisfaction = np.mean(satisfaction_scores)

            # Update metrics
            if "recommendation" not in self.performance_metrics:
                self.performance_metrics["recommendation"] = ModelPerformanceMetrics(
                    model_name="recommendation",
                    accuracy_trend=[],
                    user_satisfaction_scores=[],
                    error_patterns={},
                    improvement_suggestions=[],
                    last_updated=datetime.now()
                )

            metrics = self.performance_metrics["recommendation"]
            metrics.user_satisfaction_scores.append(avg_satisfaction)
            metrics.last_updated = datetime.now()

            # Keep only recent scores (last 100)
            metrics.user_satisfaction_scores = metrics.user_satisfaction_scores[-100:]

            self.logger.info(f"Updated satisfaction score: {avg_satisfaction:.3f}")

    def _archive_processed_corrections(self):
        """Archive processed corrections"""
        archive_dir = Path("data/corrections/archive")
        archive_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        correction_files = [
            "data/corrections/ner_corrections.jsonl",
            "data/corrections/prediction_corrections.jsonl"
        ]

        for file_path in correction_files:
            if Path(file_path).exists():
                archive_path = archive_dir / f"{Path(file_path).stem}_{timestamp}.jsonl"
                Path(file_path).rename(archive_path)
                self.logger.info(f"Archived corrections to {archive_path}")

    def get_learning_status(self) -> Dict[str, Any]:
        """Get current learning pipeline status"""
        return {
            "is_running": self.is_running,
            "feedback_buffer_size": len(self.feedback_buffer),
            "feedback_queue_size": self.feedback_queue.qsize(),
            "performance_metrics": {
                name: asdict(metrics) for name, metrics in self.performance_metrics.items()
            },
            "last_update_check": datetime.now().isoformat(),
            "model_versions": self.model_versions
        }

    def save_state(self, filepath: str):
        """Save continuous learning state"""
        state = {
            "feedback_buffer": [asdict(fb) for fb in self.feedback_buffer],
            "performance_metrics": {
                name: asdict(metrics) for name, metrics in self.performance_metrics.items()
            },
            "model_versions": self.model_versions,
            "configuration": {
                "update_threshold": self.update_threshold,
                "retrain_interval_hours": self.retrain_interval.total_seconds() / 3600
            }
        }

        with open(filepath, 'w') as f:
            json.dump(state, f, indent=2, default=str)

    def load_state(self, filepath: str):
        """Load continuous learning state"""
        with open(filepath, 'r') as f:
            state = json.load(f)

        # Restore feedback buffer
        self.feedback_buffer.clear()
        for fb_data in state.get("feedback_buffer", []):
            fb_data["timestamp"] = datetime.fromisoformat(fb_data["timestamp"])
            feedback = FeedbackData(**fb_data)
            self.feedback_buffer.append(feedback)

        # Restore performance metrics
        self.performance_metrics = {}
        for name, metrics_data in state.get("performance_metrics", {}).items():
            metrics_data["last_updated"] = datetime.fromisoformat(metrics_data["last_updated"])
            self.performance_metrics[name] = ModelPerformanceMetrics(**metrics_data)

        # Restore configuration
        config = state.get("configuration", {})
        self.update_threshold = config.get("update_threshold", self.update_threshold)
        self.retrain_interval = timedelta(hours=config.get("retrain_interval_hours", 24))