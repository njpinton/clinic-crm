# Generated migration for adding composite indexes to appointments

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('appointments', '0003_appointment_is_walk_in_appointment_queue_order_and_more'),
    ]

    operations = [
        # Composite indexes for performance optimization
        migrations.RunSQL(
            sql='''
                CREATE INDEX CONCURRENTLY IF NOT EXISTS
                idx_appointments_doctor_datetime
                ON appointments_appointment(doctor_id, appointment_datetime DESC)
                WHERE deleted_at IS NULL;
            ''',
            reverse_sql='DROP INDEX IF EXISTS idx_appointments_doctor_datetime;',
        ),
        migrations.RunSQL(
            sql='''
                CREATE INDEX CONCURRENTLY IF NOT EXISTS
                idx_appointments_patient_status
                ON appointments_appointment(patient_id, status)
                WHERE deleted_at IS NULL;
            ''',
            reverse_sql='DROP INDEX IF EXISTS idx_appointments_patient_status;',
        ),
        migrations.RunSQL(
            sql='''
                CREATE INDEX CONCURRENTLY IF NOT EXISTS
                idx_appointments_status_created
                ON appointments_appointment(status, created_at DESC)
                WHERE deleted_at IS NULL;
            ''',
            reverse_sql='DROP INDEX IF EXISTS idx_appointments_status_created;',
        ),
        migrations.RunSQL(
            sql='''
                CREATE INDEX CONCURRENTLY IF NOT EXISTS
                idx_appointments_urgency_datetime
                ON appointments_appointment(urgency, appointment_datetime DESC)
                WHERE deleted_at IS NULL;
            ''',
            reverse_sql='DROP INDEX IF EXISTS idx_appointments_urgency_datetime;',
        ),
        # Partial index for soft deletes (only include non-deleted records)
        migrations.RunSQL(
            sql='''
                CREATE INDEX CONCURRENTLY IF NOT EXISTS
                idx_appointments_active
                ON appointments_appointment(id)
                WHERE deleted_at IS NULL;
            ''',
            reverse_sql='DROP INDEX IF EXISTS idx_appointments_active;',
        ),
    ]
