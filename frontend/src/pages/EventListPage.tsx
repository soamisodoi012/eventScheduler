import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import EventList from '../components/EventList';
import EventForm from '../components/EventForm';
import { 
  fetchUpcomingEvents, 
  createEvent, 
  updateEvent, 
  deleteEvent 
} from '../api/events';
import { Event, EventFormData } from '../types/eventTypes';

const EventListPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchUpcomingEvents();
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
  }, [isAuthenticated]);

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
    if (!editingEvent) return;
    
    try {
      await updateEvent(editingEvent.id, data);
      setShowForm(false);
      setEditingEvent(null);
      loadEvents();
    } catch (error) {
      console.error('Failed to update event:', error);
      setError('Failed to update event. Please try again.');
    }
  };

  const handleDeleteEvent = async (id: number) => {
    try {
      await deleteEvent(id);
      loadEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
      setError('Failed to delete event. Please try again.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Upcoming Events</h1>
        
        {/* Only show Create Event button when form is not visible */}
        {!showForm && (
          <button
            onClick={() => {
              setShowForm(true);
              setEditingEvent(null);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create Event
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {editingEvent ? 'Edit Event' : 'Create New Event'}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingEvent(null);
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
              editingEvent ? {
                title: editingEvent.title,
                description: editingEvent.description,
                start: editingEvent.start,
                end: editingEvent.end,
                isRecurring: editingEvent.isRecurring,
                frequency: editingEvent.frequency || '',
                interval: editingEvent.interval || 1,
                weekdays: editingEvent.weekdays ? editingEvent.weekdays.split(',') : [],
                monthDay: editingEvent.monthDay || null,
                monthWeek: editingEvent.monthWeek || null,
                monthWeekday: editingEvent.monthWeekday || null,
                until: editingEvent.until || '',
              } : undefined
            }
            onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
            onCancel={() => {
              setShowForm(false);
              setEditingEvent(null);
            }}
            isEditing={!!editingEvent}
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="text-gray-500">Loading events...</div>
        </div>
      ) : (
        <EventList 
          events={events} 
          onEdit={(event) => {
            setEditingEvent(event);
            setShowForm(true);
          }}
          onDelete={handleDeleteEvent} 
        />
      )}
    </div>
  );
};

export default EventListPage;