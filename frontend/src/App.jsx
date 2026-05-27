import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import PatientDashboard from './pages/PatientDashboard.jsx';
import DoctorDashboard from './pages/DoctorDashboard.jsx';
import DoctorSearch from './pages/DoctorSearch.jsx';
import VideoRoom from './pages/VideoRoom.jsx';
import Home from './pages/Home.jsx';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    // Jab tak auth check ho raha hai, blank screen ki jagah loader dikhayein
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles) {
    const normalize = (role) => (role || '').toString().toLowerCase();
    const authorizedRoles = allowedRoles.map(normalize);
    if (!authorizedRoles.includes(normalize(user.role))) {
      return <Navigate to="/" />; // Redirecting to home if not authorized
    }
  }

  return children;
}

function AppContent() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/doctors" element={<DoctorSearch />} />

        <Route path="/patient/dashboard"
          element={
            // protected route for patient
            <ProtectedRoute allowedRoles={['Patient']}>
              <PatientDashboard />
            </ProtectedRoute>

          }
        />

        <Route path="/doctor/dashboard"
          element={
            <ProtectedRoute allowedRoles={['Doctor']}>
              <DoctorDashboard />
            </ProtectedRoute>
            // <DoctorDashboard />
          }
        />

        <Route path="/video/:meetingId" element={<VideoRoom />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
