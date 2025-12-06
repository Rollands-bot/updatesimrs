import { useState, useEffect } from 'react';
import api from '../api';
import { Users, Trash2, UserPlus, Shield, Stethoscope, CreditCard, User, Activity, Edit, Check, X, Search } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState(null); // Tracks which user is being edited
  
  // Form state for Create
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'staff_pendaftaran'
  });

  // Form state for Edit
  const [editFormData, setEditFormData] = useState({
    username: '',
    name: '',
    role: '',
    password: '' // Optional
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
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user.id);
    setEditFormData({
        username: user.username,
        name: user.name,
        role: user.role,
        password: ''
    });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditFormData({ username: '', name: '', role: '', password: '' });
  };

  const handleUpdate = async (id) => {
    try {
        // Construct payload (omit password if empty)
        const payload = {
            username: editFormData.username,
            name: editFormData.name,
            role: editFormData.role
        };
        if (editFormData.password) payload.password = editFormData.password;

        await api.put(`/users/${id}`, payload);
        alert('User berhasil diperbarui!');
        setEditingUser(null);
        fetchUsers();
    } catch (err) {
        console.error(err);
        alert('Gagal update user: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus user ini? Tindakan ini tidak bisa dibatalkan.')) return;
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

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-heading font-bold text-slate-900">Manajemen User</h2>
        <p className="text-slate-500">Kelola akun pengguna sistem rumah sakit.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Form Create User */}
        <div className="xl:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-24">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800">
              <UserPlus size={20} className="text-primary-600" />
              Tambah User Baru
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                  placeholder="Contoh: Dr. Budi Santoso"
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
                  placeholder="jhon.doe"
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
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role / Jabatan</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="staff_pendaftaran">Staff Pendaftaran</option>
                  <option value="dokter">Dokter / Tenaga Medis</option>
                  <option value="perawat">Perawat</option>
                  <option value="apoteker">Apoteker / Farmasi</option>
                  <option value="analis_lab">Analis Lab</option>
                  <option value="radiografer">Radiografer</option>
                  <option value="kasir">Kasir / Keuangan</option>
                  <option value="manajemen">Manajemen</option>
                  <option value="super_admin">Super Admin (IT)</option>
                </select>
              </div>
              <button
                disabled={loading}
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none mt-2"
              >
                {loading ? 'Menyimpan...' : 'Buat Akun'}
              </button>
            </form>
          </div>
        </div>

        {/* User List */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 bg-white sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Users size={20} className="text-slate-500" />
                Daftar Pengguna <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full">{filteredUsers.length}</span>
              </h3>
              <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Cari user, role, username..." 
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-100 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="p-4 min-w-[200px]">User & Role</th>
                    <th className="p-4 min-w-[150px]">Username</th>
                    <th className="p-4 min-w-[150px]">Password (Reset)</th>
                    <th className="p-4 text-right w-[120px]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.length === 0 ? (
                      <tr><td colSpan="4" className="p-8 text-center text-slate-400">Tidak ada user ditemukan.</td></tr>
                  ) : (
                    filteredUsers.map(user => (
                        <tr key={user.id} className={`transition-colors ${editingUser === user.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                        {editingUser === user.id ? (
                            <>
                                <td className="p-4 align-top">
                                    <div className="space-y-2">
                                        <input 
                                            type="text" 
                                            className="w-full px-2 py-1 border rounded text-sm font-medium" 
                                            value={editFormData.name}
                                            onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                                            placeholder="Nama Lengkap"
                                        />
                                        <select 
                                            className="w-full px-2 py-1 border rounded text-xs"
                                            value={editFormData.role}
                                            onChange={e => setEditFormData({...editFormData, role: e.target.value})}
                                        >
                                            <option value="staff_pendaftaran">Staff Pendaftaran</option>
                                            <option value="dokter">Dokter</option>
                                            <option value="perawat">Perawat</option>
                                            <option value="apoteker">Apoteker</option>
                                            <option value="analis_lab">Analis Lab</option>
                                            <option value="radiografer">Radiografer</option>
                                            <option value="kasir">Kasir</option>
                                            <option value="manajemen">Manajemen</option>
                                            <option value="super_admin">Super Admin</option>
                                        </select>
                                    </div>
                                </td>
                                <td className="p-4 align-top">
                                    <input 
                                        type="text" 
                                        className="w-full px-2 py-1 border rounded text-sm"
                                        value={editFormData.username}
                                        onChange={e => setEditFormData({...editFormData, username: e.target.value})}
                                    />
                                </td>
                                <td className="p-4 align-top">
                                    <input 
                                        type="text" 
                                        className="w-full px-2 py-1 border rounded text-sm bg-white"
                                        placeholder="Ketik utk reset..."
                                        value={editFormData.password}
                                        onChange={e => setEditFormData({...editFormData, password: e.target.value})}
                                    />
                                </td>
                                <td className="p-4 align-top text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleUpdate(user.id)} className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200" title="Simpan">
                                            <Check size={16} />
                                        </button>
                                        <button onClick={handleCancelEdit} className="p-2 bg-slate-200 text-slate-600 rounded hover:bg-slate-300" title="Batal">
                                            <X size={16} />
                                        </button>
                                    </div>
                                </td>
                            </>
                        ) : (
                            <>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white border border-slate-100 rounded-lg shadow-sm">
                                        {getRoleIcon(user.role)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{user.name}</p>
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wide border border-slate-200">
                                        {user.role.replace('_', ' ')}
                                        </span>
                                    </div>
                                    </div>
                                </td>
                                <td className="p-4 font-mono text-slate-600">{user.username}</td>
                                <td className="p-4 text-slate-400 text-xs italic">********</td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => handleEditClick(user)}
                                        className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit User"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Hapus User"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    </div>
                                </td>
                            </>
                        )}
                        </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
