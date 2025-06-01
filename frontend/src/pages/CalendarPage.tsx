import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CalendarView from '../components/CalendarView';
import EventForm from '../components/EventForm';
import { 
  fetchEvents, 
  deleteEventOccurrence, 
  deleteEvent,
  createEvent,
  updateEvent,
  exportEvent,
  exportCalendar
} from '../api/events';
import { CalendarEvent, EventFormData } from '../types/eventTypes';

const CalendarPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      // If you need admin-specific logic, add it here after updating AuthContextType
      
      const data = await fetchEvents(start, end);
      setEvents(data);
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [currentDate, isAuthenticated]);

  const handleEventSelect = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleSlotSelect = (slotInfo: { start: Date; end: Date }) => {
    setSelectedEvent(null);
    setShowForm(true);
    setIsEditing(false);
  };

  const handleDeleteOccurrence = async () => {
    if (!selectedEvent) return;
    
    try {
      await deleteEventOccurrence(
        selectedEvent.id, 
        selectedEvent.originalStart.toISOString()
      );
      setSelectedEvent(null);
      loadEvents();
    } catch (error) {
      console.error('Failed to delete occurrence:', error);
      setError('Failed to delete occurrence. Please try again.');
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      await deleteEvent(selectedEvent.id);
      setSelectedEvent(null);
      loadEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
      setError('Failed to delete event. Please try again.');
    }
  };

  const handleEditEvent = () => {
    if (!selectedEvent) return;
    setShowForm(true);
    setIsEditing(true);
  };

  const handleCreateEvent = async (data: EventFormData) => {
    try {
      await createEvent(data);
      setShowForm(false);
      loadEvents();
    } catch (error) {
      console.error('Failed to create event:', error);
      setError('Failed to create event. Please try again.');
    }
  };

  const handleUpdateEvent = async (data: EventFormData) => {
    if (!selectedEvent) return;
    
    try {
      await updateEvent(selectedEvent.id, data);
      setShowForm(false);
      setSelectedEvent(null);
      loadEvents();
    } catch (error) {
      console.error('Failed to update event:', error);
      setError('Failed to update event. Please try again.');
    }
  };

  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const handleExportCalendar = async () => {
    try {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const blob = await exportCalendar(start, end);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'calendar.ics');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export calendar. Please try again.');
    }
  };

  const handleExportEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      const blob = await exportEvent(selectedEvent.id);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `event_${selectedEvent.id}.ics`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export event. Please try again.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Calendar</h1>
        
        <div className="flex space-x-2">
          <button
            onClick={handleExportCalendar}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Export Calendar
          </button>
          
          {!showForm && !selectedEvent && (
            <button
              onClick={() => {
                setShowForm(true);
                setIsEditing(false);
                setSelectedEvent(null);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create Event
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading events...</div>
        </div>
      ) : (
        <CalendarView
          events={events}
          onSelectEvent={handleEventSelect}
          onSelectSlot={handleSlotSelect}
          onNavigate={handleNavigate}
          currentDate={currentDate}
        />
      )}

      {showForm && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {isEditing ? 'Edit Event' : 'Create New Event'}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setSelectedEvent(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <EventForm
            initialData={
              isEditing && selectedEvent ? {
                title: selectedEvent.title,
                description: selectedEvent.description || '',
                start: selectedEvent.start.toISOString().slice(0, 16),
                end: selectedEvent.end.toISOString().slice(0, 16),
                isRecurring: selectedEvent.isRecurring,
                frequency: selectedEvent.isRecurring ? (selectedEvent as any).frequency : '',
                interval: (selectedEvent as any).interval || 1,
                weekdays: (selectedEvent as any).weekdays ? (selectedEvent as any).weekdays.split(',') : [],
                monthDay: (selectedEvent as any).monthDay || null,
                monthWeek: (selectedEvent as any).monthWeek || null,
                monthWeekday: (selectedEvent as any).monthWeekday || null,
                until: (selectedEvent as any).until || '',
              } : undefined
            }
            onSubmit={isEditing ? handleUpdateEvent : handleCreateEvent}
            onCancel={() => {
              setShowForm(false);
              setSelectedEvent(null);
            }}
            isEditing={isEditing}
          />
        </div>
      )}

      {selectedEvent && !showForm && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-2">{selectedEvent.title}</h2>
          {selectedEvent.description && (
            <p className="text-gray-700 mb-4">{selectedEvent.description}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="font-semibold">Start</h3>
              <p>{selectedEvent.start.toLocaleString()}</p>
            </div>
            <div>
              <h3 className="font-semibold">End</h3>
              <p>{selectedEvent.end.toLocaleString()}</p>
            </div>
            {selectedEvent.isRecurring && (
              <div>
                <h3 className="font-semibold">Recurrence</h3>
                <p>This is part of a recurring event</p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleEditEvent}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Edit Event
            </button>
            {selectedEvent.isRecurring && (
              <button
                onClick={handleDeleteOccurrence}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Delete This Occurrence
              </button>
            )}
            <button
              onClick={handleExportEvent}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Export as .ics
            </button>
            <button
              onClick={handleDeleteEvent}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete Event
            </button>
            <button
              onClick={() => setSelectedEvent(null)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;