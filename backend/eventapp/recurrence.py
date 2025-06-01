from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from django.utils import timezone
from .models import Event

WEEKDAY_MAP = {
    'MO': 0,
    'TU': 1,
    'WE': 2,
    'TH': 3,
    'FR': 4,
    'SA': 5,
    'SU': 6,
}

def next_weekday(date, weekday):
    """Get next specific weekday from date"""
    days_ahead = (weekday - date.weekday()) % 7
    if days_ahead == 0:
        days_ahead = 7
    return date + timedelta(days=days_ahead)

def nth_weekday_in_month(year, month, nth, weekday):
    """Get nth weekday in month."""
    # Create the first day of the month
    first_day = timezone.make_aware(datetime(year, month, 1))

    # Adjust to target weekday
    first_target = first_day + timedelta(days=(weekday - first_day.weekday() + 7) % 7)

    # If we're counting backwards (last week)
    if nth < 0:
        next_month = first_day.replace(day=28) + timedelta(days=4)  # Go to next month
        last_day = next_month - timedelta(days=next_month.day)  # Get last day of current month
        last_target = last_day - timedelta(days=(last_day.weekday() - weekday + 7) % 7)
        return last_target + timedelta(weeks=nth + 1)

    return first_target + timedelta(weeks=nth - 1)

def generate_occurrences(event, start, end):
    """Generate event occurrences between start and end dates"""
    occurrences = []
    current = event.start
    
    # Handle single occurrence
    if not event.is_recurring:
        if start <= current <= end:
            return [current]
        return []
    
    # Handle recurrence patterns
    while current <= (event.until or end):
        if current >= start:
            occurrences.append(current)
        
        if event.frequency == 'DAILY':
            current += timedelta(days=event.interval)
        elif event.frequency == 'WEEKLY':
            if event.weekdays:
                # Convert weekday codes to numbers
                weekday_numbers = [WEEKDAY_MAP[wd] for wd in event.weekdays.split(',')]
                
                # Find the next occurrence for each weekday
                next_dates = [
                    next_weekday(current + timedelta(days=1), wd) 
                    for wd in weekday_numbers
                ]
                
                # Get the earliest next date
                next_date = min(next_dates)
                current = next_date
            else:
                current += timedelta(weeks=event.interval)
        elif event.frequency == 'MONTHLY':
            if event.month_day:
                # Absolute day pattern (e.g., 15th of month)
                try:
                    next_month = current.month + event.interval
                    next_year = current.year
                    if next_month > 12:
                        next_month -= 12
                        next_year += 1
                    
                    current = datetime(
                        next_year, 
                        next_month, 
                        min(event.month_day, 28),  # Safe day for all months
                        current.hour,
                        current.minute,
                        tzinfo=timezone.utc
                    )
                except ValueError:  # Handle invalid dates
                    current += relativedelta(months=event.interval)
            elif event.month_week is not None and event.month_weekday is not None:
                # Relative pattern (e.g., 2nd Friday)
                next_month = current.month + event.interval
                next_year = current.year
                if next_month > 12:
                    next_month -= 12
                    next_year += 1
                
                current = nth_weekday_in_month(
                    next_year,
                    next_month,
                    event.month_week,
                    event.month_weekday
                )
                if not current:
                    current += relativedelta(months=event.interval)
            else:
                current += relativedelta(months=event.interval)
        elif event.frequency == 'YEARLY':
            current += relativedelta(years=event.interval)
    
    return occurrences