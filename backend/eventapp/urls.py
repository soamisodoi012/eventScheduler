from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView
urlpatterns = [
    # Authentication endpoints
    path('auth/token/', views.LoginView.as_view(), name='token_obtain'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', views.UserViewSet.as_view({'post': 'register'}), name='register'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    
    # Event endpoints
    path('events/', views.EventViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='event-list'),
    path('events/<int:pk>/', views.EventViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='event-detail'),
    path('events/<int:pk>/delete_occurrence/', views.EventViewSet.as_view({
        'post': 'delete_occurrence'
    }), name='delete-occurrence'),
    
    # Calendar endpoints
    path('calendar/', views.CalendarView.as_view(), name='calendar'),
    
    # Occurrence endpoints
    path('occurrences/', views.OccurrenceViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='occurrence-list'),
    path('occurrences/<int:pk>/', views.OccurrenceViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='occurrence-detail'),
    path('events/<int:event_id>/export/', views.ExportEventView.as_view(), name='export-event'),
path('calendar/export/', views.ExportCalendarView.as_view(), name='export-calendar'),
]