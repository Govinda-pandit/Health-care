import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', role: 'Patient' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setFormData((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(formData);
      navigate(formData.role === 'Doctor' ? '/doctor/dashboard' : '/patient/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-emerald-600 to-blue-700 flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative text-white text-center max-w-sm">
          <div className="w-20 h-20 mx-auto mb-8 bg-white/20 border border-white/30 rounded-3xl flex items-center justify-center text-4xl">
            🏥
          </div>
          <h2 className="text-4xl font-extrabold mb-4">Join HealthSync</h2>
          <p className="text-green-100 text-base leading-relaxed">
            Create your free account and get access to 1,200+ verified doctors across all specialties.
          </p>
          <div className="mt-10 space-y-3 text-left">
            {[
              '✅ Free HD video consultations',
              '✅ Instant digital prescriptions',
              '✅ 24/7 doctor availability',
              '✅ Secure health records',
            ].map((t) => (
              <p key={t} className="text-sm text-green-100 font-medium">{t}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md py-8 animate-slide-up">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-brand-gradient rounded-lg flex items-center justify-center text-white text-sm font-bold">H</div>
            <span className="font-extrabold text-xl text-gradient-brand">HealthSync</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Create account</h1>
            <p className="text-slate-500 text-sm">Already have one?{' '}
              <Link to="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
            </p>
          </div>

          {/* Role tabs */}
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 mb-6">
            {['Patient', 'Doctor'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setFormData((p) => ({ ...p, role: r }))}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  formData.role === r
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {r === 'Patient' ? '🧑‍💼 ' : '👨‍⚕️ '}{r}
              </button>
            ))}
          </div>

          {error && (
            <div className="alert-error mb-5">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Full name</label>
              <input id="reg-name" type="text" value={formData.name} onChange={set('name')}
                className="input" placeholder="John Doe" autoComplete="name" required />
            </div>

            <div>
              <label className="input-label">Email address</label>
              <input id="reg-email" type="email" value={formData.email} onChange={set('email')}
                className="input" placeholder="you@example.com" autoComplete="email" required />
            </div>

            <div>
              <label className="input-label">Phone number</label>
              <input id="reg-phone" type="tel" value={formData.phone} onChange={set('phone')}
                className="input" placeholder="+91 98765 43210" autoComplete="tel" required />
            </div>

            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPass ? 'text' : 'password'}
                  value={formData.password}
                  onChange={set('password')}
                  className="input pr-12"
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
                <button type="button" onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-medium">
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="reg-submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-base rounded-xl mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="spinner w-4 h-4" />
                  Creating account...
                </span>
              ) : `Create ${formData.role} Account`}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
