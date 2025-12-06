import { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { Stethoscope, FileText, CheckCircle, Search, X, History, ClipboardList, Pill, Plus, Trash2, Activity } from 'lucide-react';

export default function Doctor() {
  const [visits, setVisits] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [recordData, setRecordData] = useState({ 
    subjective: '', objective: '', assessment: '', plan: '', icd10_code: '' 
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Master Data
  const [medicines, setMedicines] = useState([]);
  const [procedures, setProcedures] = useState([]);
  
  // Input States for Prescription & Procedures
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [selectedProcedures, setSelectedProcedures] = useState([]);

  // Medical History State
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchVisits();
    fetchMasterData();
  }, []);

  const fetchVisits = async () => {
    try {
      const res = await api.get('/visits');
      setVisits(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchMasterData = async () => {
    try {
      const [meds, procs] = await Promise.all([
        api.get('/master/medicines'),
        api.get('/master/procedures')
      ]);
      setMedicines(meds.data);
      setProcedures(procs.data);
    } catch (err) { console.error("Failed to fetch master data", err); }
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
    const active = visits.filter(v => 
      v.status === 'registered' || v.status === 'in_consultation'
    );
    
    if (!searchQuery) return active;

    const query = searchQuery.toLowerCase();
    return active.filter(v => {
      const name = v.patients?.name?.toLowerCase() || '';
      return name.includes(query);
    });
  }, [visits, searchQuery]);

  const handleSelect = (visit) => {
    setSelectedVisit(visit);
    setRecordData({ subjective: '', objective: '', assessment: '', plan: '', icd10_code: '' });
    setSelectedMedicines([]);
    setSelectedProcedures([]);
    setShowHistory(false);
    if (visit.patient_id) fetchMedicalHistory(visit.patient_id);
  };

  const addMedicine = () => {
    setSelectedMedicines([...selectedMedicines, { medicine_id: '', quantity: 1, dosage: '3x1 sesudah makan', notes: '' }]);
  };

  const updateMedicine = (index, field, value) => {
    const newMeds = [...selectedMedicines];
    newMeds[index][field] = value;
    setSelectedMedicines(newMeds);
  };

  const removeMedicine = (index) => {
    setSelectedMedicines(selectedMedicines.filter((_, i) => i !== index));
  };

  const addProcedure = () => {
    setSelectedProcedures([...selectedProcedures, { procedure_id: '', notes: '' }]);
  };

  const updateProcedure = (index, field, value) => {
    const newProcs = [...selectedProcedures];
    newProcs[index][field] = value;
    setSelectedProcedures(newProcs);
  };

  const removeProcedure = (index) => {
    setSelectedProcedures(selectedProcedures.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVisit) return;
    
    setLoading(true);
    try {
      // 1. Submit SOAP (updates status to 'pharmacy' automatically by backend default logic, but we might want to override if no meds)
      await api.post('/medical-records', {
        visit_id: selectedVisit.id,
        ...recordData
      });

      // 2. Submit Prescription if any
      if (selectedMedicines.length > 0) {
        const validMeds = selectedMedicines.filter(m => m.medicine_id);
        if (validMeds.length > 0) {
          await api.post('/prescriptions', {
            visit_id: selectedVisit.id,
            items: validMeds
          });
        }
      }

      // 3. Submit Procedures (Split by category for Lab/Radiology)
      if (selectedProcedures.length > 0) {
        const validProcs = selectedProcedures.filter(p => p.procedure_id);
        
        // Group by category
        const requestsByType = {
            'lab': [],
            'radiology': [],
            'medical_procedure': [] // Default for others
        };

        validProcs.forEach(p => {
            const procDef = procedures.find(ref => String(ref.id) === String(p.procedure_id));
            if (procDef) {
                if (procDef.category === 'lab') {
                    requestsByType['lab'].push(p);
                } else if (procDef.category === 'radiologi' || procDef.category === 'radiology') {
                    requestsByType['radiology'].push(p);
                } else {
                    requestsByType['medical_procedure'].push(p);
                }
            }
        });

        // Send requests
        for (const [type, items] of Object.entries(requestsByType)) {
            if (items.length > 0) {
                await api.post('/service-requests', {
                    visit_id: selectedVisit.id,
                    type: type,
                    items: items
                });
            }
        }
      }
      
      // 4. Logic to handle status transition
      // If NO medicines, we should ideally skip pharmacy and go to billing.
      // But for simplicity, let's stick to the flow: Doctor -> Pharmacy (Check) -> Billing.
      // Even if no meds, Pharmacy can see "No Meds" and forward to billing.
      
      alert('Pemeriksaan selesai & data berhasil disimpan!');
      fetchVisits(); 
      setSelectedVisit(null);
    } catch (err) {
      console.error(err);
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-heading font-bold text-slate-900">Pemeriksaan Dokter</h2>
        <p className="text-slate-500">Input rekam medis (SOAP), Resep Obat, dan Tindakan.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Antrian Pasien */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden lg:sticky lg:top-24">
            <div className="p-4 border-b border-slate-100 bg-emerald-50">
              <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                <Stethoscope size={18} /> Antrian Pasien
              </h3>
            </div>
            <div className="p-3 bg-white border-b border-slate-100">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari pasien..." 
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
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
                    className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${selectedVisit?.id === v.id ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''}`}
                  >
                    <p className="font-bold text-slate-800">{v.patients?.name}</p>
                    <p className="text-xs text-slate-500">
                      {v.doctors?.users?.name || 'Dokter Umum'} • {new Date(v.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded mt-2 inline-block capitalize">{v.status.replace('_', ' ')}</span>
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
                  <p className="text-slate-500 text-sm">
                    Antrian #{selectedVisit.queue_number} • ID: {selectedVisit.id}
                  </p>
                </div>
                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold w-fit">
                  {selectedVisit.doctors?.users?.name || 'Dokter'}
                </span>
              </div>

              {/* Tabs */}
              <div className="mb-6">
                <div className="flex gap-2 border-b border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowHistory(false)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      !showHistory 
                        ? 'border-emerald-500 text-emerald-600' 
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ClipboardList size={16} />
                      Pemeriksaan (SOAP & Resep)
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowHistory(true)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      showHistory 
                        ? 'border-emerald-500 text-emerald-600' 
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
                  {/* History List Component */}
                  {medicalHistory.length === 0 ? (
                     <div className="text-center py-8 text-slate-400">Belum ada riwayat.</div>
                  ) : (
                    medicalHistory.map(h => (
                        <div key={h.id} className="bg-slate-50 p-4 rounded border">
                            <p className="font-bold">{new Date(h.created_at).toLocaleDateString()}</p>
                            <p>S: {h.subjective}</p>
                            <p>O: {h.objective}</p>
                            <p>A: {h.assessment}</p>
                            <p>P: {h.plan}</p>
                        </div>
                    ))
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* SOAP Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Subjective (S)</label>
                      <textarea required rows="3" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                        value={recordData.subjective}
                        onChange={e => setRecordData({...recordData, subjective: e.target.value})}
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Objective (O)</label>
                      <textarea required rows="3" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                        value={recordData.objective}
                        onChange={e => setRecordData({...recordData, objective: e.target.value})}
                      ></textarea>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Assessment (A)</label>
                      <input required type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                        value={recordData.assessment}
                        onChange={e => setRecordData({...recordData, assessment: e.target.value})}
                      />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">ICD-10</label>
                        <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                            value={recordData.icd10_code}
                            onChange={e => setRecordData({...recordData, icd10_code: e.target.value})}
                        />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Plan (P) / Notes</label>
                    <textarea required rows="2" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                      value={recordData.plan}
                      onChange={e => setRecordData({...recordData, plan: e.target.value})}
                    ></textarea>
                  </div>

                  <hr className="border-slate-200" />

                  {/* PRESCRIPTION INPUT */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Pill size={16} /> Resep Obat
                      </label>
                      <button type="button" onClick={addMedicine} className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded hover:bg-emerald-100 font-bold flex items-center gap-1">
                        <Plus size={12} /> Tambah Obat
                      </button>
                    </div>
                    
                    {selectedMedicines.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Tidak ada obat yang diresepkan.</p>
                    ) : (
                        <div className="space-y-2">
                            {selectedMedicines.map((item, idx) => (
                                <div key={idx} className="flex gap-2 items-start bg-slate-50 p-2 rounded border border-slate-200">
                                    <select 
                                        required
                                        className="flex-1 text-sm border rounded px-2 py-1"
                                        value={item.medicine_id}
                                        onChange={e => updateMedicine(idx, 'medicine_id', e.target.value)}
                                    >
                                        <option value="">-- Pilih Obat --</option>
                                        {medicines.map(m => (
                                            <option key={m.id} value={m.id}>{m.name} ({m.stock} {m.unit})</option>
                                        ))}
                                    </select>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        className="w-16 text-sm border rounded px-2 py-1"
                                        placeholder="Jml"
                                        value={item.quantity}
                                        onChange={e => updateMedicine(idx, 'quantity', e.target.value)}
                                    />
                                    <input 
                                        type="text" 
                                        className="w-32 text-sm border rounded px-2 py-1"
                                        placeholder="Dosis (3x1)"
                                        value={item.dosage}
                                        onChange={e => updateMedicine(idx, 'dosage', e.target.value)}
                                    />
                                    <button type="button" onClick={() => removeMedicine(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                  </div>

                  <hr className="border-slate-200" />

                  {/* PROCEDURES INPUT */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Activity size={16} /> Tindakan Medis
                      </label>
                      <button type="button" onClick={addProcedure} className="text-xs bg-yellow-50 text-yellow-600 px-2 py-1 rounded hover:bg-yellow-100 font-bold flex items-center gap-1">
                        <Plus size={12} /> Tambah Tindakan
                      </button>
                    </div>
                    
                    {selectedProcedures.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Tidak ada tindakan medis.</p>
                    ) : (
                        <div className="space-y-2">
                            {selectedProcedures.map((item, idx) => (
                                <div key={idx} className="flex gap-2 items-start bg-slate-50 p-2 rounded border border-slate-200">
                                    <select 
                                        required
                                        className="flex-1 text-sm border rounded px-2 py-1"
                                        value={item.procedure_id}
                                        onChange={e => updateProcedure(idx, 'procedure_id', e.target.value)}
                                    >
                                        <option value="">-- Pilih Tindakan --</option>
                                        {procedures.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <input 
                                        type="text" 
                                        className="flex-1 text-sm border rounded px-2 py-1"
                                        placeholder="Catatan tambahan..."
                                        value={item.notes}
                                        onChange={e => updateProcedure(idx, 'notes', e.target.value)}
                                    />
                                    <button type="button" onClick={() => removeProcedure(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end pt-4">
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
                      className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-sm w-full sm:w-auto"
                    >
                      <CheckCircle size={20} />
                      {loading ? 'Menyimpan...' : 'Simpan & Selesai'}
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
