import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import BookSlotPicker from '../components/BookSlotPicker.jsx';
import Navbar from '../components/Navbar.jsx';
import api from '../api/api.js';

const SPECIALTIES = ['Cardiologist', 'Dermatologist', 'Neurologist', 'Dentist', 'General Physician'];

const SPECIALTY_EMOJIS = {
  'Cardiologist': '❤️', 'Dermatologist': '🌿', 'Neurologist': '🧠',
  'Dentist': '🦷', 'General Physician': '🩺',
};

const DoctorSearch = () => {
  const [searchParams] = useSearchParams();
  const initialSpecialty = searchParams.get('specialty') || '';

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSpecialty, setActiveSpecialty] = useState(initialSpecialty);
  const [activeBookingDoctorId, setActiveBookingDoctorId] = useState(null);
  const [bookingMessage, setBookingMessage] = useState({ id: null, msg: '', ok: true });

  const fetchDoctors = useCallback(async (specialty = '') => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (specialty) params.specialty = specialty;
      
      const res = await api.get('/api/doctors', { params });
      setDoctors(Array.isArray(res.data?.doctors) ? res.data.doctors : []);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError('Failed to load doctors. Please try again.');
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors(initialSpecialty);
  }, [fetchDoctors, initialSpecialty]);

  const handleSpecialtyClick = (spec) => {
    const newSpec = activeSpecialty === spec ? '' : spec;
    setActiveSpecialty(newSpec);
    setActiveBookingDoctorId(null);
    setBookingMessage({ id: null, msg: '', ok: true });
    fetchDoctors(newSpec);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-16">

        {/* Hero bar */}
        <div className="bg-white border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Find a Doctor</h1>
            <p className="text-slate-500 text-sm mb-6">Browse verified specialists and book instantly.</p>

            {/* Specialty filters */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSpecialtyClick('')}
                className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                  activeSpecialty === ''
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                All Doctors
              </button>
              {SPECIALTIES.map((spec) => (
                <button
                  key={spec}
                  onClick={() => handleSpecialtyClick(spec)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${
                    activeSpecialty === spec
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  {SPECIALTY_EMOJIS[spec]} {spec}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div className="spinner spinner-lg border-blue-500" />
              <p className="text-slate-400 text-sm">Finding doctors...</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="alert-error mb-6">
              <span>⚠️</span>
              <span>{error}</span>
              <button onClick={() => fetchDoctors(activeSpecialty)} className="ml-auto text-xs font-semibold underline">
                Retry
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && doctors.length === 0 && (
            <div className="text-center py-32">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="font-bold text-slate-900 text-xl mb-2">No doctors found</h3>
              <p className="text-slate-500 text-sm">
                {activeSpecialty ? `No ${activeSpecialty}s available right now.` : 'No doctors registered yet.'}
              </p>
            </div>
          )}

          {/* Doctor Grid */}
          {!loading && !error && doctors.length > 0 && (
            <>
              <p className="text-xs text-slate-400 mb-5 font-medium">{doctors.length} doctor{doctors.length !== 1 ? 's' : ''} found{activeSpecialty ? ` · ${activeSpecialty}` : ''}</p>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {doctors.map((doctor) => {
                  const isOpen = activeBookingDoctorId === doctor._id;
                  const bm = bookingMessage.id === doctor._id ? bookingMessage : null;

                  return (
                    <div key={doctor._id} className="card-hover overflow-hidden flex flex-col">
                      {/* Doctor avatar / image */}
                      <div className="relative">
                        <img
                          src={doctor.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.doctor?.name || 'Doctor')}&background=2563eb&color=fff&size=300&bold=true`}
                          alt={doctor.doctor?.name}
                          className="w-full h-44 object-cover"
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.doctor?.name || 'D')}&background=2563eb&color=fff&size=300&bold=true`;
                          }}
                        />
                        <span className="absolute top-3 right-3 badge-green text-xs shadow">
                          ● Online
                        </span>
                      </div>

                      {/* Info */}
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-start justify-between mb-1 gap-2">
                          <h3 className="font-bold text-slate-900 text-lg leading-tight">
                            {doctor.doctor?.name || 'Unknown Doctor'}
                          </h3>
                          {doctor.rating != null && (
                            <span className="text-amber-500 font-bold text-sm flex-shrink-0">
                              ★ {Number(doctor.rating).toFixed(1)}
                            </span>
                          )}
                        </div>
                        <p className="text-blue-600 font-semibold text-sm mb-1">
                          {SPECIALTY_EMOJIS[doctor.specialty] || '👨‍⚕️'} {doctor.specialty}
                        </p>
                        <p className="text-emerald-600 text-sm font-semibold mb-4">
                          ₹{doctor.fees?.toLocaleString('en-IN') || '—'} / consult
                        </p>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveBookingDoctorId(isOpen ? null : doctor._id);
                            setBookingMessage({ id: null, msg: '', ok: true });
                            if (!isOpen) {
                              setTimeout(() => {
                                document.getElementById(`book-${doctor._id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                              }, 80);
                            }
                          }}
                          className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all mt-auto ${
                            isOpen
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              : 'btn-primary'
                          }`}
                        >
                          {isOpen ? '✕ Close' : '📅 Book Appointment'}
                        </button>

                        {/* Booking success / error message */}
                        {bm?.msg && (
                          <div className={`mt-3 text-xs px-3 py-2 rounded-lg ${bm.ok ? 'alert-success' : 'alert-error'}`}>
                            {bm.msg}
                          </div>
                        )}

                        {/* Booking panel */}
                        {isOpen && (
                          <div id={`book-${doctor._id}`} className="mt-4">
                            <BookSlotPicker
                              doctorId={doctor._id}
                              onBook={(appt) => {
                                if (appt) {
                                  setBookingMessage({ id: doctor._id, msg: '✅ Appointment booked!', ok: true });
                                  setActiveBookingDoctorId(null);
                                } else {
                                  setBookingMessage({ id: doctor._id, msg: '❌ Booking failed. Try again.', ok: false });
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorSearch;
