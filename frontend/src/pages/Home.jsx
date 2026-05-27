import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import SymptomChecker from '../components/SymptomChecker.jsx';

const features = [
  {
    icon: '🎥',
    title: 'HD Video Consultations',
    desc: 'Crystal-clear video calls with top specialists from the comfort of your home.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: '📋',
    title: 'Digital Prescriptions',
    desc: 'Receive, download and share prescriptions instantly after every consultation.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: '🤖',
    title: 'AI Symptom Checker',
    desc: 'Describe your symptoms and get AI-powered specialist recommendations in seconds.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: '📅',
    title: 'Easy Scheduling',
    desc: 'Book appointments in under 60 seconds. Flexible slots, zero waiting room.',
    color: 'from-orange-500 to-amber-500',
  },
];

const stats = [
  { value: '1,200+', label: 'Verified Doctors' },
  { value: '50K+',   label: 'Happy Patients' },
  { value: '4.9★',   label: 'Average Rating' },
  { value: '24/7',   label: 'Always Available' },
];

const specialties = [
  { name: 'Cardiologist',      emoji: '❤️' },
  { name: 'Dermatologist',     emoji: '🌿' },
  { name: 'Neurologist',       emoji: '🧠' },
  { name: 'Dentist',           emoji: '🦷' },
  { name: 'General Physician', emoji: '🩺' },
  { name: 'Psychiatrist',      emoji: '💬' },
];

const Home = () => {

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────── */}
      <section className="relative pt-16 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-[0.08] bg-blue-600 blur-[80px]" />
          <div className="absolute top-40 -left-32 w-[500px] h-[500px] rounded-full opacity-[0.07] bg-indigo-600 blur-[80px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-36 text-center relative">
          <span className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Trusted by 50,000+ patients across India
          </span>

          <h1 className="animate-slide-up text-5xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 mb-6 leading-tight">
            Healthcare at your{' '}
            <span className="text-gradient-brand">fingertips</span>
          </h1>

          <p className="animate-slide-up text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed" style={{ animationDelay: '0.1s' }}>
            Connect with verified doctors in minutes. Book video consultations, get digital prescriptions, and manage your health — all in one place.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/doctors" className="btn-primary btn-lg shadow-blue-200 shadow-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Find a Doctor
            </Link>
            <Link to="/register" className="btn-outline btn-lg">
              Create Free Account
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Trust bar */}
          <div className="mt-12 flex flex-wrap justify-center gap-6 animate-fade-in" style={{ animationDelay: '0.35s' }}>
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Specialty quick links ──────────────────────── */}
      <section className="bg-white border-y border-slate-100 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-center text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6">Browse by specialty</p>
          <div className="flex flex-wrap justify-center gap-3">
            {specialties.map((s) => (
              <Link
                key={s.name}
                to={`/doctors?specialty=${encodeURIComponent(s.name)}`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50 hover:shadow-md transition-all text-sm font-medium text-slate-700"
              >
                <span>{s.emoji}</span>
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────── */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Everything you need</h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">A complete healthcare experience, designed to be simple and powerful.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card-hover p-6 group">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl mb-5 shadow-md group-hover:scale-110 transition-transform duration-200`}>
                {f.icon}
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI Symptom Checker ────────────────────────── */}
      <section className="py-16 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center text-white">
          <div className="w-16 h-16 mx-auto mb-6 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl">
            🤖
          </div>
          <h2 className="text-4xl font-extrabold mb-3">AI Symptom Checker</h2>
          <p className="text-blue-200 text-base mb-8 max-w-lg mx-auto">
            Describe how you're feeling and we'll suggest the right specialist for you — instantly.
          </p>

          <SymptomChecker />
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
      <section className="py-24 text-center max-w-3xl mx-auto px-4 sm:px-6">
        <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Start your health journey today</h2>
        <p className="text-slate-500 mb-8">Join thousands of patients who manage their health smarter with HealthSync.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/register" className="btn-primary btn-lg">Create Free Account</Link>
          <Link to="/login"    className="btn-outline btn-lg">Sign In</Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────── */}
      <footer className="border-t border-slate-200 py-8 bg-white">
        <p className="text-center text-slate-400 text-sm">
          © 2026 HealthSync. Built with ❤️ for better healthcare access.
        </p>
      </footer>
    </div>
  );
};

export default Home;
