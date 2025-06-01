from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.core.validators import MinValueValidator,MaxValueValidator
from django.core.exceptions import ValidationError

class User(AbstractUser):
    # Use a custom ID field as the primary key to prefix with 'US-'
    id = models.CharField(max_length=10, primary_key=True, editable=False)

    # Override the groups and user_permissions fields with custom related names
    groups = models.ManyToManyField(
        Group,
        related_name='custom_user_set',
        blank=True
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name='custom_user_permissions_set',
        blank=True
    )

    def save(self, *args, **kwargs):
        if not self.id:
            # Generate custom ID
            last_user = User.objects.order_by('id').last()
            if last_user:
                last_id = int(last_user.id.split('-')[1]) + 1
            else:
                last_id = 1
            
            self.id = f'US-{last_id:02}'
        
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username

class Event(models.Model):
    FREQUENCY_CHOICES = [
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
        ('MONTHLY', 'Monthly'),
        ('YEARLY', 'Yearly'),
    ]
    
    WEEKDAY_CHOICES = [
        ('MO', 'Monday'),
        ('TU', 'Tuesday'),
        ('WE', 'Wednesday'),
        ('TH', 'Thursday'),
        ('FR', 'Friday'),
        ('SA', 'Saturday'),
        ('SU', 'Sunday'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='events')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start = models.DateTimeField()
    end = models.DateTimeField()
    is_recurring = models.BooleanField(default=False)
    frequency = models.CharField(max_length=10, choices=FREQUENCY_CHOICES, blank=True, null=True)
    interval = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    weekdays = models.CharField(max_length=50, blank=True)  # Comma-separated weekdays
    month_day = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(31)])
    month_week = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)])
    month_weekday = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0), MaxValueValidator(6)])
    until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    def clean(self):
        super().clean()  
        if self.is_recurring:
            if not self.frequency:
                raise ValidationError("Frequency is required for recurring events")
            
            if self.frequency == 'WEEKLY' and not self.weekdays:
                raise ValidationError("Weekdays are required for weekly recurrence")
            
            if self.frequency == 'MONTHLY':
                if not self.month_day and (self.month_week is None or self.month_weekday is None):
                    raise ValidationError("Monthly recurrence requires either day of month or relative pattern")
    def __str__(self):
        return f"{self.title} ({self.start})"

class OccurrenceOverride(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='overrides')
    original_start = models.DateTimeField()
    new_start = models.DateTimeField(null=True, blank=True)
    new_end = models.DateTimeField(null=True, blank=True)
    is_cancelled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Override for {self.original_start}"