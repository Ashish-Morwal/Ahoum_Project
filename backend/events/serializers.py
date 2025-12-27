from rest_framework import serializers
from django.contrib.auth.models import User
from django.utils import timezone
from .models import Event, Enrollment


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model (basic info)"""
    role = serializers.CharField(source='profile.role', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']
        read_only_fields = ['id', 'username', 'email', 'role']


class EventListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing events (with basic info).
    Used for search/list operations.
    """
    created_by = UserSerializer(read_only=True)
    enrolled_count = serializers.SerializerMethodField()
    available_spots = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    facilitator_name = serializers.CharField(source='created_by.username', read_only=True)
    start_date = serializers.DateTimeField(source='starts_at', read_only=True)
    end_date = serializers.DateTimeField(source='ends_at', read_only=True)
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'language', 'location',
            'starts_at', 'ends_at', 'start_date', 'end_date',
            'capacity', 'created_by', 'facilitator_name',
            'enrolled_count', 'available_spots', 'is_full',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def get_enrolled_count(self, obj):
        """Get count of enrolled seekers"""
        return obj.enrollments.filter(status='enrolled').count()


class EventDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for single event view.
    Includes all event information.
    """
    created_by = UserSerializer(read_only=True)
    enrolled_count = serializers.SerializerMethodField()
    available_spots = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    facilitator_name = serializers.CharField(source='created_by.username', read_only=True)
    start_date = serializers.DateTimeField(source='starts_at', read_only=True)
    end_date = serializers.DateTimeField(source='ends_at', read_only=True)
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'language', 'location',
            'starts_at', 'ends_at', 'start_date', 'end_date',
            'capacity', 'created_by', 'facilitator_name',
            'enrolled_count', 'available_spots', 'is_full',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def get_enrolled_count(self, obj):
        """Get count of enrolled seekers"""
        return obj.enrollments.filter(status='enrolled').count()


class EventCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating events (Facilitator only).
    Accepts both starts_at/ends_at and start_date/end_date field names.
    """
    start_date = serializers.DateTimeField(write_only=True, required=False)
    end_date = serializers.DateTimeField(write_only=True, required=False)
    
    class Meta:
        model = Event
        fields = [
            'title', 'description', 'language', 'location',
            'starts_at', 'ends_at', 'capacity',
            'start_date', 'end_date'  # Accept frontend field names
        ]
        extra_kwargs = {
            'starts_at': {'required': False},
            'ends_at': {'required': False}
        }
    
    def validate(self, data):
        """Map frontend field names to backend field names and validate"""
        # Map start_date -> starts_at
        if 'start_date' in data:
            data['starts_at'] = data.pop('start_date')
        
        # Map end_date -> ends_at
        if 'end_date' in data:
            data['ends_at'] = data.pop('end_date')
        
        # Validate starts_at is present
        if not data.get('starts_at'):
            raise serializers.ValidationError({
                'start_date': "Event start time is required."
            })
        
        # Validate ends_at is present
        if not data.get('ends_at'):
            raise serializers.ValidationError({
                'end_date': "Event end time is required."
            })
        
        # Ensure event starts in the future
        if data['starts_at'] < timezone.now():
            raise serializers.ValidationError({
                'start_date': "Event start time must be in the future."
            })
        
        # Validate event dates
        if data['ends_at'] <= data['starts_at']:
            raise serializers.ValidationError({
                'end_date': "Event end time must be after start time."
            })
        
        return data
        return data
    
    def create(self, validated_data):
        """Create event with current user as creator"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class EventUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating events (Owner only).
    """
    class Meta:
        model = Event
        fields = [
            'title', 'description', 'language', 'location',
            'starts_at', 'ends_at', 'capacity'
        ]
    
    def validate(self, data):
        """Validate event dates"""
        starts_at = data.get('starts_at', self.instance.starts_at)
        ends_at = data.get('ends_at', self.instance.ends_at)
        
        if ends_at and starts_at:
            if ends_at <= starts_at:
                raise serializers.ValidationError({
                    'ends_at': "Event end time must be after start time."
                })
        return data


class FacilitatorEventSerializer(serializers.ModelSerializer):
    """
    Serializer for facilitator's own events with enrollment statistics.
    """
    enrolled_count = serializers.SerializerMethodField()
    available_spots = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'language', 'location',
            'starts_at', 'ends_at', 'capacity',
            'enrolled_count', 'available_spots', 'is_full',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_enrolled_count(self, obj):
        """Get count of enrolled seekers"""
        return obj.enrollments.filter(status='enrolled').count()


class EnrollmentSerializer(serializers.ModelSerializer):
    """
    Serializer for enrollment (includes event details).
    """
    event = EventListSerializer(read_only=True)
    seeker = UserSerializer(read_only=True)
    
    class Meta:
        model = Enrollment
        fields = ['id', 'event', 'seeker', 'status', 'enrolled_at', 'updated_at']
        read_only_fields = ['id', 'seeker', 'enrolled_at', 'updated_at']


class EnrollmentCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating enrollment.
    """
    event_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Enrollment
        fields = ['event_id']
    
    def validate_event_id(self, value):
        """Check if event exists"""
        try:
            event = Event.objects.get(id=value)
        except Event.DoesNotExist:
            raise serializers.ValidationError("Event not found.")
        
        # Check if event is in the future
        if event.starts_at < timezone.now():
            raise serializers.ValidationError("Cannot enroll in past events.")
        
        # Check capacity
        if event.is_full:
            raise serializers.ValidationError("Event is full.")
        
        return value
    
    def validate(self, data):
        """Check for duplicate enrollment"""
        user = self.context['request'].user
        event_id = data['event_id']
        
        # Check if already enrolled
        existing_enrollment = Enrollment.objects.filter(
            event_id=event_id,
            seeker=user,
            status='enrolled'
        ).exists()
        
        if existing_enrollment:
            raise serializers.ValidationError({
                'event_id': "You are already enrolled in this event."
            })
        
        return data
    
    def create(self, validated_data):
        """Create enrollment"""
        event_id = validated_data.pop('event_id')
        event = Event.objects.get(id=event_id)
        
        enrollment = Enrollment.objects.create(
            event=event,
            seeker=self.context['request'].user,
            status='enrolled'
        )
        
        return enrollment
