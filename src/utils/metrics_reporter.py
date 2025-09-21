"""
Accuracy metrics and performance reporting system for golf AI models.
Generates comprehensive reports, visualizations, and benchmarks.
"""

import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from pathlib import Path
import sqlite3
from dataclasses import dataclass, asdict
from collections import defaultdict
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import plotly.express as px
from sklearn.metrics import confusion_matrix, classification_report
from jinja2 import Template

@dataclass
class ModelPerformanceReport:
    """Comprehensive model performance report"""
    model_name: str
    evaluation_period: str
    timestamp: datetime

    # Core metrics
    accuracy: float
    precision: float
    recall: float
    f1_score: float

    # Detailed metrics
    per_class_metrics: Dict[str, Dict[str, float]]
    confusion_matrix: List[List[int]]

    # Performance trends
    accuracy_trend: List[Tuple[datetime, float]]
    latency_stats: Dict[str, float]
    throughput_stats: Dict[str, float]

    # User satisfaction
    user_feedback_summary: Dict[str, int]
    satisfaction_score: float

    # Error analysis
    common_errors: List[Dict[str, Any]]
    improvement_suggestions: List[str]

    # Deployment metrics
    uptime_percentage: float
    error_rate: float
    request_volume: int


class MetricsReporter:
    """Generates comprehensive performance reports and visualizations"""

    def __init__(self, db_path: str = "data/monitoring/metrics.db"):
        self.db_path = db_path
        self.report_template_path = "templates/performance_report.html"
        self.output_dir = Path("reports")
        self.output_dir.mkdir(exist_ok=True)

        # Styling for plots
        plt.style.use('seaborn-v0_8')
        sns.set_palette("husl")

    def generate_comprehensive_report(self,
                                    model_name: str,
                                    days: int = 7,
                                    include_visualizations: bool = True) -> ModelPerformanceReport:
        """Generate comprehensive performance report for a model"""

        print(f"Generating comprehensive report for {model_name} (last {days} days)...")

        # Load data from database
        model_data = self._load_model_data(model_name, days)
        feedback_data = self._load_feedback_data(model_name, days)
        system_data = self._load_system_data(days)

        # Calculate core metrics
        core_metrics = self._calculate_core_metrics(model_data, feedback_data)

        # Analyze trends
        trends = self._analyze_trends(model_data)

        # Analyze errors
        error_analysis = self._analyze_errors(model_data, feedback_data)

        # Calculate user satisfaction
        satisfaction = self._calculate_user_satisfaction(feedback_data)

        # Generate report
        report = ModelPerformanceReport(
            model_name=model_name,
            evaluation_period=f"Last {days} days",
            timestamp=datetime.now(),
            **core_metrics,
            **trends,
            **error_analysis,
            **satisfaction
        )

        # Generate visualizations
        if include_visualizations:
            self._generate_visualizations(report, model_name)

        # Save report
        self._save_report(report)

        return report

    def _load_model_data(self, model_name: str, days: int) -> pd.DataFrame:
        """Load model performance data from database"""
        cutoff_date = datetime.now() - timedelta(days=days)

        try:
            conn = sqlite3.connect(self.db_path)

            query = """
                SELECT * FROM model_metrics
                WHERE model_name = ? AND timestamp >= ?
                ORDER BY timestamp
            """

            df = pd.read_sql_query(query, conn,
                                 params=[model_name, cutoff_date.isoformat()])

            if not df.empty:
                df['timestamp'] = pd.to_datetime(df['timestamp'])
                df['confidence_scores'] = df['confidence_scores'].apply(
                    lambda x: json.loads(x) if x else []
                )

            conn.close()
            return df

        except Exception as e:
            print(f"Error loading model data: {e}")
            return pd.DataFrame()

    def _load_feedback_data(self, model_name: str, days: int) -> List[Dict]:
        """Load user feedback data"""
        # In production, this would load from feedback database
        # For now, return mock data
        return [
            {"feedback_type": "recommendation", "rating": 5, "timestamp": datetime.now()},
            {"feedback_type": "prediction", "rating": 4, "timestamp": datetime.now()},
            {"feedback_type": "entity_recognition", "rating": 5, "timestamp": datetime.now()},
        ]

    def _load_system_data(self, days: int) -> pd.DataFrame:
        """Load system metrics data"""
        cutoff_date = datetime.now() - timedelta(days=days)

        try:
            conn = sqlite3.connect(self.db_path)

            query = """
                SELECT * FROM system_metrics
                WHERE timestamp >= ?
                ORDER BY timestamp
            """

            df = pd.read_sql_query(query, conn,
                                 params=[cutoff_date.isoformat()])

            if not df.empty:
                df['timestamp'] = pd.to_datetime(df['timestamp'])

            conn.close()
            return df

        except Exception as e:
            print(f"Error loading system data: {e}")
            return pd.DataFrame()

    def _calculate_core_metrics(self, model_data: pd.DataFrame,
                               feedback_data: List[Dict]) -> Dict[str, Any]:
        """Calculate core performance metrics"""

        if model_data.empty:
            return {
                "accuracy": 0.0,
                "precision": 0.0,
                "recall": 0.0,
                "f1_score": 0.0,
                "per_class_metrics": {},
                "confusion_matrix": [],
                "request_volume": 0,
                "error_rate": 0.0,
                "uptime_percentage": 0.0
            }

        # Calculate aggregate metrics
        avg_accuracy = model_data['accuracy'].dropna().mean() if 'accuracy' in model_data.columns else 0.0
        avg_error_rate = model_data['error_rate'].mean() if 'error_rate' in model_data.columns else 0.0
        request_volume = len(model_data)

        # Calculate uptime (simplified - based on data availability)
        expected_data_points = 24 * 7  # Hourly data points for a week
        actual_data_points = len(model_data)
        uptime_percentage = min(100.0, (actual_data_points / expected_data_points) * 100)

        # Mock detailed metrics (in production, calculate from actual data)
        per_class_metrics = {
            "DISTANCE": {"precision": 0.92, "recall": 0.89, "f1_score": 0.90},
            "CLUB": {"precision": 0.88, "recall": 0.91, "f1_score": 0.89},
            "HAZARD": {"precision": 0.85, "recall": 0.87, "f1_score": 0.86},
            "CONDITION": {"precision": 0.83, "recall": 0.80, "f1_score": 0.81}
        }

        confusion_matrix_data = [
            [45, 2, 1, 0],
            [3, 42, 2, 1],
            [1, 1, 38, 2],
            [0, 2, 1, 35]
        ]

        return {
            "accuracy": avg_accuracy,
            "precision": 0.87,  # Would calculate from actual data
            "recall": 0.87,
            "f1_score": 0.87,
            "per_class_metrics": per_class_metrics,
            "confusion_matrix": confusion_matrix_data,
            "request_volume": request_volume,
            "error_rate": avg_error_rate,
            "uptime_percentage": uptime_percentage
        }

    def _analyze_trends(self, model_data: pd.DataFrame) -> Dict[str, Any]:
        """Analyze performance trends over time"""

        trends = {
            "accuracy_trend": [],
            "latency_stats": {},
            "throughput_stats": {}
        }

        if model_data.empty:
            return trends

        # Accuracy trend
        if 'accuracy' in model_data.columns:
            accuracy_trend = []
            for _, row in model_data.iterrows():
                if pd.notna(row['accuracy']):
                    accuracy_trend.append((row['timestamp'], row['accuracy']))
            trends["accuracy_trend"] = accuracy_trend

        # Latency statistics
        if 'latency_ms' in model_data.columns:
            latency_data = model_data['latency_ms'].dropna()
            trends["latency_stats"] = {
                "mean": latency_data.mean(),
                "median": latency_data.median(),
                "p95": latency_data.quantile(0.95),
                "p99": latency_data.quantile(0.99),
                "max": latency_data.max(),
                "min": latency_data.min()
            }

        # Throughput statistics
        if 'throughput_rps' in model_data.columns:
            throughput_data = model_data['throughput_rps'].dropna()
            trends["throughput_stats"] = {
                "mean": throughput_data.mean(),
                "median": throughput_data.median(),
                "max": throughput_data.max(),
                "min": throughput_data.min()
            }

        return trends

    def _analyze_errors(self, model_data: pd.DataFrame,
                       feedback_data: List[Dict]) -> Dict[str, Any]:
        """Analyze common errors and issues"""

        # Mock error analysis (in production, analyze actual error data)
        common_errors = [
            {
                "error_type": "Entity Recognition",
                "description": "Difficulty identifying compound club names",
                "frequency": 12,
                "impact": "medium"
            },
            {
                "error_type": "Distance Estimation",
                "description": "Overestimating distances in windy conditions",
                "frequency": 8,
                "impact": "high"
            },
            {
                "error_type": "Context Understanding",
                "description": "Missing previous shot context in recommendations",
                "frequency": 5,
                "impact": "low"
            }
        ]

        improvement_suggestions = [
            "Increase training data for compound club names (e.g., '3-hybrid', 'gap wedge')",
            "Improve wind adjustment algorithms for distance calculations",
            "Enhance conversation context retention beyond single interactions",
            "Add more diverse weather condition training scenarios",
            "Implement user feedback integration for real-time model updates"
        ]

        return {
            "common_errors": common_errors,
            "improvement_suggestions": improvement_suggestions
        }

    def _calculate_user_satisfaction(self, feedback_data: List[Dict]) -> Dict[str, Any]:
        """Calculate user satisfaction metrics"""

        if not feedback_data:
            return {
                "user_feedback_summary": {},
                "satisfaction_score": 0.0
            }

        # Aggregate feedback
        feedback_summary = defaultdict(int)
        total_ratings = []

        for feedback in feedback_data:
            feedback_type = feedback.get("feedback_type", "unknown")
            rating = feedback.get("rating", 3)

            feedback_summary[feedback_type] += 1
            total_ratings.append(rating)

        # Calculate satisfaction score (0-1 scale)
        if total_ratings:
            avg_rating = np.mean(total_ratings)
            satisfaction_score = (avg_rating - 1) / 4  # Convert 1-5 scale to 0-1
        else:
            satisfaction_score = 0.0

        return {
            "user_feedback_summary": dict(feedback_summary),
            "satisfaction_score": satisfaction_score
        }

    def _generate_visualizations(self, report: ModelPerformanceReport, model_name: str):
        """Generate comprehensive visualizations"""

        viz_dir = self.output_dir / "visualizations" / model_name
        viz_dir.mkdir(parents=True, exist_ok=True)

        # 1. Accuracy trend over time
        if report.accuracy_trend:
            self._plot_accuracy_trend(report.accuracy_trend, viz_dir)

        # 2. Confusion matrix heatmap
        if report.confusion_matrix:
            self._plot_confusion_matrix(report.confusion_matrix, viz_dir)

        # 3. Per-class performance metrics
        if report.per_class_metrics:
            self._plot_per_class_metrics(report.per_class_metrics, viz_dir)

        # 4. Latency distribution
        if report.latency_stats:
            self._plot_latency_distribution(report.latency_stats, viz_dir)

        # 5. Performance dashboard
        self._create_performance_dashboard(report, viz_dir)

        print(f"Visualizations saved to {viz_dir}")

    def _plot_accuracy_trend(self, accuracy_trend: List[Tuple], viz_dir: Path):
        """Plot accuracy trend over time"""
        if not accuracy_trend:
            return

        timestamps, accuracies = zip(*accuracy_trend)

        plt.figure(figsize=(12, 6))
        plt.plot(timestamps, accuracies, marker='o', linewidth=2, markersize=4)
        plt.title('Model Accuracy Trend Over Time', fontsize=16, fontweight='bold')
        plt.xlabel('Time', fontsize=12)
        plt.ylabel('Accuracy', fontsize=12)
        plt.ylim(0, 1)
        plt.grid(True, alpha=0.3)
        plt.xticks(rotation=45)
        plt.tight_layout()

        # Add trend line
        x_numeric = np.arange(len(timestamps))
        z = np.polyfit(x_numeric, accuracies, 1)
        p = np.poly1d(z)
        plt.plot(timestamps, p(x_numeric), "--", alpha=0.8, color='red',
                label=f'Trend: {z[0]:.4f} per unit time')
        plt.legend()

        plt.savefig(viz_dir / 'accuracy_trend.png', dpi=300, bbox_inches='tight')
        plt.close()

    def _plot_confusion_matrix(self, cm_data: List[List[int]], viz_dir: Path):
        """Plot confusion matrix heatmap"""
        classes = ['DISTANCE', 'CLUB', 'HAZARD', 'CONDITION']

        plt.figure(figsize=(8, 6))
        sns.heatmap(cm_data, annot=True, fmt='d', cmap='Blues',
                   xticklabels=classes, yticklabels=classes)
        plt.title('Confusion Matrix - Entity Recognition', fontsize=16, fontweight='bold')
        plt.ylabel('True Label', fontsize=12)
        plt.xlabel('Predicted Label', fontsize=12)
        plt.tight_layout()

        plt.savefig(viz_dir / 'confusion_matrix.png', dpi=300, bbox_inches='tight')
        plt.close()

    def _plot_per_class_metrics(self, metrics: Dict[str, Dict[str, float]], viz_dir: Path):
        """Plot per-class performance metrics"""
        classes = list(metrics.keys())
        precision_scores = [metrics[cls]['precision'] for cls in classes]
        recall_scores = [metrics[cls]['recall'] for cls in classes]
        f1_scores = [metrics[cls]['f1_score'] for cls in classes]

        x = np.arange(len(classes))
        width = 0.25

        plt.figure(figsize=(12, 6))
        plt.bar(x - width, precision_scores, width, label='Precision', alpha=0.8)
        plt.bar(x, recall_scores, width, label='Recall', alpha=0.8)
        plt.bar(x + width, f1_scores, width, label='F1 Score', alpha=0.8)

        plt.title('Per-Class Performance Metrics', fontsize=16, fontweight='bold')
        plt.xlabel('Entity Classes', fontsize=12)
        plt.ylabel('Score', fontsize=12)
        plt.xticks(x, classes)
        plt.ylim(0, 1)
        plt.legend()
        plt.grid(True, alpha=0.3, axis='y')
        plt.tight_layout()

        plt.savefig(viz_dir / 'per_class_metrics.png', dpi=300, bbox_inches='tight')
        plt.close()

    def _plot_latency_distribution(self, latency_stats: Dict[str, float], viz_dir: Path):
        """Plot latency distribution and statistics"""
        # Generate sample data based on statistics
        mean = latency_stats.get('mean', 100)
        std = mean * 0.3  # Approximate std dev
        sample_data = np.random.normal(mean, std, 1000)
        sample_data = np.clip(sample_data, 0, latency_stats.get('max', mean * 3))

        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))

        # Histogram
        ax1.hist(sample_data, bins=30, alpha=0.7, color='skyblue', edgecolor='black')
        ax1.axvline(latency_stats.get('mean', 0), color='red', linestyle='--',
                   label=f'Mean: {latency_stats.get("mean", 0):.1f}ms')
        ax1.axvline(latency_stats.get('p95', 0), color='orange', linestyle='--',
                   label=f'P95: {latency_stats.get("p95", 0):.1f}ms')
        ax1.set_title('Latency Distribution', fontsize=14, fontweight='bold')
        ax1.set_xlabel('Latency (ms)', fontsize=12)
        ax1.set_ylabel('Frequency', fontsize=12)
        ax1.legend()
        ax1.grid(True, alpha=0.3)

        # Box plot
        ax2.boxplot(sample_data, vert=True)
        ax2.set_title('Latency Box Plot', fontsize=14, fontweight='bold')
        ax2.set_ylabel('Latency (ms)', fontsize=12)
        ax2.grid(True, alpha=0.3)

        plt.tight_layout()
        plt.savefig(viz_dir / 'latency_distribution.png', dpi=300, bbox_inches='tight')
        plt.close()

    def _create_performance_dashboard(self, report: ModelPerformanceReport, viz_dir: Path):
        """Create comprehensive performance dashboard"""

        # Create subplots
        fig = make_subplots(
            rows=2, cols=2,
            subplot_titles=('Key Metrics', 'Performance Trend', 'Error Breakdown', 'User Satisfaction'),
            specs=[[{'type': 'indicator'}, {'type': 'scatter'}],
                   [{'type': 'bar'}, {'type': 'pie'}]]
        )

        # Key metrics gauge
        fig.add_trace(
            go.Indicator(
                mode="gauge+number+delta",
                value=report.accuracy * 100,
                domain={'x': [0, 1], 'y': [0, 1]},
                title={'text': "Accuracy %"},
                gauge={
                    'axis': {'range': [None, 100]},
                    'bar': {'color': "darkblue"},
                    'steps': [
                        {'range': [0, 70], 'color': "lightgray"},
                        {'range': [70, 85], 'color': "yellow"},
                        {'range': [85, 100], 'color': "green"}
                    ],
                    'threshold': {
                        'line': {'color': "red", 'width': 4},
                        'thickness': 0.75,
                        'value': 90
                    }
                }
            ),
            row=1, col=1
        )

        # Performance trend
        if report.accuracy_trend:
            timestamps, accuracies = zip(*report.accuracy_trend)
            fig.add_trace(
                go.Scatter(
                    x=timestamps,
                    y=[a * 100 for a in accuracies],
                    mode='lines+markers',
                    name='Accuracy %',
                    line=dict(color='blue', width=2)
                ),
                row=1, col=2
            )

        # Error breakdown
        if report.common_errors:
            error_types = [e['error_type'] for e in report.common_errors]
            error_counts = [e['frequency'] for e in report.common_errors]

            fig.add_trace(
                go.Bar(
                    x=error_types,
                    y=error_counts,
                    name='Errors',
                    marker_color='red'
                ),
                row=2, col=1
            )

        # User satisfaction
        if report.user_feedback_summary:
            feedback_types = list(report.user_feedback_summary.keys())
            feedback_counts = list(report.user_feedback_summary.values())

            fig.add_trace(
                go.Pie(
                    labels=feedback_types,
                    values=feedback_counts,
                    name="Feedback"
                ),
                row=2, col=2
            )

        fig.update_layout(
            height=800,
            title_text=f"Performance Dashboard - {report.model_name}",
            title_font_size=20,
            showlegend=False
        )

        fig.write_html(viz_dir / 'performance_dashboard.html')
        print(f"Interactive dashboard saved to {viz_dir / 'performance_dashboard.html'}")

    def _save_report(self, report: ModelPerformanceReport):
        """Save report to JSON and generate HTML report"""

        # Save JSON report
        report_path = self.output_dir / f"{report.model_name}_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        with open(report_path, 'w') as f:
            json.dump(asdict(report), f, indent=2, default=str)

        # Generate HTML report
        self._generate_html_report(report)

        print(f"Report saved to {report_path}")

    def _generate_html_report(self, report: ModelPerformanceReport):
        """Generate HTML report using template"""

        html_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>{{ report.model_name }} Performance Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                .header { background-color: #f4f4f4; padding: 20px; border-radius: 5px; }
                .metric { display: inline-block; margin: 10px; padding: 15px; background-color: #e9e9e9; border-radius: 5px; }
                .section { margin: 30px 0; }
                .error-item { margin: 10px 0; padding: 10px; background-color: #ffebee; border-radius: 3px; }
                .suggestion { margin: 5px 0; padding: 8px; background-color: #e8f5e8; border-radius: 3px; }
                table { border-collapse: collapse; width: 100%; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>{{ report.model_name }} Performance Report</h1>
                <p><strong>Evaluation Period:</strong> {{ report.evaluation_period }}</p>
                <p><strong>Generated:</strong> {{ report.timestamp }}</p>
            </div>

            <div class="section">
                <h2>Key Metrics</h2>
                <div class="metric">
                    <strong>Accuracy:</strong> {{ "%.2f%%" | format(report.accuracy * 100) }}
                </div>
                <div class="metric">
                    <strong>Precision:</strong> {{ "%.2f%%" | format(report.precision * 100) }}
                </div>
                <div class="metric">
                    <strong>Recall:</strong> {{ "%.2f%%" | format(report.recall * 100) }}
                </div>
                <div class="metric">
                    <strong>F1 Score:</strong> {{ "%.2f%%" | format(report.f1_score * 100) }}
                </div>
                <div class="metric">
                    <strong>Uptime:</strong> {{ "%.1f%%" | format(report.uptime_percentage) }}
                </div>
                <div class="metric">
                    <strong>Satisfaction:</strong> {{ "%.1f%%" | format(report.satisfaction_score * 100) }}
                </div>
            </div>

            <div class="section">
                <h2>Performance Statistics</h2>
                <table>
                    <tr>
                        <th>Metric</th>
                        <th>Value</th>
                    </tr>
                    <tr>
                        <td>Request Volume</td>
                        <td>{{ "{:,}".format(report.request_volume) }}</td>
                    </tr>
                    <tr>
                        <td>Error Rate</td>
                        <td>{{ "%.2f%%" | format(report.error_rate * 100) }}</td>
                    </tr>
                    {% if report.latency_stats %}
                    <tr>
                        <td>Avg Latency</td>
                        <td>{{ "%.1f ms" | format(report.latency_stats.mean) }}</td>
                    </tr>
                    <tr>
                        <td>P95 Latency</td>
                        <td>{{ "%.1f ms" | format(report.latency_stats.p95) }}</td>
                    </tr>
                    {% endif %}
                </table>
            </div>

            <div class="section">
                <h2>Common Issues</h2>
                {% for error in report.common_errors %}
                <div class="error-item">
                    <strong>{{ error.error_type }}</strong> ({{ error.frequency }} occurrences)
                    <br>{{ error.description }}
                </div>
                {% endfor %}
            </div>

            <div class="section">
                <h2>Improvement Suggestions</h2>
                {% for suggestion in report.improvement_suggestions %}
                <div class="suggestion">{{ suggestion }}</div>
                {% endfor %}
            </div>
        </body>
        </html>
        """

        template = Template(html_template)
        html_content = template.render(report=report)

        html_path = self.output_dir / f"{report.model_name}_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"

        with open(html_path, 'w') as f:
            f.write(html_content)

        print(f"HTML report saved to {html_path}")

    def generate_benchmark_comparison(self, model_names: List[str], days: int = 7) -> Dict[str, Any]:
        """Generate benchmark comparison between multiple models"""

        comparison_data = {}

        for model_name in model_names:
            report = self.generate_comprehensive_report(model_name, days, include_visualizations=False)
            comparison_data[model_name] = {
                "accuracy": report.accuracy,
                "precision": report.precision,
                "recall": report.recall,
                "f1_score": report.f1_score,
                "satisfaction_score": report.satisfaction_score,
                "uptime_percentage": report.uptime_percentage,
                "error_rate": report.error_rate,
                "request_volume": report.request_volume
            }

        # Create comparison visualization
        self._create_benchmark_visualization(comparison_data)

        return comparison_data

    def _create_benchmark_visualization(self, comparison_data: Dict[str, Dict[str, float]]):
        """Create benchmark comparison visualization"""

        models = list(comparison_data.keys())
        metrics = ['accuracy', 'precision', 'recall', 'f1_score']

        fig, axes = plt.subplots(2, 2, figsize=(15, 10))
        axes = axes.flatten()

        for i, metric in enumerate(metrics):
            values = [comparison_data[model][metric] * 100 for model in models]

            axes[i].bar(models, values, alpha=0.7, color=plt.cm.Set3(np.arange(len(models))))
            axes[i].set_title(f'{metric.title()} Comparison', fontweight='bold')
            axes[i].set_ylabel('Score (%)')
            axes[i].set_ylim(0, 100)
            axes[i].grid(True, alpha=0.3, axis='y')

            # Add value labels on bars
            for j, v in enumerate(values):
                axes[i].text(j, v + 1, f'{v:.1f}%', ha='center', fontweight='bold')

        plt.suptitle('Model Performance Benchmark', fontsize=16, fontweight='bold')
        plt.tight_layout()

        benchmark_path = self.output_dir / 'model_benchmark_comparison.png'
        plt.savefig(benchmark_path, dpi=300, bbox_inches='tight')
        plt.close()

        print(f"Benchmark comparison saved to {benchmark_path}")


# Example usage
def main():
    """Example usage of the metrics reporter"""

    reporter = MetricsReporter()

    # Generate comprehensive report for a single model
    report = reporter.generate_comprehensive_report("golf_ner", days=7)

    print("Report Summary:")
    print(f"Model: {report.model_name}")
    print(f"Accuracy: {report.accuracy:.2%}")
    print(f"F1 Score: {report.f1_score:.2%}")
    print(f"Satisfaction: {report.satisfaction_score:.2%}")
    print(f"Uptime: {report.uptime_percentage:.1f}%")

    # Generate benchmark comparison
    models_to_compare = ["golf_ner", "recommendation_engine", "context_manager"]
    comparison = reporter.generate_benchmark_comparison(models_to_compare)

    print("\nBenchmark Comparison:")
    for model, metrics in comparison.items():
        print(f"{model}: Accuracy={metrics['accuracy']:.2%}, F1={metrics['f1_score']:.2%}")


if __name__ == "__main__":
    main()