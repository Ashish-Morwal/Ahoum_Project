from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator


class Event(models.Model):
    """
    Event model representing an event created by a facilitator.
    Contains all event details including scheduling, location, and capacity information.
    """
    title = models.CharField(
        max_length=255,
        help_text="Event title"
    )
    description = models.TextField(
        help_text="Detailed description of the event"
    )
    language = models.CharField(
        max_length=100,
        help_text="Language in which the event will be conducted"
    )
    location = models.CharField(
        max_length=255,
        help_text="Physical or virtual location of the event"
    )
    starts_at = models.DateTimeField(
        help_text="Event start time in UTC"
    )
    ends_at = models.DateTimeField(
        help_text="Event end time in UTC"
    )
    capacity = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
        help_text="Maximum number of participants (null means unlimited)"
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_events',
        help_text="Facilitator who created this event"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'events'
        verbose_name = 'Event'
        verbose_name_plural = 'Events'
        ordering = ['-starts_at']
        indexes = [
            models.Index(fields=['starts_at']),
            models.Index(fields=['location']),
            models.Index(fields=['created_by']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.starts_at.strftime('%Y-%m-%d')}"
    
    @property
    def is_full(self):
        """Check if the event has reached capacity"""
        if self.capacity is None:
            return False
        enrolled_count = self.enrollments.filter(status='enrolled').count()
        return enrolled_count >= self.capacity
    
    @property
    def available_spots(self):
        """Get number of available spots"""
        if self.capacity is None:
            return None
        enrolled_count = self.enrollments.filter(status='enrolled').count()
        return max(0, self.capacity - enrolled_count)


class Enrollment(models.Model):
    """
    Enrollment model representing a seeker's enrollment in an event.
    Tracks enrollment status and ensures uniqueness per seeker-event pair.
    """
    STATUS_CHOICES = [
        ('enrolled', 'Enrolled'),
        ('canceled', 'Canceled'),
    ]
    
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='enrollments',
        help_text="The event being enrolled in"
    )
    seeker = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='enrollments',
        help_text="The seeker enrolling in the event"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='enrolled',
        help_text="Current enrollment status"
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'enrollments'
        verbose_name = 'Enrollment'
        verbose_name_plural = 'Enrollments'
        ordering = ['-enrolled_at']
        unique_together = [['event', 'seeker']]
        indexes = [
            models.Index(fields=['event', 'status']),
            models.Index(fields=['seeker', 'status']),
            models.Index(fields=['enrolled_at']),
        ]
    
    def __str__(self):
        return f"{self.seeker.username} - {self.event.title} ({self.status})"

