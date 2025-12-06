import { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { BarChart3, PieChart, Users, DollarSign, Activity, Calendar } from 'lucide-react';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(value));
};

export default function Reports() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalRevenue: 0,
    totalVisits: 0,
    visitsToday: 0,
    revenueToday: 0
  });
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [patientsRes, visitsRes, transactionsRes] = await Promise.all([
        api.get('/patients'),
        api.get('/visits'),
        api.get('/transactions')
      ]);

      const patients = patientsRes.data;
      const visitsData = visitsRes.data;
      const transactions = transactionsRes.data;

      // Calculate Stats
      const today = new Date().toDateString();
      
      const totalRevenue = transactions
        .filter(t => t.status === 'paid')
        .reduce((sum, t) => sum + Number(t.total_amount || t.amount || 0), 0);

      const revenueToday = transactions
        .filter(t => t.status === 'paid' && new Date(t.created_at).toDateString() === today)
        .reduce((sum, t) => sum + Number(t.total_amount || t.amount || 0), 0);

      const visitsTodayCount = visitsData.filter(v => new Date(v.created_at).toDateString() === today).length;

      setStats({
        totalPatients: patients.length,
        totalRevenue,
        totalVisits: visitsData.length,
        visitsToday: visitsTodayCount,
        revenueToday
      });
      
      setVisits(visitsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate Visits per Polyclinic (more reliable than doctor name if doctor object is missing)
  const visitsByPoli = useMemo(() => {
    const counts = {};
    visits.forEach(v => {
      // Try to get poli name from relation, or fallback
      const poliName = v.polyclinics?.name || 'Umum'; 
      counts[poliName] = (counts[poliName] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .slice(0, 5); // Top 5
  }, [visits]);

  // Calculate Visit Status Distribution
  const visitsByStatus = useMemo(() => {
    // Current flow: registered -> in_consultation -> pharmacy_queue -> pharmacy_processed -> payment_pending -> paid -> completed
    const counts = { 
        registered: 0, 
        consultation: 0, 
        pharmacy: 0,
        billing: 0,
        completed: 0
    };

    visits.forEach(v => {
      const s = v.status;
      
      if (s === 'registered') counts.registered++;
      else if (s === 'in_consultation') counts.consultation++;
      else if (s === 'pharmacy_queue' || s === 'pharmacy_processed' || s === 'pharmacy') counts.pharmacy++;
      else if (s === 'payment_pending' || s === 'billing') counts.billing++;
      else if (s === 'paid' || s === 'completed') counts.completed++;
      else counts.registered++; // Fallback
    });
    return counts;
  }, [visits]);

  if (loading) {
    return <div className="text-center py-10 text-slate-500">Memuat data laporan...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-heading font-bold text-slate-900">Laporan Manajemen</h2>
        <p className="text-slate-500">Ringkasan kinerja rumah sakit berdasarkan data real-time</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Pasien</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalPatients}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Pendapatan</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-xs text-green-600">+{formatCurrency(stats.revenueToday)} hari ini</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Kunjungan</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalVisits}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Kunjungan Hari Ini</p>
              <p className="text-2xl font-bold text-slate-900">{stats.visitsToday}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Poli Chart (Simple Bar) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
            <BarChart3 size={20} />
            Kunjungan per Poli (Top 5)
          </h3>
          <div className="space-y-4">
            {visitsByPoli.length === 0 ? (
              <p className="text-center text-slate-400 py-10">Belum ada data kunjungan.</p>
            ) : (
              visitsByPoli.map(([poli, count], index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{poli}</span>
                    <span className="text-slate-500">{count} pasien</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${(count / stats.totalVisits) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Visit Status Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
            <PieChart size={20} />
            Status Kunjungan Hari Ini (Estimasi)
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg flex justify-between items-center">
                <span className="text-slate-700 font-medium">Belum Diperiksa (Daftar/Tunggu)</span>
                <span className="bg-slate-200 text-slate-800 px-3 py-1 rounded-full text-sm font-bold">
                {visitsByStatus.registered}
                </span>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg flex justify-between items-center">
              <span className="text-blue-700 font-medium">Sedang/Selesai Konsultasi</span>
              <span className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                {visitsByStatus.consultation}
              </span>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg flex justify-between items-center">
              <span className="text-purple-700 font-medium">Farmasi / Obat</span>
              <span className="bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-sm font-bold">
                {visitsByStatus.pharmacy}
              </span>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg flex justify-between items-center">
              <span className="text-amber-700 font-medium">Kasir / Billing</span>
              <span className="bg-amber-200 text-amber-800 px-3 py-1 rounded-full text-sm font-bold">
                {visitsByStatus.billing}
              </span>
            </div>
            <div className="p-4 bg-green-50 rounded-lg flex justify-between items-center">
              <span className="text-green-700 font-medium">Selesai (Pulang)</span>
              <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                {visitsByStatus.completed}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
