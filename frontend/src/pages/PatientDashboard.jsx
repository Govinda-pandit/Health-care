import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import axios from 'axios';
import Navbar from '../components/Navbar.jsx';

const STATUS_STYLES = {
  pending:     'badge-yellow',
  confirmed:   'badge-blue',
  'in-progress': 'badge-blue',
  completed:   'badge-green',
  cancelled:   'badge-red',
};

const StatCard = ({ label, value, icon, color }) => (
  <div className="card p-6 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-extrabold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  </div>
);

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get('/api/appointments/my',
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      const data = res.data;
      const list = Array.isArray(data) ? data : Array.isArray(data?.appointments) ? data.appointments : [];
      setAppointments(list);
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
        logout();
        navigate('/login');
      } else {
        setError(err.response?.data?.error || 'Failed to load appointments.');
      }
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const upcoming  = appointments.filter((a) => ['pending', 'confirmed', 'in-progress'].includes(a.status));
  const completed = appointments.filter((a) => a.status === 'completed');

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-16">
        {/* Header */}
        <div className="bg-white border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">
                  Good {getGreeting()}, {user?.name?.split(' ')[0] || 'there'} 👋
                </h1>
                <p className="text-slate-500 text-sm mt-1">Here's your health overview</p>
              </div>
              <Link to="/doctors" className="btn-primary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Book Appointment
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Upcoming" value={upcoming.length}  icon="📅" color="bg-blue-50" />
            <StatCard label="Completed" value={completed.length} icon="✅" color="bg-emerald-50" />
            <StatCard label="Total Visits" value={appointments.length} icon="🩺" color="bg-violet-50" />
          </div>

          {/* Error */}
          {error && (
            <div className="alert-error">
              <span>⚠️</span>
              <span>{error}</span>
              <button onClick={fetchAppointments} className="ml-auto text-xs font-semibold underline">Retry</button>
            </div>
          )}

          {/* Appointments list */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">My Appointments</h2>

            {loading ? (
              <div className="card p-16 flex flex-col items-center gap-3">
                <div className="spinner spinner-lg border-blue-500" />
                <p className="text-slate-400 text-sm">Loading your appointments...</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="card p-16 text-center">
                <div className="text-5xl mb-4">📭</div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">No appointments yet</h3>
                <p className="text-slate-500 text-sm mb-6">Book your first consultation with a verified doctor.</p>
                <Link to="/doctors" className="btn-primary inline-flex mx-auto">Find a Doctor</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((appt) => (
                  <div key={appt._id} className="card-hover p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Doctor avatar */}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {appt.doctorProfile?.doctor?.name?.[0] || appt.doctor?.name?.[0] || 'D'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900">
                          {appt.doctorProfile?.doctor?.name || appt.doctor?.name || 'Doctor'}
                        </h3>
                        <span className={STATUS_STYLES[appt.status] || 'badge-gray'}>
                          {appt.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {appt.doctorProfile?.specialty}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        📅 {new Date(appt.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        {' '} · 🕐 {appt.time}
                      </p>
                    </div>

                    {/* Action */}
                    {(appt.meetingLink || appt.meetingId) && appt.status !== 'completed' && appt.status !== 'cancelled' && (
                      <a
                        href={appt.meetingLink || `/video/${appt.meetingId}`}
                        className="btn-primary flex-shrink-0 text-sm"
                      >
                        🎥 Join Call
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
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

export default PatientDashboard;
