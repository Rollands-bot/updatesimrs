import { useState, useEffect } from 'react';
import { Plus, User, Trash2 } from 'lucide-react';
import api from '../../api';
import { useAuth } from '../../AuthContext';

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [polis, setPolis] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '', sip: '', str: '', specialization: '', polyclinic_id: '', schedule: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [docRes, userRes, poliRes] = await Promise.all([
        api.get('/master/doctors'),
        api.get('/users'),
        api.get('/master/polyclinics')
      ]);
      setDoctors(docRes.data);
      setUsers(userRes.data.filter(u => u.role === 'dokter'));
      setPolis(poliRes.data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/master/doctors', formData);
      setShowForm(false);
      fetchData();
    } catch (err) { alert('Gagal menyimpan'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus?')) return;
    try {
      await api.delete(`/master/doctors/${id}`);
      fetchData();
    } catch (err) { alert('Gagal menghapus: ' + err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Data Dokter</h2>
          <p className="text-slate-500">Manajemen tenaga medis</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex gap-2">
          <Plus size={20} /> Tambah Dokter
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Akun User (Dokter)</label>
              <select required className="w-full p-2 border rounded-lg"
                value={formData.user_id} onChange={e => setFormData({...formData, user_id: e.target.value})}>
                <option value="">Pilih User</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.username})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Poli / Unit</label>
              <select required className="w-full p-2 border rounded-lg"
                value={formData.polyclinic_id} onChange={e => setFormData({...formData, polyclinic_id: e.target.value})}>
                <option value="">Pilih Poli</option>
                {polis.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SIP</label>
              <input type="text" className="w-full p-2 border rounded-lg"
                value={formData.sip} onChange={e => setFormData({...formData, sip: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">STR</label>
              <input type="text" className="w-full p-2 border rounded-lg"
                value={formData.str} onChange={e => setFormData({...formData, str: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Spesialisasi</label>
              <input type="text" className="w-full p-2 border rounded-lg"
                value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Jadwal</label>
              <input type="text" placeholder="Senin-Jumat 08:00-14:00" className="w-full p-2 border rounded-lg"
                value={formData.schedule} onChange={e => setFormData({...formData, schedule: e.target.value})} />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Simpan</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {doctors.map((doc) => (
          <div key={doc.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-start">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                <User size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">{doc.users?.name}</h3>
                <p className="text-sm text-slate-500">{doc.specialization}</p>
                <div className="mt-2 text-sm text-slate-600 space-y-1">
                  <p>Poli: <span className="font-medium">{doc.polyclinics?.name}</span></p>
                  <p>SIP: {doc.sip}</p>
                  <p className="text-xs bg-slate-100 inline-block px-2 py-1 rounded">{doc.schedule}</p>
                </div>
              </div>
            </div>
            {user?.role === 'super_admin' && (
                <button onClick={() => handleDelete(doc.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                    <Trash2 size={18} />
                </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
