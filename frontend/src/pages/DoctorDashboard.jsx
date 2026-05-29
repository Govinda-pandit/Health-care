import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/api.js';
import Navbar from '../components/Navbar.jsx';

const STATUS_STYLES = {
  pending:     'badge-yellow',
  confirmed:     'badge-blue',
  'in-progress': 'badge-blue',
  completed:     'badge-green',
  cancelled:     'badge-red',
};

const TIMES = ['09:00 AM','09:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
                '02:00 PM','02:30 PM','03:00 PM','03:30 PM','04:00 PM','04:30 PM',
                '05:00 PM','05:30 PM','06:00 PM'];

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [addingSlots, setAddingSlots] = useState(false);
  const [slotsMsg, setSlotsMsg] = useState('');
  const [slotDate, setSlotDate] = useState('');

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/appointments/my');
      const data = res.data;
      const list = Array.isArray(data) ? data : Array.isArray(data?.appointments) ? data.appointments : [];
      setAppointments(list);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    const today = new Date();
    setSlotDate(today.toISOString().split('T')[0]);
  }, [fetchAppointments]);

  const upcoming  = appointments.filter((a) => ['pending', 'confirmed', 'in-progress'].includes(a.status));
  const completed = appointments.filter((a) => a.status === 'completed');
  const earnings  = completed.reduce((sum, a) => sum + (a.doctorProfile?.fees || 0), 0);

  const toggleTime = (t) =>
    setSelectedTimes((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t]);

  const handleAddSlots = async () => {
    if (!selectedTimes.length || !slotDate) return;
    setAddingSlots(true);
    setSlotsMsg('');
    try {
      const slots = selectedTimes.map((time) => ({ date: slotDate, time }));
      await api.post('/api/doctors/profile', { availableSlots: slots });
      setSlotsMsg('✅ Slots added successfully!');
      setSelectedTimes([]);
    } catch (err) {
      setSlotsMsg('❌ ' + (err.response?.data?.error || 'Failed to add slots.'));
    } finally {
      setAddingSlots(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-16">
        {/* Header */}
        <div className="bg-white border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">
                Good morning, Dr. {user?.name?.split(' ')[0] || 'Doctor'} 👨‍⚕️
              </h1>
              <p className="text-slate-500 text-sm mt-1">Manage your appointments and availability</p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Upcoming', value: upcoming.length,  icon: '📅', bg: 'bg-blue-50' },
              { label: 'Completed', value: completed.length, icon: '✅', bg: 'bg-emerald-50' },
              { label: 'Earnings',  value: `₹${earnings.toLocaleString('en-IN')}`, icon: '💰', bg: 'bg-amber-50' },
            ].map((s) => (
              <div key={s.label} className="card p-6 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${s.bg}`}>{s.icon}</div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
                  <p className="text-sm text-slate-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-5 gap-6">
            {/* Appointments */}
            <div className="lg:col-span-3 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Upcoming Appointments</h2>

              {error && <div className="alert-error"><span>⚠️</span><span>{error}</span></div>}

              {loading ? (
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
                          📅 {new Date(appt.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · 🕐 {appt.time}
                        </p>
                      </div>
                      {(appt.meetingLink || appt.meetingId) && (
                        <a
                          href={appt.meetingLink || `/video/${appt.meetingId}`}
                          className="btn-primary text-xs flex-shrink-0"
                        >
                          🎥 Start Call
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Slot Manager */}
            <div className="lg:col-span-2">
              <div className="card p-6 sticky top-20">
                <h2 className="text-lg font-bold text-slate-900 mb-1">Manage Availability</h2>
                <p className="text-slate-500 text-xs mb-5">Select your available time slots</p>

                <div className="mb-4">
                  <label className="input-label">Date</label>
                  <input
                    type="date"
                    value={slotDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setSlotDate(e.target.value)}
                    className="input"
                  />
                </div>

                <div className="mb-5">
                  <label className="input-label">Time slots</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {TIMES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTime(t)}
                        className={`py-1.5 px-1 rounded-lg text-xs font-medium border-2 transition-all ${
                          selectedTimes.includes(t)
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-blue-300'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {slotsMsg && (
                  <div className={slotsMsg.startsWith('✅') ? 'alert-success mb-3' : 'alert-error mb-3'}>
                    {slotsMsg}
                  </div>
                )}

                <button
                  onClick={handleAddSlots}
                  disabled={!selectedTimes.length || addingSlots}
                  className="btn-primary w-full py-3 disabled:opacity-50"
                >
                  {addingSlots ? (
                    <span className="flex items-center gap-2"><span className="spinner w-4 h-4" />Saving...</span>
                  ) : (
                    `Add ${selectedTimes.length || ''} Slot${selectedTimes.length !== 1 ? 's' : ''}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
