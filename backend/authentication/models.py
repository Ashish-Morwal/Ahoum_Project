from django.db import models
from django.utils import timezone
from datetime import timedelta
import random


class EmailOTP(models.Model):
    """
    Model to store One-Time Passwords (OTP) for email verification.
    OTPs are 6-digit codes sent to user's email during signup.
    """
    
    email = models.EmailField(
        max_length=255,
        db_index=True,
        help_text="Email address to which OTP is sent"
    )
    otp = models.CharField(
        max_length=6,
        help_text="6-digit numeric OTP code"
    )
    expires_at = models.DateTimeField(
        help_text="Expiration timestamp for the OTP (typically 10 minutes from creation)"
    )
    attempts = models.IntegerField(
        default=0,
        help_text="Number of failed verification attempts (max 3)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'email_otps'
        verbose_name = 'Email OTP'
        verbose_name_plural = 'Email OTPs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email', 'expires_at']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"OTP for {self.email} - Expires at {self.expires_at.strftime('%Y-%m-%d %H:%M:%S')}"
    
    def is_expired(self):
        """Check if the OTP has expired"""
        return timezone.now() > self.expires_at
    
    def is_valid(self, entered_otp):
        """
        Validate the entered OTP against stored OTP.
        Checks expiration and attempt limits.
        """
        if self.is_expired():
            return False, "OTP has expired"
        
        if self.attempts >= 3:
            return False, "Maximum verification attempts exceeded"
        
        if self.otp != entered_otp:
            self.attempts += 1
            self.save()
            return False, f"Invalid OTP. {3 - self.attempts} attempts remaining"
        
        return True, "OTP verified successfully"
    
    @classmethod
    def generate_otp(cls):
        """Generate a random 6-digit OTP"""
        return str(random.randint(100000, 999999))
    
    @classmethod
    def create_otp(cls, email, expiry_minutes=10):
        """
        Create a new OTP for the given email.
        Deletes any existing OTPs for the same email.
        """
        # Delete any existing OTPs for this email
        cls.objects.filter(email=email).delete()
        
        # Generate new OTP
        otp_code = cls.generate_otp()
        expires_at = timezone.now() + timedelta(minutes=expiry_minutes)
        
        # Create and return the OTP instance
        return cls.objects.create(
            email=email,
            otp=otp_code,
            expires_at=expires_at
        )
    
    @classmethod
    def cleanup_expired(cls):
        """
        Utility method to delete expired OTPs from database.
        Can be called via a management command or cron job.
        """
        expired_count = cls.objects.filter(expires_at__lt=timezone.now()).delete()[0]
        return expired_count
