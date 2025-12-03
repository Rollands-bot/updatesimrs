import { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { Receipt, CreditCard, Printer, History, CheckCircle2, AlertCircle, Search, Filter, UserPlus, Calendar, User, Stethoscope, TrendingUp, Clock, DollarSign, FileText } from 'lucide-react';

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
  const [amount, setAmount] = useState('');
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
    () => visits.filter(v => !isVisitPaid(v)),
    [visits]
  );

  const todayTransactions = useMemo(() => {
    const today = new Date().toDateString();
    return transactions.filter(tx => {
      const txDate = new Date(tx.created_at);
      return txDate.toDateString() === today && !isNaN(txDate.getTime());
    });
  }, [transactions]);

  const totalRevenueToday = useMemo(() => 
    todayTransactions.reduce((sum, tx) => {
      const amount = Number(tx.amount);
      return !isNaN(amount) ? sum + amount : sum;
    }, 0),
    [todayTransactions]
  );

  const latestTransactions = useMemo(() => transactions.slice(0, 10), [transactions]);

  const filteredPendingVisits = useMemo(() => {
    // Filter visits that are NOT paid yet (status != 'paid') and NOT closed
    // Although the initial pendingVisits memo does this, adding extra safety here
    const activeUnpaidVisits = pendingVisits.filter(v => 
      !v.transactions?.some(t => t.status === 'paid') && v.status !== 'closed'
    );

    if (!visitSearchQuery) return activeUnpaidVisits;
    
    const query = visitSearchQuery.toLowerCase();
    return activeUnpaidVisits.filter(v => 
      v.patients?.name.toLowerCase().includes(query) ||
      v.doctor.toLowerCase().includes(query) ||
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
      tx.visits?.patients?.name.toLowerCase().includes(query) ||
      String(tx.amount).includes(query) ||
      tx.status.toLowerCase().includes(query) ||
      (!isNaN(query) && (
        String(tx.id) === String(Number(query)) || 
        String(tx.id).padStart(3, '0') === query
      ))
    );
  }, [latestTransactions, transactionHistoryQuery]);

  const handleSelectVisit = (visit) => {
    if (isVisitPaid(visit)) return;
    setSelectedVisit(visit);
    setAmount('');
    setStatusMessage(null);
    setErrorMessage('');
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!selectedVisit) {
      setErrorMessage('Pilih tagihan pasien terlebih dahulu.');
      return;
    }

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMessage('Nominal tagihan harus lebih dari 0.');
      return;
    }

    // Validate amount is not excessive (preventing accidental large inputs)
    if (numericAmount > 100000000) {
      setErrorMessage('Nominal tagihan terlalu besar. Mohon periksa kembali.');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/transactions', {
        visit_id: selectedVisit.id,
        amount: numericAmount,
        status: 'paid'
      });
      setAmount('');
      setSelectedVisit(null);
      setStatusMessage({
        type: 'success',
        title: 'Pembayaran Berhasil',
        detail: `${selectedVisit.patients?.name || 'Pasien'} sudah lunas.`
      });
      setErrorMessage('');
      fetchVisits();
      fetchTransactions();
    } catch (err) {
      setStatusMessage(null);
      setErrorMessage(err.response?.data?.error || err.message || 'Terjadi kesalahan saat memproses pembayaran.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintInvoice = () => {
    if (!selectedVisit) return;
    
    window.print();
  };

  const handleQuickAmount = (value) => {
    // Ensure the input is a valid number before setting
    if (typeof value === 'number' && !isNaN(value)) {
      setAmount(value.toString());
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle shortcuts when billing form is in focus or any input is focused
      const activeElement = document.activeElement;
      const isInputFocused = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';
      
      // Ctrl/Cmd + Enter untuk submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && isInputFocused) {
        e.preventDefault();
        const form = document.getElementById('billing-form');
        if (form && selectedVisit && !loading) form.requestSubmit();
      }
      // Escape untuk reset
      if (e.key === 'Escape') {
        setSelectedVisit(null);
        setAmount('');
        setErrorMessage('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedVisit, amount, loading]);

  return (
    <div className="space-y-6">
      {/* Header dengan Dashboard Stats */}
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
                  placeholder="Cari pasien, ID, atau dokter..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={visitSearchQuery}
                  onChange={e => setVisitSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {filteredPendingVisits.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                  <CheckCircle2 size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">
                    {visitSearchQuery ? 'Tidak ada tagihan yang cocok.' : 'Tidak ada tagihan pending.'}
                  </p>
                </div>
              ) : (
                filteredPendingVisits.map(v => (
                  <div 
                    key={v.id} 
                    onClick={() => handleSelectVisit(v)}
                    className={`p-3 border-b border-slate-50 cursor-pointer transition-all duration-200 ${
                      selectedVisit?.id === v.id 
                        ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">
                          {v.patients?.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500">
                            {new Date(v.created_at).toLocaleDateString('id-ID')}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500">{v.doctor}</span>
                        </div>
                      </div>
                      {selectedVisit?.id === v.id && (
                        <CheckCircle2 size={16} className="text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Form Pembayaran - Enhanced untuk Desktop */}
        <div className="lg:col-span-2">
          {statusMessage && (
            <div className={`rounded-lg border px-4 py-3 flex items-start gap-3 mb-6 ${
              statusMessage.type === 'success' 
                ? 'border-green-200 bg-green-50 text-green-800' 
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}>
              <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">{statusMessage.title}</p>
                <p className="text-sm">{statusMessage.detail}</p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 flex items-start gap-3 mb-6">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Terjadi Kesalahan</p>
                <p className="text-sm">{errorMessage}</p>
              </div>
            </div>
          )}

          {selectedVisit ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              {/* Patient Info Card */}
              <div className="border-b border-slate-200 p-6 bg-gradient-to-r from-slate-50 to-blue-50">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500 text-white p-3 rounded-lg">
                    <User size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {selectedVisit.patients?.name}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-white rounded-lg p-3 border border-slate-100">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                          <FileText size={12} />
                          No. Registrasi
                        </div>
                        <p className="font-semibold text-sm text-slate-900">
                          {selectedVisit?.id ? String(selectedVisit.id).slice(0, 8).toUpperCase() : '-'}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-slate-100">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                          <Stethoscope size={12} />
                          Poli
                        </div>
                        <p className="font-semibold text-sm text-slate-900">{selectedVisit.doctor}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-slate-100">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                          <Calendar size={12} />
                          Tanggal
                        </div>
                        <p className="font-semibold text-sm text-slate-900">
                          {new Date(selectedVisit.created_at).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Form */}
              <form id="billing-form" onSubmit={handlePayment} className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Input Section */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Total Tagihan
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rp</span>
                        <input
                          required
                          type="number"
                          min="0"
                          step="1"
                          className="w-full pl-12 pr-4 py-4 text-2xl font-bold border-2 border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                          placeholder="0"
                          value={amount}
                          onChange={e => setAmount(e.target.value)}
                        />
                      </div>
                      {/* Quick Amount Buttons */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[50000, 100000, 150000, 200000, 250000].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleQuickAmount(val)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                            disabled={loading}
                          >
                            {formatCurrency(val).replace(/Rp\s*/g, '')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Preview Amount */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-700 font-medium">Preview Tagihan:</span>
                        <span className="text-xl font-bold text-blue-700">
                          {formatCurrency(Number(amount) || 0)}
                        </span>
                      </div>
                      {amount && Number(amount) > 0 && (
                        <div className="mt-2 text-xs text-blue-600">
                          Terbilang: {toWords(Number(amount) || 0)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Section */}
                  <div className="space-y-4">
                    {/* Instructions */}
                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                      <div className="flex items-start gap-2">
                        <DollarSign size={16} className="text-amber-600 mt-0.5" />
                        <div className="text-xs text-amber-700">
                          <p className="font-semibold mb-1">Tips:</p>
                          <ul className="space-y-1">
                            <li>• Gunakan tombol quick amount untuk input cepat</li>
                            <li>• Tekan <kbd className="px-1 py-0.5 bg-white rounded text-xs">Ctrl+Enter</kbd> untuk submit</li>
                            <li>• Tekan <kbd className="px-1 py-0.5 bg-white rounded text-xs">Esc</kbd> untuk reset</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={handlePrintInvoice}
                        className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Printer size={18} />
                        Cetak Invoice
                      </button>
                      
                      <button
                        disabled={loading}
                        type="submit"
                        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <CreditCard size={18} />
                        {loading ? 'Memproses Pembayaran...' : 'Proses Pembayaran'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Belum Ada Tagihan Dipilih
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                Pilih tagihan pasien dari daftar untuk memulai proses pembayaran
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
                <Search size={16} />
                Pilih dari {pendingVisits.length} tagihan tersedia
              </div>
            </div>
          )}

          {/* Transaction History */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 mt-6">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <History size={16} />
                Riwayat Pembayaran
              </h3>
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari riwayat..."
                  className="w-40 pl-7 pr-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  value={transactionHistoryQuery}
                  onChange={e => setTransactionHistoryQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left p-3 text-xs font-semibold text-slate-700">ID PASIEN</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-700">WAKTU TRANSAKSI</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-700">PASIEN</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-700">NOMINAL</th>
                    <th className="text-left p-3 text-xs font-semibold text-slate-700">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-slate-400 text-sm">
                        {transactionHistoryQuery ? 'Tidak ada transaksi yang cocok.' : 'Belum ada transaksi.'}
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map(tx => (
                      <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="p-3 text-xs font-mono text-slate-500">
                          #{String(tx.visits?.patient_id).padStart(3, '0')}
                        </td>
                        <td className="p-3 text-xs text-slate-500">
                          {tx.created_at ? new Date(tx.created_at).toLocaleString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          }) : '-'}
                        </td>
                        <td className="p-3">
                          <p className="text-sm font-medium text-slate-900">
                            {tx.visits?.patients?.name || '-'}
                          </p>
                        </td>
                        <td className="p-3">
                          <p className="text-sm font-semibold text-slate-900">
                            {formatCurrency(tx.amount)}
                          </p>
                        </td>
                        <td className="p-3">
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Print Invoice - Hidden by default */}
      {selectedVisit && (
        <div className="print:block hidden">
          <div className="p-8">
            <div className="mb-8 border-b-2 border-slate-300 pb-4">
              <h1 className="text-2xl font-bold text-slate-900">RUMAH SAKIT KELUARGA KITA</h1>
              <p className="text-slate-600">Invoice Pembayaran</p>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between">
                <span className="text-slate-600">No. Invoice:</span>
                <span className="font-semibold">{selectedVisit?.id ? String(selectedVisit.id).slice(0, 8).toUpperCase() : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tanggal:</span>
                <span className="font-semibold">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Pasien:</span>
                <span className="font-semibold">{selectedVisit?.patients?.name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Dokter:</span>
                <span className="font-semibold">{selectedVisit?.doctor || '-'}</span>
              </div>
            </div>

          <div className="border-t-2 border-b-2 border-slate-300 py-4 mb-8">
            <div className="flex justify-between text-xl">
              <span className="font-bold">Total Tagihan:</span>
              <span className="font-bold">{formatCurrency(amount) || 'Rp0'}</span>
            </div>
          </div>

          <div className="text-left space-y-8">
            <div>
              <p className="font-semibold mb-2">Pembayar:</p>
              <div className="border-b border-slate-300 pb-2"></div>
            </div>
            <div>
              <p className="font-semibold mb-2">Kasir:</p>
              <div className="border-b border-slate-300 pb-2"></div>
            </div>
          </div>

          <div className="mt-12 text-center text-sm text-slate-600">
            <p>Terima kasih atas kepercayaan Anda</p>
            <p>RS Keluarga Kita</p>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
