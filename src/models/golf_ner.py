"""
Golf-specific Named Entity Recognition model for identifying golf terminology,
distances, clubs, hazards, and conditions in natural language input.
"""

import torch
import torch.nn as nn
from transformers import (
    AutoTokenizer,
    AutoModelForTokenClassification,
    TrainingArguments,
    Trainer,
    DataCollatorForTokenClassification
)
from typing import List, Dict, Tuple, Optional
import numpy as np
from seqeval.metrics import accuracy_score, classification_report, f1_score


class GolfNERLabels:
    """Golf-specific entity labels for NER model"""

    # Define golf-specific entity types
    LABELS = [
        "O",  # Outside
        "B-DISTANCE",  # Beginning of distance (e.g., "150", "yards")
        "I-DISTANCE",  # Inside distance
        "B-CLUB",      # Beginning of club (e.g., "7-iron", "driver")
        "I-CLUB",      # Inside club
        "B-HAZARD",    # Beginning of hazard (e.g., "water", "bunker", "rough")
        "I-HAZARD",    # Inside hazard
        "B-CONDITION", # Beginning of condition (e.g., "windy", "uphill")
        "I-CONDITION", # Inside condition
        "B-TARGET",    # Beginning of target (e.g., "pin", "green", "fairway")
        "I-TARGET",    # Inside target
        "B-COURSE_FEATURE", # Course features (e.g., "tee box", "dogleg")
        "I-COURSE_FEATURE",
        "B-SHOT_TYPE", # Shot types (e.g., "approach", "chip", "putt")
        "I-SHOT_TYPE",
        "B-DIRECTION", # Directions (e.g., "left", "right", "straight")
        "I-DIRECTION"
    ]

    LABEL2ID = {label: idx for idx, label in enumerate(LABELS)}
    ID2LABEL = {idx: label for idx, label in enumerate(LABELS)}

    @classmethod
    def get_num_labels(cls) -> int:
        return len(cls.LABELS)


class GolfNERModel:
    """Golf-specific NER model wrapper"""

    def __init__(self, model_name: str = "distilbert-base-uncased"):
        self.model_name = model_name
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = None
        self.labels = GolfNERLabels()

    def initialize_model(self):
        """Initialize the model architecture"""
        self.model = AutoModelForTokenClassification.from_pretrained(
            self.model_name,
            num_labels=self.labels.get_num_labels(),
            id2label=self.labels.ID2LABEL,
            label2id=self.labels.LABEL2ID
        )

    def tokenize_and_align_labels(self, examples):
        """Tokenize inputs and align labels with subword tokens"""
        tokenized_inputs = self.tokenizer(
            examples["tokens"],
            truncation=True,
            is_split_into_words=True,
            padding=True,
            return_tensors="pt"
        )

        labels = []
        for i, label in enumerate(examples["ner_tags"]):
            word_ids = tokenized_inputs.word_ids(batch_index=i)
            previous_word_idx = None
            label_ids = []

            for word_idx in word_ids:
                if word_idx is None:
                    label_ids.append(-100)
                elif word_idx != previous_word_idx:
                    label_ids.append(label[word_idx])
                else:
                    label_ids.append(-100)
                previous_word_idx = word_idx

            labels.append(label_ids)

        tokenized_inputs["labels"] = labels
        return tokenized_inputs

    def compute_metrics(self, eval_pred):
        """Compute evaluation metrics"""
        predictions, labels = eval_pred
        predictions = np.argmax(predictions, axis=2)

        # Remove ignored index (special tokens)
        true_predictions = [
            [self.labels.ID2LABEL[p] for (p, l) in zip(prediction, label) if l != -100]
            for prediction, label in zip(predictions, labels)
        ]
        true_labels = [
            [self.labels.ID2LABEL[l] for (p, l) in zip(prediction, label) if l != -100]
            for prediction, label in zip(predictions, labels)
        ]

        return {
            "accuracy": accuracy_score(true_labels, true_predictions),
            "f1": f1_score(true_labels, true_predictions),
            "classification_report": classification_report(true_labels, true_predictions)
        }

    def train(self, train_dataset, eval_dataset, output_dir: str = "./golf_ner_model"):
        """Train the NER model"""
        if self.model is None:
            self.initialize_model()

        training_args = TrainingArguments(
            output_dir=output_dir,
            learning_rate=2e-5,
            per_device_train_batch_size=16,
            per_device_eval_batch_size=16,
            num_train_epochs=3,
            weight_decay=0.01,
            evaluation_strategy="epoch",
            save_strategy="epoch",
            load_best_model_at_end=True,
            push_to_hub=False,
            logging_steps=10,
            eval_steps=100,
            save_steps=100,
        )

        data_collator = DataCollatorForTokenClassification(
            tokenizer=self.tokenizer, return_tensors="pt"
        )

        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=eval_dataset,
            tokenizer=self.tokenizer,
            data_collator=data_collator,
            compute_metrics=self.compute_metrics,
        )

        trainer.train()
        return trainer

    def predict(self, text: str) -> List[Tuple[str, str, float]]:
        """Predict entities in text"""
        if self.model is None:
            raise ValueError("Model not initialized. Train or load a model first.")

        inputs = self.tokenizer(text, return_tensors="pt", truncation=True, padding=True)

        with torch.no_grad():
            outputs = self.model(**inputs)

        predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
        predicted_labels = torch.argmax(predictions, dim=-1)

        # Convert tokens back to words and get predictions
        tokens = self.tokenizer.convert_ids_to_tokens(inputs["input_ids"][0])
        word_predictions = []

        for i, (token, pred_id) in enumerate(zip(tokens, predicted_labels[0])):
            if token.startswith("##"):
                continue
            if token in ["[CLS]", "[SEP]", "[PAD]"]:
                continue

            label = self.labels.ID2LABEL[pred_id.item()]
            confidence = predictions[0][i][pred_id].item()

            if label != "O":  # Only return non-other entities
                word_predictions.append((token, label, confidence))

        return word_predictions

    def save_model(self, path: str):
        """Save the trained model"""
        if self.model is None:
            raise ValueError("No model to save")
        self.model.save_pretrained(path)
        self.tokenizer.save_pretrained(path)

    def load_model(self, path: str):
        """Load a trained model"""
        self.model = AutoModelForTokenClassification.from_pretrained(path)
        self.tokenizer = AutoTokenizer.from_pretrained(path)


class GolfEntityExtractor:
    """High-level interface for extracting golf entities from text"""

    def __init__(self, model_path: Optional[str] = None):
        self.ner_model = GolfNERModel()
        if model_path:
            self.ner_model.load_model(model_path)

    def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """Extract and categorize golf entities from text"""
        predictions = self.ner_model.predict(text)

        entities = {
            "distances": [],
            "clubs": [],
            "hazards": [],
            "conditions": [],
            "targets": [],
            "course_features": [],
            "shot_types": [],
            "directions": []
        }

        current_entity = ""
        current_type = ""

        for token, label, confidence in predictions:
            if label.startswith("B-"):
                # Save previous entity if exists
                if current_entity and current_type:
                    self._add_entity_to_dict(entities, current_type, current_entity)

                # Start new entity
                current_entity = token
                current_type = label[2:]  # Remove "B-" prefix

            elif label.startswith("I-") and current_type == label[2:]:
                # Continue current entity
                current_entity += " " + token

            else:
                # Save current entity and reset
                if current_entity and current_type:
                    self._add_entity_to_dict(entities, current_type, current_entity)
                current_entity = ""
                current_type = ""

        # Save final entity
        if current_entity and current_type:
            self._add_entity_to_dict(entities, current_type, current_entity)

        return entities

    def _add_entity_to_dict(self, entities: Dict, entity_type: str, entity_value: str):
        """Add entity to the appropriate category"""
        type_mapping = {
            "DISTANCE": "distances",
            "CLUB": "clubs",
            "HAZARD": "hazards",
            "CONDITION": "conditions",
            "TARGET": "targets",
            "COURSE_FEATURE": "course_features",
            "SHOT_TYPE": "shot_types",
            "DIRECTION": "directions"
        }

        category = type_mapping.get(entity_type)
        if category and entity_value not in entities[category]:
            entities[category].append(entity_value)


# Golf-specific vocabulary and patterns for training data generation
class GolfVocabulary:
    """Golf terminology dictionary for training data augmentation"""

    DISTANCES = [
        "yards", "yds", "y", "feet", "ft", "meters", "m",
        "50", "75", "100", "125", "150", "175", "200", "225", "250", "275", "300"
    ]

    CLUBS = [
        "driver", "3-wood", "5-wood", "7-wood", "hybrid", "rescue",
        "1-iron", "2-iron", "3-iron", "4-iron", "5-iron", "6-iron",
        "7-iron", "8-iron", "9-iron", "pitching wedge", "sand wedge",
        "gap wedge", "lob wedge", "putter", "pw", "sw", "gw", "lw"
    ]

    HAZARDS = [
        "water", "pond", "lake", "stream", "creek", "river",
        "sand", "bunker", "trap", "rough", "thick rough", "deep rough",
        "trees", "woods", "forest", "cart path", "road", "out of bounds", "OB"
    ]

    CONDITIONS = [
        "windy", "calm", "breezy", "gusty", "headwind", "tailwind", "crosswind",
        "uphill", "downhill", "sidehill", "flat", "elevated", "below",
        "wet", "dry", "muddy", "firm", "soft", "fast", "slow",
        "sunny", "cloudy", "overcast", "rain", "drizzle"
    ]

    TARGETS = [
        "pin", "flag", "hole", "green", "fairway", "fringe", "collar",
        "front", "back", "middle", "center", "left", "right"
    ]

    COURSE_FEATURES = [
        "tee", "tee box", "fairway", "rough", "green", "fringe",
        "dogleg", "bend", "turn", "slope", "hill", "valley",
        "elevation", "drop", "rise"
    ]

    SHOT_TYPES = [
        "drive", "approach", "chip", "pitch", "putt", "recovery",
        "punch", "fade", "draw", "slice", "hook", "straight",
        "high", "low", "bump and run"
    ]

    DIRECTIONS = [
        "left", "right", "straight", "center", "middle",
        "front", "back", "short", "long", "over", "under"
    ]