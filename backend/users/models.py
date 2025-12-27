from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class Profile(models.Model):
    """
    Profile model extending the default Django User model with additional fields.
    Linked via OneToOne relationship for better data organization and extensibility.
    """
    
    ROLE_CHOICES = [
        ('seeker', 'Seeker'),
        ('facilitator', 'Facilitator'),
    ]
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile',
        help_text="Link to Django's default User model"
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='seeker',
        help_text="User role: Seeker can browse and enroll, Facilitator can create events"
    )
    is_verified = models.BooleanField(
        default=False,
        help_text="Email verification status via OTP"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_profiles'
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
        indexes = [
            models.Index(fields=['role']),
            models.Index(fields=['is_verified']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"
    
    @property
    def is_seeker(self):
        """Check if user is a Seeker"""
        return self.role == 'seeker'
    
    @property
    def is_facilitator(self):
        """Check if user is a Facilitator"""
        return self.role == 'facilitator'


# Signal to automatically create Profile when User is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Create a Profile instance whenever a new User is created"""
    if created:
        Profile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Save the Profile instance when User is saved"""
    if hasattr(instance, 'profile'):
        instance.profile.save()
