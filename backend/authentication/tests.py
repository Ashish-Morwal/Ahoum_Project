from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch
from .models import EmailOTP


class SignupViewTestCase(TestCase):
    """
    Test cases for SignupView to ensure proper handling of email failures.
    """

    def setUp(self):
        self.client = APIClient()
        self.signup_url = '/api/auth/signup/'
        self.valid_payload = {
            'email': 'test@example.com',
            'password': 'TestPass123!',
            'role': 'seeker'
        }

    def test_signup_with_email_failure_returns_201(self):
        """
        Test that signup still returns 201 when email sending fails,
        instead of 500 error (which was causing 502 Bad Gateway).
        """
        # Mock send_otp_email to simulate email failure
        with patch('authentication.views.send_otp_email') as mock_send:
            mock_send.return_value = (False, "Email service not configured")
            
            response = self.client.post(
                self.signup_url,
                self.valid_payload,
                format='json'
            )
            
            # Should return 201 (created) not 500
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            
            # Response should contain warning and OTP
            self.assertIn('warning', response.data)
            self.assertIn('otp', response.data)
            self.assertIn('message', response.data)
            
            # User should still be created
            self.assertTrue(
                User.objects.filter(email='test@example.com').exists()
            )

    def test_signup_with_successful_email_returns_201(self):
        """
        Test that signup returns 201 when email is sent successfully.
        """
        with patch('authentication.views.send_otp_email') as mock_send:
            mock_send.return_value = (True, None)
            
            response = self.client.post(
                self.signup_url,
                self.valid_payload,
                format='json'
            )
            
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            self.assertIn('message', response.data)
            self.assertNotIn('warning', response.data)
            self.assertNotIn('otp', response.data)  # OTP should not be in response when email works


class ResendOTPViewTestCase(TestCase):
    """
    Test cases for ResendOTPView to ensure proper handling of email failures.
    """

    def setUp(self):
        self.client = APIClient()
        self.resend_url = '/api/auth/resend-otp/'
        
        # Create a test user
        self.user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='TestPass123!',
            is_active=False
        )
        # Set user as unverified
        self.user.profile.is_verified = False
        self.user.profile.save()

    def test_resend_otp_with_email_failure_returns_200(self):
        """
        Test that resend OTP returns 200 when email sending fails,
        instead of 500 error.
        """
        with patch('authentication.views.send_otp_email') as mock_send:
            mock_send.return_value = (False, "Email service not configured")
            
            response = self.client.post(
                self.resend_url,
                {'email': 'test@example.com'},
                format='json'
            )
            
            # Should return 200 not 500
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # Response should contain warning and OTP
            self.assertIn('warning', response.data)
            self.assertIn('otp', response.data)


class EmailOTPHelperTestCase(TestCase):
    """
    Test cases for send_otp_email helper function.
    """

    def test_send_otp_email_detects_missing_credentials(self):
        """
        Test that send_otp_email properly detects missing email credentials.
        """
        from authentication.views import send_otp_email
        from django.conf import settings
        
        # Save original values
        original_user = settings.EMAIL_HOST_USER
        original_password = settings.EMAIL_HOST_PASSWORD
        
        try:
            # Set to empty to simulate missing credentials
            settings.EMAIL_HOST_USER = ""
            settings.EMAIL_HOST_PASSWORD = ""
            
            success, error_msg = send_otp_email('test@example.com', '123456')
            
            self.assertFalse(success)
            self.assertIsNotNone(error_msg)
            self.assertIn('not configured', error_msg)
        finally:
            # Restore original values
            settings.EMAIL_HOST_USER = original_user
            settings.EMAIL_HOST_PASSWORD = original_password
