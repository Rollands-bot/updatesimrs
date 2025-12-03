import { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { UserPlus, Search, ChevronDown } from 'lucide-react';

export default function Registration() {
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    nik: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    return searchQuery ? patients.filter(patient => 
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      // Pencarian ID Eksak (Exact Match)
      // Jika user ketik "1", maka hanya muncul ID 1 (atau 001). ID 12, 21, 100 tidak akan muncul.
      (
        !isNaN(searchQuery) && (
          String(patient.id) === String(Number(searchQuery)) || 
          String(patient.id).padStart(3, '0') === searchQuery
        )
      )
    ) : patients;
  }, [patients, searchQuery]);

  const displayedPatients = useMemo(() => {
    return filteredPatients.slice(0, visibleCount);
  }, [filteredPatients, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 10);
  };

  const fetchPatients = async () => {
    try {
      const res = await api.get('/patients');
      setPatients(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/patients', formData);
      setFormData({ name: '', nik: '', phone: '', address: '' });
      fetchPatients();
      alert('Pasien berhasil didaftarkan!');
    } catch (err) {
      alert('Gagal mendaftarkan pasien: ' + err.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-heading font-bold text-slate-900">Pendaftaran Pasien</h2>
        <p className="text-slate-500">Registrasi pasien baru ke dalam database rumah sakit.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <UserPlus size={20} className="text-primary-600" />
              Pasien Baru
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  placeholder="Contoh: Budi Santoso"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">NIK</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  placeholder="Nomor Induk Kependudukan"
                  value={formData.nik}
                  onChange={e => setFormData({...formData, nik: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">No. Telepon</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  placeholder="0812..."
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  rows="3"
                  placeholder="Alamat lengkap..."
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                ></textarea>
              </div>
              <button
                disabled={loading}
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan Data Pasien'}
              </button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-bold text-lg">Data Pasien Terdaftar</h3>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari Nama atau ID Pasien..." 
                  className="w-full sm:w-64 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-4">ID Pasien</th>
                    <th className="p-4">Tanggal Daftar</th>
                    <th className="p-4">Nama Pasien</th>
                    <th className="p-4">NIK</th>
                    <th className="p-4">No. HP</th>
                    <th className="p-4">Alamat</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedPatients.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-400">
                        {searchQuery ? 'Tidak ada pasien yang cocok dengan pencarian.' : 'Belum ada data pasien.'}
                      </td>
                    </tr>
                  ) : (
                    displayedPatients.map(p => (
                      <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-mono text-xs text-slate-500">#{String(p.id).padStart(3, '0')}</td>
                        <td className="p-4 text-xs text-slate-500">
                          {p.created_at ? new Date(p.created_at).toLocaleString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          }) : '-'}
                        </td>
                        <td className="p-4 font-medium text-slate-900">{p.name}</td>
                        <td className="p-4">{p.nik || '-'}</td>
                        <td className="p-4">{p.phone || '-'}</td>
                        <td className="p-4">
                          <div className="max-w-[250px] line-clamp-2 leading-snug text-slate-600" title={p.address}>
                            {p.address || '-'}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {displayedPatients.length < filteredPatients.length && (
                <div className="p-4 border-t border-slate-100 text-center">
                  <button
                    onClick={handleLoadMore}
                    className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors"
                  >
                    <ChevronDown size={16} />
                    Lihat Lebih Banyak ({filteredPatients.length - displayedPatients.length} lagi)
                  </button>
                </div>
              )}
            </div>

            <div className="md:hidden p-4 space-y-3">
              {displayedPatients.length === 0 ? (
                <p className="text-center text-slate-400 py-6">
                  {searchQuery ? 'Tidak ada pasien yang cocok dengan pencarian.' : 'Belum ada data pasien.'}
                </p>
              ) : (
                <>
                  {displayedPatients.map(p => (
                    <div key={p.id} className="border border-slate-100 rounded-lg p-4 bg-slate-50">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex flex-col">
                          <p className="font-bold text-slate-900">{p.name}</p>
                          <span className="text-[10px] text-slate-400">
                            {p.created_at ? new Date(p.created_at).toLocaleString('id-ID', {
                              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            }) : '-'}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-slate-400">#{String(p.id).padStart(3, '0')}</span>
                      </div>
                      <div className="text-xs text-slate-500 space-y-1">
                        <p><span className="font-semibold text-slate-700">NIK:</span> {p.nik || '-'}</p>
                        <p><span className="font-semibold text-slate-700">Telp:</span> {p.phone || '-'}</p>
                        <p className="leading-snug break-words"><span className="font-semibold text-slate-700">Alamat:</span> {p.address || '-'}</p>
                      </div>
                    </div>
                  ))}
                  {displayedPatients.length < filteredPatients.length && (
                    <button
                      onClick={handleLoadMore}
                      className="w-full flex items-center justify-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm px-4 py-3 rounded-lg hover:bg-primary-50 border border-dashed border-primary-200 transition-colors"
                    >
                      <ChevronDown size={16} />
                      Muat Lebih Banyak
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
