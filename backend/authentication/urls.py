from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import SignupView, VerifyEmailView, LoginView, ResendOTPView

app_name = 'authentication'

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('resend-otp/', ResendOTPView.as_view(), name='resend-otp'),
]
