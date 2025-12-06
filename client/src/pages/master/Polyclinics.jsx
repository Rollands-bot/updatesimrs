import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../../api';
import { useAuth } from '../../AuthContext';

export default function Polyclinics() {
  const [polis, setPolis] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'rawat_jalan' });
  const { user } = useAuth();

  useEffect(() => { fetchPolis(); }, []);

  const fetchPolis = async () => {
    try {
      const res = await api.get('/master/polyclinics');
      setPolis(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/master/polyclinics', formData);
      setShowForm(false);
      setFormData({ name: '', type: 'rawat_jalan' });
      fetchPolis();
    } catch (err) { alert('Gagal menyimpan'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus?')) return;
    try {
      await api.delete(`/master/polyclinics/${id}`);
      fetchPolis();
    } catch (err) { alert('Gagal menghapus: ' + err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Data Poli / Unit</h2>
          <p className="text-slate-500">Unit layanan rumah sakit</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex gap-2">
          <Plus size={20} /> Tambah Poli
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <form onSubmit={handleSubmit} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Nama Poli</label>
              <input required type="text" className="w-full p-2 border rounded-lg"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium mb-1">Tipe</label>
              <select className="w-full p-2 border rounded-lg"
                value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="rawat_jalan">Rawat Jalan</option>
                <option value="igd">IGD</option>
                <option value="penunjang">Penunjang</option>
                <option value="rawat_inap">Rawat Inap</option>
              </select>
            </div>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg">Simpan</button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {polis.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">{item.name}</h3>
              <span className="text-xs uppercase tracking-wide bg-slate-100 text-slate-600 px-2 py-1 rounded mt-1 inline-block">
                {item.type.replace('_', ' ')}
              </span>
            </div>
            {user?.role === 'super_admin' && (
                <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                    <Trash2 size={18} />
                </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
