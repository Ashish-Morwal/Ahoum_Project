from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.conf import settings
from django.db import IntegrityError
from django.core.exceptions import ObjectDoesNotExist
from .serializers import SignupSerializer, VerifyEmailSerializer, LoginSerializer
from .models import EmailOTP
import logging

# Set up logger for production-ready logging
logger = logging.getLogger(__name__)


class SignupView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Handle user signup with email verification.
        Production-safe with comprehensive error handling.
        """
        try:
            serializer = SignupSerializer(data=request.data)
            
            if not serializer.is_valid():
                logger.warning(f"Signup validation failed: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            # Save user and generate OTP
            try:
                result = serializer.save()
            except IntegrityError as e:
                logger.error(f"Database IntegrityError during signup: {str(e)}")
                return Response({
                    'error': 'A user with this email already exists. Please try logging in.'
                }, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                logger.error(f"Unexpected error during user creation: {str(e)}", exc_info=True)
                return Response({
                    'error': 'An error occurred during signup. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            user = result.get('user')
            otp = result.get('otp')
            
            if not user or not otp:
                logger.error("User or OTP missing from serializer result")
                return Response({
                    'error': 'Signup failed. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Send OTP email (non-blocking, failure shouldn't prevent signup)
            email_sent, email_error = self.send_otp_email(user.email, otp)
            
            # Get role safely
            try:
                user_role = user.profile.role
            except ObjectDoesNotExist:
                logger.error(f"Profile not found for user {user.id}")
                user_role = 'seeker'  # Default fallback
            
            response_data = {
                'message': 'Signup successful. Please check your email for OTP verification.',
                'email': user.email,
                'otp': otp,  # Include OTP in response for development/testing
                'role': user_role
            }
            
            # Add warning if email failed
            if not email_sent:
                response_data['warning'] = f'Account created but email sending failed: {email_error}'
                logger.warning(f"Email not sent to {user.email}: {email_error}")
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            # Catch-all for any unexpected errors
            logger.error(f"Unexpected error in SignupView: {str(e)}", exc_info=True)
            return Response({
                'error': 'An unexpected error occurred. Please try again later.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def send_otp_email(self, email, otp):
        """
        Send OTP verification email with comprehensive error handling.
        Returns (success: bool, error_message: str or None)
        """
        subject = 'Email Verification - Events Platform'
        message = f'''
        Welcome to Events Platform!
        
        Your OTP for email verification is: {otp}
        
        This OTP will expire in 10 minutes.
        Please do not share this code with anyone.
        
        If you didn't request this, please ignore this email.
        '''
        
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            logger.info(f"OTP email sent successfully to {email}")
            return True, None
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Failed to send OTP email to {email}: {error_msg}", exc_info=True)
            # Return user-friendly error message
            return False, "Email service temporarily unavailable"


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Handle email verification using OTP.
        Production-safe with comprehensive error handling.
        """
        try:
            serializer = VerifyEmailSerializer(data=request.data)
            
            if not serializer.is_valid():
                logger.warning(f"Email verification validation failed: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            # Save (mark user as verified)
            try:
                user = serializer.save()
            except IntegrityError as e:
                logger.error(f"Database IntegrityError during email verification: {str(e)}")
                return Response({
                    'error': 'An error occurred during verification. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            except Exception as e:
                logger.error(f"Unexpected error during email verification: {str(e)}", exc_info=True)
                return Response({
                    'error': 'An error occurred during verification. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Get role safely
            try:
                user_role = user.profile.role
            except ObjectDoesNotExist:
                logger.error(f"Profile not found for user {user.id}")
                user_role = 'seeker'  # Default fallback
            
            return Response({
                'message': 'Email verified successfully. You can now login.',
                'email': user.email,
                'role': user_role
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Catch-all for any unexpected errors
            logger.error(f"Unexpected error in VerifyEmailView: {str(e)}", exc_info=True)
            return Response({
                'error': 'An unexpected error occurred. Please try again later.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Handle user login with JWT token generation.
        Production-safe with comprehensive error handling.
        """
        try:
            serializer = LoginSerializer(data=request.data)
            
            if not serializer.is_valid():
                logger.warning(f"Login validation failed: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            user = serializer.validated_data.get('user')
            
            if not user:
                logger.error("User missing from validated data")
                return Response({
                    'error': 'Login failed. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Generate JWT tokens
            try:
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                refresh_token = str(refresh)
            except Exception as e:
                logger.error(f"Failed to generate JWT tokens for user {user.id}: {str(e)}", exc_info=True)
                return Response({
                    'error': 'Failed to generate authentication tokens. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Get user profile data safely
            try:
                user_role = user.profile.role
                is_verified = user.profile.is_verified
            except ObjectDoesNotExist:
                logger.error(f"Profile not found for user {user.id}")
                user_role = 'seeker'
                is_verified = False
            
            return Response({
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': user_role,
                    'is_verified': is_verified,
                },
                'tokens': {
                    'refresh': refresh_token,
                    'access': access_token,
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Catch-all for any unexpected errors
            logger.error(f"Unexpected error in LoginView: {str(e)}", exc_info=True)
            return Response({
                'error': 'An unexpected error occurred. Please try again later.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ResendOTPView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Resend OTP for email verification.
        Production-safe with comprehensive error handling.
        """
        try:
            # Safely get email from request data
            email = request.data.get('email', '').strip().lower()
            
            # Validate email is provided
            if not email:
                logger.warning("ResendOTP: Email not provided")
                return Response({
                    'error': 'Email is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Basic email format validation
            if '@' not in email or '.' not in email:
                logger.warning(f"ResendOTP: Invalid email format: {email}")
                return Response({
                    'error': 'Invalid email format'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            from django.contrib.auth.models import User
            
            # Check if user exists
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                logger.warning(f"ResendOTP: User not found for email: {email}")
                return Response({
                    'error': 'No user found with this email'
                }, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                logger.error(f"Database error while fetching user: {str(e)}", exc_info=True)
                return Response({
                    'error': 'An error occurred. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Check if user is already verified
            try:
                if user.profile.is_verified:
                    logger.info(f"ResendOTP: User {email} is already verified")
                    return Response({
                        'error': 'Email is already verified'
                    }, status=status.HTTP_400_BAD_REQUEST)
            except ObjectDoesNotExist:
                logger.error(f"Profile not found for user {user.id}")
                return Response({
                    'error': 'User profile not found. Please contact support.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Create new OTP
            try:
                otp_instance = EmailOTP.create_otp(email=email, expiry_minutes=10)
            except IntegrityError as e:
                logger.error(f"Database IntegrityError during OTP creation: {str(e)}")
                return Response({
                    'error': 'An error occurred while generating OTP. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            except Exception as e:
                logger.error(f"Unexpected error during OTP creation: {str(e)}", exc_info=True)
                return Response({
                    'error': 'An error occurred while generating OTP. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Send OTP email (non-blocking, failure shouldn't prevent OTP creation)
            email_sent, email_error = SignupView().send_otp_email(email, otp_instance.otp)
            
            response_data = {
                'message': 'OTP resent successfully',
                'email': email,
                'otp': otp_instance.otp  # Include OTP in response for development/testing
            }
            
            # Add warning if email failed
            if not email_sent:
                response_data['warning'] = f'OTP generated but email sending failed: {email_error}'
                logger.warning(f"Email not sent to {email}: {email_error}")
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Catch-all for any unexpected errors
            logger.error(f"Unexpected error in ResendOTPView: {str(e)}", exc_info=True)
            return Response({
                'error': 'An unexpected error occurred. Please try again later.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
