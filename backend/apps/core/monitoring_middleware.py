"""
Middleware for automatic endpoint monitoring and performance tracking.

Integrates with the monitoring module to track:
- Request duration and performance
- Error rates and categorization
- HTTP status codes
- Per-endpoint statistics
"""
import time
import logging
from django.utils.deprecation import MiddlewareMixin
from django.http import HttpResponse
from apps.core.monitoring import PerformanceMetrics, ErrorTracker

logger = logging.getLogger(__name__)


class PerformanceMonitoringMiddleware(MiddlewareMixin):
    """
    Middleware to track request performance and record metrics.

    Automatically records:
    - Request duration
    - HTTP status code
    - Errors
    - Per-endpoint statistics
    """

    # Endpoints to exclude from monitoring (logging, health checks, etc.)
    EXCLUDED_PATHS = [
        '/health/',
        '/ping/',
        '/api/health/',
        '/static/',
        '/media/',
        '/admin/',
    ]

    def process_request(self, request):
        """Store request start time."""
        request._monitoring_start_time = time.time()
        return None

    def process_response(self, request, response):
        """Record performance metrics on response."""
        # Skip excluded paths
        if self._should_exclude_path(request.path):
            return response

        # Calculate duration
        start_time = getattr(request, '_monitoring_start_time', time.time())
        duration_seconds = time.time() - start_time
        duration_ms = duration_seconds * 1000

        # Get user ID if authenticated
        user_id = None
        if hasattr(request, 'user') and request.user and request.user.is_authenticated:
            user_id = str(request.user.id)

        # Record metric
        PerformanceMetrics.record_endpoint_metric(
            endpoint=request.path,
            method=request.method,
            duration_ms=duration_ms,
            status_code=response.status_code,
            user_id=user_id,
            error=None if 200 <= response.status_code < 400 else response.status_code,
        )

        return response

    def process_exception(self, request, exception):
        """Track exception occurrence."""
        if self._should_exclude_path(request.path):
            return None

        # Get user ID if authenticated
        user_id = None
        if hasattr(request, 'user') and request.user and request.user.is_authenticated:
            user_id = str(request.user.id)

        # Track the error
        status_code = getattr(exception, 'status_code', 500)
        ErrorTracker.track_error(
            error=exception,
            status_code=status_code,
            endpoint=request.path,
            user_id=user_id,
        )

        return None

    @staticmethod
    def _should_exclude_path(path: str) -> bool:
        """Check if path should be excluded from monitoring."""
        for excluded in PerformanceMonitoringMiddleware.EXCLUDED_PATHS:
            if path.startswith(excluded):
                return True
        return False


class ErrorTrackingMiddleware(MiddlewareMixin):
    """
    Middleware to categorize and track errors across the application.

    Provides:
    - Error categorization by type and status code
    - Error rate tracking
    - Integration with Sentry
    """

    def process_exception(self, request, exception):
        """Track and categorize exceptions."""
        status_code = getattr(exception, 'status_code', 500)

        # Skip 404 errors unless in development
        if status_code == 404:
            return None

        # Track the error
        ErrorTracker.track_error(
            error=exception,
            status_code=status_code,
            endpoint=request.path,
            user_id=getattr(request.user, 'id', None) if hasattr(request, 'user') else None,
        )

        return None

    def process_response(self, request, response):
        """Track error status codes in responses."""
        # Track 5xx errors
        if response.status_code >= 500:
            error_msg = f"Server error: {response.status_code} on {request.method} {request.path}"
            ErrorTracker.track_error(
                error=Exception(error_msg),
                status_code=response.status_code,
                endpoint=request.path,
                user_id=getattr(request.user, 'id', None) if hasattr(request, 'user') else None,
            )

        return response
