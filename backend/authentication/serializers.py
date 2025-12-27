from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError, ObjectDoesNotExist
from django.db import IntegrityError
from users.models import Profile
from .models import EmailOTP
import logging

# Set up logger
logger = logging.getLogger(__name__)


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
        Production-safe with comprehensive error handling.
        """
        email = validated_data['email']
        password = validated_data['password']
        role = validated_data.get('role', 'seeker')
        
        try:
            # Create user with username = email
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                is_active=False  # User is inactive until email is verified
            )
        except IntegrityError as e:
            logger.error(f"IntegrityError creating user {email}: {str(e)}")
            raise serializers.ValidationError({
                'email': 'A user with this email already exists.'
            })
        except Exception as e:
            logger.error(f"Unexpected error creating user {email}: {str(e)}", exc_info=True)
            raise serializers.ValidationError({
                'error': 'An error occurred during signup. Please try again.'
            })
        
        # Update profile with role (Profile is auto-created by signal)
        try:
            user.profile.role = role
            user.profile.is_verified = False
            user.profile.save()
        except ObjectDoesNotExist:
            logger.error(f"Profile not found for user {user.id} after creation")
            # Fallback: Create profile if signal didn't create it
            # This handles edge cases like signal failures or race conditions
            # TODO: Investigate if this happens frequently and fix root cause
            try:
                Profile.objects.create(user=user, role=role, is_verified=False)
            except Exception as e:
                logger.error(f"Failed to create profile for user {user.id}: {str(e)}", exc_info=True)
                # Continue anyway, profile might be created later
        except Exception as e:
            logger.error(f"Error updating profile for user {user.id}: {str(e)}", exc_info=True)
            # Continue anyway, profile has defaults
        
        # Generate OTP for email verification
        try:
            otp_instance = EmailOTP.create_otp(email=email, expiry_minutes=10)
        except Exception as e:
            logger.error(f"Error creating OTP for {email}: {str(e)}", exc_info=True)
            # User is created, but OTP failed - raise error
            raise serializers.ValidationError({
                'error': 'User created but OTP generation failed. Please use Resend OTP.'
            })
        
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
        email = data.get('email', '').lower()
        otp = data.get('otp', '')
        
        # Check if user exists
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            logger.warning(f"Email verification failed: User not found for {email}")
            raise serializers.ValidationError({
                'email': 'No user found with this email address.'
            })
        except Exception as e:
            logger.error(f"Database error fetching user for {email}: {str(e)}", exc_info=True)
            raise serializers.ValidationError({
                'error': 'An error occurred. Please try again.'
            })
        
        # Check if user is already verified
        try:
            if user.profile.is_verified:
                logger.info(f"Email verification attempted for already verified user: {email}")
                raise serializers.ValidationError({
                    'email': 'Email is already verified. Please login.'
                })
        except ObjectDoesNotExist:
            logger.error(f"Profile not found for user {user.id}")
            # Continue anyway, we'll verify the OTP and create profile if needed
        except serializers.ValidationError:
            raise  # Re-raise validation errors
        except Exception as e:
            logger.error(f"Error checking verification status for {email}: {str(e)}", exc_info=True)
            # Continue anyway
        
        # Get the most recent OTP for this email
        try:
            otp_instance = EmailOTP.objects.filter(email=email).latest('created_at')
        except EmailOTP.DoesNotExist:
            logger.warning(f"No OTP found for {email}")
            raise serializers.ValidationError({
                'otp': 'No OTP found for this email. Please request a new one.'
            })
        except Exception as e:
            logger.error(f"Database error fetching OTP for {email}: {str(e)}", exc_info=True)
            raise serializers.ValidationError({
                'error': 'An error occurred. Please try again.'
            })
        
        # Validate OTP using the model method
        try:
            is_valid, message = otp_instance.is_valid(otp)
        except Exception as e:
            logger.error(f"Error validating OTP for {email}: {str(e)}", exc_info=True)
            raise serializers.ValidationError({
                'error': 'An error occurred during validation. Please try again.'
            })
        
        if not is_valid:
            logger.warning(f"Invalid OTP for {email}: {message}")
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
        
        try:
            # Activate user account
            user.is_active = True
            user.save()
        except Exception as e:
            logger.error(f"Error activating user {user.id}: {str(e)}", exc_info=True)
            raise serializers.ValidationError({
                'error': 'Failed to activate account. Please try again.'
            })
        
        try:
            # Mark profile as verified
            user.profile.is_verified = True
            user.profile.save()
        except ObjectDoesNotExist:
            logger.error(f"Profile not found for user {user.id} during verification")
            # Create profile if it doesn't exist
            try:
                Profile.objects.create(user=user, is_verified=True)
            except Exception as e:
                logger.error(f"Failed to create profile for user {user.id}: {str(e)}", exc_info=True)
        except Exception as e:
            logger.error(f"Error updating profile for user {user.id}: {str(e)}", exc_info=True)
            # Continue anyway, user is activated
        
        try:
            # Delete the used OTP
            otp_instance.delete()
        except Exception as e:
            logger.error(f"Error deleting OTP for {user.email}: {str(e)}", exc_info=True)
            # Continue anyway, OTP will expire naturally
        
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
        email = data.get('email', '').lower()
        password = data.get('password', '')
        
        # Check if user exists
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            logger.warning(f"Login failed: User not found for {email}")
            raise serializers.ValidationError({
                'email': 'Invalid email or password.'
            })
        except Exception as e:
            logger.error(f"Database error fetching user for {email}: {str(e)}", exc_info=True)
            raise serializers.ValidationError({
                'error': 'An error occurred. Please try again.'
            })
        
        # Block login if user is not verified
        try:
            if not user.profile.is_verified:
                logger.warning(f"Login blocked for unverified user: {email}")
                raise serializers.ValidationError({
                    'email': 'Email not verified. Please verify your email before logging in.'
                })
        except ObjectDoesNotExist:
            logger.error(f"Profile not found for user {user.id}")
            raise serializers.ValidationError({
                'error': 'User profile not found. Please contact support.'
            })
        except serializers.ValidationError:
            raise  # Re-raise validation errors
        except Exception as e:
            logger.error(f"Error checking verification status for {email}: {str(e)}", exc_info=True)
            raise serializers.ValidationError({
                'error': 'An error occurred. Please try again.'
            })
        
        # Authenticate user
        try:
            authenticated_user = authenticate(username=email, password=password)
        except Exception as e:
            logger.error(f"Authentication error for {email}: {str(e)}", exc_info=True)
            raise serializers.ValidationError({
                'error': 'An error occurred during authentication. Please try again.'
            })
        
        if authenticated_user is None:
            logger.warning(f"Authentication failed for {email}")
            raise serializers.ValidationError({
                'email': 'Invalid email or password.'
            })
        
        if not authenticated_user.is_active:
            logger.warning(f"Login attempted for inactive user: {email}")
            raise serializers.ValidationError({
                'email': 'Account is inactive. Please contact support.'
            })
        
        data['user'] = authenticated_user
        return data
