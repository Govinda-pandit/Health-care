import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setFormData((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userData = await login(formData.email, formData.password);
      navigate(userData.role === 'Doctor' ? '/doctor/dashboard' : '/patient/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-gradient flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, white 1px, transparent 1px), radial-gradient(circle at 70% 70%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative text-center text-white">
          <div className="w-20 h-20 mx-auto mb-8 bg-white/20 border border-white/30 rounded-3xl flex items-center justify-center text-4xl">
            ❤️
          </div>
          <h2 className="text-4xl font-extrabold mb-4">Welcome back</h2>
          <p className="text-blue-200 text-lg max-w-sm">Sign in to continue your healthcare journey with HealthSync.</p>

          <div className="mt-12 grid grid-cols-2 gap-4 text-left">
            {[
              { icon: '🎥', t: 'Video Consultations', d: 'Connect with doctors from home' },
              { icon: '📋', t: 'Digital Prescriptions', d: 'Download anytime, anywhere' },
              { icon: '📅', t: 'Easy Booking', d: 'Schedule in under 60 seconds' },
              { icon: '🔒', t: 'Secure & Private', d: 'End-to-end encrypted visits' },
            ].map((item) => (
              <div key={item.t} className="bg-white/10 border border-white/20 rounded-2xl p-4">
                <div className="text-2xl mb-2">{item.icon}</div>
                <p className="font-semibold text-sm">{item.t}</p>
                <p className="text-blue-200 text-xs mt-0.5">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-brand-gradient rounded-lg flex items-center justify-center text-white text-sm font-bold">H</div>
            <span className="font-extrabold text-xl text-gradient-brand">HealthSync</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Sign in</h1>
            <p className="text-slate-500 text-sm">Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 font-semibold hover:underline">Create one</Link>
            </p>
          </div>

          {error && (
            <div className="alert-error mb-5">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="input-label">Email address</label>
              <input
                id="login-email"
                type="email"
                value={formData.email}
                onChange={set('email')}
                className="input"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="input-label mb-0">Password</label>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={formData.password}
                  onChange={set('password')}
                  className="input pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-medium"
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="login-submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-base rounded-xl"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="spinner w-4 h-4" />
                  Signing in...
                </span>
              ) : 'Sign in to your account'}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 border-t border-slate-200" />
            <span className="text-xs text-slate-400">or</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          <Link to="/doctors" className="btn-ghost w-full mt-4 py-3 border border-slate-200 justify-center text-slate-600 rounded-xl text-sm">
            Browse doctors without signing in
          </Link>

          <p className="mt-8 text-center text-xs text-slate-400">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
