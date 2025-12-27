from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from users.models import Profile
from .models import EmailOTP
from unittest.mock import patch, MagicMock


class SignupViewTestCase(TestCase):
    """Test cases for SignupView with production error handling"""
    
    def setUp(self):
        self.client = APIClient()
        self.signup_url = '/api/auth/signup/'
        self.valid_payload = {
            'email': 'test@example.com',
            'password': 'SecurePass123!',
            'role': 'seeker'
        }
    
    def test_signup_success(self):
        """Test successful signup returns 201 with user data"""
        response = self.client.post(self.signup_url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('message', response.data)
        self.assertIn('email', response.data)
        self.assertEqual(response.data['email'], 'test@example.com')
        # OTP is only returned in DEBUG mode
        # In production (DEBUG=False), OTP is not exposed in response
    
    def test_signup_with_missing_email(self):
        """Test signup without email returns 400"""
        payload = {'password': 'SecurePass123!'}
        response = self.client.post(self.signup_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
    
    def test_signup_with_missing_password(self):
        """Test signup without password returns 400"""
        payload = {'email': 'test@example.com'}
        response = self.client.post(self.signup_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)
    
    def test_signup_with_duplicate_email(self):
        """Test signup with existing email returns 400"""
        # Create first user
        self.client.post(self.signup_url, self.valid_payload, format='json')
        # Try to create second user with same email
        response = self.client.post(self.signup_url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    @patch('authentication.views.send_mail')
    def test_signup_with_email_failure(self, mock_send_mail):
        """Test signup continues even if email fails"""
        mock_send_mail.side_effect = Exception("SMTP Error")
        response = self.client.post(self.signup_url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('warning', response.data)
    
    def test_signup_invalid_password(self):
        """Test signup with weak password returns 400"""
        payload = {
            'email': 'test@example.com',
            'password': '123',  # Too weak
            'role': 'seeker'
        }
        response = self.client.post(self.signup_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class VerifyEmailViewTestCase(TestCase):
    """Test cases for VerifyEmailView with production error handling"""
    
    def setUp(self):
        self.client = APIClient()
        self.verify_url = '/api/auth/verify-email/'
        # Create unverified user
        self.user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='SecurePass123!',
            is_active=False
        )
        self.user.profile.is_verified = False
        self.user.profile.save()
        # Create OTP
        self.otp = EmailOTP.create_otp(email='test@example.com')
    
    def test_verify_email_success(self):
        """Test successful email verification"""
        payload = {
            'email': 'test@example.com',
            'otp': self.otp.otp
        }
        response = self.client.post(self.verify_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        # Verify user is now active and verified
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_active)
        self.assertTrue(self.user.profile.is_verified)
    
    def test_verify_email_with_invalid_otp(self):
        """Test verification with invalid OTP returns 400"""
        payload = {
            'email': 'test@example.com',
            'otp': '000000'  # Wrong OTP
        }
        response = self.client.post(self.verify_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_verify_email_with_nonexistent_user(self):
        """Test verification for non-existent user returns 400"""
        payload = {
            'email': 'nonexistent@example.com',
            'otp': '123456'
        }
        response = self.client.post(self.verify_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_verify_email_already_verified(self):
        """Test verification for already verified user returns 400"""
        self.user.profile.is_verified = True
        self.user.profile.save()
        payload = {
            'email': 'test@example.com',
            'otp': self.otp.otp
        }
        response = self.client.post(self.verify_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginViewTestCase(TestCase):
    """Test cases for LoginView with production error handling"""
    
    def setUp(self):
        self.client = APIClient()
        self.login_url = '/api/auth/login/'
        # Create verified user
        self.user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='SecurePass123!',
            is_active=True
        )
        self.user.profile.is_verified = True
        self.user.profile.save()
    
    def test_login_success(self):
        """Test successful login returns tokens"""
        payload = {
            'email': 'test@example.com',
            'password': 'SecurePass123!'
        }
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertIn('refresh', response.data['tokens'])
        self.assertIn('user', response.data)
    
    def test_login_with_invalid_credentials(self):
        """Test login with wrong password returns 400"""
        payload = {
            'email': 'test@example.com',
            'password': 'WrongPassword123!'
        }
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_login_with_unverified_email(self):
        """Test login with unverified email returns 400"""
        # Create unverified user
        unverified_user = User.objects.create_user(
            username='unverified@example.com',
            email='unverified@example.com',
            password='SecurePass123!',
            is_active=False
        )
        unverified_user.profile.is_verified = False
        unverified_user.profile.save()
        
        payload = {
            'email': 'unverified@example.com',
            'password': 'SecurePass123!'
        }
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
    
    def test_login_with_nonexistent_user(self):
        """Test login with non-existent user returns 400"""
        payload = {
            'email': 'nonexistent@example.com',
            'password': 'SecurePass123!'
        }
        response = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ResendOTPViewTestCase(TestCase):
    """Test cases for ResendOTPView with production error handling"""
    
    def setUp(self):
        self.client = APIClient()
        self.resend_url = '/api/auth/resend-otp/'
        # Create unverified user
        self.user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='SecurePass123!',
            is_active=False
        )
        self.user.profile.is_verified = False
        self.user.profile.save()
    
    def test_resend_otp_success(self):
        """Test successful OTP resend"""
        payload = {'email': 'test@example.com'}
        response = self.client.post(self.resend_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        # OTP is only returned in DEBUG mode
        # In production (DEBUG=False), OTP is not exposed in response
    
    def test_resend_otp_without_email(self):
        """Test resend OTP without email returns 400"""
        payload = {}
        response = self.client.post(self.resend_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_resend_otp_with_invalid_email_format(self):
        """Test resend OTP with invalid email format returns 400"""
        payload = {'email': 'invalid-email'}
        response = self.client.post(self.resend_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_resend_otp_for_nonexistent_user(self):
        """Test resend OTP for non-existent user returns 404"""
        payload = {'email': 'nonexistent@example.com'}
        response = self.client.post(self.resend_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_resend_otp_for_verified_user(self):
        """Test resend OTP for already verified user returns 400"""
        self.user.profile.is_verified = True
        self.user.profile.save()
        payload = {'email': 'test@example.com'}
        response = self.client.post(self.resend_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    @patch('authentication.views.send_mail')
    def test_resend_otp_with_email_failure(self, mock_send_mail):
        """Test resend OTP continues even if email fails"""
        mock_send_mail.side_effect = Exception("SMTP Error")
        payload = {'email': 'test@example.com'}
        response = self.client.post(self.resend_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('warning', response.data)


class IntegrityErrorTestCase(TestCase):
    """Test cases for database IntegrityError handling"""
    
    def setUp(self):
        self.client = APIClient()
        self.signup_url = '/api/auth/signup/'
    
    @patch('authentication.serializers.User.objects.create_user')
    def test_signup_handles_integrity_error(self, mock_create_user):
        """Test signup handles IntegrityError gracefully"""
        from django.db import IntegrityError
        mock_create_user.side_effect = IntegrityError("Duplicate key")
        
        payload = {
            'email': 'test@example.com',
            'password': 'SecurePass123!',
            'role': 'seeker'
        }
        response = self.client.post(self.signup_url, payload, format='json')
        # Should return 400, not 500
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Error should be in response (either 'error' or 'email' field)
        self.assertTrue('error' in response.data or 'email' in response.data)


class ProfileAccessTestCase(TestCase):
    """Test cases for safe profile access"""
    
    def setUp(self):
        self.client = APIClient()
        self.login_url = '/api/auth/login/'
    
    def test_login_handles_missing_profile(self):
        """Test login handles missing profile gracefully"""
        # Create user without profile
        user = User.objects.create_user(
            username='noprofile@example.com',
            email='noprofile@example.com',
            password='SecurePass123!',
            is_active=True
        )
        # Delete profile if it was created by signal
        if hasattr(user, 'profile'):
            user.profile.delete()
        
        payload = {
            'email': 'noprofile@example.com',
            'password': 'SecurePass123!'
        }
        response = self.client.post(self.login_url, payload, format='json')
        # Should return error, not crash
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_500_INTERNAL_SERVER_ERROR])
        self.assertIn('error', response.data)
