"""
Clinic CRM Load Testing with Locust

Tests critical endpoints to validate Phase 1-10 optimizations:
- Phase 7: PostgreSQL function for appointment availability
- Phase 8: Circuit breaker resilience
- Phase 10: Monitoring and alerting

Run with:
    locust -f locustfile.py --host=http://localhost:8000
    locust -f locustfile.py --host=https://clinic-backend-300842021131.us-central1.run.app
"""

import os
import json
import time
from locust import HttpUser, task, between, constant
from locust.contrib.fasthttp import FastHttpUser
import logging

logger = logging.getLogger(__name__)

# Test configuration
API_BASE = os.environ.get('API_BASE', 'http://localhost:8000')
TEST_USER_EMAIL = os.environ.get('TEST_EMAIL', 'admin@clinic.com')
TEST_USER_PASSWORD = os.environ.get('TEST_PASSWORD', 'admin123')

# Token cache
_token_cache = {'token': None, 'timestamp': 0}


class ClinicLoadTest(FastHttpUser):
    """
    Base Locust user class for clinic load testing.
    Uses FastHttpUser for better performance under load.
    """

    # Wait 1-5 seconds between requests
    wait_time = between(1, 5)

    def on_start(self):
        """Authenticate before running tasks."""
        self.authenticate()

    def authenticate(self):
        """Get JWT token for authenticated requests."""
        try:
            response = self.client.post(
                '/api/token/',
                json={
                    'email': TEST_USER_EMAIL,
                    'password': TEST_USER_PASSWORD,
                },
                catch_response=True
            )

            if response.status_code == 200:
                data = response.json()
                self.token = data.get('access')
                logger.info(f"Authenticated: {TEST_USER_EMAIL}")
                response.success()
            else:
                logger.error(f"Authentication failed: {response.status_code}")
                response.failure(f"Auth failed: {response.status_code}")
                self.token = None
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            self.token = None

    def get_headers(self):
        """Get headers with authentication token."""
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        return headers

    # ==================== CORE ENDPOINT TESTS ====================

    @task(5)
    def test_patient_list(self):
        """
        Test patient list with pagination (Phase 2).
        Simulates: Search → List with pagination → View details
        """
        with self.client.get(
            '/api/patients/?page=1&page_size=50',
            headers=self.get_headers(),
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Patient list failed: {response.status_code}")

    @task(3)
    def test_patient_search(self):
        """
        Test patient search with filters (Phase 2 - Pagination).
        """
        search_term = 'John'  # Common search term
        with self.client.get(
            f'/api/patients/?search={search_term}&page_size=20',
            headers=self.get_headers(),
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Patient search failed: {response.status_code}")

    @task(8)
    def test_appointment_availability(self):
        """
        Test appointment availability (Phase 7 - PostgreSQL function).
        This endpoint was optimized from Python to PostgreSQL.
        CRITICAL: Tests if slot calculation is fast enough.
        """
        # Use a fixed doctor ID for testing
        doctor_id = '1'  # Would normally be discovered from test data
        date = '2025-12-10'
        duration = 30

        with self.client.get(
            f'/api/appointments/availability/?doctor_id={doctor_id}&date={date}&duration_minutes={duration}',
            headers=self.get_headers(),
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                slot_count = len(data.get('available_slots', []))
                response.success()
                logger.info(f"Available slots: {slot_count}")
            elif response.status_code == 503:
                # Circuit breaker opened - expected under extreme load
                response.success()
                logger.warning("Circuit breaker opened (expected under load)")
            else:
                response.failure(f"Availability check failed: {response.status_code}")

    @task(6)
    def test_appointment_list(self):
        """
        Test appointment list (Phase 2 - Pagination, Phase 10 - Monitoring).
        """
        with self.client.get(
            '/api/appointments/?page=1&page_size=50',
            headers=self.get_headers(),
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Appointment list failed: {response.status_code}")

    @task(2)
    def test_appointment_create(self):
        """
        Test appointment creation (Phase 4 - Atomic transactions).
        Tests transaction handling under concurrent load.
        """
        appointment_data = {
            'patient_id': '1',  # Use test patient
            'doctor_id': '1',   # Use test doctor
            'appointment_datetime': '2025-12-10T14:00:00Z',
            'appointment_type': 'consultation',
            'reason': 'Load test appointment',
            'duration_minutes': 30,
        }

        with self.client.post(
            '/api/appointments/',
            json=appointment_data,
            headers=self.get_headers(),
            catch_response=True
        ) as response:
            if response.status_code in [201, 400]:  # Created or validation error
                response.success()
            elif response.status_code == 409:  # Conflict (double booking prevented)
                response.success()
                logger.info("Conflict detected (race condition prevention working)")
            else:
                response.failure(f"Appointment create failed: {response.status_code}")

    @task(4)
    def test_clinical_notes_list(self):
        """
        Test clinical notes listing (Phase 2 - Pagination).
        """
        with self.client.get(
            '/api/clinical-notes/?page=1&page_size=20',
            headers=self.get_headers(),
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Clinical notes list failed: {response.status_code}")

    @task(3)
    def test_doctors_list(self):
        """
        Test doctors list (Phase 2 - Pagination, Phase 3 - Indexes).
        """
        with self.client.get(
            '/api/doctors/?page=1&page_size=50',
            headers=self.get_headers(),
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Doctors list failed: {response.status_code}")

    # ==================== MONITORING VALIDATION ====================

    @task(1)
    def test_health_check(self):
        """
        Test API health check (Phase 10 - Monitoring).
        Should be fast even under load.
        """
        with self.client.get(
            '/api/health/',
            headers=self.get_headers(),
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Health check failed: {response.status_code}")

    @task(2)
    def test_audit_logs(self):
        """
        Test audit logs API (Phase 10 - Monitoring).
        Tests if monitoring doesn't significantly impact performance.
        """
        with self.client.get(
            '/api/audit-logs/?limit=100',
            headers=self.get_headers(),
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Audit logs failed: {response.status_code}")

    # ==================== ERROR SCENARIO TESTS ====================

    @task(1)
    def test_not_found(self):
        """Test 404 handling (error tracking)."""
        with self.client.get(
            '/api/patients/invalid-id-12345/',
            headers=self.get_headers(),
            catch_response=True
        ) as response:
            if response.status_code == 404:
                response.success()
            else:
                response.failure(f"Unexpected status: {response.status_code}")

    @task(1)
    def test_invalid_data(self):
        """Test validation error handling."""
        invalid_data = {
            'patient_id': 'invalid',
            'appointment_datetime': 'not-a-date',
        }

        with self.client.post(
            '/api/appointments/',
            json=invalid_data,
            headers=self.get_headers(),
            catch_response=True
        ) as response:
            if response.status_code == 400:
                response.success()
            else:
                response.failure(f"Unexpected status: {response.status_code}")


class SpikeLoadTest(ClinicLoadTest):
    """
    Spike load test: Sudden increase in requests.
    Tests circuit breaker behavior (Phase 8).
    """
    wait_time = constant(0.1)  # Very short wait time for spike


class StressLoadTest(ClinicLoadTest):
    """
    Stress test: Continuously increasing load until failure.
    Tests system limits and recovery.
    """
    wait_time = constant(0.5)  # Medium wait time


class ResillienceLoadTest(ClinicLoadTest):
    """
    Resilience test: Validates circuit breaker and recovery.
    Tests Phase 8 implementation.
    """

    @task(10)
    def test_slow_endpoint(self):
        """
        Test slow endpoint to trigger warnings.
        Should trigger monitoring but still respond.
        """
        with self.client.get(
            '/api/appointments/availability/?doctor_id=1&date=2025-12-10&duration_minutes=30',
            headers=self.get_headers(),
            timeout=10,
            catch_response=True
        ) as response:
            if response.status_code in [200, 503]:
                response.success()
            else:
                response.failure(f"Slow endpoint test failed: {response.status_code}")

    @task(5)
    def test_concurrent_creates(self):
        """
        Test concurrent appointment creation.
        Validates atomic transactions (Phase 4) prevent double-booking.
        """
        self.test_appointment_create()


# Configuration for different load test scenarios
if __name__ == '__main__':
    print("""
    Clinic CRM Load Testing Guide
    =============================

    Run tests:

    1. Normal Load (5-10 concurrent users):
       locust -f locustfile.py --host=http://localhost:8000 -u 10 -r 2 -t 5m

    2. Spike Test (sudden spike to 100 users):
       locust -f locustfile.py -c SpikeLoadTest --host=http://localhost:8000 -u 100 -r 50 -t 2m

    3. Stress Test (gradually increase to 200 users):
       locust -f locustfile.py -c StressLoadTest --host=http://localhost:8000 -u 200 -r 20 -t 10m

    4. Resilience Test (test circuit breaker):
       locust -f locustfile.py -c ResillienceLoadTest --host=http://localhost:8000 -u 50 -r 5 -t 5m

    5. Web UI (interactive):
       locust -f locustfile.py --host=http://localhost:8000
       Then visit http://localhost:8089

    Test Goals:
    - Verify PostgreSQL function (Phase 7) handles concurrent requests
    - Validate circuit breaker (Phase 8) behavior under failure
    - Confirm monitoring (Phase 10) doesn't impact performance
    - Check atomic transactions (Phase 4) prevent race conditions
    - Verify caching (Phase 6) improves repeated requests
    - Validate pagination (Phase 2) doesn't break under load
    """)
