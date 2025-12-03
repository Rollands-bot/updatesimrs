import { createContext, useState, useContext, useEffect } from 'react';
import api from './api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('simrs_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch {
      localStorage.removeItem('simrs_user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const res = await api.post('/login', { username, password });
      const userData = res.data.user;
      setUser(userData);
      localStorage.setItem('simrs_user', JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      // Fallback: Mock Auth locally if server is unreachable or /login not ready
      console.warn("Server login failed, trying local mock auth...", err);
      
      const mockUsers = [
        { username: "admin", password: "123", role: "admin", name: "Administrator" },
        { username: "staff", password: "123", role: "staff_pendaftaran", name: "Staff Pendaftaran" },
        { username: "dokter", password: "123", role: "dokter", name: "Dr. Spesialis" },
        { username: "kasir", password: "123", role: "kasir", name: "Staff Billing" },
        { username: "manajemen", password: "123", role: "manajemen", name: "Kepala RS" },
      ];

      const user = mockUsers.find(u => u.username === username && u.password === password);
      if (user) {
        setUser(user);
        localStorage.setItem('simrs_user', JSON.stringify(user));
        return { success: true };
      }

      return { 
        success: false, 
        error: err.response?.data?.error || 'Login gagal (Cek koneksi server)' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('simrs_user');
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
