import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Stethoscope, Receipt, Menu, X, LogOut, BarChart3, 
  Database, Activity, TestTube, Bed, Pill
} from 'lucide-react';
import Registration from './pages/Registration';
import Visits from './pages/Visits';
import Doctor from './pages/Doctor';
import Billing from './pages/Billing';
import Login from './pages/Login';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import Medicines from './pages/master/Medicines';
import Polyclinics from './pages/master/Polyclinics';
import Doctors from './pages/master/Doctors';
import Procedures from './pages/master/Procedures';
import Rooms from './pages/master/Rooms';
import Pharmacy from './pages/pharmacy/Pharmacy';
import Lab from './pages/lab/Lab';
import { AuthProvider, useAuth } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

function AppContent() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const role = user.role;

  return (
    <div className="min-h-screen bg-slate-50 font-sans md:flex">
      {/* Sidebar */}
      <aside
        className={`w-64 bg-white border-r border-slate-200 fixed md:relative inset-y-0 left-0 transform transition-transform duration-200 z-30 md:z-0 h-full md:h-auto md:min-h-screen md:translate-x-0 md:flex md:flex-col overflow-y-auto ${
          menuOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6 border-b border-slate-100 flex items-start justify-between sticky top-0 bg-white z-10">
          <div>
            <div className="flex items-center gap-2 text-primary-600">
              <img src="/logoRS.png" alt="RS Logo" className="h-8 w-8 rounded-lg" />
              <h1 className="font-heading font-bold text-xl text-slate-900">Keluarga Kita</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">Sistem Informasi Rumah Sakit</p>
          </div>
          <button
            className="md:hidden text-slate-500 hover:text-slate-700"
            onClick={() => setMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 bg-blue-50 border-b border-blue-100 mb-2">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Logged in as</p>
          <p className="font-bold text-slate-900 truncate">{user.name}</p>
          <p className="text-xs text-slate-500 capitalize">{user.role.replace('_', ' ')}</p>
        </div>

        <nav className="p-4 space-y-6 flex-1">
          
          {/* 1. DATA MASTER */}
          {(role === 'super_admin' || role === 'admin' || role === 'manajemen') && (
            <div>
              <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Data Master</p>
              <div className="space-y-1">
                <NavLink to="/master/medicines" icon={<Pill size={18} />} label="Obat & Alkes" onNavigate={() => setMenuOpen(false)} />
                <NavLink to="/master/polyclinics" icon={<LayoutDashboard size={18} />} label="Poli / Unit" onNavigate={() => setMenuOpen(false)} />
                <NavLink to="/master/doctors" icon={<Users size={18} />} label="Dokter & Medis" onNavigate={() => setMenuOpen(false)} />
                <NavLink to="/master/procedures" icon={<Activity size={18} />} label="Tindakan" onNavigate={() => setMenuOpen(false)} />
                <NavLink to="/master/rooms" icon={<Bed size={18} />} label="Kamar / Bed" onNavigate={() => setMenuOpen(false)} />
              </div>
            </div>
          )}

          {/* 2. OPERASIONAL PASIEN */}
          <div>
            <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Operasional Pasien</p>
            <div className="space-y-1">
              {(role === 'super_admin' || role === 'staff_pendaftaran') && (
                <NavLink to="/" icon={<Users size={18} />} label="Pendaftaran" onNavigate={() => setMenuOpen(false)} />
              )}
              {(role === 'super_admin' || role === 'staff_pendaftaran' || role === 'dokter' || role === 'perawat') && (
                <NavLink to="/visits" icon={<LayoutDashboard size={18} />} label="Kunjungan / Poli" onNavigate={() => setMenuOpen(false)} />
              )}
              {(role === 'super_admin' || role === 'dokter' || role === 'perawat') && (
                <NavLink to="/doctor" icon={<Stethoscope size={18} />} label="Rekam Medis" onNavigate={() => setMenuOpen(false)} />
              )}
            </div>
          </div>

          {/* 3. PENUNJANG */}
          {(role === 'super_admin' || role === 'apoteker' || role === 'analis_lab' || role === 'radiografer') && (
            <div>
              <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Penunjang</p>
              <div className="space-y-1">
                <NavLink to="/pharmacy" icon={<Pill size={18} />} label="Farmasi" onNavigate={() => setMenuOpen(false)} />
                <NavLink to="/lab" icon={<TestTube size={18} />} label="Lab & Radiologi" onNavigate={() => setMenuOpen(false)} />
              </div>
            </div>
          )}

          {/* 4. BILLING */}
          {(role === 'super_admin' || role === 'kasir') && (
            <div>
              <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Keuangan</p>
              <div className="space-y-1">
                <NavLink to="/billing" icon={<Receipt size={18} />} label="Billing / Kasir" onNavigate={() => setMenuOpen(false)} />
              </div>
            </div>
          )}

          {/* 5. ADMIN */}
          {(role === 'super_admin' || role === 'manajemen') && (
            <div>
              <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Laporan & Admin</p>
              <div className="space-y-1">
                <NavLink to="/reports" icon={<BarChart3 size={18} />} label="Laporan" onNavigate={() => setMenuOpen(false)} />
                {role === 'super_admin' && (
                  <NavLink to="/users" icon={<Database size={18} />} label="Manajemen User" onNavigate={() => setMenuOpen(false)} />
                )}
              </div>
            </div>
          )}

        </nav>

        <div className="p-4 border-t border-slate-100 sticky bottom-0 bg-white">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            <LogOut size={20} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {menuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-20 md:hidden"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="md:hidden flex items-center justify-between px-4 py-4 bg-white border-b border-slate-200 sticky top-0 z-20">
          <div className="flex items-center gap-2 text-primary-600">
            <img src="/logoRS.png" alt="RS Logo" className="h-7 w-7 rounded-lg" />
            <div>
              <p className="font-heading font-semibold text-lg text-slate-900">Keluarga Kita</p>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">SIMRS</p>
            </div>
          </div>
          <button
            className="p-2 rounded-lg border border-slate-200 text-slate-600"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={20} />
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl w-full mx-auto">
            <Routes>
              {/* Master Data Routes */}
              <Route path="/master/medicines" element={<ProtectedRoute><Medicines /></ProtectedRoute>} />
              <Route path="/master/polyclinics" element={<ProtectedRoute><Polyclinics /></ProtectedRoute>} />
              <Route path="/master/doctors" element={<ProtectedRoute><Doctors /></ProtectedRoute>} />
              <Route path="/master/procedures" element={<ProtectedRoute><Procedures /></ProtectedRoute>} />
              <Route path="/master/rooms" element={<ProtectedRoute><Rooms /></ProtectedRoute>} />

              {/* Operational Routes */}
              <Route path="/" element={<ProtectedRoute><Registration /></ProtectedRoute>} />
              <Route path="/visits" element={<ProtectedRoute><Visits /></ProtectedRoute>} />
              <Route path="/doctor" element={<ProtectedRoute><Doctor /></ProtectedRoute>} />
              
              {/* Supporting Routes */}
              <Route path="/pharmacy" element={<ProtectedRoute><Pharmacy /></ProtectedRoute>} />
              <Route path="/lab" element={<ProtectedRoute><Lab /></ProtectedRoute>} />
              
              {/* Billing & Admin */}
              <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

function NavLink({ to, icon, label, onNavigate }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors font-medium text-sm ${
        isActive 
          ? 'bg-primary-50 text-primary-700' 
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export default App;
