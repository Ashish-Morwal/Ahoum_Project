from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from django.utils import timezone
from django.db.models import Count, Q
from authentication.permissions import IsSeeker, IsFacilitator, IsOwner
from .models import Event, Enrollment
from .serializers import (
    EventListSerializer, EventDetailSerializer, EventCreateSerializer,
    EventUpdateSerializer, FacilitatorEventSerializer,
    EnrollmentSerializer, EnrollmentCreateSerializer
)
from .filters import EventFilterBackend


class EventsListCreateView(APIView):
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsFacilitator()]
        return [IsAuthenticatedOrReadOnly()]
    
    def get(self, request):
        queryset = Event.objects.filter(starts_at__gte=timezone.now())
        location = request.query_params.get('location')
        language = request.query_params.get('language')
        search = request.query_params.get('search')
        
        if location:
            queryset = queryset.filter(location__icontains=location)
        if language:
            queryset = queryset.filter(language__icontains=language)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(location__icontains=search)
            )
        
        ordering = request.query_params.get('ordering', 'starts_at')
        queryset = queryset.order_by(ordering)
        
        page = int(request.query_params.get('page', 1))
        page_size = 10
        start = (page - 1) * page_size
        end = start + page_size
        
        total_count = queryset.count()
        events = queryset[start:end]
        
        serializer = EventListSerializer(events, many=True)
        
        return Response({
            'count': total_count,
            'next': page + 1 if end < total_count else None,
            'previous': page - 1 if page > 1 else None,
            'results': serializer.data
        })
    
    def post(self, request):
        serializer = EventCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        event = serializer.save()
        return Response(
            EventDetailSerializer(event).data,
            status=status.HTTP_201_CREATED
        )


class EventSearchView(generics.ListAPIView):
    serializer_class = EventListSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [EventFilterBackend]
    ordering_fields = ['starts_at', 'created_at', 'title']
    ordering = ['starts_at']
    
    def get_queryset(self):
        queryset = Event.objects.filter(starts_at__gte=timezone.now())
        
        ordering = self.request.query_params.get('ordering', 'starts_at')
        if ordering:
            queryset = queryset.order_by(ordering)
        
        return queryset


class EnrollInEventView(APIView):
    permission_classes = [IsAuthenticated, IsSeeker]
    
    def post(self, request, event_id):
        data = {'event_id': event_id}
        
        serializer = EnrollmentCreateSerializer(
            data=data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            enrollment = serializer.save()
            response_serializer = EnrollmentSerializer(enrollment)
            
            return Response({
                'message': 'Successfully enrolled in event',
                'enrollment': response_serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CancelEnrollmentView(APIView):
    permission_classes = [IsAuthenticated, IsSeeker]
    
    def delete(self, request, enrollment_id):
        try:
            enrollment = Enrollment.objects.get(
                id=enrollment_id,
                seeker=request.user
            )
        except Enrollment.DoesNotExist:
            return Response({
                'error': 'Enrollment not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        enrollment.status = 'canceled'
        enrollment.save()
        
        return Response({
            'message': 'Enrollment canceled successfully'
        }, status=status.HTTP_200_OK)


class MyEnrollmentsView(generics.ListAPIView):
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated, IsSeeker]
    
    def get_queryset(self):
        return Enrollment.objects.filter(
            seeker=self.request.user,
            status='enrolled'
        ).select_related('event', 'seeker').order_by('-event__starts_at')


class MyUpcomingEnrollmentsView(generics.ListAPIView):
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated, IsSeeker]
    
    def get_queryset(self):
        return Enrollment.objects.filter(
            seeker=self.request.user,
            status='enrolled',
            event__starts_at__gte=timezone.now()
        ).select_related('event', 'seeker').order_by('event__starts_at')


class MyPastEnrollmentsView(generics.ListAPIView):
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated, IsSeeker]
    
    def get_queryset(self):
        return Enrollment.objects.filter(
            seeker=self.request.user,
            status='enrolled',
            event__starts_at__lt=timezone.now()
        ).select_related('event', 'seeker').order_by('-event__starts_at')


class CreateEventView(generics.CreateAPIView):
    serializer_class = EventCreateSerializer
    permission_classes = [IsAuthenticated, IsFacilitator]
    
    def perform_create(self, serializer):
        serializer.save()


class UpdateEventView(generics.UpdateAPIView):
    serializer_class = EventUpdateSerializer
    permission_classes = [IsAuthenticated, IsFacilitator, IsOwner]
    lookup_field = 'id'
    lookup_url_kwarg = 'event_id'
    
    def get_queryset(self):
        return Event.objects.filter(created_by=self.request.user)


class DeleteEventView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated, IsFacilitator, IsOwner]
    lookup_field = 'id'
    lookup_url_kwarg = 'event_id'
    
    def get_queryset(self):
        return Event.objects.filter(created_by=self.request.user)


class MyEventsView(generics.ListAPIView):
    serializer_class = FacilitatorEventSerializer
    permission_classes = [IsAuthenticated, IsFacilitator]
    
    def get_queryset(self):
        return Event.objects.filter(
            created_by=self.request.user
        ).order_by('-created_at')


class EventDetailView(generics.RetrieveAPIView):
    serializer_class = EventDetailSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = 'id'
    lookup_url_kwarg = 'event_id'
    queryset = Event.objects.all()


class EventEnrollmentsView(generics.ListAPIView):
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated, IsFacilitator]
    
    def get_queryset(self):
        event_id = self.kwargs.get('event_id')
        
        event = Event.objects.filter(
            id=event_id,
            created_by=self.request.user
        ).first()
        
        if not event:
            return Enrollment.objects.none()
        
        return Enrollment.objects.filter(
            event_id=event_id,
            status='enrolled'
        ).select_related('event', 'seeker').order_by('-enrolled_at')
