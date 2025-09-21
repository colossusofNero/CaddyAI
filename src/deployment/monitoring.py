"""
Monitoring and observability system for golf AI models in production.
Tracks performance, detects drift, and provides alerting capabilities.
"""

import time
import json
import asyncio
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from collections import deque, defaultdict
import numpy as np
import logging
from pathlib import Path
import psutil
import requests
from threading import Thread, Lock
import sqlite3

# Monitoring metrics and alerts
@dataclass
class ModelMetrics:
    """Model performance metrics"""
    model_name: str
    timestamp: datetime
    latency_ms: float
    accuracy: Optional[float] = None
    throughput_rps: float = 0.0
    error_rate: float = 0.0
    memory_usage_mb: float = 0.0
    cpu_usage_percent: float = 0.0
    confidence_scores: List[float] = None

    def __post_init__(self):
        if self.confidence_scores is None:
            self.confidence_scores = []


@dataclass
class SystemMetrics:
    """System-level performance metrics"""
    timestamp: datetime
    cpu_percent: float
    memory_percent: float
    disk_usage_percent: float
    network_io: Dict[str, int]
    active_connections: int
    queue_sizes: Dict[str, int]


@dataclass
class Alert:
    """Alert definition and status"""
    alert_id: str
    alert_type: str
    severity: str  # "low", "medium", "high", "critical"
    message: str
    timestamp: datetime
    resolved: bool = False
    metadata: Optional[Dict[str, Any]] = None


class ModelDriftDetector:
    """Detects model drift using statistical tests"""

    def __init__(self, window_size: int = 1000):
        self.window_size = window_size
        self.reference_data = deque(maxlen=window_size)
        self.current_data = deque(maxlen=window_size)
        self.drift_threshold = 0.05  # p-value threshold

    def update_reference_data(self, data: List[float]):
        """Update reference distribution"""
        self.reference_data.extend(data)

    def add_current_data(self, data: float):
        """Add current observation"""
        self.current_data.append(data)

    def detect_drift(self) -> Tuple[bool, float, str]:
        """Detect statistical drift using KS test"""
        if len(self.reference_data) < 100 or len(self.current_data) < 100:
            return False, 1.0, "Insufficient data for drift detection"

        try:
            from scipy.stats import ks_2samp
            statistic, p_value = ks_2samp(list(self.reference_data), list(self.current_data))

            drift_detected = p_value < self.drift_threshold
            confidence = 1 - p_value

            message = f"Drift {'detected' if drift_detected else 'not detected'} (p-value: {p_value:.4f})"

            return drift_detected, confidence, message

        except ImportError:
            # Fallback to simple statistical comparison
            ref_mean = np.mean(list(self.reference_data))
            cur_mean = np.mean(list(self.current_data))
            ref_std = np.std(list(self.reference_data))

            drift_threshold = 2 * ref_std  # 2 standard deviations
            drift_detected = abs(cur_mean - ref_mean) > drift_threshold

            return drift_detected, abs(cur_mean - ref_mean) / ref_std, "Simple drift detection"


class PerformanceMonitor:
    """Monitors model and system performance"""

    def __init__(self, metrics_retention_hours: int = 24):
        self.metrics_retention = timedelta(hours=metrics_retention_hours)
        self.model_metrics = defaultdict(deque)
        self.system_metrics = deque()
        self.drift_detectors = {}
        self.alerts = []
        self.alert_rules = self._setup_alert_rules()
        self.lock = Lock()

        # Performance tracking
        self.request_counts = defaultdict(int)
        self.error_counts = defaultdict(int)
        self.latency_measurements = defaultdict(deque)

        # Database for persistence
        self.db_path = "data/monitoring/metrics.db"
        self._setup_database()

        # Start background monitoring
        self.monitoring_thread = Thread(target=self._monitoring_loop, daemon=True)
        self.is_running = False

    def _setup_database(self):
        """Setup SQLite database for metrics persistence"""
        Path("data/monitoring").mkdir(parents=True, exist_ok=True)

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Create tables
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS model_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                model_name TEXT,
                timestamp TEXT,
                latency_ms REAL,
                accuracy REAL,
                throughput_rps REAL,
                error_rate REAL,
                memory_usage_mb REAL,
                cpu_usage_percent REAL,
                confidence_scores TEXT
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS system_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT,
                cpu_percent REAL,
                memory_percent REAL,
                disk_usage_percent REAL,
                network_io TEXT,
                active_connections INTEGER,
                queue_sizes TEXT
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                alert_id TEXT UNIQUE,
                alert_type TEXT,
                severity TEXT,
                message TEXT,
                timestamp TEXT,
                resolved INTEGER,
                metadata TEXT
            )
        """)

        conn.commit()
        conn.close()

    def _setup_alert_rules(self) -> List[Dict[str, Any]]:
        """Setup alerting rules"""
        return [
            {
                "name": "high_latency",
                "condition": lambda metrics: metrics.latency_ms > 5000,  # 5 seconds
                "severity": "high",
                "message": "High model latency detected"
            },
            {
                "name": "low_accuracy",
                "condition": lambda metrics: metrics.accuracy and metrics.accuracy < 0.7,
                "severity": "critical",
                "message": "Model accuracy below threshold"
            },
            {
                "name": "high_error_rate",
                "condition": lambda metrics: metrics.error_rate > 0.1,  # 10%
                "severity": "high",
                "message": "High error rate detected"
            },
            {
                "name": "high_cpu",
                "condition": lambda metrics: isinstance(metrics, SystemMetrics) and metrics.cpu_percent > 80,
                "severity": "medium",
                "message": "High CPU usage"
            },
            {
                "name": "high_memory",
                "condition": lambda metrics: isinstance(metrics, SystemMetrics) and metrics.memory_percent > 85,
                "severity": "high",
                "message": "High memory usage"
            }
        ]

    def start_monitoring(self):
        """Start the monitoring loop"""
        if not self.is_running:
            self.is_running = True
            self.monitoring_thread.start()
            logging.info("Performance monitoring started")

    def stop_monitoring(self):
        """Stop the monitoring loop"""
        self.is_running = False
        logging.info("Performance monitoring stopped")

    def record_model_metrics(self, model_name: str, latency_ms: float,
                           accuracy: Optional[float] = None,
                           confidence_scores: Optional[List[float]] = None):
        """Record model performance metrics"""
        with self.lock:
            # Calculate throughput and error rate
            current_time = datetime.now()
            window_start = current_time - timedelta(minutes=5)

            # Count recent requests and errors
            recent_requests = sum(1 for ts in self.latency_measurements[model_name]
                                if isinstance(ts, datetime) and ts > window_start)
            recent_errors = self.error_counts[model_name]  # Simplified

            throughput = recent_requests / 300.0  # RPS over 5 minutes
            error_rate = recent_errors / max(recent_requests, 1)

            # System resource usage
            memory_usage = psutil.virtual_memory().used / (1024 * 1024)  # MB
            cpu_usage = psutil.cpu_percent()

            metrics = ModelMetrics(
                model_name=model_name,
                timestamp=current_time,
                latency_ms=latency_ms,
                accuracy=accuracy,
                throughput_rps=throughput,
                error_rate=error_rate,
                memory_usage_mb=memory_usage,
                cpu_usage_percent=cpu_usage,
                confidence_scores=confidence_scores or []
            )

            # Store in memory
            self.model_metrics[model_name].append(metrics)
            self.latency_measurements[model_name].append(latency_ms)
            self.request_counts[model_name] += 1

            # Cleanup old data
            self._cleanup_old_metrics()

            # Store in database
            self._store_model_metrics(metrics)

            # Check for alerts
            self._check_alerts(metrics)

            # Update drift detection
            self._update_drift_detection(model_name, confidence_scores or [])

    def record_error(self, model_name: str, error_type: str, error_message: str):
        """Record model error"""
        with self.lock:
            self.error_counts[model_name] += 1

            # Create error alert
            alert = Alert(
                alert_id=f"error_{model_name}_{int(time.time())}",
                alert_type="model_error",
                severity="medium",
                message=f"Model error in {model_name}: {error_message}",
                timestamp=datetime.now(),
                metadata={"error_type": error_type, "model_name": model_name}
            )

            self.alerts.append(alert)
            self._store_alert(alert)

    def _monitoring_loop(self):
        """Background monitoring loop"""
        while self.is_running:
            try:
                # Collect system metrics
                system_metrics = self._collect_system_metrics()
                self.system_metrics.append(system_metrics)
                self._store_system_metrics(system_metrics)

                # Check system alerts
                self._check_alerts(system_metrics)

                # Cleanup old data
                self._cleanup_old_metrics()

                # Sleep for monitoring interval
                time.sleep(60)  # Monitor every minute

            except Exception as e:
                logging.error(f"Error in monitoring loop: {e}")
                time.sleep(60)

    def _collect_system_metrics(self) -> SystemMetrics:
        """Collect system-level metrics"""
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        network = psutil.net_io_counters()

        return SystemMetrics(
            timestamp=datetime.now(),
            cpu_percent=cpu_percent,
            memory_percent=memory.percent,
            disk_usage_percent=(disk.used / disk.total) * 100,
            network_io={"bytes_sent": network.bytes_sent, "bytes_recv": network.bytes_recv},
            active_connections=len(psutil.net_connections()),
            queue_sizes={}  # Would track actual queue sizes
        )

    def _check_alerts(self, metrics):
        """Check if metrics trigger any alerts"""
        for rule in self.alert_rules:
            try:
                if rule["condition"](metrics):
                    alert_id = f"{rule['name']}_{int(time.time())}"

                    # Check if similar alert already exists
                    existing_alerts = [a for a in self.alerts
                                     if a.alert_type == rule['name'] and not a.resolved
                                     and a.timestamp > datetime.now() - timedelta(hours=1)]

                    if not existing_alerts:
                        alert = Alert(
                            alert_id=alert_id,
                            alert_type=rule['name'],
                            severity=rule['severity'],
                            message=rule['message'],
                            timestamp=datetime.now(),
                            metadata=asdict(metrics) if hasattr(metrics, '__dict__') else {}
                        )

                        self.alerts.append(alert)
                        self._store_alert(alert)
                        self._send_alert_notification(alert)

            except Exception as e:
                logging.error(f"Error checking alert rule {rule['name']}: {e}")

    def _update_drift_detection(self, model_name: str, confidence_scores: List[float]):
        """Update drift detection for model"""
        if not confidence_scores:
            return

        if model_name not in self.drift_detectors:
            self.drift_detectors[model_name] = ModelDriftDetector()

        detector = self.drift_detectors[model_name]

        # Add current data
        avg_confidence = np.mean(confidence_scores)
        detector.add_current_data(avg_confidence)

        # Check for drift periodically
        if len(detector.current_data) % 100 == 0:  # Check every 100 predictions
            drift_detected, confidence, message = detector.detect_drift()

            if drift_detected:
                alert = Alert(
                    alert_id=f"drift_{model_name}_{int(time.time())}",
                    alert_type="model_drift",
                    severity="high",
                    message=f"Model drift detected for {model_name}: {message}",
                    timestamp=datetime.now(),
                    metadata={"confidence": confidence, "model_name": model_name}
                )

                self.alerts.append(alert)
                self._store_alert(alert)

    def _cleanup_old_metrics(self):
        """Remove old metrics beyond retention period"""
        cutoff_time = datetime.now() - self.metrics_retention

        # Cleanup model metrics
        for model_name in self.model_metrics:
            self.model_metrics[model_name] = deque(
                [m for m in self.model_metrics[model_name] if m.timestamp > cutoff_time],
                maxlen=self.model_metrics[model_name].maxlen
            )

        # Cleanup system metrics
        self.system_metrics = deque(
            [m for m in self.system_metrics if m.timestamp > cutoff_time],
            maxlen=self.system_metrics.maxlen
        )

        # Cleanup latency measurements
        for model_name in self.latency_measurements:
            # Keep only recent measurements (simplified cleanup)
            if len(self.latency_measurements[model_name]) > 1000:
                for _ in range(100):
                    self.latency_measurements[model_name].popleft()

    def _store_model_metrics(self, metrics: ModelMetrics):
        """Store model metrics in database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute("""
                INSERT INTO model_metrics (
                    model_name, timestamp, latency_ms, accuracy, throughput_rps,
                    error_rate, memory_usage_mb, cpu_usage_percent, confidence_scores
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                metrics.model_name,
                metrics.timestamp.isoformat(),
                metrics.latency_ms,
                metrics.accuracy,
                metrics.throughput_rps,
                metrics.error_rate,
                metrics.memory_usage_mb,
                metrics.cpu_usage_percent,
                json.dumps(metrics.confidence_scores)
            ))

            conn.commit()
            conn.close()

        except Exception as e:
            logging.error(f"Error storing model metrics: {e}")

    def _store_system_metrics(self, metrics: SystemMetrics):
        """Store system metrics in database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute("""
                INSERT INTO system_metrics (
                    timestamp, cpu_percent, memory_percent, disk_usage_percent,
                    network_io, active_connections, queue_sizes
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                metrics.timestamp.isoformat(),
                metrics.cpu_percent,
                metrics.memory_percent,
                metrics.disk_usage_percent,
                json.dumps(metrics.network_io),
                metrics.active_connections,
                json.dumps(metrics.queue_sizes)
            ))

            conn.commit()
            conn.close()

        except Exception as e:
            logging.error(f"Error storing system metrics: {e}")

    def _store_alert(self, alert: Alert):
        """Store alert in database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute("""
                INSERT OR REPLACE INTO alerts (
                    alert_id, alert_type, severity, message, timestamp, resolved, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                alert.alert_id,
                alert.alert_type,
                alert.severity,
                alert.message,
                alert.timestamp.isoformat(),
                int(alert.resolved),
                json.dumps(alert.metadata) if alert.metadata else None
            ))

            conn.commit()
            conn.close()

        except Exception as e:
            logging.error(f"Error storing alert: {e}")

    def _send_alert_notification(self, alert: Alert):
        """Send alert notification (placeholder for webhook/email/Slack)"""
        logging.warning(f"ALERT [{alert.severity.upper()}]: {alert.message}")

        # In production, implement actual notification systems:
        # - Email notifications
        # - Slack webhooks
        # - PagerDuty integration
        # - Custom webhooks

    def get_metrics_summary(self, model_name: Optional[str] = None,
                          hours: int = 1) -> Dict[str, Any]:
        """Get metrics summary for specified time window"""
        cutoff_time = datetime.now() - timedelta(hours=hours)

        summary = {
            "time_window_hours": hours,
            "models": {},
            "system": {},
            "alerts": []
        }

        # Model metrics summary
        if model_name:
            models_to_check = [model_name]
        else:
            models_to_check = list(self.model_metrics.keys())

        for name in models_to_check:
            recent_metrics = [m for m in self.model_metrics[name] if m.timestamp > cutoff_time]

            if recent_metrics:
                latencies = [m.latency_ms for m in recent_metrics]
                accuracies = [m.accuracy for m in recent_metrics if m.accuracy is not None]
                error_rates = [m.error_rate for m in recent_metrics]

                summary["models"][name] = {
                    "request_count": len(recent_metrics),
                    "avg_latency_ms": np.mean(latencies),
                    "p95_latency_ms": np.percentile(latencies, 95),
                    "avg_accuracy": np.mean(accuracies) if accuracies else None,
                    "avg_error_rate": np.mean(error_rates),
                    "uptime_percent": 100.0  # Simplified
                }

        # System metrics summary
        recent_system = [m for m in self.system_metrics if m.timestamp > cutoff_time]
        if recent_system:
            summary["system"] = {
                "avg_cpu_percent": np.mean([m.cpu_percent for m in recent_system]),
                "avg_memory_percent": np.mean([m.memory_percent for m in recent_system]),
                "avg_disk_percent": np.mean([m.disk_usage_percent for m in recent_system])
            }

        # Recent alerts
        recent_alerts = [a for a in self.alerts if a.timestamp > cutoff_time]
        summary["alerts"] = [
            {
                "alert_type": a.alert_type,
                "severity": a.severity,
                "message": a.message,
                "timestamp": a.timestamp.isoformat(),
                "resolved": a.resolved
            }
            for a in recent_alerts
        ]

        return summary

    def resolve_alert(self, alert_id: str):
        """Resolve an alert"""
        for alert in self.alerts:
            if alert.alert_id == alert_id:
                alert.resolved = True
                self._store_alert(alert)
                logging.info(f"Alert {alert_id} resolved")
                break

    def export_metrics(self, filepath: str, hours: int = 24):
        """Export metrics to JSON file"""
        summary = self.get_metrics_summary(hours=hours)

        with open(filepath, 'w') as f:
            json.dump(summary, f, indent=2, default=str)

        logging.info(f"Metrics exported to {filepath}")


# Context manager for performance tracking
class PerformanceTracker:
    """Context manager for tracking model performance"""

    def __init__(self, monitor: PerformanceMonitor, model_name: str):
        self.monitor = monitor
        self.model_name = model_name
        self.start_time = None

    def __enter__(self):
        self.start_time = time.time()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.start_time:
            latency_ms = (time.time() - self.start_time) * 1000

            if exc_type is not None:
                # Record error
                self.monitor.record_error(
                    self.model_name,
                    exc_type.__name__,
                    str(exc_val)
                )
            else:
                # Record successful execution
                self.monitor.record_model_metrics(
                    self.model_name,
                    latency_ms
                )


# Example usage and testing
def main():
    """Example usage of the monitoring system"""
    monitor = PerformanceMonitor()
    monitor.start_monitoring()

    # Simulate some model calls
    for i in range(10):
        with PerformanceTracker(monitor, "golf_ner") as tracker:
            time.sleep(0.1)  # Simulate model inference

        monitor.record_model_metrics(
            "golf_ner",
            latency_ms=100 + np.random.normal(0, 20),
            accuracy=0.85 + np.random.normal(0, 0.05),
            confidence_scores=[0.9, 0.8, 0.95]
        )

        time.sleep(1)

    # Get metrics summary
    summary = monitor.get_metrics_summary(hours=1)
    print("Metrics Summary:")
    print(json.dumps(summary, indent=2, default=str))

    monitor.stop_monitoring()


if __name__ == "__main__":
    main()