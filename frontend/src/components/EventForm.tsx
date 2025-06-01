import React, { useState, useEffect } from 'react';
import { EventFormData } from '../types/eventTypes';

const WEEKDAYS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_WEEK_OPTIONS = [
  { value: 1, label: 'First' },
  { value: 2, label: 'Second' },
  { value: 3, label: 'Third' },
  { value: 4, label: 'Fourth' },
  { value: -1, label: 'Last' },
];
const WEEKDAY_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

interface EventFormProps {
  initialData?: EventFormData;
  onSubmit: (data: EventFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const EventForm: React.FC<EventFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel,
  isEditing = false
}) => {
  const defaultData: EventFormData = {
    title: '',
    description: '',
    start: new Date().toISOString().slice(0, 16),
    end: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
    isRecurring: false,
    frequency: '',
    interval: 1,
    weekdays: [],
    monthDay: null,
    monthWeek: null,
    monthWeekday: null,
    until: '',
  };

  const [formData, setFormData] = useState<EventFormData>(defaultData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'interval') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 1 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleWeekdayChange = (weekday: string) => {
    setFormData(prev => {
      const weekdays = prev.weekdays.includes(weekday)
        ? prev.weekdays.filter(w => w !== weekday)
        : [...prev.weekdays, weekday];
      return { ...prev, weekdays };
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.start) newErrors.start = 'Start time is required';
    if (!formData.end) newErrors.end = 'End time is required';
    
    if (new Date(formData.end) <= new Date(formData.start)) {
      newErrors.end = 'End time must be after start time';
    }
    
    if (formData.isRecurring) {
      if (!formData.frequency) newErrors.frequency = 'Frequency is required';
      if (formData.interval < 1) newErrors.interval = 'Interval must be at least 1';
      
      if (formData.frequency === 'WEEKLY' && formData.weekdays.length === 0) {
        newErrors.weekdays = 'At least one weekday must be selected';
      }
      
      if (formData.frequency === 'MONTHLY') {
        if (!formData.monthDay && (formData.monthWeek === null || formData.monthWeekday === null)) {
          newErrors.monthlyType = 'Please select a monthly recurrence type';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-1 font-medium">Title*</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={`w-full p-2 border rounded ${errors.title ? 'border-red-500' : ''}`}
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
      </div>
      
      <div>
        <label className="block mb-1 font-medium">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-medium">Start*</label>
          <input
            type="datetime-local"
            name="start"
            value={formData.start}
            onChange={handleChange}
            className={`w-full p-2 border rounded ${errors.start ? 'border-red-500' : ''}`}
          />
          {errors.start && <p className="text-red-500 text-sm mt-1">{errors.start}</p>}
        </div>
        
        <div>
          <label className="block mb-1 font-medium">End*</label>
          <input
            type="datetime-local"
            name="end"
            value={formData.end}
            onChange={handleChange}
            className={`w-full p-2 border rounded ${errors.end ? 'border-red-500' : ''}`}
          />
          {errors.end && <p className="text-red-500 text-sm mt-1">{errors.end}</p>}
        </div>
      </div>
      
      <div className="pt-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            name="isRecurring"
            checked={formData.isRecurring}
            onChange={handleChange}
            className="mr-2"
          />
          <span className="font-medium">Recurring Event</span>
        </label>
      </div>
      
      {formData.isRecurring && (
        <div className="space-y-4 p-4 border rounded bg-gray-50">
          <div>
            <label className="block mb-1 font-medium">Frequency*</label>
            <select
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              className={`w-full p-2 border rounded ${errors.frequency ? 'border-red-500' : ''}`}
            >
              <option value="">Select Frequency</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
            {errors.frequency && <p className="text-red-500 text-sm mt-1">{errors.frequency}</p>}
          </div>
          
          <div>
            <label className="block mb-1 font-medium">Repeat Every</label>
            <div className="flex items-center">
              <input
                type="number"
                name="interval"
                min="1"
                value={formData.interval}
                onChange={handleChange}
                className={`w-20 p-2 border rounded ${errors.interval ? 'border-red-500' : ''}`}
              />
              <span className="ml-2">
                {formData.frequency ? formData.frequency.toLowerCase() + '(s)' : 'interval(s)'}
              </span>
            </div>
            {errors.interval && <p className="text-red-500 text-sm mt-1">{errors.interval}</p>}
          </div>
          
          {formData.frequency === 'WEEKLY' && (
            <div>
              <label className="block mb-1 font-medium">On Weekdays*</label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((weekday, idx) => (
                  <button
                    key={weekday}
                    type="button"
                    onClick={() => handleWeekdayChange(weekday)}
                    className={`px-3 py-1 border rounded transition ${
                      formData.weekdays.includes(weekday)
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {WEEKDAY_LABELS[idx]}
                  </button>
                ))}
              </div>
              {errors.weekdays && <p className="text-red-500 text-sm mt-1">{errors.weekdays}</p>}
            </div>
          )}
          
          {formData.frequency === 'MONTHLY' && (
            <div>
              <label className="block mb-1 font-medium">Monthly Pattern*</label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="monthlyType"
                    id="monthDay"
                    checked={!!formData.monthDay}
                    onChange={() => setFormData(prev => ({
                      ...prev,
                      monthDay: prev.monthDay || 1,
                      monthWeek: null,
                      monthWeekday: null
                    }))}
                    className="mr-2"
                  />
                  <label htmlFor="monthDay" className="flex items-center">
                    <span className="mr-2">Day</span>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.monthDay || ''}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        monthDay: parseInt(e.target.value) || null
                      }))}
                      className="w-16 p-1 border rounded"
                      disabled={!formData.monthDay}
                    />
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="monthlyType"
                    id="relativeDay"
                    checked={formData.monthWeek !== null}
                    onChange={() => setFormData(prev => ({
                      ...prev,
                      monthDay: null,
                      monthWeek: prev.monthWeek || 1,
                      monthWeekday: prev.monthWeekday || 0
                    }))}
                    className="mr-2"
                  />
                  <label htmlFor="relativeDay" className="flex items-center flex-wrap">
                    <span className="mr-2">The</span>
                    <select
                      value={formData.monthWeek || ''}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        monthWeek: parseInt(e.target.value) || null
                      }))}
                      className="p-1 border rounded"
                      disabled={formData.monthWeek === null}
                    >
                      {MONTH_WEEK_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    
                    <select
                      value={formData.monthWeekday ?? ''}
                      onChange={e => setFormData(prev => ({
                        ...prev,
                        monthWeekday: parseInt(e.target.value) || null
                      }))}
                      className="ml-2 p-1 border rounded"
                      disabled={formData.monthWeek === null}
                    >
                      {WEEKDAY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
              {errors.monthlyType && <p className="text-red-500 text-sm mt-1">{errors.monthlyType}</p>}
            </div>
          )}
          
          <div>
            <label className="block mb-1 font-medium">Recur Until</label>
            <input
              type="datetime-local"
              name="until"
              value={formData.until}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      )}
      
      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {isEditing ? 'Update Event' : 'Create Event'}
        </button>
      </div>
    </form>
  );
};

export default EventForm;