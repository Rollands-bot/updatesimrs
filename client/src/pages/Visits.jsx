import { useState, useEffect } from 'react';
import api from '../api';
import { CalendarPlus, Clock, Search, ChevronDown } from 'lucide-react';
import { useMemo } from 'react';

export default function Visits() {
  const [patients, setPatients] = useState([]);
  const [visits, setVisits] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);
  
  // Custom dropdown states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor: 'Poli Kebidanan & Kandungan'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPatients();
    fetchVisits();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await api.get('/patients');
      setPatients(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchVisits = async () => {
    try {
      const res = await api.get('/visits');
      setVisits(res.data);
    } catch (err) { console.error(err); }
  };

  // Get list of patient IDs who currently have active visits (registered or in_consultation)
  // AND also patients who have visits that are 'closed' or 'paid' TODAY (to prevent multiple visits same day if that's the rule)
  // Request says: "jika pasien terdaftar sudah membayar lunas, jangan biarkan masih ada daftarnya di halaman visit bag buat kunjungan baru"
  // Interpretation: If patient has ANY visit today (active OR completed/paid), they shouldn't be in the "Create New" list.
  const activePatientIds = useMemo(() => {
    const today = new Date().toDateString();
    return new Set(visits
      .filter(v => {
        const visitDate = new Date(v.created_at).toDateString();
        // Check if visit is today AND status is registered, in_consultation, closed, or paid
        return visitDate === today && (
          v.status === 'registered' || 
          v.status === 'in_consultation' || 
          v.status === 'closed' || 
          v.status === 'paid'
        );
      })
      .map(v => v.patient_id));
  }, [visits]);

  const filteredPatients = useMemo(() => {
    // First filter by search query
    let results = patients;
    
    if (patientSearch) {
      results = results.filter(p => 
        p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
        (p.nik && p.nik.includes(patientSearch)) ||
        (!isNaN(patientSearch) && (
          String(p.id) === String(Number(patientSearch)) || 
          String(p.id).padStart(3, '0') === patientSearch
        ))
      );
    }

    // Then filter out patients who already have active visits
    // Unless they are the currently selected patient (in case we want to keep them visible while selected)
    // But for "Create New", we usually don't want to select them again.
    results = results.filter(p => !activePatientIds.has(p.id));

    return results.slice(0, 20); // Limit results
  }, [patients, patientSearch, activePatientIds]);

  const filteredVisits = useMemo(() => {
    return searchQuery ? visits.filter(v => 
      v.patients?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (!isNaN(searchQuery) && (
        String(v.id) === String(Number(searchQuery)) || 
        String(v.id).padStart(3, '0') === searchQuery
      ))
    ) : visits;
  }, [visits, searchQuery]);

  const displayedVisits = useMemo(() => {
    return filteredVisits.slice(0, visibleCount);
  }, [filteredVisits, visibleCount]);

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 5, 15));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient_id) return alert("Pilih pasien terlebih dahulu");
    
    setLoading(true);
    try {
      await api.post('/visits', formData);
      fetchVisits();
      // Reset form and dropdown
      setFormData(prev => ({ ...prev, patient_id: '' }));
      setSelectedPatient(null);
      setPatientSearch('');
      alert('Kunjungan berhasil dibuat!');
    } catch (err) {
      alert('Error: ' + err.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-heading font-bold text-slate-900">Kunjungan & Poli</h2>
        <p className="text-slate-500">Kelola antrian dan kunjungan pasien ke poliklinik.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Form Buat Kunjungan */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:sticky lg:top-24">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <CalendarPlus size={20} className="text-primary-600" />
              Buat Kunjungan Baru
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Pasien</label>
                
                {/* Searchable Dropdown Trigger */}
                <div 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-yellow-500 bg-white cursor-pointer flex items-center justify-between"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className={selectedPatient ? "text-slate-900" : "text-slate-400"}>
                    {selectedPatient ? `${selectedPatient.name} (ID: ${selectedPatient.id})` : "-- Cari & Pilih Pasien --"}
                  </span>
                  <Search size={16} className="text-slate-400" />
                </div>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0">
                      <input
                        autoFocus
                        type="text"
                        placeholder="Cari nama / NIK / ID..."
                        className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-yellow-500"
                        value={patientSearch}
                        onChange={e => setPatientSearch(e.target.value)}
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {filteredPatients.length === 0 ? (
                        <div className="p-3 text-sm text-slate-400 text-center">Tidak ada pasien ditemukan</div>
                      ) : (
                        filteredPatients.map(p => (
                          <div
                            key={p.id}
                            className="px-3 py-2 hover:bg-yellow-50 cursor-pointer text-sm border-b border-slate-50 last:border-0"
                            onClick={() => {
                              setSelectedPatient(p);
                              setFormData({ ...formData, patient_id: p.id });
                              setIsDropdownOpen(false);
                              setPatientSearch('');
                            }}
                          >
                            <div className="font-medium text-slate-900">{p.name}</div>
                            <div className="text-xs text-slate-500 flex gap-2">
                              <span>ID: {p.id}</span>
                              <span>•</span>
                              <span>NIK: {p.nik || '-'}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Hidden Overlay to Close Dropdown */}
                {isDropdownOpen && (
                  <div 
                    className="fixed inset-0 z-0" 
                    onClick={() => setIsDropdownOpen(false)}
                  ></div>
                )}
                
                <p className="text-xs text-slate-400 mt-1">*Cari berdasarkan Nama, NIK, atau ID</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dokter / Poli</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none bg-white"
                  value={formData.doctor}
                  onChange={e => setFormData({...formData, doctor: e.target.value})}
                >
                  <option value="Poli Kebidanan & Kandungan">Poli Kebidanan & Kandungan</option>
                  <option value="Poli Paru-paru">Poli Paru-paru</option>
                  <option value="Poli Anak">Poli Anak</option>
                  <option value="Poli Penyakit Dalam">Poli Penyakit Dalam</option>
                  <option value="Poli Bedah">Poli Bedah</option>
                  <option value="Poli Orthopedi">Poli Orthopedi</option>
                  <option value="Poli Saraf">Poli Saraf</option>
                  <option value="Poli Rehabilitasi Medik">Poli Rehabilitasi Medik</option>
                  <option value="Poli Radiologi">Poli Radiologi</option>
                  <option value="Poli Mata">Poli Mata</option>
                  <option value="Poli Okupasi">Poli Okupasi</option>
                  <option value="Poli Gigi">Poli Gigi</option>
                  <option value="Poli Urologi">Poli Urologi</option>
                  <option value="Poli THT BKL">Poli THT BKL</option>
                  <option value="Poli Jantung & Pembuluh Darah">Poli Jantung & Pembuluh Darah</option>
                </select>
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? 'Memproses...' : 'Buat Antrian'}
              </button>
            </form>
          </div>
        </div>

        {/* List Kunjungan Hari Ini */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Clock size={20} className="text-slate-400" />
                Riwayat Kunjungan
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  Maksimal 15 Terbaru
                </span>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari kunjungan..."
                    className="w-48 pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-primary-500"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-900 font-bold">
                  <tr>
                    <th className="p-4">ID Pasien</th>
                    <th className="p-4">Waktu Kunjungan</th>
                    <th className="p-4">Pasien</th>
                    <th className="p-4">Dokter</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedVisits.length === 0 ? (
                    <tr><td colSpan="5" className="p-8 text-center text-slate-400">
                      {searchQuery ? 'Tidak ada kunjungan yang cocok dengan pencarian.' : 'Belum ada kunjungan.'}
                    </td></tr>
                  ) : (
                    displayedVisits.map(v => (
                      <tr key={v.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="p-4 font-mono text-xs text-slate-500">#{String(v.patient_id).padStart(3, '0')}</td>
                        <td className="p-4 text-xs text-slate-500">
                          {v.created_at ? new Date(v.created_at).toLocaleString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          }) : '-'}
                        </td>
                        <td className="p-4 font-medium text-slate-900">{v.patients?.name || 'Unknown'}</td>
                        <td className="p-4">{v.doctor}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            v.status === 'closed' ? 'bg-slate-100 text-slate-500' :
                            v.status === 'in_consultation' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {v.status === 'registered' ? 'Menunggu' : v.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {displayedVisits.length < filteredVisits.length && (
                <div className="p-4 border-t border-slate-100 text-center">
                  <button
                    onClick={handleLoadMore}
                    className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium text-sm px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors"
                  >
                    <ChevronDown size={16} />
                    Lihat Lebih Banyak ({Math.min(5, filteredVisits.length - displayedVisits.length)} lagi)
                  </button>
                </div>
              )}
            </div>

            <div className="md:hidden p-4 space-y-3">
              {displayedVisits.length === 0 ? (
                <p className="text-center text-slate-400 py-6">
                  {searchQuery ? 'Tidak ada kunjungan yang cocok dengan pencarian.' : 'Belum ada kunjungan.'}
                </p>
              ) : (
                <>
                  {displayedVisits.map(v => (
                    <div key={v.id} className="border border-slate-100 rounded-lg p-4 bg-slate-50">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <p className="font-bold text-slate-900">{v.patients?.name || 'Unknown'}</p>
                          <span className="text-[10px] text-slate-400">
                            {v.created_at ? new Date(v.created_at).toLocaleString('id-ID', {
                              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            }) : '-'}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-slate-400">#{String(v.patient_id).padStart(3, '0')}</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-2">{v.doctor}</p>
                      <span className={`mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                        v.status === 'closed' ? 'bg-slate-100 text-slate-500' :
                        v.status === 'in_consultation' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {v.status === 'registered' ? 'Menunggu' : v.status}
                      </span>
                    </div>
                  ))}
                  {displayedVisits.length < filteredVisits.length && (
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
