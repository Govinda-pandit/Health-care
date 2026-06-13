import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/api.js';
import Navbar from '../components/Navbar.jsx';

const STATUS_STYLES = {
  pending:       'badge-yellow',
  confirmed:     'badge-blue',
  'in-progress': 'badge-blue',
  completed:     'badge-green',
  cancelled:     'badge-red',
};

// Morning + Afternoon + Evening slots
const TIMES = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM',
];

const todayStr = () => new Date().toISOString().split('T')[0];

const DoctorDashboard = () => {
  const { user } = useAuth();

  // Appointments
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [apptError, setApptError] = useState('');

  // Slot management
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [addingSlots, setAddingSlots]   = useState(false);
  const [slotsMsg, setSlotsMsg]         = useState('');
  const [slotDate, setSlotDate]         = useState(todayStr);

  // Existing slots for chosen date
  const [existingSlots, setExistingSlots]       = useState([]);
  const [loadingExisting, setLoadingExisting]   = useState(false);
  const [myProfileId, setMyProfileId]           = useState(null);
  const [deletingSlot, setDeletingSlot]         = useState(null);

  // ── Fetch my appointments ──────────────────────────────────
  const fetchAppointments = useCallback(async () => {
    setApptLoading(true);
    setApptError('');
    try {
      const res = await api.get('/api/appointments/my');
      const data = res.data;
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.appointments)
          ? data.appointments
          : [];
      setAppointments(list);
    } catch (err) {
      setApptError(err.response?.data?.error || 'Failed to load appointments.');
    } finally {
      setApptLoading(false);
    }
  }, []);

  // ── Fetch my profile ID (needed for slots endpoint) ────────
  const fetchMyProfile = useCallback(async () => {
    try {
      const res = await api.get('/api/doctors/my-profile');
      setMyProfileId(res.data?._id || null);
    } catch {
      // Profile may not exist yet — OK
    }
  }, []);

  // ── Fetch existing slots for selected date ─────────────────
  const fetchExistingSlots = useCallback(async (date, profileId) => {
    if (!profileId || !date) return;
    setLoadingExisting(true);
    try {
      const res = await api.get(`/api/doctors/${profileId}/slots`, {
        params: { date },
      });
      // Include booked slots too — fetch all then separate
      const allSlotsRes = await api.get('/api/doctors/my-profile');
      const all = allSlotsRes.data?.availableSlots || [];
      // Filter by date manually
      const [y, m, d] = date.split('-').map(Number);
      const filtered = all.filter((s) => {
        const sd = new Date(s.date);
        return (
          sd.getUTCFullYear() === y &&
          sd.getUTCMonth() + 1 === m &&
          sd.getUTCDate() === d
        );
      });
      setExistingSlots(filtered);
    } catch {
      setExistingSlots([]);
    } finally {
      setLoadingExisting(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetchMyProfile();
  }, [fetchAppointments, fetchMyProfile]);

  useEffect(() => {
    if (myProfileId && slotDate) {
      fetchExistingSlots(slotDate, myProfileId);
    }
  }, [slotDate, myProfileId, fetchExistingSlots]);

  // ── Stats ──────────────────────────────────────────────────
  const upcoming  = appointments.filter((a) => ['pending', 'confirmed', 'in-progress'].includes(a.status));
  const completed = appointments.filter((a) => a.status === 'completed');
  const earnings  = completed.reduce((sum, a) => sum + (a.doctorProfile?.fees || 0), 0);

  // ── Toggle time selection ──────────────────────────────────
  const toggleTime = (t) =>
    setSelectedTimes((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  // ── Add slots ─────────────────────────────────────────────
  const handleAddSlots = async () => {
    if (!selectedTimes.length || !slotDate) return;
    setAddingSlots(true);
    setSlotsMsg('');
    try {
      const slots = selectedTimes.map((time) => ({ date: slotDate, time }));
      const res = await api.post('/api/doctors/slots/add', { slots });
      setSlotsMsg(`✅ ${res.data.message}`);
      setSelectedTimes([]);
      // Refresh existing slots panel
      if (myProfileId) fetchExistingSlots(slotDate, myProfileId);
    } catch (err) {
      setSlotsMsg('❌ ' + (err.response?.data?.error || 'Failed to add slots.'));
    } finally {
      setAddingSlots(false);
    }
  };

  // ── Delete a slot ──────────────────────────────────────────
  const handleDeleteSlot = async (slotId) => {
    setDeletingSlot(slotId);
    try {
      await api.delete(`/api/doctors/slots/${slotId}`);
      setExistingSlots((p) => p.filter((s) => s._id !== slotId));
    } catch (err) {
      alert(err.response?.data?.error || 'Could not delete slot.');
    } finally {
      setDeletingSlot(null);
    }
  };

  // ── Update appointment status ──────────────────────────────
  const handleStatusUpdate = async (apptId, status) => {
    try {
      await api.patch(`/api/appointments/${apptId}/status`, { status });
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.error || 'Status update failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-16">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="bg-white border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <h1 className="text-2xl font-extrabold text-slate-900">
              Good {getGreeting()}, Dr. {user?.name?.split(' ')[0] || 'Doctor'} 👨‍⚕️
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage your appointments and availability
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

          {/* ── Stats ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Upcoming',  value: upcoming.length,  icon: '📅', bg: 'bg-blue-50'    },
              { label: 'Completed', value: completed.length, icon: '✅', bg: 'bg-emerald-50' },
              { label: 'Earnings',  value: `₹${earnings.toLocaleString('en-IN')}`, icon: '💰', bg: 'bg-amber-50' },
            ].map((s) => (
              <div key={s.label} className="card p-6 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${s.bg}`}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
                  <p className="text-sm text-slate-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-5 gap-6">

            {/* ── Appointments ───────────────────────────── */}
            <div className="lg:col-span-3 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Upcoming Appointments</h2>

              {apptError && (
                <div className="alert-error">
                  <span>⚠️</span><span>{apptError}</span>
                  <button onClick={fetchAppointments} className="ml-auto text-xs underline">Retry</button>
                </div>
              )}

              {apptLoading ? (
                <div className="card p-16 flex flex-col items-center gap-3">
                  <div className="spinner spinner-lg border-blue-500" />
                  <p className="text-slate-400 text-sm">Loading appointments...</p>
                </div>
              ) : upcoming.length === 0 ? (
                <div className="card p-12 text-center">
                  <div className="text-4xl mb-3">📭</div>
                  <h3 className="font-bold text-slate-900 mb-1">No upcoming appointments</h3>
                  <p className="text-slate-500 text-sm">Add availability slots to start receiving bookings.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((appt) => (
                    <div key={appt._id} className="card-hover p-5 flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                        {appt.patient?.name?.[0] || 'P'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900">{appt.patient?.name || 'Patient'}</span>
                          <span className={STATUS_STYLES[appt.status] || 'badge-gray'}>{appt.status}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          📅 {new Date(appt.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                          {' · '}🕐 {appt.time}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {appt.status === 'pending' && (
                          <button
                            onClick={() => handleStatusUpdate(appt._id, 'confirmed')}
                            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 font-semibold hover:bg-emerald-200 transition"
                          >
                            Confirm
                          </button>
                        )}
                        {(appt.meetingLink || appt.meetingId) && (
                          <a
                            href={`/video/${appt.meetingId}`}
                            className="btn-primary text-xs"
                          >
                            🎥 Start Call
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Slot Manager ───────────────────────────── */}
            <div className="lg:col-span-2 space-y-4">
              <div className="card p-6 sticky top-20">
                <h2 className="text-lg font-bold text-slate-900 mb-1">Manage Availability</h2>
                <p className="text-slate-500 text-xs mb-5">Select your available time slots for a date</p>

                {/* Date picker */}
                <div className="mb-4">
                  <label className="input-label">Date</label>
                  <input
                    type="date"
                    value={slotDate}
                    min={todayStr()}
                    onChange={(e) => {
                      setSlotDate(e.target.value);
                      setSlotsMsg('');
                      setSelectedTimes([]);
                    }}
                    className="input"
                  />
                </div>

                {/* Existing slots for this date */}
                {(existingSlots.length > 0 || loadingExisting) && (
                  <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs font-semibold text-slate-600 mb-2">
                      Slots on {slotDate}
                    </p>
                    {loadingExisting ? (
                      <div className="flex items-center gap-2 text-slate-400 text-xs">
                        <div className="spinner w-3 h-3 border-slate-400" /> Loading...
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {existingSlots.map((s) => (
                          <span
                            key={s._id}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${
                              s.isBooked
                                ? 'bg-red-50 border-red-200 text-red-600'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            }`}
                          >
                            {s.time}
                            {s.isBooked ? (
                              <span className="ml-1 text-red-400">🔒</span>
                            ) : (
                              <button
                                onClick={() => handleDeleteSlot(s._id)}
                                disabled={deletingSlot === s._id}
                                className="ml-1 text-slate-400 hover:text-red-500 transition"
                                title="Delete slot"
                              >
                                {deletingSlot === s._id ? '…' : '✕'}
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Time slot selector */}
                <div className="mb-5">
                  <label className="input-label">Add New Slots</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {TIMES.map((t) => {
                      const alreadyAdded = existingSlots.some((s) => s.time === t);
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => !alreadyAdded && toggleTime(t)}
                          disabled={alreadyAdded}
                          title={alreadyAdded ? 'Already added' : ''}
                          className={`py-1.5 px-1 rounded-lg text-xs font-medium border-2 transition-all ${
                            alreadyAdded
                              ? 'border-slate-100 bg-slate-100 text-slate-300 cursor-not-allowed'
                              : selectedTimes.includes(t)
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-blue-300'
                          }`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Message */}
                {slotsMsg && (
                  <div className={`${slotsMsg.startsWith('✅') ? 'alert-success' : 'alert-error'} mb-3`}>
                    {slotsMsg}
                  </div>
                )}

                {/* Add button */}
                <button
                  onClick={handleAddSlots}
                  disabled={!selectedTimes.length || addingSlots || !slotDate}
                  className="btn-primary w-full py-3 disabled:opacity-50"
                >
                  {addingSlots ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="spinner w-4 h-4" /> Saving...
                    </span>
                  ) : (
                    `Add ${selectedTimes.length || ''} Slot${selectedTimes.length !== 1 ? 's' : ''}`
                  )}
                </button>

                {!myProfileId && (
                  <p className="text-xs text-amber-600 mt-2 text-center">
                    ⚠️ Doctor profile not found. Please complete your profile setup.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Completed Appointments ───────────────────── */}
          {completed.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">Completed Appointments</h2>
              <div className="space-y-3">
                {completed.map((appt) => (
                  <div key={appt._id} className="card p-4 flex items-center gap-4 opacity-75">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                      {appt.patient?.name?.[0] || 'P'}
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-slate-800">{appt.patient?.name || 'Patient'}</span>
                      <p className="text-xs text-slate-400">
                        {new Date(appt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}{appt.time}
                      </p>
                    </div>
                    <span className={STATUS_STYLES[appt.status] || 'badge-gray'}>{appt.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default DoctorDashboard;
