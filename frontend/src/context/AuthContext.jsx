import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/api';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Force relogin if token does not contain role (old token format)
        if (!decoded.role) {
          throw new Error('Invalid token schema');
        }
        setUser(decoded);
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    const { token, user: userData } = res.data;

    localStorage.setItem('token', token);
    // Use API response user object — has correct _id / id
    setUser(userData);

    return userData;
  };

  const register = async (userData) => {
    const res = await api.post('/api/auth/register', userData);
    const { token, user: userDataRes } = res.data;
    
    localStorage.setItem('token', token);
    setUser(userDataRes);
    
    return userDataRes;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

