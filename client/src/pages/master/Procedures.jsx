import { useState, useEffect } from 'react';
import { Plus, Activity, Search, Trash2 } from 'lucide-react';
import api from '../../api';
import { useAuth } from '../../AuthContext';

export default function Procedures() {
  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', code: '', category: 'tindakan_medis', price: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchProcedures();
  }, []);

  const fetchProcedures = async () => {
    try {
      const res = await api.get('/master/procedures');
      setProcedures(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/master/procedures', formData);
      setShowForm(false);
      setFormData({ name: '', code: '', category: 'tindakan_medis', price: 0 });
      fetchProcedures();
      alert('Tindakan berhasil ditambahkan');
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menyimpan');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus?')) return;
    try {
      await api.delete(`/master/procedures/${id}`);
      fetchProcedures();
    } catch (err) { alert('Gagal menghapus: ' + err.message); }
  };

  const filteredProcedures = procedures.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Data Tindakan & Layanan</h2>
          <p className="text-slate-500">Master data tarif tindakan medis, lab, dan radiologi.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 shadow-sm"
        >
          <Plus size={20} /> Tambah Tindakan
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-fade-in">
          <h3 className="font-bold text-lg mb-4">Form Tindakan Baru</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-slate-700">Nama Tindakan</label>
              <input required type="text" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Contoh: Konsultasi Dokter Umum"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Kode (ICD-9 / Internal)</label>
              <input type="text" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Contoh: C001"
                value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Kategori</label>
              <select className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="konsultasi">Konsultasi</option>
                <option value="tindakan_medis">Tindakan Medis</option>
                <option value="lab">Laboratorium</option>
                <option value="radiologi">Radiologi</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Tarif (Rp)</label>
              <input required type="number" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium">Batal</button>
              <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold shadow-sm">Simpan Data</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
            <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari tindakan..." 
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
            <thead className="bg-white text-slate-600 border-b border-slate-200">
                <tr>
                <th className="p-4 font-bold">Kode</th>
                <th className="p-4 font-bold">Nama Tindakan</th>
                <th className="p-4 font-bold">Kategori</th>
                <th className="p-4 font-bold">Tarif</th>
                {user?.role === 'super_admin' && <th className="p-4 font-bold text-right">Aksi</th>}
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {filteredProcedures.length === 0 ? (
                    <tr><td colSpan={user?.role === 'super_admin' ? 5 : 4} className="p-8 text-center text-slate-500">
                        {loading ? 'Memuat data...' : 'Belum ada data tindakan.'}
                    </td></tr>
                ) : (
                    filteredProcedures.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-mono text-slate-500">{item.code || '-'}</td>
                        <td className="p-4 font-medium text-slate-900 flex items-center gap-2">
                            <Activity size={16} className="text-blue-400" />
                            {item.name}
                        </td>
                        <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                                item.category === 'konsultasi' ? 'bg-purple-100 text-purple-700' :
                                item.category === 'lab' ? 'bg-yellow-100 text-yellow-700' :
                                item.category === 'radiologi' ? 'bg-red-100 text-red-700' :
                                'bg-blue-100 text-blue-700'
                            }`}>
                                {item.category.replace('_', ' ')}
                            </span>
                        </td>
                        <td className="p-4 font-bold text-slate-700">
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.price)}
                        </td>
                        {user?.role === 'super_admin' && (
                            <td className="p-4 text-right">
                                <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                                    <Trash2 size={18} />
                                </button>
                            </td>
                        )}
                    </tr>
                    ))
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
