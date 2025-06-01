export interface Event {
  id: number;
  title: string;
  description: string;
  start: string;
  end: string;
  isRecurring: boolean;
  frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval?: number;
  weekdays?: string;
  monthDay?: number | null;
  monthWeek?: number | null;
  monthWeekday?: number | null;
  until?: string | null;
}

export interface CalendarEvent {
  id: number;
  title: string;
  description: string;
  start: Date;
  end: Date;
  isRecurring: boolean;
  originalStart: Date;
}

export interface EventFormData {
  title: string;
  description: string;
  start: string;
  end: string;
  isRecurring: boolean;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | '';
  interval: number;
  weekdays: string[];
  monthDay: number | null;
  monthWeek: number | null;
  monthWeekday: number | null;
  until: string;
}

export interface UserCredentials {
  username: string;
  password: string;
}