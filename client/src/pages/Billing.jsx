import { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { Receipt, CreditCard, Printer, History, CheckCircle2, AlertCircle, Search, Filter, UserPlus, Calendar, User, Stethoscope, TrendingUp, Clock, DollarSign, FileText, List } from 'lucide-react';

const formatCurrency = (value) => {
  if (!value && value !== 0) return 'Rp0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(value));
};

const toWords = (num) => {
  if (num === 0) return 'Nol Rupiah';
  
  const units = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan'];
  const teens = ['Sepuluh', 'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas', 'Lima Belas', 'Enam Belas', 'Tujuh Belas', 'Delapan Belas', 'Sembilan Belas'];
  const tens = ['', 'Sepuluh', 'Dua Puluh', 'Tiga Puluh', 'Empat Puluh', 'Lima Puluh', 'Enam Puluh', 'Tujuh Puluh', 'Delapan Puluh', 'Sembilan Puluh'];
  
  if (num < 10) return units[num] + ' Rupiah';
  if (num < 20) return teens[num - 10] + ' Rupiah';
  if (num < 100) {
    const unit = num % 10;
    const ten = Math.floor(num / 10);
    return tens[ten] + (unit > 0 ? ' ' + units[unit] : '') + ' Rupiah';
  }
  
  // For simplicity, just return the number for larger amounts
  return formatCurrency(num).replace('Rp', '').trim() + ' Rupiah';
};

export default function Billing() {
  const [visits, setVisits] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [billItems, setBillItems] = useState([]); // Stores calculated items
  const [amount, setAmount] = useState(''); // Still editable if needed, but auto-filled
  
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [visitSearchQuery, setVisitSearchQuery] = useState('');
  const [transactionHistoryQuery, setTransactionHistoryQuery] = useState('');

  useEffect(() => {
    fetchVisits();
    fetchTransactions();
  }, []);

  const fetchVisits = async () => {
    try {
      const res = await api.get('/visits');
      setVisits(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/transactions');
      setTransactions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const isVisitPaid = (visit) => visit?.transactions?.some(t => t.status === 'paid');

  const pendingVisits = useMemo(
    () => visits.filter(v => !isVisitPaid(v) && (
        v.status === 'payment_pending' || 
        v.status === 'billing' || 
        v.status === 'pharmacy_processed' || 
        v.status === 'registered' // Optional: if paying registration fee early
    )), 
    [visits]
  );

  // ... (Same stats logic)
  const todayTransactions = useMemo(() => {
    const today = new Date().toDateString();
    return transactions.filter(tx => {
      const txDate = new Date(tx.created_at);
      return txDate.toDateString() === today && !isNaN(txDate.getTime());
    });
  }, [transactions]);

  const totalRevenueToday = useMemo(() => 
    todayTransactions.reduce((sum, tx) => {
      const amount = Number(tx.total_amount || tx.amount || 0);
      return !isNaN(amount) ? sum + amount : sum;
    }, 0),
    [todayTransactions]
  );

  const latestTransactions = useMemo(() => transactions.slice(0, 10), [transactions]);

  const filteredPendingVisits = useMemo(() => {
    if (!visitSearchQuery) return pendingVisits;
    const query = visitSearchQuery.toLowerCase();
    return pendingVisits.filter(v => 
      v.patients?.name.toLowerCase().includes(query) ||
      v.doctors?.users?.name?.toLowerCase().includes(query) ||
      (!isNaN(query) && (
        String(v.id) === String(Number(query)) || 
        String(v.id).padStart(3, '0') === query
      ))
    );
  }, [pendingVisits, visitSearchQuery]);

  const filteredTransactions = useMemo(() => {
    if (!transactionHistoryQuery) return latestTransactions;
    const query = transactionHistoryQuery.toLowerCase();
    return latestTransactions.filter(tx => 
      (tx.patients?.name || 'Unknown').toLowerCase().includes(query) ||
      String(tx.total_amount || tx.amount).includes(query) ||
      tx.status.toLowerCase().includes(query)
    );
  }, [latestTransactions, transactionHistoryQuery]);

  // Enhanced Select Logic: Fetch Bill Details
  const handleSelectVisit = async (visit) => {
    if (isVisitPaid(visit)) return;
    setSelectedVisit(visit);
    setAmount('');
    setStatusMessage(null);
    setErrorMessage('');
    setBillItems([]);

    try {
        setLoading(true);
        console.log("Fetching billing details for visit:", visit.id);

        // 1. Fetch Prescriptions
        const presRes = await api.get('/prescriptions'); 
        if (!presRes.data) throw new Error("Gagal mengambil data resep");
        const visitPrescriptions = presRes.data.filter(p => p.visit_id === visit.id);
        
        // 2. Fetch Procedures (Service Requests)
        const procRes = await api.get('/service-requests', { params: { visit_id: visit.id } });
        if (!procRes.data) throw new Error("Gagal mengambil data tindakan");
        
        // 3. Calculate Items
        let items = [];
        let total = 0;

        // Add Procedures
        if (procRes.data && Array.isArray(procRes.data)) {
            procRes.data.forEach(req => {
                if (req.procedures) {
                    const price = Number(req.procedures.price) || 0;
                    items.push({
                        item_type: 'procedure',
                        item_id: req.procedure_id,
                        item_name: req.procedures.name,
                        quantity: 1,
                        price: price,
                        subtotal: price
                    });
                    total += price;
                }
            });
        }

        // Add Medicines
        visitPrescriptions.forEach(pres => {
            if (pres.prescription_items && Array.isArray(pres.prescription_items)) {
                pres.prescription_items.forEach(pi => {
                    if (pi.medicines) {
                        const price = Number(pi.medicines.price) || 0;
                        const subtotal = price * (pi.quantity || 1);
                        items.push({
                            item_type: 'medicine',
                            item_id: pi.medicine_id,
                            item_name: pi.medicines.name,
                            quantity: pi.quantity || 1,
                            price: price,
                            subtotal: subtotal
                        });
                        total += subtotal;
                    }
                });
            }
        });

        // Add Doctor/Registration Fee (Static for now, could be from master)
        const regFee = 15000;
        items.push({
            item_type: 'registration',
            item_name: 'Biaya Administrasi & Jasa Dokter',
            quantity: 1,
            price: regFee,
            subtotal: regFee
        });
        total += regFee;

        console.log("Calculated Bill Items:", items);
        setBillItems(items);
        setAmount(total.toString());

    } catch (error) {
        console.error("Error calculating bill:", error);
        setErrorMessage("Gagal menghitung rincian biaya: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!selectedVisit) return;

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMessage('Nominal tagihan harus lebih dari 0.');
      return;
    }
    
    setLoading(true);
    setErrorMessage('');
    
    try {
      // Use billItems if available, otherwise fallback to manual item
      const itemsToSubmit = billItems.length > 0 ? billItems.map(i => ({
          item_type: i.item_type,
          item_id: i.item_id || null,
          item_name: i.item_name,
          quantity: i.quantity,
          price: i.price,
          subtotal: i.subtotal
      })) : [{
        item_type: 'manual',
        item_name: 'Biaya Pelayanan (Manual)',
        quantity: 1,
        price: numericAmount
      }];

      console.log("Submitting Transaction:", {
        visit_id: selectedVisit.id,
        total: numericAmount,
        items: itemsToSubmit
      });

      await api.post('/transactions', {
        visit_id: selectedVisit.id,
        patient_id: selectedVisit.patient_id,
        items: itemsToSubmit,
        payment_method: 'cash'
      });

      alert('Pembayaran Berhasil!'); // Add explicit alert
      setAmount('');
      setSelectedVisit(null);
      setBillItems([]);
      setStatusMessage({
        type: 'success',
        title: 'Pembayaran Berhasil',
        detail: `${selectedVisit.patients?.name || 'Pasien'} sudah lunas.`
      });
      fetchVisits();
      fetchTransactions();
    } catch (err) {
      console.error("Payment Error:", err);
      setErrorMessage(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintInvoice = () => window.print();

  return (
    <div className="space-y-6">
      {/* Header with Dashboard Stats */}
      <div className="bg-gradient-to-r from-emerald-500 to-yellow-500 rounded-2xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Kasir & Billing</h2>
            <p className="text-emerald-50">Sistem pembayaran tagihan layanan kesehatan</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} />
                <span className="text-sm text-emerald-50">Hari Ini</span>
              </div>
              <p className="text-2xl font-bold">{todayTransactions.length}</p>
              <p className="text-xs text-emerald-50">Transaksi</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <User size={16} />
                <span className="text-sm text-emerald-50">Pending</span>
              </div>
              <p className="text-2xl font-bold">{pendingVisits.length}</p>
              <p className="text-xs text-emerald-50">Tagihan</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} />
                <span className="text-sm text-emerald-50">Revenue</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(totalRevenueToday).replace('Rp', '')}</p>
              <p className="text-xs text-emerald-50">Hari ini</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List Tagihan Pending */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Receipt size={18} />
                  Tagihan Aktif
                </h3>
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">
                  {pendingVisits.length}
                </span>
              </div>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari pasien..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm"
                  value={visitSearchQuery}
                  onChange={e => setVisitSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[600px]">
              {filteredPendingVisits.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  <p className="text-sm">Tidak ada tagihan pending.</p>
                </div>
              ) : (
                filteredPendingVisits.map(v => (
                  <div 
                    key={v.id} 
                    onClick={() => handleSelectVisit(v)}
                    className={`p-3 border-b border-slate-50 cursor-pointer transition-all duration-200 ${
                      selectedVisit?.id === v.id 
                        ? 'bg-emerald-50 border-l-4 border-l-emerald-500' 
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{v.patients?.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                              v.status === 'billing' ? 'bg-yellow-100 text-yellow-700' :
                              v.status === 'pharmacy' ? 'bg-yellow-50 text-yellow-600' :
                              v.status === 'payment_pending' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-slate-100 text-slate-600'
                          }`}>{v.status.replace('_', ' ')}</span>
                        </div>
                      </div>
                      {selectedVisit?.id === v.id && (
                        <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Form Pembayaran */}
        <div className="lg:col-span-2">
          {statusMessage && (
            <div className="rounded-lg border border-green-200 bg-green-50 text-green-800 px-4 py-3 mb-6">
              <p className="font-bold">{statusMessage.title}</p>
              <p className="text-sm">{statusMessage.detail}</p>
            </div>
          )}
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 text-red-800 px-4 py-3 mb-6">
              <p className="font-bold">Error</p>
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

          {selectedVisit ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
               {/* Visit Info */}
               <div className="p-6 bg-slate-50 border-b border-slate-200">
                    <h3 className="font-bold text-lg text-slate-900">{selectedVisit.patients?.name}</h3>
                    <p className="text-sm text-slate-500">ID: {selectedVisit.id} • Dokter: {selectedVisit.doctors?.users?.name || '-'}</p>
               </div>

               <div className="p-6">
                   {/* Itemized Bill */}
                   <div className="mb-6">
                       <h4 className="font-bold text-sm text-slate-700 mb-2 flex items-center gap-2"><List size={16}/> Rincian Tagihan</h4>
                       <div className="border rounded-lg overflow-x-auto">
                           <table className="w-full text-sm text-left min-w-[500px]">
                               <thead className="bg-slate-100 text-slate-700">
                                   <tr>
                                       <th className="p-3">Item</th>
                                       <th className="p-3 text-right">Harga</th>
                                       <th className="p-3 text-right">Qty</th>
                                       <th className="p-3 text-right">Subtotal</th>
                                   </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-100">
                                   {billItems.length === 0 ? (
                                       <tr><td colSpan="4" className="p-4 text-center text-slate-400">Menghitung/Tidak ada item...</td></tr>
                                   ) : (
                                       billItems.map((item, idx) => (
                                           <tr key={idx}>
                                               <td className="p-3">
                                                   <p className="font-medium">{item.item_name}</p>
                                                   <p className="text-xs text-slate-400 capitalize">{item.item_type}</p>
                                               </td>
                                               <td className="p-3 text-right">{formatCurrency(item.price)}</td>
                                               <td className="p-3 text-right">{item.quantity}</td>
                                               <td className="p-3 text-right font-bold">{formatCurrency(item.subtotal)}</td>
                                           </tr>
                                       ))
                                   )}
                               </tbody>
                               <tfoot className="bg-slate-50 font-bold">
                                   <tr>
                                       <td colSpan="3" className="p-3 text-right">TOTAL</td>
                                       <td className="p-3 text-right text-emerald-600">{formatCurrency(amount)}</td>
                                   </tr>
                               </tfoot>
                           </table>
                       </div>
                   </div>

                   <form id="billing-form" onSubmit={handlePayment}>
                        <div className="flex justify-end">
                            <button
                                disabled={loading}
                                type="submit"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg disabled:opacity-50 transition-all"
                            >
                                {loading ? 'Memproses...' : `Bayar ${formatCurrency(amount)}`}
                            </button>
                        </div>
                   </form>
               </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <CreditCard size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">Pilih tagihan untuk diproses.</p>
            </div>
          )}
          
          {/* Transaction History Table */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 mt-6">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">Riwayat Pembayaran Terakhir</h3>
            </div>
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-3 text-left">Waktu</th>
                    <th className="p-3 text-left">Pasien</th>
                    <th className="p-3 text-left">Total</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(tx => (
                    <tr key={tx.id} className="border-b border-slate-50">
                      <td className="p-3">{new Date(tx.created_at).toLocaleString()}</td>
                      <td className="p-3 font-medium">{tx.patients?.name || 'Unknown'}</td>
                      <td className="p-3">{formatCurrency(tx.total_amount || tx.amount)}</td>
                      <td className="p-3"><span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full uppercase font-bold">{tx.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Mobile Transaction Cards */}
            <div className="md:hidden p-4 space-y-3 bg-slate-50/50">
                {filteredTransactions.map(tx => (
                    <div key={tx.id} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-slate-500">{new Date(tx.created_at).toLocaleString()}</span>
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase font-bold">{tx.status}</span>
                        </div>
                        <div className="font-bold text-slate-900">{tx.patients?.name || 'Unknown'}</div>
                        <div className="text-emerald-600 font-bold mt-1">{formatCurrency(tx.total_amount || tx.amount)}</div>
                    </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
