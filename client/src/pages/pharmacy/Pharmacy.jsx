import { useState, useEffect } from 'react';
import api from '../../api';
import { Pill, Search, CheckCircle, Clock, User, FileText, ArrowRight } from 'lucide-react';

export default function Pharmacy() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      // Fetch pending prescriptions
      const res = await api.get('/prescriptions', { params: { status: 'pending' } });
      setPrescriptions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProcess = async () => {
    if (!selectedPrescription) return;
    setLoading(true);
    try {
      // 1. Update Prescription Status
      await api.put(`/prescriptions/${selectedPrescription.id}`, { status: 'processed' });
      
      // 2. Update Visit Status to Billing (payment_pending)
      if (selectedPrescription.visit_id) {
        await api.patch(`/visits/${selectedPrescription.visit_id}`, { status: 'payment_pending' });
      }

      alert('Resep berhasil diproses dan diteruskan ke Billing!');
      setSelectedPrescription(null);
      fetchPrescriptions();
    } catch (err) {
      console.error(err);
      alert('Gagal memproses resep: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter(p => 
    p.visits?.patients?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(p.id).includes(searchQuery)
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-heading font-bold text-slate-900">Farmasi & Apotek</h2>
        <p className="text-slate-500">Kelola resep masuk dan penyiapan obat.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* List Resep Masuk */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-emerald-50">
              <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                <Clock size={18} /> Antrian Resep (Pending)
              </h3>
            </div>
            <div className="p-3 bg-white border-b border-slate-100">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari pasien / ID..." 
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto min-h-[400px]">
              {filteredPrescriptions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2 h-full">
                  <div className="bg-slate-50 p-3 rounded-full">
                    <Pill size={24} className="opacity-20" />
                  </div>
                  <p className="text-sm">Tidak ada resep pending.</p>
                </div>
              ) : (
                filteredPrescriptions.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => setSelectedPrescription(p)}
                    className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${selectedPrescription?.id === p.id ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-bold text-slate-800">{p.visits?.patients?.name}</p>
                      <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">#{p.id}</span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <User size={10} /> {p.visits?.doctors?.users?.name || 'Dokter'}
                    </p>
                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                      <Clock size={10} /> {new Date(p.created_at).toLocaleString('id-ID')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Detail & Aksi */}
        <div className="lg:col-span-2">
          {selectedPrescription ? (
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200 h-full">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Detail Resep</h3>
                    <p className="text-slate-500 text-sm">
                      Pasien: <span className="font-semibold text-slate-800">{selectedPrescription.visits?.patients?.name}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                      {selectedPrescription.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <Pill size={16} className="text-emerald-600" /> Daftar Obat
                  </h4>
                  <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-100 text-slate-700 font-semibold">
                        <tr>
                          <th className="p-3">Nama Obat</th>
                          <th className="p-3 w-24">Jumlah</th>
                          <th className="p-3 w-32">Dosis</th>
                          <th className="p-3">Catatan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {selectedPrescription.prescription_items?.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-3 font-medium text-slate-800">{item.medicines?.name}</td>
                            <td className="p-3">{item.quantity}</td>
                            <td className="p-3">{item.dosage}</td>
                            <td className="p-3 text-slate-500 italic">{item.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {(!selectedPrescription.prescription_items || selectedPrescription.prescription_items.length === 0) && (
                        <div className="p-4 text-center text-slate-400 text-sm">Tidak ada item obat.</div>
                    )}
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                    <p className="font-bold mb-1">Instruksi:</p>
                    <p>Silakan siapkan obat sesuai daftar di atas. Pastikan dosis dan jumlah sesuai.</p>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    disabled={loading}
                    onClick={handleProcess}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none"
                  >
                    {loading ? (
                        <span>Memproses...</span>
                    ) : (
                        <>
                            <CheckCircle size={20} />
                            <span>Konfirmasi & Kirim ke Kasir</span>
                            <ArrowRight size={16} />
                        </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <FileText size={48} className="mb-4 opacity-20" />
              <p className="font-medium">Pilih resep dari antrian untuk memproses.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
