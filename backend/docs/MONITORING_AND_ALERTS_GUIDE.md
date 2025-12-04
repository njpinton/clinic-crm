# Phase 10: Comprehensive Monitoring and Alerting Guide

## Overview

This phase implements enterprise-grade monitoring and alerting for the Clinic CRM production environment. The implementation provides:

- Real-time performance metrics tracking
- Error categorization and trend analysis
- Deployment and release tracking
- Health check monitoring for all system components
- Integration with Sentry for centralized error tracking

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────┐
│                   Django Application                      │
├─────────────────────────────────────────────────────────┤
│  PerformanceMonitoringMiddleware  │  ErrorTrackingMW     │
│  (auto-records all endpoints)      │  (categorizes errors) │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
    ┌───▼──┐      ┌───▼──┐      ┌───▼──┐
    │Sentry│      │Redis │    │Django│
    │Error │      │Cache │    │  DB  │
    │Tracking      └──────┘    └──────┘
    └──────┘
```

### Key Modules

**`apps/core/monitoring.py`** (413 lines)
- `PerformanceMetrics`: Track endpoint performance with 4 severity levels
- `ErrorTracker`: Categorize errors into 9 categories
- `MonitoringDecorators`: @monitor_performance and @monitor_database_query
- `ReleaseTracking`: Track deployments and releases
- `HealthCheck`: Monitor service health status

**`apps/core/monitoring_middleware.py`** (98 lines)
- `PerformanceMonitoringMiddleware`: Auto-record all endpoint metrics
- `ErrorTrackingMiddleware`: Auto-categorize and track errors
- Automatic Sentry integration

**`apps/core/management/commands/monitor_health.py`** (216 lines)
- Django management command for health checks
- Checks: database, redis, cache, api
- Detailed reporting with verbose option

---

## Implementation Details

### 1. Performance Metrics Tracking

**Severity Levels:**
- `normal` (< 100ms)
- `slow` (100-500ms)
- `warning` (500-2000ms)
- `critical` (> 2000ms or 5xx status)

**Automatic Tracking:**
```python
# All endpoints automatically tracked via middleware
# Response time > 2 seconds = warning in Sentry
# Response time > 5 seconds = critical error
# Any 5xx status = critical error
```

**Manual Tracking:**
```python
from apps.core.monitoring import PerformanceMetrics

PerformanceMetrics.record_endpoint_metric(
    endpoint='/api/appointments/',
    method='GET',
    duration_ms=250,
    status_code=200,
    user_id='user-uuid'
)
```

**Statistics Caching:**
- Cached in Redis for 24 hours
- Tracks: total requests, total duration, error count, status codes
- Accessible via `get_endpoint_stats()` for dashboard integration

---

### 2. Error Categorization

**9 Error Categories:**
1. `authentication` - Auth/authorization failures (401, 403)
2. `validation` - Data validation errors
3. `not_found` - Resource not found (404)
4. `conflict` - Resource conflicts (409)
5. `server_error` - Server errors (5xx)
6. `external_service` - External API failures
7. `database` - Database operation errors
8. `timeout` - Request timeout errors
9. `rate_limit` - Rate limiting (429)

**Automatic Categorization:**
```python
# Via middleware on any exception or 5xx response
# Categorizes based on:
# - HTTP status code
# - Exception type
# - Error message patterns
```

**Manual Categorization:**
```python
from apps.core.monitoring import ErrorTracker

ErrorTracker.track_error(
    error=exception,
    status_code=500,
    endpoint='/api/appointments/',
    user_id='user-uuid'
)

# Get error statistics
stats = ErrorTracker.get_error_stats()
# Output: {'database': 3, 'timeout': 1, 'server_error': 2}
```

---

### 3. Performance Monitoring Decorators

**Monitor Function Duration:**
```python
from apps.core.monitoring import MonitoringDecorators

@MonitoringDecorators.monitor_performance(
    name='fetch_patient_data',
    threshold_ms=500
)
def expensive_operation():
    # Code that takes time
    # If > 500ms, logs warning to Sentry
    pass
```

**Monitor Database Queries:**
```python
@MonitoringDecorators.monitor_database_query(query_type='SELECT')
def get_patient_appointments(patient_id):
    # Database query
    # If > 1 second, logs warning to Sentry
    pass
```

---

### 4. Release Tracking

**Set Release Information:**
```python
from apps.core.monitoring import ReleaseTracking

# In deployment script or Django startup
ReleaseTracking.set_release_info(
    version='1.2.0',
    environment='production'
)

# Or track full deployment
ReleaseTracking.track_deployment(
    version='1.2.0',
    environment='production',
    deployed_by='devops@clinic.com',
    changes='Fixed N+1 query in appointments, added monitoring'
)
```

**Benefits:**
- Correlate errors to specific releases
- Identify regressions introduced in new versions
- Track deployment frequency and success rate

---

### 5. Health Checking

**Automated Health Checks:**
```python
# Run in your deployment or startup script
python manage.py monitor_health

# Output:
# ✓ Database Connected
# ✓ Redis Connected
# ✓ Cache Working
# ✓ API Responding
```

**Check Specific Component:**
```bash
python manage.py monitor_health --check database
python manage.py monitor_health --check redis --verbose
```

**Programmatic Health Checks:**
```python
from apps.core.monitoring import HealthCheck

# Set health status
HealthCheck.set_health_status(
    service='database',
    status=HealthCheck.STATUS_HEALTHY
)

# Get health status
health = HealthCheck.get_health_status()
if HealthCheck.is_healthy():
    # All systems operational
    pass
```

---

## Sentry Integration

### Existing Configuration

The backend already has Sentry configured in `config/settings/base.py` with:
- HIPAA-compliant PHI scrubbing
- 10% transaction sampling for performance monitoring
- Automatic Django integration

### Enhanced with Phase 10

**Automatic Error Tracking:**
- All unhandled exceptions captured
- 5xx responses automatically logged
- Error categorization applied

**Performance Tracking:**
- Slow endpoint warnings (> 2 seconds)
- Critical endpoint alerts (> 5 seconds)
- Per-endpoint performance metrics

**Release Correlation:**
- Errors tagged with release version
- Deployment tracking for context
- Regression detection

### Example Sentry Dashboard Queries

**Find slow endpoints:**
```
status:warning tags:severity:warning
```

**Track specific error category:**
```
tags:error_category:database
```

**Errors in last 24 hours:**
```
timestamp:>24h
```

---

## Middleware Integration

### Automatic Registration

The middleware is registered in `config/settings/base.py`:

```python
MIDDLEWARE = [
    # ... other middleware ...
    'apps.core.monitoring_middleware.PerformanceMonitoringMiddleware',
    'apps.core.monitoring_middleware.ErrorTrackingMiddleware',
]
```

### What Gets Tracked

**PerformanceMonitoringMiddleware:**
- Request start time captured in `process_request`
- Duration calculated in `process_response`
- Metrics recorded to Redis cache
- Sentry alerts for slow/critical requests

**ErrorTrackingMiddleware:**
- All exceptions captured in `process_exception`
- 5xx responses tracked in `process_response`
- Error categorization applied automatically
- Sentry integration for visibility

### Excluded Paths

Certain paths are excluded from monitoring overhead:
- `/health/` - Health check endpoints
- `/ping/` - Ping endpoints
- `/api/health/` - API health
- `/static/` - Static files
- `/media/` - Media files
- `/admin/` - Admin panel

---

## Monitoring Metrics Reference

### Performance Thresholds

| Level | Duration | Status Codes | Action |
|-------|----------|------------|--------|
| Normal | < 100ms | 200-299 | No alert |
| Slow | 100-500ms | 200-299 | Log for analysis |
| Warning | 500-2000ms | Any | Alert in Sentry |
| Critical | > 2000ms OR | > 5000ms OR 5xx | Critical alert |

### Cached Metrics (Redis)

```python
# Per-endpoint statistics (24 hour retention)
clinic_perf:endpoint_stats:{endpoint}:{method}
{
    'total_requests': 1250,
    'total_duration': 312500,  # ms
    'error_count': 3,
    'status_codes': {'200': 1240, '500': 3, '404': 7},
    'last_updated': '2025-12-04T10:30:00'
}

# Error counters by category (24 hour window)
clinic_perf:error:{category}
# Values: authentication, validation, not_found, database, etc.

# Health status snapshots (5 minute retention)
clinic_perf:health_status
{
    'database': {'status': 'healthy', 'timestamp': '...'},
    'redis': {'status': 'healthy', 'timestamp': '...'},
    'cache': {'status': 'healthy', 'timestamp': '...'},
    'api': {'status': 'healthy', 'timestamp': '...'},
}
```

---

## Alert Configuration

### Automatic Alerts (to Sentry)

**Performance Warnings:**
- Endpoint response > 2 seconds → warning level
- Endpoint response > 5 seconds → error level
- Database query > 1 second → warning level

**Error Alerts:**
- Any 5xx response → error level
- Critical health check failures → error level
- Circuit breaker opened → error level

### Manual Alert Triggers

```python
from django.core.mail import send_mail
import sentry_sdk

# Custom alert
sentry_sdk.capture_message(
    "Custom alert: High memory usage detected",
    level='warning',
    tags={'alert_type': 'memory'},
    extra={'memory_percent': 85}
)
```

### Sentry Alert Rules (Configure in Dashboard)

**Recommended Rules:**

1. **Spike in Errors**
   - Alert when error rate increases 100% in 5 minutes
   - Severity: High

2. **Slow Transactions**
   - Alert when p95 transaction duration > 5000ms
   - Severity: Medium

3. **Custom Error Categories**
   - Alert on `error_category:database` tag
   - Alert on `error_category:authentication` spike
   - Severity: High for database, Medium for auth

4. **Deployment Issues**
   - Alert on new errors within 30 minutes of deployment
   - Severity: High

---

## Usage Examples

### Monitor Critical Endpoints

```python
from apps.core.monitoring import MonitoringDecorators

class AppointmentViewSet(viewsets.ModelViewSet):
    @MonitoringDecorators.monitor_performance(
        name='create_appointment',
        threshold_ms=1000
    )
    def create(self, request, *args, **kwargs):
        # Critical business logic
        # Alerts if takes > 1 second
        return super().create(request, *args, **kwargs)
```

### Monitor Database Operations

```python
from apps.core.monitoring import MonitoringDecorators

class AppointmentAvailabilityService:
    @MonitoringDecorators.monitor_database_query(query_type='SELECT')
    def get_available_slots(self, doctor_id, date):
        # Database-heavy operation
        # Alerts if > 1 second
        slots = Appointment.objects.filter(...).values_list(...)
        return list(slots)
```

### Track Deployment

```python
# In deploy.py or startup script
from apps.core.monitoring import ReleaseTracking

ReleaseTracking.track_deployment(
    version=os.environ.get('VERSION'),
    environment=os.environ.get('ENVIRONMENT', 'production'),
    deployed_by=os.environ.get('DEPLOYED_BY', 'automated'),
    changes='Fixed appointment conflicts, added monitoring'
)
```

### Check System Health

```python
# In startup or periodic monitoring task
from apps.core.monitoring import HealthCheck

if HealthCheck.is_healthy():
    print("All systems operational")
else:
    health = HealthCheck.get_health_status()
    for service, status in health.get('services', {}).items():
        if status['status'] == HealthCheck.STATUS_CRITICAL:
            alert(f"Critical: {service} down")
```

---

## Monitoring Dashboard Integration

### Metrics Available for Dashboard

```python
# Get current statistics
from apps.core.monitoring import PerformanceMetrics

stats = PerformanceMetrics.get_endpoint_stats('/api/appointments/', 'GET')
# {
#     'total_requests': 1250,
#     'total_duration': 312500,
#     'error_count': 3,
#     'status_codes': {...},
#     'last_updated': '...'
# }

all_stats = PerformanceMetrics.get_all_endpoint_stats()

# Get error statistics
from apps.core.monitoring import ErrorTracker
error_stats = ErrorTracker.get_error_stats()
# {'database': 3, 'timeout': 1, 'server_error': 2}

# Get health status
from apps.core.monitoring import HealthCheck
health = HealthCheck.get_health_status()
```

### Proposed Dashboard Sections

1. **Performance Overview**
   - Average response times by endpoint
   - Slow endpoint alerts
   - Error rate trends

2. **Error Analysis**
   - Error counts by category
   - Top error types
   - Error trends over time

3. **System Health**
   - Database status and connection pool
   - Redis connection status
   - API responsiveness

4. **Deployment Tracking**
   - Current version/release
   - Deployment history
   - Error rate by release

---

## Maintenance & Best Practices

### Regular Tasks

1. **Daily**: Review Sentry for critical errors
2. **Weekly**: Analyze error trends and slow endpoints
3. **Monthly**: Review monitoring configuration, adjust thresholds
4. **Quarterly**: Audit performance metrics, optimize slow operations

### Threshold Tuning

```python
# In apps/core/monitoring.py
PerformanceMetrics.THRESHOLDS = {
    'critical': 5000,      # Adjust based on SLO
    'warning': 2000,       # Adjust based on target
    'slow': 500,           # Adjust based on normal
    'normal': 100,         # Target response time
}
```

### Cache Management

Monitoring metrics are cached in Redis with 24-hour TTL. To clear:

```python
from django.core.cache import cache
cache.delete('clinic_perf:endpoint_stats:*')
```

---

## Integration with Previous Phases

**Phase 7 (PostgreSQL Functions):**
- Database query times monitored with `@monitor_database_query` decorator
- Slow slot availability queries tracked automatically

**Phase 8 (Circuit Breaker):**
- Circuit breaker state changes logged to Sentry
- Automatic health status updates on circuit open/close

**Phase 9 (Frontend Performance):**
- Backend monitoring supports frontend API consumption analysis
- Endpoint metrics help identify problematic API endpoints

---

## Next Steps: Phase 11 (Load & Chaos Testing)

This monitoring infrastructure supports Phase 11 by:
- Collecting baseline performance metrics during normal operation
- Providing real-time metrics during load testing
- Tracking system behavior under chaos conditions
- Identifying failure points and recovery behavior

---

## Troubleshooting

### Middleware Not Tracking

**Check:**
1. Middleware registered in `MIDDLEWARE` list
2. Redis/cache backend accessible
3. Sentry DSN configured in environment

### Health Check Fails

**Run with verbose output:**
```bash
python manage.py monitor_health --verbose
```

### Missing Sentry Alerts

**Verify:**
1. SENTRY_DSN environment variable set
2. Sentry integration enabled in settings
3. Alert rules configured in Sentry dashboard

---

## Summary

Phase 10 provides comprehensive production monitoring with:
- ✓ Automatic endpoint performance tracking
- ✓ Error categorization and alerting
- ✓ Health check monitoring
- ✓ Deployment tracking
- ✓ Sentry integration
- ✓ HIPAA-compliant logging
- ✓ Production-ready alerting

**Result**: Complete observability into application health, performance, and errors for reliable production operations.

---

**Last Updated:** 2025-12-04
**Phase Status:** Complete
**Lines of Code Added:** 727 (monitoring.py: 413, middleware: 98, management: 216)
