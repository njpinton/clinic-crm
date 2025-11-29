"""
Management command to create users with specific roles.
"""
from django.core.management.base import BaseCommand, CommandError
from apps.users.models import User


class Command(BaseCommand):
    help = 'Create a new user with a specific role'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='User email address')
        parser.add_argument('--first-name', type=str, required=True, help='User first name')
        parser.add_argument('--last-name', type=str, required=True, help='User last name')
        parser.add_argument('--password', type=str, required=True, help='User password')
        parser.add_argument(
            '--role',
            type=str,
            choices=['admin', 'doctor', 'patient', 'nurse', 'receptionist', 'lab_tech', 'pharmacist'],
            default='patient',
            help='User role (default: patient)'
        )
        parser.add_argument('--phone', type=str, help='Phone number')
        parser.add_argument('--superuser', action='store_true', help='Make user a Django superuser')

    def handle(self, *args, **options):
        email = options['email'].lower()

        # Check if user already exists
        if User.objects.filter(email=email).exists():
            raise CommandError(f'User with email "{email}" already exists')

        # Create user
        user_data = {
            'first_name': options['first_name'],
            'last_name': options['last_name'],
            'role': options['role'],
        }

        if options.get('phone'):
            user_data['phone'] = options['phone']

        # Create superuser or regular user
        if options['superuser']:
            user = User.objects.create_superuser(
                email=email,
                password=options['password'],
                **user_data
            )
            self.stdout.write(self.style.SUCCESS(
                f'Successfully created superuser: {user.email} with role "{user.get_role_display()}"'
            ))
        else:
            user = User.objects.create_user(
                email=email,
                password=options['password'],
                **user_data
            )
            self.stdout.write(self.style.SUCCESS(
                f'Successfully created user: {user.email} with role "{user.get_role_display()}"'
            ))

        # Display user info
        self.stdout.write(f'  Name: {user.get_full_name()}')
        self.stdout.write(f'  Role: {user.get_role_display()}')
        self.stdout.write(f'  Email: {user.email}')
        if user.phone:
            self.stdout.write(f'  Phone: {user.phone}')
