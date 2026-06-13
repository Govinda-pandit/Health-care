import { useState, useEffect, useCallback } from 'react';
import { format, addDays } from 'date-fns';
import api from '../api/api.js';

const BookSlotPicker = ({ doctorId, onBook }) => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [dateStr, setDateStr]             = useState(todayStr);
  const [slots, setSlots]                 = useState([]);
  const [selectedSlot, setSelectedSlot]   = useState('');
  const [loading, setLoading]             = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [slotError, setSlotError]         = useState('');
  const [bookingError, setBookingError]   = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');

  // ── Fetch available slots ─────────────────────────────────
  const fetchSlots = useCallback(async (date) => {
    if (!doctorId || !date) return;
    setLoading(true);
    setSlotError('');
    setSelectedSlot('');
    setBookingError('');
    setBookingSuccess('');
    try {
      const res = await api.get(`/api/doctors/${doctorId}/slots`, {
        params: { date },
      });
      setSlots(Array.isArray(res.data?.availableSlots) ? res.data.availableSlots : []);
    } catch (err) {
      console.error('Slot fetch error:', err);
      setSlotError(err.response?.data?.error || 'Failed to load slots. Please try again.');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  // Re-fetch when date or doctor changes
  useEffect(() => {
    fetchSlots(dateStr);
  }, [doctorId, dateStr, fetchSlots]);

  // ── Book selected slot ────────────────────────────────────
  const handleBook = async () => {
    if (!selectedSlot) return;

    // Check login
    const token = localStorage.getItem('token');
    if (!token) {
      setBookingError('Please login to book an appointment.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');
    setBookingSuccess('');

    try {
      // Send date as UTC midnight string so backend sameUTCDate() works correctly
      const [y, m, d] = dateStr.split('-').map(Number);
      const utcMidnight = new Date(Date.UTC(y, m - 1, d)).toISOString();

      const res = await api.post('/api/appointments/book', {
        doctorProfileId: doctorId,
        date: utcMidnight,
        time: selectedSlot,
      });

      setBookingSuccess('✅ Appointment booked! Check your dashboard.');
      setSlots((prev) => prev.filter((s) => s.time !== selectedSlot));
      setSelectedSlot('');
      onBook?.(res.data?.appointment);
    } catch (err) {
      console.error('Booking error:', err);
      const msg = err.response?.data?.error || err.message || 'Booking failed. Please try again.';
      setBookingError(msg);
      onBook?.(null);
    } finally {
      setBookingLoading(false);
    }
  };

  // ── Build next 14 days ────────────────────────────────────
  const availableDates = Array.from({ length: 14 }, (_, i) => {
    return format(addDays(new Date(), i), 'yyyy-MM-dd');
  });

  return (
    <div className="space-y-5 bg-gray-50 p-5 rounded-xl border border-gray-200 mt-4">

      {/* ── Date picker ──────────────────────────────────── */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Select Date</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {availableDates.map((d) => {
            const dayLabel  = format(new Date(d + 'T00:00:00'), 'EEE');
            const dateLabel = format(new Date(d + 'T00:00:00'), 'd MMM');
            const isSelected = d === dateStr;
            return (
              <button
                key={d}
                onClick={() => setDateStr(d)}
                className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border-2 text-xs transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-600 text-white font-semibold shadow'
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

      {/* ── Slots grid ───────────────────────────────────── */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-2">Available Slots</p>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Loading slots...
          </div>
        ) : slotError ? (
          <div className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {slotError}
            <button
              onClick={() => fetchSlots(dateStr)}
              className="ml-2 underline text-red-600 font-semibold"
            >
              Retry
            </button>
          </div>
        ) : slots.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {slots.map((slot, i) => (
              <button
                key={i}
                onClick={() => setSelectedSlot(slot.time)}
                className={`py-2 px-3 rounded-lg border-2 text-sm transition-all font-medium ${
                  selectedSlot === slot.time
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold shadow'
                    : 'border-gray-200 bg-white hover:border-blue-300 text-gray-700'
                }`}
              >
                {slot.time}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">📅</div>
            <p className="text-gray-400 text-sm">No slots available on this date.</p>
            <p className="text-gray-300 text-xs mt-1">Try selecting another date.</p>
          </div>
        )}
      </div>

      {/* ── Error / Success messages ──────────────────────── */}
      {bookingError && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          ❌ {bookingError}
        </p>
      )}
      {bookingSuccess && (
        <p className="text-emerald-700 text-sm bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          {bookingSuccess}
        </p>
      )}

      {/* ── Book button ───────────────────────────────────── */}
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
          selectedSlot ? `Book at ${selectedSlot}` : 'Select a slot to book'
        )}
      </button>
    </div>
  );
};

export default BookSlotPicker;
