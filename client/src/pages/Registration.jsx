import { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { UserPlus, Search, ChevronDown, Clock, Calendar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Registration() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    nik: '',
    phone: '',
    address: '',
    dob: '',
    gender: 'L',
    insurance_type: 'UMUM',
    insurance_number: '',
    allergies: ''
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPatients(searchQuery);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const displayedPatients = useMemo(() => {
    // Since filtering is done on server, patients is already filtered
    return patients.slice(0, visibleCount);
  }, [patients, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 10);
  };

  const fetchPatients = async (query = '') => {
    try {
      const params = query ? { q: query } : {};
      const res = await api.get('/patients', { params });
      setPatients(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/patients', formData);
      setFormData({ 
        name: '', nik: '', phone: '', address: '',
        dob: '', gender: 'L', insurance_type: 'UMUM', insurance_number: '', allergies: ''
      });
      // Refresh list (keep current search)
      fetchPatients(searchQuery);
      alert('Pasien berhasil didaftarkan!');
      
      // Direct to Visit creation if needed
      if (window.confirm("Ingin langsung mendaftarkan kunjungan (Poli) untuk pasien ini?")) {
          // We can navigate to Visits page and pre-select patient if we implement query param handling there
          // For now, simple navigation
          navigate('/visits');
      }

    } catch (err) {
      console.error("Registration Error Details:", err.response?.data || err);
      alert('Gagal mendaftarkan pasien: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDirectVisit = (patient) => {
      // Could use context or local storage to pass patient data, 
      // but for simplicity let's just go to visits page. 
      // Ideally Visits page should accept ?patient_id=XYZ
      navigate('/visits');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-heading font-bold text-slate-900">Pendaftaran Pasien</h2>
          <p className="text-slate-500">Registrasi pasien baru ke dalam database rumah sakit.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* Form */}
        <div className="xl:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-24">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-800">
              <UserPlus size={20} className="text-emerald-600" />
              Form Pasien Baru
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="Contoh: Budi Santoso"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">NIK <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    value={formData.nik}
                    onChange={e => setFormData({...formData, nik: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">No. HP <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tgl Lahir</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    value={formData.dob}
                    onChange={e => setFormData({...formData, dob: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">JK</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                    value={formData.gender}
                    onChange={e => setFormData({...formData, gender: e.target.value})}
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Info Penjamin</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipe</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                      value={formData.insurance_type}
                      onChange={e => setFormData({...formData, insurance_type: e.target.value})}
                    >
                      <option value="UMUM">Umum</option>
                      <option value="BPJS">BPJS</option>
                      <option value="ASURANSI_LAIN">Asuransi Lain</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">No. Kartu</label>
                    <input
                      type="text"
                      placeholder="Optional"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      value={formData.insurance_number}
                      onChange={e => setFormData({...formData, insurance_number: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Alergi</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="Contoh: Seafood, Amoxicillin"
                  value={formData.allergies}
                  onChange={e => setFormData({...formData, allergies: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  rows="2"
                  placeholder="Alamat lengkap..."
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                ></textarea>
              </div>
              <button
                disabled={loading}
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none mt-2"
              >
                {loading ? 'Menyimpan Data...' : 'Simpan Data Pasien'}
              </button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white sticky top-0 z-10">
              <h3 className="font-bold text-lg text-slate-800">Data Pasien Terdaftar</h3>
              <div className="relative w-full sm:w-auto">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari Nama / NIK / RM..." 
                  className="w-full sm:w-72 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {/* Desktop Table */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-4 w-24">No. RM</th>
                    <th className="p-4 min-w-[200px]">Nama Pasien & Waktu Daftar</th>
                    <th className="p-4">NIK</th>
                    <th className="p-4">JK</th>
                    <th className="p-4">Tgl Lahir</th>
                    <th className="p-4">Penjamin</th>
                    <th className="p-4">No. HP</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {displayedPatients.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-12 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <Search size={32} className="text-slate-200" />
                          <p>{searchQuery ? 'Tidak ada pasien yang cocok dengan pencarian.' : 'Belum ada data pasien.'}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayedPatients.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4 font-mono text-xs text-slate-500 font-bold">{p.no_rm || '-'}</td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
                            <Clock size={12} className="text-primary-500" />
                            {p.created_at ? new Date(p.created_at).toLocaleString('id-ID', {
                              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            }) : '-'}
                          </div>
                        </td>
                        <td className="p-4">{p.nik || '-'}</td>
                        <td className="p-4">{p.gender === 'L' ? 'Lk' : p.gender === 'P' ? 'Pr' : '-'}</td>
                        <td className="p-4 whitespace-nowrap">{p.dob ? new Date(p.dob).toLocaleDateString('id-ID') : '-'}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            p.insurance_type === 'BPJS' ? 'bg-green-100 text-green-700' : 
                            p.insurance_type === 'ASURANSI_LAIN' ? 'bg-blue-100 text-blue-700' : 
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {p.insurance_type || 'UMUM'}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap">{p.phone || '-'}</td>
                        <td className="p-4 text-right">
                            <button 
                                onClick={() => handleDirectVisit(p)}
                                className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-bold text-xs bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-full transition-colors"
                                title="Daftarkan Kunjungan"
                            >
                                Daftar Poli <ArrowRight size={12} />
                            </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden p-4 space-y-3 bg-slate-50/50">
              {displayedPatients.length === 0 ? (
                <div className="text-center text-slate-400 py-12 bg-white rounded-xl border border-dashed border-slate-200">
                  <p>{searchQuery ? 'Tidak ada pasien yang cocok.' : 'Belum ada data pasien.'}</p>
                </div>
              ) : (
                displayedPatients.map(p => (
                  <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-slate-900 text-lg">{p.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                            <Calendar size={12} />
                            {p.created_at ? new Date(p.created_at).toLocaleDateString('id-ID') : '-'}
                          </span>
                          <span className="flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded text-blue-600 font-medium">
                            <Clock size={12} />
                            {p.created_at ? new Date(p.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'}) : '-'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 rounded font-bold">{p.no_rm || '-'}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          p.insurance_type === 'BPJS' ? 'bg-green-50 text-green-700 border-green-100' : 
                          'bg-slate-50 text-slate-600 border-slate-100'
                        }`}>
                          {p.insurance_type || 'UMUM'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-1 gap-x-4 text-sm text-slate-600 my-3 pl-1 border-l-2 border-slate-100">
                      <p><span className="text-slate-400 text-xs uppercase tracking-wide">NIK:</span> <br/>{p.nik || '-'}</p>
                      <p><span className="text-slate-400 text-xs uppercase tracking-wide">No. HP:</span> <br/>{p.phone || '-'}</p>
                      <p><span className="text-slate-400 text-xs uppercase tracking-wide">Lahir:</span> <br/>{p.dob ? new Date(p.dob).toLocaleDateString('id-ID') : '-'}</p>
                      <p><span className="text-slate-400 text-xs uppercase tracking-wide">Gender:</span> <br/>{p.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                    </div>

                    <button 
                        onClick={() => handleDirectVisit(p)}
                        className="w-full mt-2 inline-flex justify-center items-center gap-2 text-primary-600 hover:text-primary-700 font-bold text-sm bg-primary-50 hover:bg-primary-100 px-4 py-2 rounded-lg transition-colors border border-primary-100"
                    >
                        Daftarkan ke Poli <ArrowRight size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {displayedPatients.length < patients.length && (
              <div className="p-4 border-t border-slate-100 text-center bg-slate-50">
                <button
                  onClick={handleLoadMore}
                  className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-bold text-sm px-6 py-2 rounded-full bg-white border border-primary-200 hover:bg-primary-50 transition-all shadow-sm"
                >
                  <ChevronDown size={16} />
                  Muat Lebih Banyak ({patients.length - displayedPatients.length})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
