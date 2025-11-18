"""
User serializers for the Clinic CRM.
Handles user registration, profile management, and role assignment.
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User


class UserListSerializer(serializers.ModelSerializer):
    """
    Minimal serializer for user lists.
    Excludes sensitive information like password.
    """
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    full_name = serializers.CharField(read_only=True)
    is_staff_member = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'role',
            'role_display',
            'phone',
            'is_active',
            'is_verified',
            'is_staff_member',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'full_name',
            'role_display',
            'is_staff_member',
            'created_at',
        ]


class UserDetailSerializer(serializers.ModelSerializer):
    """
    Complete serializer for user details.
    Includes all user information except password.
    """
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    full_name = serializers.CharField(read_only=True)
    is_admin = serializers.BooleanField(read_only=True)
    is_doctor = serializers.BooleanField(read_only=True)
    is_patient = serializers.BooleanField(read_only=True)
    is_staff_member = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'role',
            'role_display',
            'phone',
            'is_active',
            'is_verified',
            'is_staff',
            'is_superuser',
            'date_of_birth',
            'profile_picture',
            'emergency_contact_name',
            'emergency_contact_phone',
            # Computed properties
            'is_admin',
            'is_doctor',
            'is_patient',
            'is_staff_member',
            # Timestamps
            'date_joined',
            'last_login',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'username',
            'full_name',
            'role_display',
            'is_admin',
            'is_doctor',
            'is_patient',
            'is_staff_member',
            'date_joined',
            'last_login',
            'created_at',
            'updated_at',
        ]


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new users.
    Includes password validation and role assignment (admin only).
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text="User's password (min 8 characters)"
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text="Confirm password"
    )

    class Meta:
        model = User
        fields = [
            'email',
            'password',
            'password_confirm',
            'first_name',
            'last_name',
            'role',
            'phone',
            'date_of_birth',
        ]

    def validate_email(self, value):
        """Validate email is unique and properly formatted."""
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_password(self, value):
        """Validate password meets Django's password requirements."""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, attrs):
        """Validate that passwords match."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': "Passwords do not match."
            })
        return attrs

    def create(self, validated_data):
        """Create user with hashed password."""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')

        user = User.objects.create_user(
            password=password,
            **validated_data
        )

        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user profiles.
    Users can update their own profile, admins can update anyone.
    """
    class Meta:
        model = User
        fields = [
            'first_name',
            'last_name',
            'phone',
            'date_of_birth',
            'profile_picture',
            'emergency_contact_name',
            'emergency_contact_phone',
        ]

    def validate_phone(self, value):
        """Validate phone number format."""
        if value and not value.strip():
            return ''
        return value


class UserRoleUpdateSerializer(serializers.Serializer):
    """
    Serializer for updating user roles (admin only).
    Separate from profile update for security.
    """
    role = serializers.ChoiceField(
        choices=User.ROLE_CHOICES,
        help_text="New role for the user"
    )

    def validate_role(self, value):
        """Validate role change."""
        user = self.context.get('user')
        request_user = self.context.get('request').user

        # Don't allow users to change their own role
        if user and user.id == request_user.id:
            raise serializers.ValidationError(
                "You cannot change your own role. Ask another administrator."
            )

        return value


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for password changes.
    Requires current password for verification.
    """
    current_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )

    def validate_current_password(self, value):
        """Validate that current password is correct."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate_new_password(self, value):
        """Validate new password meets requirements."""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, attrs):
        """Validate that new passwords match."""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': "New passwords do not match."
            })
        return attrs


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Public registration serializer (for patients).
    Creates user with 'patient' role by default.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = [
            'email',
            'password',
            'password_confirm',
            'first_name',
            'last_name',
            'phone',
            'date_of_birth',
        ]

    def validate_email(self, value):
        """Validate email is unique."""
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_password(self, value):
        """Validate password meets requirements."""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, attrs):
        """Validate passwords match."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': "Passwords do not match."
            })
        return attrs

    def create(self, validated_data):
        """Create patient user."""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')

        # Force role to 'patient' for public registration
        validated_data['role'] = 'patient'
        validated_data['is_verified'] = False  # Require email verification

        user = User.objects.create_user(
            password=password,
            **validated_data
        )

        return user
