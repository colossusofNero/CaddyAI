"""
Training data collection and preprocessing pipeline for golf NLP models.
Includes synthetic data generation, web scraping, and data augmentation.
"""

import random
import json
import os
import re
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
import pandas as pd
import requests
from bs4 import BeautifulSoup
import nltk
from nltk.tokenize import word_tokenize, sent_tokenize
import numpy as np
from datasets import Dataset


@dataclass
class GolfSentence:
    """Represents a golf-related sentence with NER annotations"""
    text: str
    tokens: List[str]
    ner_tags: List[int]
    entities: Dict[str, List[str]]


class GolfDataGenerator:
    """Generates synthetic golf training data for NER and dialogue models"""

    def __init__(self):
        # Golf-specific templates for sentence generation
        self.sentence_templates = [
            "I need to hit my {club} {distance} to the {target}",
            "There's a {hazard} about {distance} from the {target}",
            "The conditions are {condition} with {direction} wind",
            "I'm hitting {shot_type} with my {club} from the {course_feature}",
            "The pin is {distance} away on the {direction} side of the green",
            "Watch out for the {hazard} on the {direction} side",
            "I recommend a {club} for this {distance} {shot_type}",
            "The green is {condition} and playing {direction}",
            "You have {distance} to carry the {hazard}",
            "Hit it {direction} of the {target} to avoid the {hazard}"
        ]

        self.dialogue_templates = [
            {
                "user": "What club should I use for {distance}?",
                "assistant": "For {distance}, I recommend your {club}. Watch out for the {hazard} on the {direction}."
            },
            {
                "user": "I'm {distance} from the pin, what do you think?",
                "assistant": "From {distance}, consider the {condition} conditions and use your {club}."
            },
            {
                "user": "There's a {hazard} in front of me",
                "assistant": "I see the {hazard}. You need to {shot_type} with your {club} to clear it."
            }
        ]

        # Import vocabulary from golf_ner module
        from ..models.golf_ner import GolfVocabulary
        self.vocab = GolfVocabulary()

        # Label mapping
        self.label_map = {
            "O": 0, "B-DISTANCE": 1, "I-DISTANCE": 2, "B-CLUB": 3, "I-CLUB": 4,
            "B-HAZARD": 5, "I-HAZARD": 6, "B-CONDITION": 7, "I-CONDITION": 8,
            "B-TARGET": 9, "I-TARGET": 10, "B-COURSE_FEATURE": 11, "I-COURSE_FEATURE": 12,
            "B-SHOT_TYPE": 13, "I-SHOT_TYPE": 14, "B-DIRECTION": 15, "I-DIRECTION": 16
        }

    def generate_synthetic_sentences(self, num_sentences: int = 1000) -> List[GolfSentence]:
        """Generate synthetic golf sentences with NER annotations"""
        sentences = []

        for _ in range(num_sentences):
            template = random.choice(self.sentence_templates)
            sentence_data = self._fill_template(template)
            sentences.append(sentence_data)

        return sentences

    def _fill_template(self, template: str) -> GolfSentence:
        """Fill template with golf vocabulary and create NER annotations"""
        # Create mapping of placeholders to values
        placeholders = {
            "{distance}": random.choice(self.vocab.DISTANCES),
            "{club}": random.choice(self.vocab.CLUBS),
            "{hazard}": random.choice(self.vocab.HAZARDS),
            "{condition}": random.choice(self.vocab.CONDITIONS),
            "{target}": random.choice(self.vocab.TARGETS),
            "{course_feature}": random.choice(self.vocab.COURSE_FEATURES),
            "{shot_type}": random.choice(self.vocab.SHOT_TYPES),
            "{direction}": random.choice(self.vocab.DIRECTIONS)
        }

        # Fill template
        filled_template = template
        entity_positions = {}

        for placeholder, value in placeholders.items():
            if placeholder in filled_template:
                start_pos = filled_template.find(placeholder)
                filled_template = filled_template.replace(placeholder, value, 1)
                entity_positions[placeholder] = (start_pos, start_pos + len(value), value)

        # Tokenize and create NER tags
        tokens = word_tokenize(filled_template)
        ner_tags = ["O"] * len(tokens)

        # Map entities to tokens
        self._map_entities_to_tokens(filled_template, tokens, ner_tags, entity_positions)

        # Convert string labels to integers
        ner_tag_ids = [self.label_map[tag] for tag in ner_tags]

        return GolfSentence(
            text=filled_template,
            tokens=tokens,
            ner_tags=ner_tag_ids,
            entities=self._extract_entities_from_tags(tokens, ner_tags)
        )

    def _map_entities_to_tokens(self, text: str, tokens: List[str], ner_tags: List[str],
                               entity_positions: Dict):
        """Map entity positions to token-level NER tags"""
        entity_type_map = {
            "{distance}": "DISTANCE",
            "{club}": "CLUB",
            "{hazard}": "HAZARD",
            "{condition}": "CONDITION",
            "{target}": "TARGET",
            "{course_feature}": "COURSE_FEATURE",
            "{shot_type}": "SHOT_TYPE",
            "{direction}": "DIRECTION"
        }

        # Reconstruct token positions
        token_positions = []
        current_pos = 0
        for token in tokens:
            start = text.find(token, current_pos)
            if start != -1:
                token_positions.append((start, start + len(token)))
                current_pos = start + len(token)
            else:
                token_positions.append((current_pos, current_pos))

        # Assign NER tags based on overlap
        for placeholder, (ent_start, ent_end, value) in entity_positions.items():
            entity_type = entity_type_map.get(placeholder)
            if not entity_type:
                continue

            # Find overlapping tokens
            overlapping_tokens = []
            for i, (tok_start, tok_end) in enumerate(token_positions):
                if tok_start < ent_end and tok_end > ent_start:
                    overlapping_tokens.append(i)

            # Assign B- and I- tags
            for i, token_idx in enumerate(overlapping_tokens):
                if i == 0:
                    ner_tags[token_idx] = f"B-{entity_type}"
                else:
                    ner_tags[token_idx] = f"I-{entity_type}"

    def _extract_entities_from_tags(self, tokens: List[str], ner_tags: List[str]) -> Dict:
        """Extract entity dictionary from NER tags"""
        entities = {
            "distances": [], "clubs": [], "hazards": [], "conditions": [],
            "targets": [], "course_features": [], "shot_types": [], "directions": []
        }

        current_entity = ""
        current_type = ""

        for token, tag in zip(tokens, ner_tags):
            if tag.startswith("B-"):
                if current_entity:
                    self._add_to_entities(entities, current_type, current_entity)
                current_entity = token
                current_type = tag[2:]
            elif tag.startswith("I-") and current_type:
                current_entity += " " + token
            else:
                if current_entity:
                    self._add_to_entities(entities, current_type, current_entity)
                current_entity = ""
                current_type = ""

        if current_entity:
            self._add_to_entities(entities, current_type, current_entity)

        return entities

    def _add_to_entities(self, entities: Dict, entity_type: str, entity_value: str):
        """Add entity to appropriate category"""
        type_mapping = {
            "DISTANCE": "distances", "CLUB": "clubs", "HAZARD": "hazards",
            "CONDITION": "conditions", "TARGET": "targets",
            "COURSE_FEATURE": "course_features", "SHOT_TYPE": "shot_types",
            "DIRECTION": "directions"
        }
        category = type_mapping.get(entity_type)
        if category:
            entities[category].append(entity_value)

    def generate_dialogue_data(self, num_dialogues: int = 500) -> List[Dict]:
        """Generate dialogue training data"""
        dialogues = []

        for _ in range(num_dialogues):
            template = random.choice(self.dialogue_templates)

            # Fill placeholders
            placeholders = {
                "{distance}": random.choice(self.vocab.DISTANCES),
                "{club}": random.choice(self.vocab.CLUBS),
                "{hazard}": random.choice(self.vocab.HAZARDS),
                "{condition}": random.choice(self.vocab.CONDITIONS),
                "{direction}": random.choice(self.vocab.DIRECTIONS),
                "{shot_type}": random.choice(self.vocab.SHOT_TYPES)
            }

            user_msg = template["user"]
            assistant_msg = template["assistant"]

            for placeholder, value in placeholders.items():
                user_msg = user_msg.replace(placeholder, value)
                assistant_msg = assistant_msg.replace(placeholder, value)

            dialogues.append({
                "user": user_msg,
                "assistant": assistant_msg,
                "context": "golf_recommendation"
            })

        return dialogues


class GolfWebScraper:
    """Scrapes golf-related content from web sources"""

    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }

    def scrape_golf_forums(self, urls: List[str]) -> List[str]:
        """Scrape text content from golf forums and websites"""
        scraped_texts = []

        for url in urls:
            try:
                response = requests.get(url, headers=self.headers, timeout=10)
                soup = BeautifulSoup(response.content, 'html.parser')

                # Extract text content
                text_content = soup.get_text()
                sentences = sent_tokenize(text_content)

                # Filter for golf-related sentences
                golf_sentences = self._filter_golf_sentences(sentences)
                scraped_texts.extend(golf_sentences)

            except Exception as e:
                print(f"Error scraping {url}: {e}")
                continue

        return scraped_texts

    def _filter_golf_sentences(self, sentences: List[str]) -> List[str]:
        """Filter sentences that contain golf-related terms"""
        golf_keywords = [
            "golf", "club", "iron", "driver", "putter", "green", "fairway",
            "tee", "hole", "par", "birdie", "eagle", "bogey", "yard", "pin"
        ]

        filtered = []
        for sentence in sentences:
            sentence = sentence.strip()
            if (len(sentence) > 20 and len(sentence) < 200 and
                any(keyword.lower() in sentence.lower() for keyword in golf_keywords)):
                filtered.append(sentence)

        return filtered


class GolfDataPreprocessor:
    """Preprocesses golf training data for model training"""

    def __init__(self):
        self.generator = GolfDataGenerator()
        self.scraper = GolfWebScraper()

    def create_training_dataset(self,
                              synthetic_sentences: int = 2000,
                              dialogue_examples: int = 1000,
                              web_scraping_urls: Optional[List[str]] = None) -> Dataset:
        """Create complete training dataset"""

        # Generate synthetic data
        print("Generating synthetic NER data...")
        synthetic_data = self.generator.generate_synthetic_sentences(synthetic_sentences)

        # Generate dialogue data
        print("Generating dialogue data...")
        dialogue_data = self.generator.generate_dialogue_data(dialogue_examples)

        # Scrape web data if URLs provided
        web_data = []
        if web_scraping_urls:
            print("Scraping web data...")
            web_data = self.scraper.scrape_golf_forums(web_scraping_urls)

        # Prepare dataset format
        dataset_dict = {
            "tokens": [sent.tokens for sent in synthetic_data],
            "ner_tags": [sent.ner_tags for sent in synthetic_data],
            "text": [sent.text for sent in synthetic_data]
        }

        # Create HuggingFace dataset
        dataset = Dataset.from_dict(dataset_dict)

        return dataset, dialogue_data, web_data

    def save_training_data(self,
                          dataset: Dataset,
                          dialogue_data: List[Dict],
                          web_data: List[str],
                          output_dir: str):
        """Save training data to files"""
        os.makedirs(output_dir, exist_ok=True)

        # Save NER dataset
        dataset.save_to_disk(os.path.join(output_dir, "ner_dataset"))

        # Save dialogue data
        with open(os.path.join(output_dir, "dialogue_data.json"), "w") as f:
            json.dump(dialogue_data, f, indent=2)

        # Save web scraped data
        with open(os.path.join(output_dir, "web_scraped_data.json"), "w") as f:
            json.dump(web_data, f, indent=2)

        print(f"Training data saved to {output_dir}")

    def augment_data(self, sentences: List[GolfSentence],
                    augmentation_factor: float = 0.3) -> List[GolfSentence]:
        """Apply data augmentation techniques"""
        augmented = list(sentences)
        num_to_augment = int(len(sentences) * augmentation_factor)

        for _ in range(num_to_augment):
            original = random.choice(sentences)
            augmented_sentence = self._apply_augmentation(original)
            augmented.append(augmented_sentence)

        return augmented

    def _apply_augmentation(self, sentence: GolfSentence) -> GolfSentence:
        """Apply single augmentation technique"""
        # Random synonym replacement for non-entities
        tokens = sentence.tokens.copy()
        ner_tags = sentence.ner_tags.copy()

        # Simple augmentation: replace some non-entity words
        synonym_map = {
            "good": "great", "bad": "poor", "nice": "excellent",
            "hit": "strike", "use": "take", "need": "require"
        }

        for i, (token, tag) in enumerate(zip(tokens, ner_tags)):
            if tag == 0 and token.lower() in synonym_map:  # O tag
                if random.random() < 0.3:  # 30% chance
                    tokens[i] = synonym_map[token.lower()]

        return GolfSentence(
            text=" ".join(tokens),
            tokens=tokens,
            ner_tags=ner_tags,
            entities=sentence.entities
        )


# Example usage and testing
def main():
    """Example usage of the data collection pipeline"""
    preprocessor = GolfDataPreprocessor()

    # Create training dataset
    dataset, dialogue_data, web_data = preprocessor.create_training_dataset(
        synthetic_sentences=1000,
        dialogue_examples=500
    )

    # Save training data
    preprocessor.save_training_data(
        dataset, dialogue_data, web_data,
        output_dir="./data/training"
    )

    print(f"Created dataset with {len(dataset)} NER examples")
    print(f"Created {len(dialogue_data)} dialogue examples")
    print("Training data ready for model training!")


if __name__ == "__main__":
    main()