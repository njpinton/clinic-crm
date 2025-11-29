"""
Management command to seed test users with different roles.
"""
from django.core.management.base import BaseCommand
from apps.users.models import User


class Command(BaseCommand):
    help = 'Create test users with different roles for development'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete all existing users before seeding (DANGEROUS!)'
        )

    def handle(self, *args, **options):
        if options['clear']:
            confirm = input('This will DELETE ALL USERS. Type "yes" to confirm: ')
            if confirm.lower() != 'yes':
                self.stdout.write(self.style.WARNING('Aborted.'))
                return

            count = User.objects.all().delete()[0]
            self.stdout.write(self.style.WARNING(f'Deleted {count} users'))

        # Define test users
        test_users = [
            {
                'email': 'admin@clinic.com',
                'first_name': 'Admin',
                'last_name': 'User',
                'password': 'admin123',
                'role': 'admin',
                'is_superuser': True,
                'is_staff': True,
            },
            {
                'email': 'doctor@clinic.com',
                'first_name': 'Dr. Sarah',
                'last_name': 'Johnson',
                'password': 'doctor123',
                'role': 'doctor',
                'phone': '+12125551234',
            },
            {
                'email': 'doctor2@clinic.com',
                'first_name': 'Dr. Michael',
                'last_name': 'Chen',
                'password': 'doctor123',
                'role': 'doctor',
                'phone': '+12125551235',
            },
            {
                'email': 'nurse@clinic.com',
                'first_name': 'Emily',
                'last_name': 'Rodriguez',
                'password': 'nurse123',
                'role': 'nurse',
                'phone': '+12125551236',
            },
            {
                'email': 'receptionist@clinic.com',
                'first_name': 'Jessica',
                'last_name': 'Williams',
                'password': 'reception123',
                'role': 'receptionist',
                'phone': '+12125551237',
            },
            {
                'email': 'labtech@clinic.com',
                'first_name': 'David',
                'last_name': 'Martinez',
                'password': 'lab123',
                'role': 'lab_tech',
                'phone': '+12125551238',
            },
            {
                'email': 'pharmacist@clinic.com',
                'first_name': 'Rachel',
                'last_name': 'Thompson',
                'password': 'pharmacy123',
                'role': 'pharmacist',
                'phone': '+12125551239',
            },
            {
                'email': 'patient@clinic.com',
                'first_name': 'John',
                'last_name': 'Doe',
                'password': 'patient123',
                'role': 'patient',
                'phone': '+12125551240',
            },
            {
                'email': 'patient2@clinic.com',
                'first_name': 'Jane',
                'last_name': 'Smith',
                'password': 'patient123',
                'role': 'patient',
                'phone': '+12125551241',
            },
        ]

        created_count = 0
        skipped_count = 0

        for user_data in test_users:
            email = user_data['email']

            # Check if user already exists
            if User.objects.filter(email=email).exists():
                self.stdout.write(self.style.WARNING(f'  Skipped: {email} (already exists)'))
                skipped_count += 1
                continue

            # Extract password and superuser flag
            password = user_data.pop('password')
            is_superuser = user_data.pop('is_superuser', False)
            is_staff = user_data.pop('is_staff', False)

            # Create user
            if is_superuser:
                user = User.objects.create_superuser(
                    email=email,
                    password=password,
                    first_name=user_data['first_name'],
                    last_name=user_data['last_name'],
                    role=user_data['role']
                )
            else:
                user = User.objects.create_user(
                    password=password,
                    **user_data
                )

            if is_staff:
                user.is_staff = True
                user.save()

            self.stdout.write(self.style.SUCCESS(
                f'  Created: {user.email} ({user.get_role_display()})'
            ))
            created_count += 1

        # Summary
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'✓ Created {created_count} users'))
        if skipped_count > 0:
            self.stdout.write(self.style.WARNING(f'⊘ Skipped {skipped_count} existing users'))

        # Print login info
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('Test User Credentials:'))
        self.stdout.write('  Admin:        admin@clinic.com / admin123')
        self.stdout.write('  Doctor:       doctor@clinic.com / doctor123')
        self.stdout.write('  Nurse:        nurse@clinic.com / nurse123')
        self.stdout.write('  Receptionist: receptionist@clinic.com / reception123')
        self.stdout.write('  Lab Tech:     labtech@clinic.com / lab123')
        self.stdout.write('  Pharmacist:   pharmacist@clinic.com / pharmacy123')
        self.stdout.write('  Patient:      patient@clinic.com / patient123')
