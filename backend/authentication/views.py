from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.conf import settings
from .serializers import SignupSerializer, VerifyEmailSerializer, LoginSerializer
from .models import EmailOTP


class SignupView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        
        if serializer.is_valid():
            result = serializer.save()
            user = result['user']
            otp = result['otp']
            
            self.send_otp_email(user.email, otp)
            
            return Response({
                'message': 'Signup successful. Please check your email for OTP verification.',
                'email': user.email,
                'otp': otp,
                'role': user.profile.role
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def send_otp_email(self, email, otp):
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
        except Exception as e:
            pass


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            return Response({
                'message': 'Email verified successfully. You can now login.',
                'email': user.email,
                'role': user.profile.role
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': user.profile.role,
                    'is_verified': user.profile.is_verified,
                },
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResendOTPView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email', '').lower()
        
        if not email:
            return Response({
                'error': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        from django.contrib.auth.models import User
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({
                'error': 'No user found with this email'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if user.profile.is_verified:
            return Response({
                'error': 'Email is already verified'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        otp_instance = EmailOTP.create_otp(email=email, expiry_minutes=10)
        
        SignupView().send_otp_email(email, otp_instance.otp)
        
        return Response({
            'message': 'OTP resent successfully',
            'email': email,
            'otp': otp_instance.otp
        }, status=status.HTTP_200_OK)
