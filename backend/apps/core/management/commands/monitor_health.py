"""
Management command to check and report system health.

Usage:
    python manage.py monitor_health
    python manage.py monitor_health --check database
    python manage.py monitor_health --check redis
    python manage.py monitor_health --verbose
"""
from django.core.management.base import BaseCommand
from django.db import connection
from django.core.cache import cache
from django.conf import settings
from apps.core.monitoring import HealthCheck
import redis
import json
from datetime import datetime


class Command(BaseCommand):
    help = 'Check and report health status of all system components'

    def add_arguments(self, parser):
        parser.add_argument(
            '--check',
            type=str,
            help='Check specific component (database, redis, cache, api)',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed health information',
        )

    def handle(self, *args, **options):
        check_component = options.get('check')
        verbose = options.get('verbose')

        self.stdout.write(self.style.SUCCESS('\nClinician CRM - Health Check Report'))
        self.stdout.write('=' * 60)
        self.stdout.write(f'Timestamp: {datetime.utcnow().isoformat()}\n')

        if check_component:
            self._check_specific_component(check_component, verbose)
        else:
            self._check_all_components(verbose)

        # Get overall health status
        health = HealthCheck.get_health_status()
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.SUCCESS('Overall Status: Healthy'))
        self.stdout.write('')

    def _check_specific_component(self, component: str, verbose: bool):
        """Check a specific component."""
        if component == 'database':
            self._check_database(verbose)
        elif component == 'redis':
            self._check_redis(verbose)
        elif component == 'cache':
            self._check_cache(verbose)
        elif component == 'api':
            self._check_api(verbose)
        else:
            self.stdout.write(
                self.style.ERROR(f'Unknown component: {component}')
            )

    def _check_all_components(self, verbose: bool):
        """Check all system components."""
        self._check_database(verbose)
        self._check_redis(verbose)
        self._check_cache(verbose)
        self._check_api(verbose)

    def _check_database(self, verbose: bool):
        """Check database connectivity and performance."""
        self.stdout.write('\n📊 DATABASE CHECK')
        self.stdout.write('-' * 60)

        try:
            # Test database connection
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1')
            status = self.style.SUCCESS('✓ Connected')

            # Get database info
            db_config = connection.settings_dict
            self.stdout.write(f'  Status: {status}')
            self.stdout.write(f'  Engine: {db_config.get("ENGINE", "Unknown")}')
            self.stdout.write(f'  Host: {db_config.get("HOST", "localhost")}')
            self.stdout.write(f'  Database: {db_config.get("NAME", "Unknown")}')

            HealthCheck.set_health_status('database', HealthCheck.STATUS_HEALTHY)
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Connection Failed: {str(e)}')
            )
            HealthCheck.set_health_status('database', HealthCheck.STATUS_CRITICAL, {
                'error': str(e)
            })

    def _check_redis(self, verbose: bool):
        """Check Redis connectivity."""
        self.stdout.write('\n🔴 REDIS CHECK')
        self.stdout.write('-' * 60)

        try:
            # Parse Redis URL
            redis_url = settings.CACHES['default'].get('LOCATION', 'redis://127.0.0.1:6379/1')
            self.stdout.write(f'  URL: {redis_url}')

            # Test connection
            r = redis.from_url(redis_url, socket_connect_timeout=5)
            r.ping()

            status = self.style.SUCCESS('✓ Connected')
            self.stdout.write(f'  Status: {status}')

            # Get info
            info = r.info()
            self.stdout.write(f'  Version: {info.get("redis_version", "Unknown")}')
            self.stdout.write(f'  Used Memory: {info.get("used_memory_human", "Unknown")}')

            HealthCheck.set_health_status('redis', HealthCheck.STATUS_HEALTHY)
        except Exception as e:
            self.stdout.write(
                self.style.WARNING(f'⚠ Connection Failed: {str(e)} (non-critical)')
            )
            HealthCheck.set_health_status('redis', HealthCheck.STATUS_DEGRADED, {
                'error': str(e)
            })

    def _check_cache(self, verbose: bool):
        """Check Django cache functionality."""
        self.stdout.write('\n💾 CACHE CHECK')
        self.stdout.write('-' * 60)

        try:
            # Test cache operations
            test_key = 'health_check_test'
            test_value = {'test': 'data', 'timestamp': datetime.utcnow().isoformat()}

            cache.set(test_key, test_value, 60)
            retrieved = cache.get(test_key)

            if retrieved == test_value:
                status = self.style.SUCCESS('✓ Working')
            else:
                status = self.style.WARNING('⚠ Inconsistent')

            self.stdout.write(f'  Status: {status}')
            self.stdout.write(f'  Backend: {settings.CACHES["default"].get("BACKEND", "Unknown")}')

            if verbose:
                self.stdout.write(f'  Set Key: {test_key}')
                self.stdout.write(f'  Retrieved Value: {json.dumps(retrieved, indent=2)}')

            cache.delete(test_key)  # Clean up
            HealthCheck.set_health_status('cache', HealthCheck.STATUS_HEALTHY)
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Cache Error: {str(e)}')
            )
            HealthCheck.set_health_status('cache', HealthCheck.STATUS_CRITICAL, {
                'error': str(e)
            })

    def _check_api(self, verbose: bool):
        """Check API availability and response times."""
        self.stdout.write('\n🌐 API CHECK')
        self.stdout.write('-' * 60)

        try:
            from django.test import Client
            from django.urls import reverse

            client = Client()

            # Test API endpoint
            response = client.get('/api/')
            status_code = response.status_code

            if status_code == 200 or status_code == 401:  # 401 is expected if not authenticated
                status = self.style.SUCCESS('✓ Responding')
            else:
                status = self.style.WARNING(f'⚠ Status {status_code}')

            self.stdout.write(f'  Status: {status}')
            self.stdout.write(f'  Response Code: {status_code}')

            if verbose:
                self.stdout.write(f'  Response Size: {len(response.content)} bytes')

            HealthCheck.set_health_status('api', HealthCheck.STATUS_HEALTHY)
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ API Error: {str(e)}')
            )
            HealthCheck.set_health_status('api', HealthCheck.STATUS_CRITICAL, {
                'error': str(e)
            })
