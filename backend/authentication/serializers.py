from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from users.models import Profile
from .models import EmailOTP


class SignupSerializer(serializers.Serializer):
    """
    Serializer for user signup/registration.
    Creates an unverified user with username set to email.
    Generates and sends OTP for email verification.
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    role = serializers.ChoiceField(
        choices=Profile.ROLE_CHOICES,
        default='seeker',
        required=False
    )
    
    def validate_email(self, value):
        """Check if email is already registered"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()
    
    def validate_password(self, value):
        """Validate password using Django's password validators"""
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value
    
    def create(self, validated_data):
        """
        Create a new unverified user with username set to email.
        Generate and return OTP for email verification.
        """
        email = validated_data['email']
        password = validated_data['password']
        role = validated_data.get('role', 'seeker')
        
        # Create user with username = email
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            is_active=False  # User is inactive until email is verified
        )
        
        # Update profile with role (Profile is auto-created by signal)
        user.profile.role = role
        user.profile.is_verified = False
        user.profile.save()
        
        # Generate OTP for email verification
        otp_instance = EmailOTP.create_otp(email=email, expiry_minutes=10)
        
        # In production, send OTP via email here
        # send_otp_email(email, otp_instance.otp)
        
        return {
            'user': user,
            'otp': otp_instance.otp,  # Return OTP for development/testing
            'message': f'Signup successful. OTP sent to {email}. Please verify your email.'
        }


class VerifyEmailSerializer(serializers.Serializer):
    """
    Serializer for email verification using OTP.
    Validates OTP expiry and attempt limits.
    """
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(
        required=True,
        max_length=6,
        min_length=6
    )
    
    def validate(self, data):
        """Validate OTP for the given email"""
        email = data.get('email').lower()
        otp = data.get('otp')
        
        # Check if user exists
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({
                'email': 'No user found with this email address.'
            })
        
        # Check if user is already verified
        if user.profile.is_verified:
            raise serializers.ValidationError({
                'email': 'Email is already verified. Please login.'
            })
        
        # Get the most recent OTP for this email
        try:
            otp_instance = EmailOTP.objects.filter(email=email).latest('created_at')
        except EmailOTP.DoesNotExist:
            raise serializers.ValidationError({
                'otp': 'No OTP found for this email. Please request a new one.'
            })
        
        # Validate OTP using the model method
        is_valid, message = otp_instance.is_valid(otp)
        
        if not is_valid:
            raise serializers.ValidationError({
                'otp': message
            })
        
        # Store validated data for use in view
        data['user'] = user
        data['otp_instance'] = otp_instance
        
        return data
    
    def save(self):
        """Mark user as verified and activate account"""
        user = self.validated_data['user']
        otp_instance = self.validated_data['otp_instance']
        
        # Activate user account
        user.is_active = True
        user.save()
        
        # Mark profile as verified
        user.profile.is_verified = True
        user.profile.save()
        
        # Delete the used OTP
        otp_instance.delete()
        
        return user


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login.
    Blocks login if user is not verified.
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, data):
        """Validate user credentials and verification status"""
        email = data.get('email').lower()
        password = data.get('password')
        
        # Check if user exists
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({
                'email': 'Invalid email or password.'
            })
        
        # Block login if user is not verified
        if not user.profile.is_verified:
            raise serializers.ValidationError({
                'email': 'Email not verified. Please verify your email before logging in.'
            })
        
        # Authenticate user
        user = authenticate(username=email, password=password)
        
        if user is None:
            raise serializers.ValidationError({
                'email': 'Invalid email or password.'
            })
        
        if not user.is_active:
            raise serializers.ValidationError({
                'email': 'Account is inactive. Please contact support.'
            })
        
        data['user'] = user
        return data
