"""Circuit breaker for OpenAI API calls to prevent cascading failures."""
from pybreaker import CircuitBreaker, CircuitBreakerListener
import logging

logger = logging.getLogger(__name__)


# Circuit breaker for OpenAI API
openai_breaker = CircuitBreaker(
    fail_max=5,           # Open circuit after 5 consecutive failures
    reset_timeout=60,     # Keep circuit open for 60 seconds
    name="openai_api"
)


class LoggingListener(CircuitBreakerListener):
    """Listener to log circuit breaker state changes."""
    
    def state_change(self, cb, old_state, new_state):
        """Log circuit breaker state changes."""
        logger.warning(
            f"Circuit breaker '{cb.name}' state changed: {old_state} -> {new_state}"
        )
        
        if new_state == "open":
            logger.error(
                f"Circuit breaker '{cb.name}' is now OPEN. "
                f"OpenAI API calls will be blocked for {cb.reset_timeout} seconds."
            )
        elif new_state == "half-open":
            logger.info(
                f"Circuit breaker '{cb.name}' is now HALF-OPEN. "
                f"Testing if service has recovered..."
            )
        elif new_state == "closed":
            logger.info(
                f"Circuit breaker '{cb.name}' is now CLOSED. "
                f"Service has recovered and is operating normally."
            )


# Add listener for state changes
openai_breaker.add_listener(LoggingListener())
