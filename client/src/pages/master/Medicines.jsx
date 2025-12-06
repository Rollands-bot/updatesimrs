import { useState, useEffect } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import api from '../../api';
import { useAuth } from '../../AuthContext';

export default function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', code: '', category: 'obat_keras', form: 'tablet', stock: 0, price: 0, unit: 'strip'
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const res = await api.get('/master/medicines');
      setMedicines(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/master/medicines', formData);
      setShowForm(false);
      setFormData({ name: '', code: '', category: 'obat_keras', form: 'tablet', stock: 0, price: 0, unit: 'strip' });
      fetchMedicines();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menyimpan');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus?')) return;
    try {
      await api.delete(`/master/medicines/${id}`);
      fetchMedicines();
    } catch (err) { alert('Gagal menghapus: ' + err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Data Obat & Alkes</h2>
          <p className="text-slate-500">Manajemen inventaris farmasi</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700"
        >
          <Plus size={20} /> Tambah Obat
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nama Obat</label>
              <input required type="text" className="w-full p-2 border rounded-lg"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kode</label>
              <input required type="text" className="w-full p-2 border rounded-lg"
                value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Kategori</label>
              <select className="w-full p-2 border rounded-lg"
                value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="obat_keras">Obat Keras</option>
                <option value="obat_bebas">Obat Bebas</option>
                <option value="alkes">Alkes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bentuk</label>
              <input type="text" className="w-full p-2 border rounded-lg"
                value={formData.form} onChange={e => setFormData({...formData, form: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stok</label>
              <input type="number" className="w-full p-2 border rounded-lg"
                value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Harga</label>
              <input type="number" className="w-full p-2 border rounded-lg"
                value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Batal</button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Simpan</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-semibold text-slate-600">Kode</th>
              <th className="p-4 font-semibold text-slate-600">Nama</th>
              <th className="p-4 font-semibold text-slate-600">Kategori</th>
              <th className="p-4 font-semibold text-slate-600">Stok</th>
              <th className="p-4 font-semibold text-slate-600">Harga</th>
              <th className="p-4 font-semibold text-slate-600">Satuan</th>
              {user?.role === 'super_admin' && <th className="p-4 font-semibold text-slate-600 text-right">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {medicines.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="p-4 font-mono text-sm text-slate-500">{item.code}</td>
                <td className="p-4 font-medium">{item.name}</td>
                <td className="p-4 text-slate-600 capitalize">{item.category.replace('_', ' ')}</td>
                <td className="p-4">{item.stock}</td>
                <td className="p-4">Rp {parseInt(item.price).toLocaleString()}</td>
                <td className="p-4 text-slate-500">{item.unit}</td>
                {user?.role === 'super_admin' && (
                    <td className="p-4 text-right">
                        <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                            <Trash2 size={18} />
                        </button>
                    </td>
                )}
              </tr>
            ))}
            {medicines.length === 0 && !loading && (
              <tr><td colSpan={user?.role === 'super_admin' ? 7 : 6} className="p-8 text-center text-slate-500">Belum ada data obat.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
