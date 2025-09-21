"""
Model training and evaluation framework for golf AI models.
Handles training of NER models, dialogue models, and recommendation systems.
"""

import os
import json
import torch
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime
import wandb
import mlflow
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
from sklearn.model_selection import train_test_split
from transformers import (
    AutoTokenizer,
    AutoModelForTokenClassification,
    TrainingArguments,
    Trainer,
    EarlyStoppingCallback,
    get_linear_schedule_with_warmup
)
from datasets import Dataset, DatasetDict
import matplotlib.pyplot as plt
import seaborn as sns
from dataclasses import dataclass
from pathlib import Path

from ..models.golf_ner import GolfNERModel, GolfNERLabels
from ..data.data_collector import GolfDataPreprocessor


@dataclass
class TrainingConfig:
    """Configuration for model training"""
    model_name: str = "distilbert-base-uncased"
    output_dir: str = "./models/trained"
    learning_rate: float = 2e-5
    batch_size: int = 16
    num_epochs: int = 5
    warmup_steps: int = 500
    weight_decay: float = 0.01
    max_grad_norm: float = 1.0
    seed: int = 42
    eval_steps: int = 100
    save_steps: int = 500
    logging_steps: int = 50
    early_stopping_patience: int = 3
    use_wandb: bool = True
    use_mlflow: bool = True


@dataclass
class EvaluationResults:
    """Results from model evaluation"""
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    per_class_metrics: Dict[str, Dict[str, float]]
    confusion_matrix: List[List[int]]
    training_loss: List[float]
    validation_loss: List[float]
    evaluation_time: float


class GolfModelTrainer:
    """Handles training and evaluation of golf AI models"""

    def __init__(self, config: TrainingConfig):
        self.config = config
        self.setup_logging()
        self.set_seed()

    def setup_logging(self):
        """Setup experiment tracking"""
        if self.config.use_wandb:
            wandb.init(
                project="golf-ai-ml",
                config=self.config.__dict__,
                name=f"golf-ner-{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            )

        if self.config.use_mlflow:
            mlflow.set_experiment("golf-ai-training")
            mlflow.start_run()
            mlflow.log_params(self.config.__dict__)

    def set_seed(self):
        """Set random seeds for reproducibility"""
        torch.manual_seed(self.config.seed)
        np.random.seed(self.config.seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(self.config.seed)

    def prepare_datasets(self, data_dir: str = "./data/training") -> DatasetDict:
        """Prepare datasets for training"""
        print("Preparing datasets...")

        # Load or generate training data
        if not os.path.exists(data_dir):
            print("No existing data found. Generating synthetic data...")
            preprocessor = GolfDataPreprocessor()
            dataset, dialogue_data, web_data = preprocessor.create_training_dataset()
            preprocessor.save_training_data(dataset, dialogue_data, web_data, data_dir)
        else:
            print("Loading existing training data...")
            dataset = Dataset.load_from_disk(os.path.join(data_dir, "ner_dataset"))

        # Split dataset
        train_test_split_data = dataset.train_test_split(test_size=0.2, seed=self.config.seed)
        train_dataset = train_test_split_data["train"]
        eval_dataset = train_test_split_data["test"]

        # Further split eval into validation and test
        eval_split = eval_dataset.train_test_split(test_size=0.5, seed=self.config.seed)
        val_dataset = eval_split["train"]
        test_dataset = eval_split["test"]

        datasets = DatasetDict({
            "train": train_dataset,
            "validation": val_dataset,
            "test": test_dataset
        })

        print(f"Dataset sizes - Train: {len(train_dataset)}, Val: {len(val_dataset)}, Test: {len(test_dataset)}")
        return datasets

    def train_ner_model(self, datasets: DatasetDict) -> Tuple[GolfNERModel, EvaluationResults]:
        """Train the golf NER model"""
        print("Training NER model...")

        # Initialize model
        golf_ner = GolfNERModel(model_name=self.config.model_name)
        golf_ner.initialize_model()

        # Tokenize datasets
        train_dataset = datasets["train"].map(
            golf_ner.tokenize_and_align_labels,
            batched=True,
            remove_columns=datasets["train"].column_names
        )

        val_dataset = datasets["validation"].map(
            golf_ner.tokenize_and_align_labels,
            batched=True,
            remove_columns=datasets["validation"].column_names
        )

        # Setup training arguments
        training_args = TrainingArguments(
            output_dir=self.config.output_dir,
            learning_rate=self.config.learning_rate,
            per_device_train_batch_size=self.config.batch_size,
            per_device_eval_batch_size=self.config.batch_size,
            num_train_epochs=self.config.num_epochs,
            weight_decay=self.config.weight_decay,
            evaluation_strategy="steps",
            eval_steps=self.config.eval_steps,
            save_steps=self.config.save_steps,
            logging_steps=self.config.logging_steps,
            load_best_model_at_end=True,
            metric_for_best_model="eval_f1",
            greater_is_better=True,
            warmup_steps=self.config.warmup_steps,
            max_grad_norm=self.config.max_grad_norm,
            seed=self.config.seed,
            report_to="wandb" if self.config.use_wandb else None,
        )

        # Train model
        trainer = golf_ner.train(train_dataset, val_dataset, self.config.output_dir)

        # Evaluate model
        print("Evaluating model...")
        eval_results = self.evaluate_ner_model(golf_ner, datasets["test"])

        # Save model and results
        self.save_training_artifacts(golf_ner, eval_results)

        return golf_ner, eval_results

    def evaluate_ner_model(self, model: GolfNERModel, test_dataset: Dataset) -> EvaluationResults:
        """Evaluate NER model performance"""
        start_time = datetime.now()

        # Tokenize test dataset
        tokenized_test = test_dataset.map(
            model.tokenize_and_align_labels,
            batched=True,
            remove_columns=test_dataset.column_names
        )

        # Get predictions
        predictions = []
        true_labels = []

        for example in tokenized_test:
            # Get model prediction
            text = " ".join(example["tokens"])
            pred_entities = model.predict(text)

            # Convert predictions to label sequence
            pred_labels = self._entities_to_labels(pred_entities, example["tokens"])
            true_label_ids = example["ner_tags"]

            predictions.append(pred_labels)
            true_labels.append([model.labels.ID2LABEL[id] for id in true_label_ids])

        # Calculate metrics
        flat_pred = [label for seq in predictions for label in seq]
        flat_true = [label for seq in true_labels for label in seq]

        accuracy = accuracy_score(flat_true, flat_pred)
        precision, recall, f1, support = precision_recall_fscore_support(
            flat_true, flat_pred, average='weighted', zero_division=0
        )

        # Per-class metrics
        per_class_metrics = self._calculate_per_class_metrics(flat_true, flat_pred)

        # Confusion matrix
        confusion_matrix = self._calculate_confusion_matrix(flat_true, flat_pred)

        eval_time = (datetime.now() - start_time).total_seconds()

        results = EvaluationResults(
            accuracy=accuracy,
            precision=precision,
            recall=recall,
            f1_score=f1,
            per_class_metrics=per_class_metrics,
            confusion_matrix=confusion_matrix,
            training_loss=[],  # Would be populated from trainer
            validation_loss=[],  # Would be populated from trainer
            evaluation_time=eval_time
        )

        self._log_evaluation_metrics(results)
        return results

    def _entities_to_labels(self, entities: List[Tuple], tokens: List[str]) -> List[str]:
        """Convert entity predictions to label sequence"""
        labels = ["O"] * len(tokens)

        for token, label, confidence in entities:
            # Find token position
            for i, t in enumerate(tokens):
                if t == token:
                    labels[i] = label
                    break

        return labels

    def _calculate_per_class_metrics(self, true_labels: List[str],
                                   pred_labels: List[str]) -> Dict[str, Dict[str, float]]:
        """Calculate per-class precision, recall, and F1"""
        from sklearn.metrics import classification_report
        report = classification_report(true_labels, pred_labels, output_dict=True, zero_division=0)

        per_class = {}
        for label, metrics in report.items():
            if isinstance(metrics, dict) and 'precision' in metrics:
                per_class[label] = {
                    'precision': metrics['precision'],
                    'recall': metrics['recall'],
                    'f1_score': metrics['f1-score'],
                    'support': metrics['support']
                }

        return per_class

    def _calculate_confusion_matrix(self, true_labels: List[str],
                                  pred_labels: List[str]) -> List[List[int]]:
        """Calculate confusion matrix"""
        from sklearn.metrics import confusion_matrix
        from sklearn.preprocessing import LabelEncoder

        # Encode labels
        encoder = LabelEncoder()
        all_labels = list(set(true_labels + pred_labels))
        encoder.fit(all_labels)

        true_encoded = encoder.transform(true_labels)
        pred_encoded = encoder.transform(pred_labels)

        cm = confusion_matrix(true_encoded, pred_encoded)
        return cm.tolist()

    def _log_evaluation_metrics(self, results: EvaluationResults):
        """Log evaluation metrics to tracking platforms"""
        metrics = {
            "eval_accuracy": results.accuracy,
            "eval_precision": results.precision,
            "eval_recall": results.recall,
            "eval_f1": results.f1_score,
            "eval_time": results.evaluation_time
        }

        if self.config.use_wandb:
            wandb.log(metrics)

        if self.config.use_mlflow:
            mlflow.log_metrics(metrics)

        print(f"Evaluation Results:")
        print(f"Accuracy: {results.accuracy:.4f}")
        print(f"Precision: {results.precision:.4f}")
        print(f"Recall: {results.recall:.4f}")
        print(f"F1 Score: {results.f1_score:.4f}")

    def save_training_artifacts(self, model: GolfNERModel, results: EvaluationResults):
        """Save model and training artifacts"""
        # Create output directory
        output_path = Path(self.config.output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # Save model
        model_path = output_path / "golf_ner_model"
        model.save_model(str(model_path))

        # Save evaluation results
        results_path = output_path / "evaluation_results.json"
        with open(results_path, 'w') as f:
            # Convert numpy types to native Python types for JSON serialization
            results_dict = {
                "accuracy": float(results.accuracy),
                "precision": float(results.precision),
                "recall": float(results.recall),
                "f1_score": float(results.f1_score),
                "per_class_metrics": results.per_class_metrics,
                "confusion_matrix": results.confusion_matrix,
                "evaluation_time": float(results.evaluation_time),
                "training_config": self.config.__dict__
            }
            json.dump(results_dict, f, indent=2)

        # Create and save visualizations
        self._create_visualizations(results, output_path)

        print(f"Training artifacts saved to {output_path}")

    def _create_visualizations(self, results: EvaluationResults, output_path: Path):
        """Create and save training visualizations"""
        # Confusion matrix heatmap
        if results.confusion_matrix:
            plt.figure(figsize=(10, 8))
            sns.heatmap(results.confusion_matrix, annot=True, fmt='d', cmap='Blues')
            plt.title('NER Model Confusion Matrix')
            plt.ylabel('True Label')
            plt.xlabel('Predicted Label')
            plt.tight_layout()
            plt.savefig(output_path / "confusion_matrix.png", dpi=300, bbox_inches='tight')
            plt.close()

        # Per-class metrics bar plot
        if results.per_class_metrics:
            fig, (ax1, ax2, ax3) = plt.subplots(1, 3, figsize=(15, 5))

            classes = list(results.per_class_metrics.keys())
            precisions = [results.per_class_metrics[c]['precision'] for c in classes]
            recalls = [results.per_class_metrics[c]['recall'] for c in classes]
            f1_scores = [results.per_class_metrics[c]['f1_score'] for c in classes]

            ax1.bar(classes, precisions)
            ax1.set_title('Precision by Class')
            ax1.set_ylabel('Precision')
            ax1.tick_params(axis='x', rotation=45)

            ax2.bar(classes, recalls)
            ax2.set_title('Recall by Class')
            ax2.set_ylabel('Recall')
            ax2.tick_params(axis='x', rotation=45)

            ax3.bar(classes, f1_scores)
            ax3.set_title('F1 Score by Class')
            ax3.set_ylabel('F1 Score')
            ax3.tick_params(axis='x', rotation=45)

            plt.tight_layout()
            plt.savefig(output_path / "per_class_metrics.png", dpi=300, bbox_inches='tight')
            plt.close()

    def hyperparameter_search(self, datasets: DatasetDict,
                            param_grid: Dict[str, List[Any]]) -> Dict[str, Any]:
        """Perform hyperparameter search"""
        print("Starting hyperparameter search...")

        best_score = 0
        best_params = {}
        results_log = []

        # Grid search
        param_combinations = self._generate_param_combinations(param_grid)

        for i, params in enumerate(param_combinations):
            print(f"Testing combination {i+1}/{len(param_combinations)}: {params}")

            # Update config with current parameters
            for param, value in params.items():
                setattr(self.config, param, value)

            # Train model with current parameters
            try:
                model, eval_results = self.train_ner_model(datasets)

                # Log results
                result_entry = {
                    "params": params.copy(),
                    "f1_score": eval_results.f1_score,
                    "accuracy": eval_results.accuracy,
                    "precision": eval_results.precision,
                    "recall": eval_results.recall
                }
                results_log.append(result_entry)

                # Update best if this is better
                if eval_results.f1_score > best_score:
                    best_score = eval_results.f1_score
                    best_params = params.copy()

                print(f"F1 Score: {eval_results.f1_score:.4f}")

            except Exception as e:
                print(f"Error with parameters {params}: {e}")
                continue

        # Save hyperparameter search results
        search_results = {
            "best_params": best_params,
            "best_score": best_score,
            "all_results": results_log
        }

        search_path = Path(self.config.output_dir) / "hyperparameter_search.json"
        with open(search_path, 'w') as f:
            json.dump(search_results, f, indent=2)

        print(f"Hyperparameter search complete. Best F1: {best_score:.4f}")
        print(f"Best parameters: {best_params}")

        return search_results

    def _generate_param_combinations(self, param_grid: Dict[str, List[Any]]) -> List[Dict[str, Any]]:
        """Generate all parameter combinations for grid search"""
        from itertools import product

        keys = param_grid.keys()
        values = param_grid.values()
        combinations = []

        for combination in product(*values):
            combinations.append(dict(zip(keys, combination)))

        return combinations

    def cross_validation(self, datasets: DatasetDict, k_folds: int = 5) -> Dict[str, float]:
        """Perform k-fold cross-validation"""
        print(f"Starting {k_folds}-fold cross-validation...")

        # Combine train and validation for CV
        combined_dataset = datasets["train"].concatenate(datasets["validation"])

        fold_size = len(combined_dataset) // k_folds
        cv_results = {"accuracy": [], "precision": [], "recall": [], "f1_score": []}

        for fold in range(k_folds):
            print(f"Fold {fold + 1}/{k_folds}")

            # Create fold splits
            start_idx = fold * fold_size
            end_idx = (fold + 1) * fold_size if fold < k_folds - 1 else len(combined_dataset)

            val_indices = list(range(start_idx, end_idx))
            train_indices = [i for i in range(len(combined_dataset)) if i not in val_indices]

            fold_train = combined_dataset.select(train_indices)
            fold_val = combined_dataset.select(val_indices)

            # Create temporary datasets dict
            fold_datasets = DatasetDict({
                "train": fold_train,
                "validation": fold_val,
                "test": datasets["test"]  # Use original test set
            })

            # Train and evaluate
            try:
                model, eval_results = self.train_ner_model(fold_datasets)

                # Store results
                cv_results["accuracy"].append(eval_results.accuracy)
                cv_results["precision"].append(eval_results.precision)
                cv_results["recall"].append(eval_results.recall)
                cv_results["f1_score"].append(eval_results.f1_score)

            except Exception as e:
                print(f"Error in fold {fold + 1}: {e}")
                continue

        # Calculate means and standard deviations
        cv_summary = {}
        for metric, values in cv_results.items():
            if values:  # Only if we have results
                cv_summary[f"{metric}_mean"] = np.mean(values)
                cv_summary[f"{metric}_std"] = np.std(values)

        print("Cross-validation results:")
        for metric, value in cv_summary.items():
            print(f"{metric}: {value:.4f}")

        return cv_summary

    def cleanup(self):
        """Cleanup experiment tracking"""
        if self.config.use_wandb:
            wandb.finish()

        if self.config.use_mlflow:
            mlflow.end_run()


# Training pipeline runner
def run_training_pipeline(config: TrainingConfig = None):
    """Run the complete training pipeline"""
    if config is None:
        config = TrainingConfig()

    trainer = GolfModelTrainer(config)

    try:
        # Prepare datasets
        datasets = trainer.prepare_datasets()

        # Train NER model
        model, results = trainer.train_ner_model(datasets)

        # Optionally run hyperparameter search
        # param_grid = {
        #     "learning_rate": [1e-5, 2e-5, 3e-5],
        #     "batch_size": [8, 16, 32],
        #     "num_epochs": [3, 5, 7]
        # }
        # search_results = trainer.hyperparameter_search(datasets, param_grid)

        # Optionally run cross-validation
        # cv_results = trainer.cross_validation(datasets)

        print("Training pipeline completed successfully!")
        return model, results

    except Exception as e:
        print(f"Training pipeline failed: {e}")
        raise
    finally:
        trainer.cleanup()


if __name__ == "__main__":
    # Example usage
    config = TrainingConfig(
        num_epochs=3,
        batch_size=16,
        learning_rate=2e-5,
        use_wandb=False,  # Set to True if you have wandb setup
        use_mlflow=False  # Set to True if you have mlflow setup
    )

    model, results = run_training_pipeline(config)