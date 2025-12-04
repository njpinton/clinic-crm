# Generated migration for creating PostgreSQL function to calculate available slots

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('appointments', '0004_add_composite_indexes'),
    ]

    operations = [
        migrations.RunSQL(
            sql='''
                CREATE OR REPLACE FUNCTION get_available_slots(
                    p_doctor_id UUID,
                    p_date DATE,
                    p_duration_minutes INTEGER DEFAULT 30,
                    p_start_hour INTEGER DEFAULT 9,
                    p_end_hour INTEGER DEFAULT 17
                )
                RETURNS TABLE (
                    slot_time TIMESTAMP WITH TIME ZONE
                ) AS $$
                DECLARE
                    v_slot_time TIMESTAMP WITH TIME ZONE;
                    v_slot_end TIMESTAMP WITH TIME ZONE;
                    v_hour INTEGER;
                    v_minute INTEGER;
                    v_has_conflict BOOLEAN;
                BEGIN
                    -- Generate all possible time slots for the given date
                    v_hour := p_start_hour;

                    WHILE v_hour < p_end_hour LOOP
                        v_minute := 0;

                        WHILE v_minute < 60 LOOP
                            -- Create slot datetime
                            v_slot_time := p_date::TIMESTAMP + INTERVAL '1 hour' * v_hour + INTERVAL '1 minute' * v_minute;
                            v_slot_time := TIMEZONE('Asia/Manila', v_slot_time);
                            v_slot_end := v_slot_time + INTERVAL '1 minute' * p_duration_minutes;

                            -- Skip past slots
                            IF v_slot_time <= NOW() THEN
                                v_minute := v_minute + 30;
                                CONTINUE;
                            END IF;

                            -- Check for conflicts with existing appointments
                            v_has_conflict := EXISTS (
                                SELECT 1
                                FROM appointments_appointment aa
                                WHERE aa.doctor_id = p_doctor_id
                                    AND aa.deleted_at IS NULL
                                    AND aa.status IN ('scheduled', 'confirmed', 'checked_in', 'in_progress')
                                    AND aa.appointment_datetime < v_slot_end
                                    AND (aa.appointment_datetime + INTERVAL '1 minute' * aa.duration_minutes) > v_slot_time
                            );

                            -- Return slot if no conflict
                            IF NOT v_has_conflict THEN
                                RETURN QUERY SELECT v_slot_time;
                            END IF;

                            v_minute := v_minute + 30;
                        END LOOP;

                        v_hour := v_hour + 1;
                    END LOOP;
                END;
                $$ LANGUAGE plpgsql STABLE;
            ''',
            reverse_sql='DROP FUNCTION IF EXISTS get_available_slots(UUID, DATE, INTEGER, INTEGER, INTEGER);',
        ),
    ]
