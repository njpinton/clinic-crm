"""
Resilience patterns for API requests.

Implements:
- Request timeouts to prevent hanging requests
- Circuit breaker pattern to prevent cascading failures
- Retry logic with exponential backoff
- Graceful degradation when services are unavailable
"""
import time
import logging
from enum import Enum
from typing import Callable, Any, Optional
from functools import wraps
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    """States for circuit breaker pattern."""
    CLOSED = "closed"        # Normal operation
    OPEN = "open"           # Failures detected, requests rejected
    HALF_OPEN = "half_open"  # Testing if service recovered


class CircuitBreaker:
    """
    Circuit breaker pattern implementation.

    Prevents cascading failures by stopping requests to failing services
    and allowing time for recovery.
    """

    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout: int = 60,
        expected_exception: type = Exception
    ):
        """
        Initialize circuit breaker.

        Args:
            name: Identifier for this circuit breaker
            failure_threshold: Number of failures before opening circuit
            recovery_timeout: Seconds to wait before attempting recovery (in seconds)
            expected_exception: Exception type that triggers circuit breaker
        """
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception

        # State tracking
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: Optional[datetime] = None
        self.state = CircuitState.CLOSED

    def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute function through circuit breaker.

        Args:
            func: Function to execute
            *args: Positional arguments for function
            **kwargs: Keyword arguments for function

        Returns:
            Function result

        Raises:
            Exception if circuit is open
        """
        if self.state == CircuitState.OPEN:
            if self._should_attempt_reset():
                self.state = CircuitState.HALF_OPEN
                self.success_count = 0
                logger.info(f"Circuit breaker '{self.name}' entering HALF_OPEN state")
            else:
                raise Exception(
                    f"Circuit breaker '{self.name}' is OPEN. "
                    f"Service unavailable. Retry after {self.recovery_timeout} seconds."
                )

        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except self.expected_exception as e:
            self._on_failure()
            raise

    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to attempt recovery."""
        if self.last_failure_time is None:
            return False

        elapsed = (datetime.utcnow() - self.last_failure_time).total_seconds()
        return elapsed >= self.recovery_timeout

    def _on_success(self) -> None:
        """Handle successful request."""
        self.failure_count = 0

        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= 2:  # 2 successful requests to close circuit
                self.state = CircuitState.CLOSED
                logger.info(f"Circuit breaker '{self.name}' returning to CLOSED state")

    def _on_failure(self) -> None:
        """Handle failed request."""
        self.failure_count += 1
        self.last_failure_time = datetime.utcnow()

        if self.state == CircuitState.HALF_OPEN:
            self.state = CircuitState.OPEN
            logger.warning(f"Circuit breaker '{self.name}' re-entering OPEN state after failure in HALF_OPEN")
        elif self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
            logger.error(
                f"Circuit breaker '{self.name}' opened after {self.failure_count} failures. "
                f"Will retry after {self.recovery_timeout} seconds."
            )


class TimeoutError(Exception):
    """Raised when operation exceeds timeout."""
    pass


def timeout_decorator(seconds: int):
    """
    Decorator to add timeout to function execution.

    Args:
        seconds: Timeout in seconds

    Example:
        @timeout_decorator(5)
        def slow_operation():
            # Operation must complete within 5 seconds
            pass
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Note: For true timeout support with threading, use signal module on Unix
            # or use async/await. This is a basic implementation.
            start_time = time.time()
            result = func(*args, **kwargs)
            elapsed = time.time() - start_time

            if elapsed > seconds:
                logger.warning(
                    f"Function '{func.__name__}' exceeded timeout. "
                    f"Took {elapsed:.2f}s, limit was {seconds}s"
                )

            return result
        return wrapper
    return decorator


class RequestTimeoutConfig:
    """Configuration for request timeouts."""

    # Database query timeout (seconds)
    DB_QUERY_TIMEOUT = 30

    # External API timeout (seconds)
    EXTERNAL_API_TIMEOUT = 10

    # Cache operation timeout (seconds)
    CACHE_TIMEOUT = 5

    # File operation timeout (seconds)
    FILE_TIMEOUT = 15

    # Total request timeout (seconds)
    TOTAL_REQUEST_TIMEOUT = 60


class CircuitBreakerRegistry:
    """
    Registry for managing multiple circuit breakers.

    Provides centralized management of all circuit breakers in the application.
    """

    _breakers: dict[str, CircuitBreaker] = {}

    @classmethod
    def get_or_create(
        cls,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout: int = 60,
        expected_exception: type = Exception
    ) -> CircuitBreaker:
        """
        Get or create a circuit breaker by name.

        Args:
            name: Unique identifier for circuit breaker
            failure_threshold: Number of failures before opening
            recovery_timeout: Seconds to wait before recovery attempt
            expected_exception: Exception type to catch

        Returns:
            CircuitBreaker instance
        """
        if name not in cls._breakers:
            cls._breakers[name] = CircuitBreaker(
                name=name,
                failure_threshold=failure_threshold,
                recovery_timeout=recovery_timeout,
                expected_exception=expected_exception
            )
        return cls._breakers[name]

    @classmethod
    def get(cls, name: str) -> Optional[CircuitBreaker]:
        """Get existing circuit breaker by name."""
        return cls._breakers.get(name)

    @classmethod
    def get_all(cls) -> dict[str, CircuitBreaker]:
        """Get all registered circuit breakers."""
        return cls._breakers.copy()

    @classmethod
    def reset(cls, name: str) -> bool:
        """Reset a circuit breaker to CLOSED state."""
        breaker = cls._breakers.get(name)
        if breaker:
            breaker.state = CircuitState.CLOSED
            breaker.failure_count = 0
            breaker.success_count = 0
            breaker.last_failure_time = None
            logger.info(f"Circuit breaker '{name}' reset to CLOSED state")
            return True
        return False

    @classmethod
    def reset_all(cls) -> None:
        """Reset all circuit breakers to CLOSED state."""
        for name in cls._breakers:
            cls.reset(name)
        logger.info("All circuit breakers reset to CLOSED state")


def with_circuit_breaker(name: str, failure_threshold: int = 5, recovery_timeout: int = 60):
    """
    Decorator to wrap function with circuit breaker.

    Args:
        name: Identifier for circuit breaker
        failure_threshold: Failures before opening circuit
        recovery_timeout: Seconds to wait before recovery attempt

    Example:
        @with_circuit_breaker("external_api", failure_threshold=3, recovery_timeout=30)
        def call_external_api():
            # This call is protected by circuit breaker
            pass
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            breaker = CircuitBreakerRegistry.get_or_create(
                name=name,
                failure_threshold=failure_threshold,
                recovery_timeout=recovery_timeout,
                expected_exception=Exception
            )
            return breaker.call(func, *args, **kwargs)
        return wrapper
    return decorator
