import { useState, useEffect } from 'react';
import api from '../api';
import { Users, Trash2, UserPlus, Shield, Stethoscope, CreditCard, User, Activity } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'staff_pendaftaran'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/users', formData);
      alert('User berhasil dibuat!');
      setFormData({ username: '', password: '', name: '', role: 'staff_pendaftaran' });
      fetchUsers();
    } catch (err) {
      alert('Error: ' + err.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus user ini?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus user');
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'super_admin': return <Shield className="text-purple-600" />;
      case 'dokter': return <Stethoscope className="text-blue-600" />;
      case 'kasir': return <CreditCard className="text-green-600" />;
      case 'manajemen': return <Activity className="text-orange-600" />;
      default: return <User className="text-slate-600" />;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-heading font-bold text-slate-900">Manajemen User</h2>
        <p className="text-slate-500">Kelola akun pengguna sistem.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Create User */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <UserPlus size={20} className="text-primary-600" />
              Tambah User Baru
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">User</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  required
                  type="password"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="staff_pendaftaran">Staff Pendaftaran</option>
                  <option value="dokter">Dokter / Perawat</option>
                  <option value="kasir">Petugas Kasir</option>
                  <option value="apoteker">Apoteker</option>
                  <option value="manajemen">Manajemen</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <button
                disabled={loading}
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Buat User'}
              </button>
            </form>
          </div>
        </div>

        {/* User List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Users size={18} />
                Daftar Pengguna ({users.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Username</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="p-4 font-medium text-slate-900 flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-full">
                          {getRoleIcon(user.role)}
                        </div>
                        {user.name}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold text-slate-600 capitalize">
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500">{user.username}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
