import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import api from '../api/api.js';

const BookSlotPicker = ({ doctorId, onBook }) => {
  // ✅ Store date as "YYYY-MM-DD" string instead of Date object
  // — a Date object changes reference every render, causing infinite useEffect loops
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [dateStr, setDateStr] = useState(todayStr);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [slotError, setSlotError] = useState('');
  const [bookingError, setBookingError] = useState('');

  // ✅ Stable fetch — only re-created when doctorId changes
  const fetchSlots = useCallback(async (date) => {
    setLoading(true);
    setSlotError('');
    setSelectedSlot('');
    try {
      const res = await api.get(`/api/doctors/${doctorId}/slots`, {
        params: { date }
      });
      setSlots(Array.isArray(res.data?.availableSlots) ? res.data.availableSlots : []);
    } catch (err) {
      console.error('Error fetching slots:', err);
      setSlotError('Failed to load slots.');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  // ✅ Runs only when doctorId or dateStr (primitive string) actually changes
  useEffect(() => {
    if (doctorId && dateStr) {
      fetchSlots(dateStr);
    }
  }, [doctorId, dateStr, fetchSlots]);

  const handleBook = async () => {
    if (!selectedSlot) return;
    setBookingLoading(true);
    setBookingError('');

    const bookingData = {
      doctorProfileId: doctorId,
      // Append T00:00:00 so the string is parsed as LOCAL midnight,
      // not UTC midnight (which shifts the date backward in IST +5:30)
      date: new Date(`${dateStr}T00:00:00`).toISOString(),
      time: selectedSlot,
    };

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login to book an appointment.');

      const res = await api.post('/api/appointments/book', bookingData);
      onBook?.(res.data?.appointment);
    } catch (err) {
      console.error('Booking failed:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Booking failed.';
      setBookingError(errorMsg);
      onBook?.(null);
    } finally {
      setBookingLoading(false);
    }
  };

  // Build next 14 days for date picker
  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return format(d, 'yyyy-MM-dd');
  });

  return (
    <div className="space-y-5 bg-gray-50 p-5 rounded-xl border border-gray-200 mt-4">
      {/* Date Picker — horizontal scroll */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Select Date</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {availableDates.map((d) => {
            const dayLabel = format(new Date(d + 'T00:00:00'), 'EEE');
            const dateLabel = format(new Date(d + 'T00:00:00'), 'd MMM');
            const isSelected = d === dateStr;
            return (
              <button
                key={d}
                onClick={() => setDateStr(d)}
                className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border-2 text-xs transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-600 text-white font-semibold'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-blue-400'
                }`}
              >
                <span>{dayLabel}</span>
                <span className="font-bold text-sm mt-0.5">{dateLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slots */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Available Slots</p>
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Loading slots...
          </div>
        ) : slotError ? (
          <p className="text-red-500 text-sm">{slotError}</p>
        ) : slots.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {slots.map((slot, i) => (
              <button
                key={i}
                onClick={() => setSelectedSlot(slot.time)}
                className={`py-2 px-3 rounded-lg border-2 text-sm transition-all ${
                  selectedSlot === slot.time
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                {slot.time}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-6">No slots available on this date.</p>
        )}
      </div>

      {/* Booking Error */}
      {bookingError && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {bookingError}
        </p>
      )}

      {/* Book Button */}
      <button
        onClick={handleBook}
        disabled={!selectedSlot || loading || bookingLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all"
      >
        {bookingLoading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Booking...
          </span>
        ) : (
          `Book ${selectedSlot ? `at ${selectedSlot}` : 'Appointment'}`
        )}
      </button>
    </div>
  );
};

export default BookSlotPicker;
