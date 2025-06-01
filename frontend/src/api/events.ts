import axios from 'axios';
import { 
  Event, 
  CalendarEvent, 
  EventFormData,
  UserCredentials
} from '../types/eventTypes';

const API_URL = 'http://localhost:8000/api';

axios.interceptors.request.use(config => {
  if (!config.headers) {
    config.headers = {};
  }
  config.headers['Content-Type'] = 'application/json';
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fetchEvents = async (start: Date, end: Date): Promise<CalendarEvent[]> => {
  const response = await axios.get<CalendarEvent[]>(`${API_URL}/calendar/`, {
    params: {
      start: start.toISOString(),
      end: end.toISOString(),
    },
  });
  return response.data.map((event: any) => ({
    ...event,
    start: new Date(event.start),
    end: new Date(event.end),
    originalStart: new Date(event.originalStart),
  }));
};

export const fetchUpcomingEvents = async (limit: number = 10): Promise<Event[]> => {
  const response = await axios.get<Event[]>(`${API_URL}/events/`, {
    params: {
      upcoming: true,
      limit: limit,
    },
  });
  return response.data;
};

export const createEvent = async (data: EventFormData): Promise<Event> => {
  const payload = {
    ...data,
    weekdays: data.weekdays?.join(','),
    until: data.until || null,
  };
  const response = await axios.post<Event>(`${API_URL}/events/`, payload);
  return response.data;
};

export const updateEvent = async (id: number, data: EventFormData): Promise<Event> => {
  const payload = {
    ...data,
    weekdays: data.weekdays?.join(','),
    until: data.until || null,
  };
  const response = await axios.put<Event>(`${API_URL}/events/${id}/`, payload);
  return response.data;
};

export const deleteEvent = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/events/${id}/`);
};

export const deleteEventOccurrence = async (eventId: number, originalStart: string): Promise<void> => {
  await axios.post(`${API_URL}/events/${eventId}/delete_occurrence/`, {
    original_start: originalStart,
  });
};

export const registerUser = async (credentials: UserCredentials): Promise<void> => {
  await axios.post(`${API_URL}/auth/register/`, credentials);
};

export const loginUser = async (credentials: UserCredentials): Promise<string> => {
  const response = await axios.post(`${API_URL}/auth/token/`, credentials);
  console.log(response.data);
  return (response.data as { access: string }).access;
};

export const logoutUser = async (): Promise<void> => {
  await axios.post(`${API_URL}/auth/logout/`);
};
export const exportEvent = async (eventId: number): Promise<Blob> => {
  const response = await axios.get<Blob>(`${API_URL}/events/${eventId}/export/`, {
    responseType: 'blob',
  });
  return response.data;
};

export const exportCalendar = async (start: Date, end: Date): Promise<Blob> => {
  const response = await axios.get<Blob>(`${API_URL}/calendar/export/`, {
    params: {
      start: start.toISOString(),
      end: end.toISOString(),
    },
    responseType: 'blob',
  });
  return response.data;
};