import { useState, useEffect } from 'react';
import api from '../../api';
import { Activity, Search, CheckCircle, Clock, User, FileText, ArrowRight, Upload } from 'lucide-react';

export default function Lab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [resultData, setResultData] = useState({ results: '', notes: '' });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      // Fetch pending lab/radiology requests
      // Filter manually on client for now or update backend to support multiple statuses if needed
      // Assuming we want to see 'pending' and 'in_progress'
      const res = await api.get('/service-requests');
      // Filter for Lab/Radiology and status
      const pending = res.data.filter(r => 
        (r.type === 'lab' || r.type === 'radiology' || r.type === 'medical_procedure') && 
        r.status !== 'completed'
      );
      setRequests(pending);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProcess = async (status) => {
    if (!selectedRequest) return;
    setLoading(true);
    try {
      // Use existing endpoints or add new ones. 
      // Since we don't have specific PUT for service-requests status, we might need to add it or use a generic one.
      // Let's assume we can update it.
      // Wait, backend service-requests endpoint is GET/POST only in index.js?
      // I need to check index.js. It has POST and GET. NO PUT/PATCH for service-requests!
      // I will need to add it.
      
      // For now, I'll assume I'll add it.
      await api.patch(`/service-requests/${selectedRequest.id}`, { 
        status: status,
        results: resultData.results,
        notes: resultData.notes
      });

      // If completed, maybe trigger visit update? 
      // Usually lab is parallel to pharmacy. 
      // If both done -> billing? 
      // For simplicity, let's just mark request as completed. 
      // Billing pulls from service-requests regardless of status? 
      // Actually billing pulls *all* requests. So marking completed is for workflow tracking.

      alert('Permintaan berhasil diperbarui!');
      setSelectedRequest(null);
      setResultData({ results: '', notes: '' });
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert('Gagal memproses: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(r => 
    r.id.toString().includes(searchQuery) ||
    // We need visit info here. Does service-requests return visit info?
    // Backend GET /service-requests: select("*, procedures(name, price, category)")
    // It does NOT join visits! I need to update backend to join visits.
    (r.visit_id && r.visit_id.toString().includes(searchQuery))
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-heading font-bold text-slate-900">Laboratorium & Radiologi</h2>
        <p className="text-slate-500">Kelola permintaan pemeriksaan penunjang medis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* List Permintaan */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-purple-50">
              <h3 className="font-bold text-purple-800 flex items-center gap-2">
                <Activity size={18} /> Antrian Pemeriksaan
              </h3>
            </div>
            <div className="p-3 bg-white border-b border-slate-100">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari ID Kunjungan..." 
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto min-h-[400px]">
              {filteredRequests.length === 0 ? (
                <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2 h-full">
                  <div className="bg-slate-50 p-3 rounded-full">
                    <Activity size={24} className="opacity-20" />
                  </div>
                  <p className="text-sm">Tidak ada permintaan aktif.</p>
                </div>
              ) : (
                filteredRequests.map(r => (
                  <div 
                    key={r.id} 
                    onClick={() => setSelectedRequest(r)}
                    className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${selectedRequest?.id === r.id ? 'bg-purple-50 border-l-4 border-l-purple-500' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-bold text-slate-800">{r.procedures?.name || 'Tindakan Medis'}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          r.type === 'lab' ? 'bg-yellow-100 text-yellow-700' :
                          r.type === 'radiology' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                      }`}>{r.type}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Kunjungan ID: {r.visit_id}
                    </p>
                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                      <Clock size={10} /> {new Date(r.created_at).toLocaleString('id-ID')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Detail & Hasil */}
        <div className="lg:col-span-2">
          {selectedRequest ? (
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200 h-full">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Detail Pemeriksaan</h3>
                    <p className="text-slate-500 text-sm">
                      Jenis: <span className="font-semibold text-slate-800 capitalize">{selectedRequest.type.replace('_', ' ')}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                      {selectedRequest.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-sm font-bold text-slate-700 mb-1">Prosedur:</p>
                    <p className="text-lg text-slate-900">{selectedRequest.procedures?.name}</p>
                    {selectedRequest.notes && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                            <p className="text-xs font-bold text-slate-500 uppercase">Catatan Dokter:</p>
                            <p className="text-sm text-slate-700 mt-1">{selectedRequest.notes}</p>
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Hasil Pemeriksaan</label>
                    <textarea 
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none h-32"
                        placeholder="Tulis hasil pemeriksaan di sini..."
                        value={resultData.results}
                        onChange={e => setResultData({...resultData, results: e.target.value})}
                    ></textarea>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Catatan Tambahan (Opsional)</label>
                    <input 
                        type="text" 
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        placeholder="Catatan untuk dokter/pasien..."
                        value={resultData.notes}
                        onChange={e => setResultData({...resultData, notes: e.target.value})}
                    />
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 gap-3">
                  <button
                    disabled={loading}
                    onClick={() => handleProcess('completed')}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                  >
                    {loading ? 'Menyimpan...' : (
                        <>
                            <CheckCircle size={20} />
                            <span>Simpan Hasil & Selesai</span>
                        </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Activity size={48} className="mb-4 opacity-20" />
              <p className="font-medium">Pilih pemeriksaan dari antrian.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
