from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth import get_user_model
from django.contrib.auth.models import User
from .models import Event, OccurrenceOverride
from .serializers import EventSerializer, OccurrenceOverrideSerializer, UserSerializer
from .recurrence import generate_occurrences
from datetime import datetime
from rest_framework_simplejwt.tokens import RefreshToken
from django.http import Http404
from django.shortcuts import get_object_or_404
from icalendar import Calendar, Event as ICalEvent
from django.http import HttpResponse
from datetime import datetime, timedelta
User = get_user_model()
class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user
class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Event.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    def get_object(self):
        """Override to provide a custom error message when an event is not found."""
        queryset = self.get_queryset()
        filter_kwargs = {'pk': self.kwargs['pk']}
        try:
            return queryset.get(**filter_kwargs)
        except Event.DoesNotExist:
            event_id = self.kwargs['pk']
            raise Http404(f"No Event matches the given event id {event_id}.")
    
    @action(detail=True, methods=['post'])
    def delete_occurrence(self, request, pk=None):
        event = self.get_object()

        original_start = request.data.get('original_start')
        
        if not original_start:
            return Response({'error': 'Missing original_start'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            original_start_dt = datetime.fromisoformat(original_start)
        except (TypeError, ValueError):
            return Response({'error': 'Invalid date format'}, status=status.HTTP_400_BAD_REQUEST)
        
        OccurrenceOverride.objects.create(
            event=event,
            original_start=original_start_dt,
            is_cancelled=True
        )
        return Response({'status': 'occurrence deleted'}, status=status.HTTP_200_OK)
class OccurrenceViewSet(viewsets.ModelViewSet):
    serializer_class = OccurrenceOverrideSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return OccurrenceOverride.objects.filter(event__user=self.request.user)
class CalendarView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        start_str = request.query_params.get('start')
        end_str = request.query_params.get('end')
        
        try:
            start = datetime.fromisoformat(start_str) if start_str else None
            end = datetime.fromisoformat(end_str) if end_str else None
        except (TypeError, ValueError):
            return Response({'error': 'Invalid date format'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not start or not end:
            return Response({'error': 'Missing start or end parameters'}, status=status.HTTP_400_BAD_REQUEST)
        
        events = Event.objects.filter(user=request.user)
        results = []
        
        for event in events:
            occurrences = generate_occurrences(event, start, end)
            for occ in occurrences:
                override = event.overrides.filter(original_start=occ).first()
                
                if override and override.is_cancelled:
                    continue  # Skip cancelled occurrences
                
                results.append({
                    'id': event.id,
                    'title': event.title,
                    'description': event.description,
                    'start': override.new_start.isoformat() if override and override.new_start else occ.isoformat(),
                    'end': override.new_end.isoformat() if override and override.new_end else event.end.isoformat(),
                    'isRecurring': event.is_recurring,
                    'originalStart': occ.isoformat(),
                })
        
        return Response(results)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]
    
    @action(detail=False, methods=['post'])
    def register(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # Create new user
            user = User.objects.create_user(
                username=serializer.validated_data['username'],
                password=serializer.validated_data['password']
            )
            return Response({'status': 'user created'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        return Response({'error': 'invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        logout(request)
        return Response({'status': 'logout successful'})
class ExportEventView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, event_id):
        event = get_object_or_404(Event, id=event_id)
        
        # Create iCalendar
        cal = Calendar()
        cal.add('prodid', '-//Event Scheduler//mxm.dk//')
        cal.add('version', '2.0')
        
        ical_event = ICalEvent()
        ical_event.add('summary', event.title)
        ical_event.add('description', event.description)
        ical_event.add('dtstart', event.start)
        ical_event.add('dtend', event.end)
        ical_event.add('dtstamp', datetime.now())
        ical_event.add('uid', f'event-{event.id}@eventscheduler.com')
        
        if event.is_recurring:
            rrule = {}
            if event.frequency == 'DAILY':
                rrule['FREQ'] = 'DAILY'
            elif event.frequency == 'WEEKLY':
                rrule['FREQ'] = 'WEEKLY'
                if event.weekdays:
                    rrule['BYDAY'] = event.weekdays.split(',')
            elif event.frequency == 'MONTHLY':
                rrule['FREQ'] = 'MONTHLY'
            elif event.frequency == 'YEARLY':
                rrule['FREQ'] = 'YEARLY'
            
            rrule['INTERVAL'] = event.interval
            
            if event.until:
                rrule['UNTIL'] = event.until
                
            ical_event.add('rrule', rrule)
        
        cal.add_component(ical_event)
        
        response = HttpResponse(cal.to_ical(), content_type='text/calendar')
        response['Content-Disposition'] = f'attachment; filename="event_{event.id}.ics"'
        return response

class ExportCalendarView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        start_str = request.query_params.get('start')
        end_str = request.query_params.get('end')
        
        try:
            start = datetime.fromisoformat(start_str) if start_str else None
            end = datetime.fromisoformat(end_str) if end_str else None
        except (TypeError, ValueError):
            return Response({'error': 'Invalid date format'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get events (same as calendar view)
        # if request.user.is_admin:
        #     events = Event.objects.all()
        # else:
        events = Event.objects.filter(user=request.user)
        
        # Create iCalendar
        cal = Calendar()
        cal.add('prodid', '-//Event Scheduler//mxm.dk//')
        cal.add('version', '2.0')
        
        for event in events:
            # Generate occurrences
            occurrences = generate_occurrences(event, start, end)
            for occ in occurrences:
                # Skip cancelled occurrences
                override = event.overrides.filter(original_start=occ).first()
                if override and override.is_cancelled:
                    continue
                    
                # Create event for each occurrence
                ical_event = ICalEvent()
                ical_event.add('summary', event.title)
                ical_event.add('description', event.description)
                
                event_start = override.new_start if override else occ
                event_end = override.new_end if override else event.end
                
                ical_event.add('dtstart', event_start)
                ical_event.add('dtend', event_end)
                ical_event.add('dtstamp', datetime.now())
                ical_event.add('uid', f'event-{event.id}-{occ.isoformat()}@eventscheduler.com')
                
                cal.add_component(ical_event)
        
        response = HttpResponse(cal.to_ical(), content_type='text/calendar')
        response['Content-Disposition'] = 'attachment; filename="calendar.ics"'
        return response