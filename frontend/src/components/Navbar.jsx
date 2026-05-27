import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-brand-gradient rounded-lg flex items-center justify-center shadow-md group-hover:shadow-blue-200 transition-all">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span className="font-bold text-lg text-gradient-brand tracking-tight">HealthSync</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <Link
            to="/doctors"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive('/doctors')
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Find Doctors
          </Link>

          {user ? (
            <>
              <Link
                to={user.role === 'Doctor' ? '/doctor/dashboard' : '/patient/dashboard'}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  location.pathname.includes('dashboard')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Dashboard
              </Link>

              <div className="flex items-center gap-2 ml-3 pl-3 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold uppercase shadow">
                  {user.name?.[0] || user.email?.[0] || 'U'}
                </div>
                <button
                  onClick={handleLogout}
                  className="btn-ghost text-xs px-3 py-1.5 text-red-500 hover:bg-red-50"
                >
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Link to="/login" className="btn-ghost text-sm px-4 py-2">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary text-sm px-4 py-2">
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
