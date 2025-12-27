from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.models import User

from .serializers import SignupSerializer, VerifyEmailSerializer, LoginSerializer
from .models import EmailOTP


# --------------------------------------------------
# HELPER FUNCTION (reusable & safe)
# --------------------------------------------------
def send_otp_email(email, otp):
    """
    Send OTP email to user for verification.
    Returns (success: bool, error_message: str or None)
    """
    subject = "Email Verification - Events Platform"
    message = (
        "Welcome to Events Platform!\n\n"
        f"Your OTP for email verification is: {otp}\n\n"
        "This OTP will expire in 10 minutes.\n"
        "Please do not share this code with anyone."
    )

    try:
        # Check if email is configured
        if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
            error_msg = "Email service not configured. Please contact administrator."
            print(f"EMAIL CONFIG ERROR: {error_msg}")
            return False, error_msg
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        print(f"EMAIL SENT SUCCESSFULLY to {email}")
        return True, None
    except Exception as e:
        # VERY IMPORTANT: Log for debugging
        error_msg = str(e)
        print(f"EMAIL SEND FAILED to {email}: {error_msg}")
        return False, error_msg


# --------------------------------------------------
# SIGNUP
# --------------------------------------------------
class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        result = serializer.save()
        user = result["user"]
        otp = result["otp"]

        email_sent, error_msg = send_otp_email(user.email, otp)

        if not email_sent:
            # Still return success but inform user about email issue
            return Response(
                {
                    "message": "Account created successfully!",
                    "email": user.email,
                    "role": user.profile.role,
                    "warning": (
                        "However, we could not send the OTP email at this time. "
                        f"Your OTP is: {otp}. Please use this to verify your account. "
                        "This is temporary - please contact support if email issues persist."
                    ),
                    "otp": otp,  # Include OTP in response as fallback
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {
                "message": "Signup successful. Please check your email for OTP verification.",
                "email": user.email,
                "role": user.profile.role,
            },
            status=status.HTTP_201_CREATED,
        )


# --------------------------------------------------
# VERIFY EMAIL
# --------------------------------------------------
class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()

        return Response(
            {
                "message": "Email verified successfully. You can now login.",
                "email": user.email,
                "role": user.profile.role,
            },
            status=status.HTTP_200_OK,
        )


# --------------------------------------------------
# LOGIN
# --------------------------------------------------
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data["user"]

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "message": "Login successful",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "role": user.profile.role,
                    "is_verified": user.profile.is_verified,
                },
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
            },
            status=status.HTTP_200_OK,
        )


# --------------------------------------------------
# RESEND OTP
# --------------------------------------------------
class ResendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").lower()

        if not email:
            return Response(
                {"error": "Email is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"error": "No user found with this email"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user.profile.is_verified:
            return Response(
                {"error": "Email is already verified"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp_instance = EmailOTP.create_otp(email=email, expiry_minutes=10)

        email_sent, error_msg = send_otp_email(email, otp_instance.otp)

        if not email_sent:
            # Return success with OTP in response as fallback
            return Response(
                {
                    "message": "OTP generated successfully",
                    "email": email,
                    "warning": (
                        "However, we could not send the OTP email at this time. "
                        f"Your OTP is: {otp_instance.otp}. "
                        "Please contact support if email issues persist."
                    ),
                    "otp": otp_instance.otp,  # Include OTP in response as fallback
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "message": "OTP resent successfully",
                "email": email,
            },
            status=status.HTTP_200_OK,
        )
