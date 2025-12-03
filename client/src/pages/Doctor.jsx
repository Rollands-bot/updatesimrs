import { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { Stethoscope, FileText, CheckCircle, Search, X, History, ClipboardList } from 'lucide-react';

export default function Doctor() {
  const [visits, setVisits] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [recordData, setRecordData] = useState({ diagnosis: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Medical History State
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      const res = await api.get('/visits');
      // Filter only active visits usually, but for now show all registered/consultation
      setVisits(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchMedicalHistory = async (patientId) => {
    setLoadingHistory(true);
    try {
      const res = await api.get(`/medical-records/${patientId}`);
      setMedicalHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const filteredVisits = useMemo(() => {
    // Filter out closed visits first
    const activeVisits = visits.filter(v => v.status !== 'closed' && v.status !== 'paid');
    
    if (!searchQuery) return activeVisits;
    const query = searchQuery.toLowerCase();
    return activeVisits.filter(v => 
      v.patients?.name.toLowerCase().includes(query) ||
      v.doctor.toLowerCase().includes(query) ||
      v.status.toLowerCase().includes(query) ||
      (!isNaN(query) && (
        String(v.id) === String(Number(query)) || 
        String(v.id).padStart(3, '0') === query
      ))
    );
  }, [visits, searchQuery]);

  const handleSelect = (visit) => {
    setSelectedVisit(visit);
    setRecordData({ diagnosis: '', notes: '' });
    setShowHistory(false);
    // Fetch history immediately when patient selected
    if (visit.patient_id) {
      fetchMedicalHistory(visit.patient_id);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVisit) return;
    
    setLoading(true);
    try {
      await api.post('/medical-records', {
        visit_id: selectedVisit.id,
        ...recordData
      });
      alert('Rekam medis berhasil disimpan!');
      setSelectedVisit(null);
      setRecordData({ diagnosis: '', notes: '' });
    } catch (err) {
      alert('Error: ' + err.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-heading font-bold text-slate-900">Pemeriksaan Dokter</h2>
        <p className="text-slate-500">Input diagnosa dan catatan medis pasien.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Antrian Pasien */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden lg:sticky lg:top-24">
            <div className="p-4 border-b border-slate-100 bg-primary-50">
              <h3 className="font-bold text-primary-800 flex items-center gap-2">
                <Stethoscope size={18} /> Antrian Pasien
              </h3>
            </div>
            <div className="p-3 bg-white border-b border-slate-100">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari pasien, ID, atau dokter..." 
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {filteredVisits.length === 0 ? (
                <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <div className="bg-slate-50 p-3 rounded-full">
                    <Search size={24} className="opacity-20" />
                  </div>
                  <p className="text-sm">{searchQuery ? 'Tidak ada hasil pencarian.' : 'Belum ada antrian aktif.'}</p>
                </div>
              ) : (
                filteredVisits.map(v => (
                  <div 
                    key={v.id} 
                    onClick={() => handleSelect(v)}
                    className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${selectedVisit?.id === v.id ? 'bg-primary-50 border-l-4 border-l-primary-500' : ''}`}
                  >
                    <p className="font-bold text-slate-800">{v.patients?.name}</p>
                    <p className="text-xs text-slate-500">{v.doctor} • {new Date(v.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded mt-2 inline-block">{v.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Form Rekam Medis */}
        <div className="lg:col-span-2">
          {selectedVisit ? (
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Rekam Medis: {selectedVisit.patients?.name}</h3>
                  <p className="text-slate-500 text-sm">ID Kunjungan: {selectedVisit.id}</p>
                </div>
                <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-bold w-fit">
                  {selectedVisit.doctor}
                </span>
              </div>

              {/* Tabs or History Toggle */}
              <div className="mb-6">
                <div className="flex gap-2 border-b border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowHistory(false)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      !showHistory 
                        ? 'border-primary-500 text-primary-600' 
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ClipboardList size={16} />
                      Input Rekam Medis
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowHistory(true)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      showHistory 
                        ? 'border-primary-500 text-primary-600' 
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <History size={16} />
                      Riwayat Pasien
                    </div>
                  </button>
                </div>
              </div>

              {showHistory ? (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {loadingHistory ? (
                    <div className="text-center py-8 text-slate-400">Memuat riwayat...</div>
                  ) : medicalHistory.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-lg">
                      <History size={32} className="mx-auto mb-2 opacity-20" />
                      <p>Belum ada riwayat rekam medis.</p>
                    </div>
                  ) : (
                    medicalHistory.map((history) => (
                      <div key={history.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{new Date(history.created_at).toLocaleDateString('id-ID', { 
                              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                            })}</p>
                            <p className="text-xs text-slate-500">{history.visits?.doctor}</p>
                          </div>
                          <span className="text-xs font-mono text-slate-400">#{history.id}</span>
                        </div>
                        <div className="space-y-2 mt-3">
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase">Diagnosa</p>
                            <p className="text-sm font-medium text-slate-800">{history.diagnosis}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase">Catatan / Resep</p>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{history.notes}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Diagnosa (ICD-10)</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-medium"
                      placeholder="Contoh: A00.1 Cholera, unspecified"
                      value={recordData.diagnosis}
                      onChange={e => setRecordData({...recordData, diagnosis: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Catatan Dokter / Resep</label>
                    <textarea
                      required
                      rows="6"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                      placeholder="Tulis hasil pemeriksaan, instruksi, dan resep obat..."
                      value={recordData.notes}
                      onChange={e => setRecordData({...recordData, notes: e.target.value})}
                    ></textarea>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                    <button 
                      type="button" 
                      onClick={() => setSelectedVisit(null)}
                      className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors w-full sm:w-auto text-center"
                    >
                      Batal
                    </button>
                    <button
                      disabled={loading}
                      type="submit"
                      className="flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-sm w-full sm:w-auto"
                    >
                      <CheckCircle size={20} />
                      {loading ? 'Menyimpan...' : 'Simpan Rekam Medis'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Stethoscope size={48} className="mb-4 opacity-20" />
              <p className="font-medium">Pilih pasien dari antrian untuk memulai pemeriksaan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
