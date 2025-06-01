from rest_framework import serializers
from .models import User, Event, OccurrenceOverride
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
User = get_user_model()
class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'password')
    
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password']
        )
        return user
class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = [
            'id', 
            'user', 
            'title', 
            'description', 
            'start', 
            'end', 
            'is_recurring', 
            'frequency', 
            'interval', 
            'weekdays', 
            'month_day', 
            'month_week', 
            'month_weekday', 
            'until', 
            'created_at', 
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'user']
        extra_kwargs = {
            'start': {'required': True},
            'end': {'required': True},
        }
    def validate_weekdays(self, value):
        if value:
            valid_days = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
            days = value.split(',')
            for day in days:
                if day not in valid_days:
                    raise serializers.ValidationError(f"Invalid weekday: {day}")
        return value
    def validate(self, data):
        if data['start'] >= data['end']:
            raise serializers.ValidationError("End time must be after start time")
        
        # Validate recurrence patterns
        if data.get('is_recurring'):
            frequency = data.get('frequency')
            if not frequency:
                raise serializers.ValidationError("Frequency is required for recurring events")
            
            if frequency == 'WEEKLY' and not data.get('weekdays'):
                raise serializers.ValidationError("Weekdays are required for weekly recurrence")
            
            if frequency == 'MONTHLY':
                if not data.get('month_day') and (data.get('month_week') is None or data.get('month_weekday') is None):
                    raise serializers.ValidationError("Monthly recurrence requires either day of month or relative pattern")
        event = Event(**data)
        
        try:
            event.clean()
        except ValidationError as e:
            raise serializers.ValidationError(e.message_dict)
        return data
        

class OccurrenceOverrideSerializer(serializers.ModelSerializer):
    class Meta:
        model = OccurrenceOverride
        fields = [
            'id', 
            'event', 
            'original_start', 
            'new_start', 
            'new_end', 
            'is_cancelled', 
            'created_at', 
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']