from django.db.models import Q
from rest_framework.filters import BaseFilterBackend


class EventFilterBackend(BaseFilterBackend):
    """
    Custom filter backend for Event model.
    
    Supports filtering by:
    - location: Exact match on location field
    - language: Exact match on language field
    - starts_after: Filter events starting after this datetime
    - starts_before: Filter events starting before this datetime
    - search: Text search on title and description (case-insensitive)
    """
    
    def filter_queryset(self, request, queryset, view):
        """Apply filters based on query parameters"""
        
        # Filter by location (exact match, case-insensitive)
        location = request.query_params.get('location', None)
        if location:
            queryset = queryset.filter(location__iexact=location)
        
        # Filter by language (exact match, case-insensitive)
        language = request.query_params.get('language', None)
        if language:
            queryset = queryset.filter(language__iexact=language)
        
        # Filter by starts_after (events starting after this datetime)
        starts_after = request.query_params.get('starts_after', None)
        if starts_after:
            queryset = queryset.filter(starts_at__gte=starts_after)
        
        # Filter by starts_before (events starting before this datetime)
        starts_before = request.query_params.get('starts_before', None)
        if starts_before:
            queryset = queryset.filter(starts_at__lte=starts_before)
        
        # Text search on title and description
        search = request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(description__icontains=search)
            )
        
        return queryset


def filter_events(queryset, request):
    """
    Standalone function to filter events queryset.
    Can be used in views or viewsets directly.
    
    Usage:
        queryset = Event.objects.all()
        filtered_queryset = filter_events(queryset, request)
    
    Query Parameters:
        - location: Filter by event location (case-insensitive)
        - language: Filter by event language (case-insensitive)
        - starts_after: Events starting after this datetime (ISO format: 2024-01-01T10:00:00Z)
        - starts_before: Events starting before this datetime (ISO format: 2024-12-31T23:59:59Z)
        - search: Search in title and description (case-insensitive)
    
    Examples:
        ?location=New York
        ?language=English
        ?starts_after=2024-06-01T00:00:00Z
        ?starts_before=2024-12-31T23:59:59Z
        ?search=python workshop
        ?location=Online&language=English&search=django
    """
    
    # Filter by location
    location = request.query_params.get('location', None)
    if location:
        queryset = queryset.filter(location__iexact=location)
    
    # Filter by language
    language = request.query_params.get('language', None)
    if language:
        queryset = queryset.filter(language__iexact=language)
    
    # Filter by starts_after
    starts_after = request.query_params.get('starts_after', None)
    if starts_after:
        queryset = queryset.filter(starts_at__gte=starts_after)
    
    # Filter by starts_before
    starts_before = request.query_params.get('starts_before', None)
    if starts_before:
        queryset = queryset.filter(starts_at__lte=starts_before)
    
    # Text search
    search = request.query_params.get('search', None)
    if search:
        queryset = queryset.filter(
            Q(title__icontains=search) | 
            Q(description__icontains=search)
        )
    
    return queryset


class EventFilterMixin:
    """
    Mixin to add event filtering to any view or viewset.
    
    Usage:
        class EventListView(EventFilterMixin, ListAPIView):
            queryset = Event.objects.all()
            serializer_class = EventSerializer
    """
    
    def filter_queryset(self, queryset):
        """Override to add custom filtering"""
        # Call parent filter_queryset if it exists
        queryset = super().filter_queryset(queryset)
        
        # Apply event filters
        queryset = filter_events(queryset, self.request)
        
        return queryset
