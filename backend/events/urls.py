from django.urls import path
from .views import (
    # Combined view
    EventsListCreateView,
    # Seeker views
    EventSearchView,
    EnrollInEventView,
    CancelEnrollmentView,
    MyEnrollmentsView,
    MyUpcomingEnrollmentsView,
    MyPastEnrollmentsView,
    # Facilitator views
    CreateEventView,
    UpdateEventView,
    DeleteEventView,
    MyEventsView,
    EventEnrollmentsView,
    # Common views
    EventDetailView,
)

app_name = 'events'

urlpatterns = [
    # ============================================
    # COMBINED ENDPOINT
    # ============================================
    # GET for seekers (list events), POST for facilitators (create event)
    path('', EventsListCreateView.as_view(), name='events-list-create'),
    
    # ============================================
    # SEEKER ENDPOINTS
    # ============================================
    path('<int:event_id>/', EventDetailView.as_view(), name='event-detail'),
    
    # Enrollment management
    path('<int:event_id>/enroll/', EnrollInEventView.as_view(), name='enroll'),
    path('enrollments/<int:enrollment_id>/cancel/', CancelEnrollmentView.as_view(), name='cancel-enrollment'),
    path('enrollments/my-enrollments/', MyEnrollmentsView.as_view(), name='my-enrollments'),
    
    # ============================================
    # FACILITATOR ENDPOINTS
    # ============================================
    # Event management
    path('mine/', MyEventsView.as_view(), name='my-events'),
    path('<int:event_id>/update/', UpdateEventView.as_view(), name='update-event'),
    path('<int:event_id>/delete/', DeleteEventView.as_view(), name='delete-event'),
    
    # View enrollments for facilitator's events
    path('<int:event_id>/enrollments/', EventEnrollmentsView.as_view(), name='event-enrollments'),
]
