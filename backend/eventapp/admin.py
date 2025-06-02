from django.contrib import admin
from .models import Event, User,OccurrenceOverride

class EventAdmin(admin.ModelAdmin):
    def save_model(self, request, obj, form, change):
        obj.clean()
        super().save_model(request, obj, form, change)

admin.site.register(Event, EventAdmin)
admin.site.register(User)  # Register User model separately
admin.site.register(OccurrenceOverride)