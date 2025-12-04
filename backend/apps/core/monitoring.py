"""
Comprehensive monitoring and observability for Clinic CRM.

Implements:
- Custom performance metrics tracking
- Error categorization and alerts
- Endpoint-specific performance monitoring
- Deployment and release tracking
- HIPAA-compliant logging
"""
import time
import logging
import sentry_sdk
from functools import wraps
from datetime import datetime, timedelta
from typing import Callable, Any, Optional, Dict
from django.utils import timezone
from django.core.cache import cache

logger = logging.getLogger(__name__)


class PerformanceMetrics:
    """Track and monitor endpoint performance metrics."""

    # Performance thresholds (milliseconds)
    THRESHOLDS = {
        'critical': 5000,      # Critical: > 5 seconds
        'warning': 2000,       # Warning: > 2 seconds
        'slow': 500,           # Slow: > 500ms
        'normal': 100,         # Normal: < 100ms
    }

    # Cache keys
    CACHE_PREFIX = 'clinic_perf'
    ENDPOINT_STATS = f'{CACHE_PREFIX}:endpoint_stats'
    ERROR_COUNT = f'{CACHE_PREFIX}:error_count'

    @staticmethod
    def record_endpoint_metric(
        endpoint: str,
        method: str,
        duration_ms: float,
        status_code: int,
        error: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> None:
        """
        Record performance metric for an endpoint.

        Args:
            endpoint: API endpoint path
            method: HTTP method (GET, POST, etc.)
            duration_ms: Request duration in milliseconds
            status_code: HTTP response status code
            error: Error message if request failed
            user_id: User ID for tracking per-user performance
        """
        metric_key = f'{PerformanceMetrics.ENDPOINT_STATS}:{endpoint}:{method}'

        # Get existing stats
        stats = cache.get(metric_key, {
            'total_requests': 0,
            'total_duration': 0,
            'error_count': 0,
            'status_codes': {},
            'last_updated': None,
        })

        # Update stats
        stats['total_requests'] += 1
        stats['total_duration'] += duration_ms
        stats['status_codes'][str(status_code)] = stats['status_codes'].get(str(status_code), 0) + 1
        stats['last_updated'] = datetime.utcnow().isoformat()

        if error:
            stats['error_count'] += 1

        # Cache for 24 hours
        cache.set(metric_key, stats, 86400)

        # Determine severity level
        severity = PerformanceMetrics._get_severity(duration_ms, status_code)

        # Log to Sentry with performance tags
        if severity in ['critical', 'warning'] or status_code >= 500:
            sentry_sdk.capture_message(
                f"Endpoint performance alert: {method} {endpoint}",
                level='warning' if severity == 'warning' else 'error',
                tags={
                    'endpoint': endpoint,
                    'method': method,
                    'severity': severity,
                    'duration_ms': int(duration_ms),
                    'status_code': status_code,
                },
                extra={
                    'average_duration_ms': stats['total_duration'] / stats['total_requests'],
                    'total_requests': stats['total_requests'],
                    'error_count': stats['error_count'],
                }
            )

    @staticmethod
    def _get_severity(duration_ms: float, status_code: int) -> str:
        """Determine severity level based on duration and status code."""
        if status_code >= 500:
            return 'critical'
        if duration_ms >= PerformanceMetrics.THRESHOLDS['critical']:
            return 'critical'
        if duration_ms >= PerformanceMetrics.THRESHOLDS['warning']:
            return 'warning'
        if duration_ms >= PerformanceMetrics.THRESHOLDS['slow']:
            return 'slow'
        return 'normal'

    @staticmethod
    def get_endpoint_stats(endpoint: str, method: str) -> Optional[Dict[str, Any]]:
        """Retrieve cached statistics for an endpoint."""
        metric_key = f'{PerformanceMetrics.ENDPOINT_STATS}:{endpoint}:{method}'
        return cache.get(metric_key)

    @staticmethod
    def get_all_endpoint_stats() -> Dict[str, Any]:
        """Retrieve statistics for all monitored endpoints."""
        # This would typically query Redis directly for performance stats
        # For now, return a summary structure
        return {
            'last_updated': datetime.utcnow().isoformat(),
            'cache_prefix': PerformanceMetrics.CACHE_PREFIX,
            'note': 'Query cache directly for detailed endpoint statistics'
        }


class ErrorTracker:
    """Track and categorize application errors."""

    # Error categories
    CATEGORIES = {
        'authentication': 'Authentication/Authorization errors',
        'validation': 'Data validation errors',
        'not_found': 'Resource not found (404)',
        'conflict': 'Resource conflict (409)',
        'server_error': 'Server errors (5xx)',
        'external_service': 'External service failures',
        'database': 'Database operation errors',
        'timeout': 'Request timeout errors',
        'rate_limit': 'Rate limiting errors',
    }

    @staticmethod
    def categorize_error(error: Exception, status_code: int) -> str:
        """
        Categorize an error based on type and status code.

        Args:
            error: Exception instance
            status_code: HTTP status code

        Returns:
            Error category string
        """
        error_type = type(error).__name__
        error_message = str(error).lower()

        # Status code based categorization
        if status_code == 401 or status_code == 403:
            return 'authentication'
        if status_code == 404:
            return 'not_found'
        if status_code == 409:
            return 'conflict'
        if status_code == 429:
            return 'rate_limit'
        if status_code >= 500:
            return 'server_error'

        # Error type based categorization
        if 'authentication' in error_message or 'auth' in error_type.lower():
            return 'authentication'
        if 'validation' in error_message or 'serializer' in error_type.lower():
            return 'validation'
        if 'database' in error_message or 'db' in error_type.lower():
            return 'database'
        if 'timeout' in error_message:
            return 'timeout'
        if 'connection' in error_message or 'network' in error_message:
            return 'external_service'

        return 'server_error'

    @staticmethod
    def track_error(
        error: Exception,
        status_code: int,
        endpoint: str,
        user_id: Optional[str] = None
    ) -> None:
        """
        Track an error occurrence.

        Args:
            error: Exception instance
            status_code: HTTP status code
            endpoint: API endpoint where error occurred
            user_id: User ID if applicable
        """
        category = ErrorTracker.categorize_error(error, status_code)
        cache_key = f'{PerformanceMetrics.CACHE_PREFIX}:error:{category}'

        # Increment error counter
        current_count = cache.get(cache_key, 0)
        cache.set(cache_key, current_count + 1, 86400)  # 24 hour window

        # Log to Sentry with categorization
        sentry_sdk.capture_exception(
            error,
            tags={
                'error_category': category,
                'endpoint': endpoint,
                'status_code': status_code,
            },
            level='warning' if status_code < 500 else 'error'
        )

    @staticmethod
    def get_error_stats() -> Dict[str, int]:
        """Get error statistics by category."""
        stats = {}
        for category in ErrorTracker.CATEGORIES.keys():
            cache_key = f'{PerformanceMetrics.CACHE_PREFIX}:error:{category}'
            count = cache.get(cache_key, 0)
            if count > 0:
                stats[category] = count
        return stats


class MonitoringDecorators:
    """Decorators for automatic monitoring of functions and endpoints."""

    @staticmethod
    def monitor_performance(name: str = None, threshold_ms: float = 1000):
        """
        Decorator to monitor function performance.

        Args:
            name: Optional name for the monitored function
            threshold_ms: Threshold in milliseconds for warnings

        Example:
            @monitor_performance('expensive_operation', threshold_ms=500)
            def expensive_operation():
                # Expensive code here
                pass
        """
        def decorator(func: Callable) -> Callable:
            func_name = name or func.__name__

            @wraps(func)
            def wrapper(*args, **kwargs) -> Any:
                start_time = time.time()
                try:
                    result = func(*args, **kwargs)
                    return result
                finally:
                    duration_ms = (time.time() - start_time) * 1000

                    # Record metric
                    if duration_ms > threshold_ms:
                        logger.warning(
                            f"Slow operation: {func_name} took {duration_ms:.2f}ms (threshold: {threshold_ms}ms)"
                        )
                        sentry_sdk.capture_message(
                            f"Slow operation detected: {func_name}",
                            level='warning',
                            tags={'operation': func_name},
                            extra={'duration_ms': duration_ms}
                        )

            return wrapper
        return decorator

    @staticmethod
    def monitor_database_query(query_type: str = 'SELECT'):
        """
        Decorator to monitor database query performance.

        Args:
            query_type: Type of query (SELECT, INSERT, UPDATE, DELETE)

        Example:
            @monitor_database_query('SELECT')
            def get_patient_data(patient_id):
                # Database query here
                pass
        """
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            def wrapper(*args, **kwargs) -> Any:
                start_time = time.time()
                try:
                    result = func(*args, **kwargs)
                    return result
                finally:
                    duration_ms = (time.time() - start_time) * 1000

                    # Log slow queries (> 1 second)
                    if duration_ms > 1000:
                        logger.warning(
                            f"Slow database {query_type}: {func.__name__} took {duration_ms:.2f}ms"
                        )
                        sentry_sdk.capture_message(
                            f"Slow database query: {func.__name__}",
                            level='warning',
                            tags={
                                'query_type': query_type,
                                'function': func.__name__,
                            },
                            extra={'duration_ms': duration_ms}
                        )

            return wrapper
        return decorator


class ReleaseTracking:
    """Track deployments and releases for better error correlation."""

    @staticmethod
    def set_release_info(version: str, environment: str = 'production') -> None:
        """
        Set release and environment information in Sentry.

        Args:
            version: Release version (e.g., '1.0.0', 'git-commit-hash')
            environment: Environment name (development, staging, production)
        """
        sentry_sdk.set_tag('release', version)
        sentry_sdk.set_tag('environment', environment)
        sentry_sdk.set_context('release', {
            'version': version,
            'environment': environment,
            'timestamp': datetime.utcnow().isoformat(),
        })

        logger.info(f"Release tracking: {version} in {environment}")

    @staticmethod
    def track_deployment(
        version: str,
        environment: str,
        deployed_by: str,
        changes: Optional[str] = None
    ) -> None:
        """
        Track deployment event.

        Args:
            version: Release version
            environment: Deployment environment
            deployed_by: User who performed deployment
            changes: Summary of changes in this release
        """
        ReleaseTracking.set_release_info(version, environment)

        sentry_sdk.capture_message(
            f"Deployment: {version} to {environment}",
            level='info',
            tags={
                'event_type': 'deployment',
                'version': version,
                'environment': environment,
            },
            extra={
                'deployed_by': deployed_by,
                'changes': changes,
                'timestamp': datetime.utcnow().isoformat(),
            }
        )

        logger.info(f"Deployment tracked: {version} to {environment} by {deployed_by}")


class HealthCheck:
    """Health check status and monitoring."""

    # Health check status
    STATUS_HEALTHY = 'healthy'
    STATUS_DEGRADED = 'degraded'
    STATUS_CRITICAL = 'critical'

    HEALTH_CHECK_CACHE_KEY = f'{PerformanceMetrics.CACHE_PREFIX}:health_status'

    @staticmethod
    def set_health_status(
        service: str,
        status: str,
        details: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Update health status for a service component.

        Args:
            service: Service name (e.g., 'database', 'redis', 'external_api')
            status: Status (healthy, degraded, critical)
            details: Additional status details
        """
        health_data = cache.get(HealthCheck.HEALTH_CHECK_CACHE_KEY, {})

        health_data[service] = {
            'status': status,
            'timestamp': datetime.utcnow().isoformat(),
            'details': details or {},
        }

        cache.set(HealthCheck.HEALTH_CHECK_CACHE_KEY, health_data, 300)  # 5 minute cache

        # Alert on critical status
        if status == HealthCheck.STATUS_CRITICAL:
            sentry_sdk.capture_message(
                f"CRITICAL: {service} health check failed",
                level='error',
                tags={'service': service, 'health_status': status}
            )

    @staticmethod
    def get_health_status() -> Dict[str, Any]:
        """Retrieve overall health status of all services."""
        return cache.get(HealthCheck.HEALTH_CHECK_CACHE_KEY, {
            'overall_status': HealthCheck.STATUS_HEALTHY,
            'services': {},
            'timestamp': datetime.utcnow().isoformat(),
        })

    @staticmethod
    def is_healthy() -> bool:
        """Check if all services are healthy."""
        health = HealthCheck.get_health_status()
        if not health.get('services'):
            return True  # No checks yet

        return all(
            service_status.get('status') != HealthCheck.STATUS_CRITICAL
            for service_status in health.get('services', {}).values()
        )
