import { useState, useEffect } from 'react';
import { Plus, Bed, Search, Hotel, Trash2 } from 'lucide-react';
import api from '../../api';
import { useAuth } from '../../AuthContext';

export default function Rooms() {
  const [activeTab, setActiveTab] = useState('rooms'); // 'rooms' | 'beds'
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  // Forms
  const [roomForm, setRoomForm] = useState({ name: '', class: 'VIP', price_per_day: 0 });
  const [bedForm, setBedForm] = useState({ room_id: '', bed_number: '', status: 'available' });

  useEffect(() => {
    fetchRooms();
    fetchBeds();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await api.get('/master/rooms');
      setRooms(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchBeds = async () => {
    try {
      const res = await api.get('/master/beds');
      setBeds(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSubmitRoom = async (e) => {
    e.preventDefault();
    try {
      await api.post('/master/rooms', roomForm);
      setShowForm(false);
      setRoomForm({ name: '', class: 'VIP', price_per_day: 0 });
      fetchRooms();
      alert('Kamar berhasil ditambahkan');
    } catch (err) { alert('Error: ' + err.message); }
  };

  const handleSubmitBed = async (e) => {
    e.preventDefault();
    try {
      await api.post('/master/beds', bedForm);
      setShowForm(false);
      setBedForm({ room_id: '', bed_number: '', status: 'available' });
      fetchBeds();
      alert('Bed berhasil ditambahkan');
    } catch (err) { alert('Error: ' + err.message); }
  };

  const handleDeleteRoom = async (id) => {
    if (!confirm('Yakin ingin menghapus kamar ini? Semua bed di dalamnya juga akan terhapus.')) return;
    try {
      await api.delete(`/master/rooms/${id}`);
      fetchRooms();
      fetchBeds();
    } catch (err) { alert('Gagal menghapus: ' + err.message); }
  };

  const handleDeleteBed = async (id) => {
    if (!confirm('Yakin ingin menghapus bed ini?')) return;
    try {
      await api.delete(`/master/beds/${id}`);
      fetchBeds();
    } catch (err) { alert('Gagal menghapus: ' + err.message); }
  };

  const filteredRooms = rooms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredBeds = beds.filter(b => 
    b.bed_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.rooms?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Data Kamar & Bed</h2>
          <p className="text-slate-500">Manajemen ruang rawat inap dan ketersediaan bed.</p>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
            <button 
                onClick={() => setActiveTab('rooms')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'rooms' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Data Kamar
            </button>
            <button 
                onClick={() => setActiveTab('beds')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'beds' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Data Bed
            </button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
                type="text" 
                placeholder={`Cari ${activeTab === 'rooms' ? 'kamar' : 'bed'}...`} 
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
            />
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 shadow-sm text-sm font-bold"
        >
          <Plus size={18} /> Tambah {activeTab === 'rooms' ? 'Kamar' : 'Bed'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-fade-in">
          <h3 className="font-bold text-lg mb-4">Tambah {activeTab === 'rooms' ? 'Kamar Baru' : 'Bed Baru'}</h3>
          
          {activeTab === 'rooms' ? (
              <form onSubmit={handleSubmitRoom} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Nama Kamar</label>
                    <input required type="text" className="w-full p-2 border rounded-lg"
                        value={roomForm.name} onChange={e => setRoomForm({...roomForm, name: e.target.value})} 
                        placeholder="Contoh: Melati 1"/>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Kelas</label>
                    <select className="w-full p-2 border rounded-lg bg-white"
                        value={roomForm.class} onChange={e => setRoomForm({...roomForm, class: e.target.value})}>
                        <option value="VVIP">VVIP</option>
                        <option value="VIP">VIP</option>
                        <option value="I">Kelas I</option>
                        <option value="II">Kelas II</option>
                        <option value="III">Kelas III</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Harga Per Hari</label>
                    <input required type="number" className="w-full p-2 border rounded-lg"
                        value={roomForm.price_per_day} onChange={e => setRoomForm({...roomForm, price_per_day: e.target.value})} />
                </div>
                <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Batal</button>
                    <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Simpan</button>
                </div>
              </form>
          ) : (
              <form onSubmit={handleSubmitBed} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Pilih Kamar</label>
                    <select required className="w-full p-2 border rounded-lg bg-white"
                        value={bedForm.room_id} onChange={e => setBedForm({...bedForm, room_id: e.target.value})}>
                        <option value="">-- Pilih Kamar --</option>
                        {rooms.map(r => (
                            <option key={r.id} value={r.id}>{r.name} (Kelas {r.class})</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Nomor Bed</label>
                    <input required type="text" className="w-full p-2 border rounded-lg"
                        placeholder="Contoh: A1, B2"
                        value={bedForm.bed_number} onChange={e => setBedForm({...bedForm, bed_number: e.target.value})} />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Status Awal</label>
                    <select className="w-full p-2 border rounded-lg bg-white"
                        value={bedForm.status} onChange={e => setBedForm({...bedForm, status: e.target.value})}>
                        <option value="available">Available (Kosong)</option>
                        <option value="occupied">Occupied (Terisi)</option>
                        <option value="maintenance">Maintenance (Perbaikan)</option>
                    </select>
                </div>
                <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Batal</button>
                    <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Simpan</button>
                </div>
              </form>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {activeTab === 'rooms' ? (
                  <>
                    <th className="p-4">Nama Kamar</th>
                    <th className="p-4">Kelas</th>
                    <th className="p-4">Harga / Hari</th>
                    {user?.role === 'super_admin' && <th className="p-4 text-right">Aksi</th>}
                  </>
              ) : (
                  <>
                    <th className="p-4">Nomor Bed</th>
                    <th className="p-4">Lokasi Kamar</th>
                    <th className="p-4">Kelas</th>
                    <th className="p-4">Status</th>
                    {user?.role === 'super_admin' && <th className="p-4 text-right">Aksi</th>}
                  </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activeTab === 'rooms' ? (
                filteredRooms.length === 0 ? (
                    <tr><td colSpan={user?.role === 'super_admin' ? 4 : 3} className="p-8 text-center text-slate-500">Belum ada data kamar.</td></tr>
                ) : (
                    filteredRooms.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                            <td className="p-4 font-medium text-slate-900 flex items-center gap-2">
                                <Hotel size={16} className="text-blue-400" />
                                {item.name}
                            </td>
                            <td className="p-4"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold">{item.class}</span></td>
                            <td className="p-4 font-mono">Rp {Number(item.price_per_day).toLocaleString()}</td>
                            {user?.role === 'super_admin' && (
                                <td className="p-4 text-right">
                                    <button onClick={() => handleDeleteRoom(item.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))
                )
            ) : (
                filteredBeds.length === 0 ? (
                    <tr><td colSpan={user?.role === 'super_admin' ? 5 : 4} className="p-8 text-center text-slate-500">Belum ada data bed.</td></tr>
                ) : (
                    filteredBeds.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                            <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                                <Bed size={16} className="text-emerald-500" />
                                {item.bed_number}
                            </td>
                            <td className="p-4">{item.rooms?.name || '-'}</td>
                            <td className="p-4"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold">{item.rooms?.class || '-'}</span></td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                                    item.status === 'available' ? 'bg-green-100 text-green-700' :
                                    item.status === 'occupied' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                }`}>
                                    {item.status}
                                </span>
                            </td>
                            {user?.role === 'super_admin' && (
                                <td className="p-4 text-right">
                                    <button onClick={() => handleDeleteBed(item.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))
                )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
