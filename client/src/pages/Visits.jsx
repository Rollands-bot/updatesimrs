import { useState, useEffect } from 'react';
import api from '../api';
import { CalendarPlus, Clock, Search, ChevronDown } from 'lucide-react';
import { useMemo } from 'react';

export default function Visits() {
  const [patients, setPatients] = useState([]);
  const [visits, setVisits] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [polyclinics, setPolyclinics] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);
  
  // Custom dropdown states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    polyclinic_id: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVisits();
    fetchMasterData();
    // Initial fetch for patients (top 50)
    fetchPatients();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPatients(patientSearch);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [patientSearch]);

  const fetchMasterData = async () => {
    try {
      const [docRes, poliRes] = await Promise.all([
        api.get('/master/doctors'),
        api.get('/master/polyclinics')
      ]);
      setDoctors(docRes.data);
      setPolyclinics(poliRes.data);
    } catch (err) { console.error(err); }
  };

  const fetchPatients = async (query = '') => {
    try {
      const params = query ? { q: query } : {};
      const res = await api.get('/patients', { params });
      setPatients(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchVisits = async () => {
    try {
      const res = await api.get('/visits');
      setVisits(res.data);
    } catch (err) { console.error(err); }
  };

  const activePatientIds = useMemo(() => {
    const today = new Date().toDateString();
    return new Set(visits
      .filter(v => {
        const visitDate = new Date(v.created_at).toDateString();
        return visitDate === today && (
          v.status === 'registered' || 
          v.status === 'in_consultation' || 
          v.status === 'pharmacy' ||
          v.status === 'payment_pending' ||
          v.status === 'billing' ||
          v.status === 'paid' || 
          v.status === 'completed'
        );
      })
      .map(v => v.patient_id));
  }, [visits]);

  const filteredPatients = useMemo(() => {
    // Server already filtered by search query (in patients state)
    // We just need to filter out active patients
    let results = patients.filter(p => !activePatientIds.has(p.id));
    return results.slice(0, 20);
  }, [patients, activePatientIds]);

  const filteredVisits = useMemo(() => {
    return searchQuery ? visits.filter(v => 
      v.patients?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
    if (!formData.polyclinic_id) return alert("Pilih Poliklinik tujuan");
    
    setLoading(true);
    try {
      // Calculate queue number based on existing visits for today
      // or just simple length + 1 for now
      const currentMaxQueue = visits.length > 0 
        ? Math.max(...visits.map(v => v.queue_number || 0)) 
        : 0;
      const queue_number = currentMaxQueue + 1;

      const payload = {
        ...formData,
        queue_number,
        // Ensure doctor_id is undefined/null if empty string (handled by backend mostly, but good to be clean)
        doctor_id: formData.doctor_id || null
      };

      await api.post('/visits', payload);
      
      // Reload visits to show the new one immediately
      await fetchVisits();
      
      setFormData({ patient_id: '', doctor_id: '', polyclinic_id: '' });
      setSelectedPatient(null);
      setPatientSearch('');
      alert('Kunjungan berhasil dibuat! No. Antrian: ' + queue_number);
    } catch (err) {
      console.error("Create Visit Error:", err);
      alert('Error: ' + (err.response?.data?.error || err.message));
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
                
                <div 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-emerald-500 bg-white cursor-pointer flex items-center justify-between"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className={selectedPatient ? "text-slate-900" : "text-slate-400"}>
                    {selectedPatient ? `${selectedPatient.name} (ID: ${selectedPatient.id})` : "-- Cari & Pilih Pasien --"}
                  </span>
                  <Search size={16} className="text-slate-400" />
                </div>

                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0">
                      <input
                        autoFocus
                        type="text"
                        placeholder="Cari nama / NIK / ID..."
                        className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-emerald-500"
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
                            className="px-3 py-2 hover:bg-emerald-50 cursor-pointer text-sm border-b border-slate-50 last:border-0"
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

                {isDropdownOpen && (
                  <div 
                    className="fixed inset-0 z-0" 
                    onClick={() => setIsDropdownOpen(false)}
                  ></div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Poli / Unit</label>
                <select 
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  value={formData.polyclinic_id}
                  onChange={e => setFormData({...formData, polyclinic_id: e.target.value})}
                >
                  <option value="">-- Pilih Poli --</option>
                  {polyclinics.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.type.replace('_',' ')})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dokter (Opsional)</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  value={formData.doctor_id}
                  onChange={e => setFormData({...formData, doctor_id: e.target.value})}
                >
                  <option value="">-- Pilih Dokter (Boleh Kosong) --</option>
                  {doctors
                    .filter(d => !formData.polyclinic_id || String(d.polyclinic_id) === String(formData.polyclinic_id))
                    .map(d => (
                      <option key={d.id} value={d.id}>{d.users?.name} ({d.specialization})</option>
                    ))
                  }
                </select>
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm disabled:opacity-50"
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
                  Hari Ini
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
                    <th className="p-4">Antrian</th>
                    <th className="p-4">Pasien</th>
                    <th className="p-4">Dokter / Poli</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Waktu</th>
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
                        <td className="p-4">
                            <div className="font-mono text-lg font-bold text-blue-600">{v.queue_code || `#${v.queue_number}`}</div>
                            {v.queue_code && <div className="text-[10px] text-slate-400">Seq: {v.queue_number}</div>}
                        </td>
                        <td className="p-4 font-medium text-slate-900">
                          {v.patients?.name || <span className="text-red-500 italic">Pasien (ID: {v.patient_id})</span>}
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{v.doctors?.users?.name || '-'}</div>
                          <div className="text-xs text-slate-500">{v.polyclinics?.name || '-'}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${
                            v.status === 'completed' ? 'bg-green-100 text-green-700' :
                            v.status === 'in_consultation' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {v.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-slate-500">
                          {v.created_at ? new Date(v.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'}) : '-'}
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
                    Lihat Lebih Banyak
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
