import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HeartPulse, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  DollarSign, 
  Percent, 
  HelpCircle,
  FileCheck2,
  CalendarDays,
  ShieldCheck,
  AlertTriangle,
  TrendingDown,
  Printer
} from 'lucide-react';
import { Transaction, DailyCashSession, AppSettings } from '../types';
import { formatRupiah, getTodayDateString, getFormattedDate } from '../utils/helpers';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface BusinessHealthSummaryProps {
  selectedDate: string;
  sessions: Record<string, DailyCashSession>;
  transactions: Transaction[];
  onUpdateSession: (date: string, updates: Partial<DailyCashSession>) => void;
  settings?: AppSettings;
}

export default function BusinessHealthSummary({
  selectedDate,
  sessions,
  transactions,
  onUpdateSession,
  settings,
}: BusinessHealthSummaryProps) {
  // Summary range: 'day' | 'week' | 'all'
  const [range, setRange] = useState<'day' | 'week' | 'all'>('day');

  // Input state for physical cash ending
  const activeSession = sessions[selectedDate];
  const [closingInput, setClosingInput] = useState(
    activeSession?.closingPhysicalCash !== undefined 
      ? activeSession.closingPhysicalCash.toString() 
      : ''
  );
  const [isEditingClosing, setIsEditingClosing] = useState(
    activeSession?.closingPhysicalCash === undefined
  );

  // Synchronize closingInput with session if it changes from outside
  React.useEffect(() => {
    if (activeSession?.closingPhysicalCash !== undefined) {
      setClosingInput(activeSession.closingPhysicalCash.toString());
      setIsEditingClosing(false);
    } else {
      setClosingInput('');
      setIsEditingClosing(true);
    }
  }, [activeSession, selectedDate]);

  // Determine list of dates included in the filter
  const dateList = useMemo(() => {
    if (range === 'day') {
      return [selectedDate];
    }
    
    const dates = [];
    const today = new Date(selectedDate);
    
    if (range === 'week') {
      // Last 7 days
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
      }
    } else {
      // All dates in transactions + sessions
      const allDates = new Set<string>();
      transactions.forEach(tx => allDates.add(tx.date));
      Object.keys(sessions).forEach(d => allDates.add(d));
      return Array.from(allDates);
    }
    return dates;
  }, [range, selectedDate, transactions, sessions]);

  // Filtered transactions for the selected range, sorted by date descending
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(tx => dateList.includes(tx.date))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, dateList]);

  // Aggregate stats based on date list
  const aggregatedStats = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter(tx => tx.type === 'masuk')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalExpense = filteredTransactions
      .filter(tx => tx.type === 'keluar')
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Calculate Gross profit = Income with HPP - HPP of those transactions
    // For transactions without HPP, let's treat HPP as the product cost. If not set, we assume 100% margin (HPP = 0)
    // Let's sum HPP for all income transactions
    const incomeTransactions = filteredTransactions.filter(tx => tx.type === 'masuk');
    const totalHpp = incomeTransactions.reduce((sum, tx) => sum + (tx.hpp ?? 0), 0);
    const grossProfit = totalIncome - totalHpp;

    // Count transaction categories
    const routineCount = filteredTransactions.filter(tx => tx.category === 'rutin').length;
    const incidentalCount = filteredTransactions.filter(tx => tx.category === 'insidental').length;

    // 2. Cash sessions aggregation
    let totalOpeningPhysical = 0;
    let totalClosingPhysical = 0;
    let hasClosingData = false;

    // Let's only use sessions that exist in sessions record
    dateList.forEach(d => {
      const sess = sessions[d];
      if (sess) {
        totalOpeningPhysical += sess.openingPhysicalCash;
        if (sess.closingPhysicalCash !== undefined) {
          totalClosingPhysical += sess.closingPhysicalCash;
          hasClosingData = true;
        }
      }
    });

    const bookEndingBalance = totalOpeningPhysical + totalIncome - totalExpense;

    return {
      totalIncome,
      totalExpense,
      totalHpp,
      grossProfit,
      routineCount,
      incidentalCount,
      bookEndingBalance,
      totalOpeningPhysical,
      totalClosingPhysical,
      hasClosingData
    };
  }, [filteredTransactions, dateList, sessions]);

  // Handle closing physical cash save
  const handleSaveClosing = (e: React.FormEvent) => {
    e.preventDefault();
    const val = closingInput.trim() === '' ? undefined : Math.max(0, parseInt(closingInput) || 0);
    onUpdateSession(selectedDate, {
      closingPhysicalCash: val
    });
    setIsEditingClosing(false);
  };

  // Specific day cash evaluation (Evaluasi Arus Kas)
  // Sisa Saldo Buku Hari Ini = Saldo Awal Fisik + Total Masuk Hari ini - Total Keluar Hari ini
  const dailyTransactions = useMemo(() => {
    return transactions.filter(tx => tx.date === selectedDate);
  }, [transactions, selectedDate]);

  const dailyIncome = dailyTransactions
    .filter(tx => tx.type === 'masuk')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const dailyExpense = dailyTransactions
    .filter(tx => tx.type === 'keluar')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const dailyOpeningPhysical = activeSession?.openingPhysicalCash ?? 150000;
  const dailyBookBalance = dailyOpeningPhysical + dailyIncome - dailyExpense;

  const dailyClosingPhysical = activeSession?.closingPhysicalCash;
  const dailyDiscrepancy = dailyClosingPhysical !== undefined ? dailyClosingPhysical - dailyBookBalance : null;

  // Helper to format short Rupiah values for chart Y-axis (e.g. 1.2jt, 150rb)
  const formatShortRupiah = (val: number): string => {
    if (val === 0) return 'Rp0';
    if (val >= 1000000) {
      return `Rp ${(val / 1000000).toFixed(1).replace(/\.0$/, '')}jt`;
    }
    if (val >= 1000) {
      return `Rp ${(val / 1000).toFixed(0)}rb`;
    }
    return `Rp ${val}`;
  };

  // Calculate 7-day trend of income (pemasukan) and expenses (pengeluaran) ending on selectedDate
  const last7DaysChartData = useMemo(() => {
    const dataPoints = [];
    const today = new Date(selectedDate);
    
    // Iterate backwards from 6 days ago to today
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const dayTx = transactions.filter(tx => tx.date === dateStr);
      const income = dayTx
        .filter(tx => tx.type === 'masuk')
        .reduce((sum, tx) => sum + tx.amount, 0);
        
      const expense = dayTx
        .filter(tx => tx.type === 'keluar')
        .reduce((sum, tx) => sum + tx.amount, 0);
        
      const dayLabel = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      
      dataPoints.push({
        dateStr,
        name: dayLabel,
        pemasukan: income,
        pengeluaran: expense,
      });
    }
    return dataPoints;
  }, [selectedDate, transactions]);

  return (
    <div className="space-y-4" id="summary-container">
      
      {/* Range Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-md">
        <div>
          <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-slate-600" /> Jangka Waktu Ringkasan
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Analisis kesehatan finansial berdasarkan rentang waktu</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-white border border-slate-200 p-0.5 rounded shadow-2xs">
            <button
              onClick={() => setRange('day')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded transition-all cursor-pointer ${
                range === 'day' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Harian ({getFormattedDate(selectedDate)})
            </button>
            <button
              onClick={() => setRange('week')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded transition-all cursor-pointer ${
                range === 'week' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Mingguan (7 Hari)
            </button>
            <button
              onClick={() => setRange('all')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded transition-all cursor-pointer ${
                range === 'all' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua Waktu
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold py-1.5 px-3 rounded shadow-2xs transition-all cursor-pointer"
            title="Cetak Laporan Keuangan ke PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Primary Financial Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        
        {/* Card: Total Pemasukan */}
        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Omset Kotor</span>
            <h4 className="text-xl font-mono font-bold text-slate-800 tracking-tight mt-1">
              {formatRupiah(aggregatedStats.totalIncome)}
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-tight">
              Seluruh dana masuk yang tercatat dari {range === 'day' ? 'hari ini' : range === 'week' ? '7 hari terakhir' : 'seluruh waktu'}.
            </p>
          </div>
          <div className="border-t border-slate-100 mt-3 pt-2.5 flex justify-between text-[11px] text-slate-500">
            <span>Transaksi Masuk</span>
            <span className="font-semibold text-slate-700">
              {transactions.filter(tx => dateList.includes(tx.date) && tx.type === 'masuk').length} Kali
            </span>
          </div>
        </div>

        {/* Card: Total HPP */}
        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Total HPP / Kulakan</span>
            <h4 className="text-xl font-mono font-bold text-slate-700 tracking-tight mt-1">
              {formatRupiah(aggregatedStats.totalHpp)}
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-tight">
              Nilai modal pembelian produk (kulakan) dari transaksi masuk.
            </p>
          </div>
          <div className="border-t border-slate-100 mt-3 pt-2.5 flex justify-between text-[11px] text-slate-500">
            <span>Rasio HPP</span>
            <span className="font-semibold text-slate-700 font-mono">
              {aggregatedStats.totalIncome > 0 
                ? `${Math.round((aggregatedStats.totalHpp / aggregatedStats.totalIncome) * 100)}%` 
                : '0%'}
            </span>
          </div>
        </div>

        {/* Card: Laba Kotor */}
        <div className="bg-slate-50 border border-slate-300 rounded-md p-3.5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider font-bold">Total Laba Kotor</span>
              <span className="px-1.5 py-0.2 bg-slate-200 text-slate-800 rounded text-[9px] font-bold flex items-center gap-0.5">
                <Percent className="w-2.5 h-2.5" /> Margin
              </span>
            </div>
            <h4 className="text-xl font-mono font-bold text-slate-900 tracking-tight mt-1">
              {formatRupiah(aggregatedStats.grossProfit)}
            </h4>
            <p className="text-[11px] text-slate-600 mt-1 leading-tight">
              Selisih Penjualan dikurangi modal HPP. Indikator laba awal sebelum dikurangi biaya operasional keluar.
            </p>
          </div>
          <div className="border-t border-slate-200 mt-3 pt-2.5 flex justify-between text-[11px] text-slate-800 font-medium">
            <span>Persentase Keuntungan</span>
            <span className="font-bold text-slate-950 font-mono">
              {aggregatedStats.totalIncome > 0 
                ? `${Math.round((aggregatedStats.grossProfit / aggregatedStats.totalIncome) * 100)}%` 
                : '0%'}
            </span>
          </div>
        </div>

      </div>

      {/* 7-Day Trend Chart Section */}
      <div className="bg-white border border-slate-200 rounded-md p-4 shadow-2xs" id="trend-chart-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> Tren Keuangan 7 Hari Terakhir
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Perbandingan grafik pemasukan dan pengeluaran harian hingga {getFormattedDate(selectedDate)}
            </p>
          </div>
          
          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
              Pemasukan
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block"></span>
              Pengeluaran
            </div>
          </div>
        </div>

        <div className="h-60 w-full" id="trend-chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={last7DaysChartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#94a3b8" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                dy={8}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                tickFormatter={formatShortRupiah}
                dx={-4}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-slate-200 p-2.5 rounded shadow-xs text-[10px] font-sans space-y-1">
                        <p className="font-bold text-slate-800">{label}</p>
                        {payload.map((pld: any) => (
                          <p key={pld.name} className="font-semibold flex items-center gap-1.5" style={{ color: pld.color }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pld.color }} />
                            {pld.name === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}: {formatRupiah(pld.value)}
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="pemasukan" 
                stroke="#10b981" 
                strokeWidth={2.5}
                dot={{ stroke: '#10b981', strokeWidth: 1, r: 3, fill: '#ffffff' }}
                activeDot={{ r: 5, strokeWidth: 0, fill: '#10b981' }}
                name="pemasukan"
              />
              <Line 
                type="monotone" 
                dataKey="pengeluaran" 
                stroke="#f43f5e" 
                strokeWidth={2.5}
                dot={{ stroke: '#f43f5e', strokeWidth: 1, r: 3, fill: '#ffffff' }}
                activeDot={{ r: 5, strokeWidth: 0, fill: '#f43f5e' }}
                name="pengeluaran"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Dashboard: Cash Flow Evaluation & Physical Cash Matching */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" id="physical-cash-matching">
        
        {/* Left: Input Uang Fisik Akhir (Closing Day Entry) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1 bg-slate-100 text-slate-700 rounded">
              <HeartPulse className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-slate-800">Uang Fisik Kasir Hari Ini</h3>
          </div>

          <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
            Untuk melakukan <strong>Evaluasi Arus Kas</strong>, hitung seluruh uang fisik di laci kasir (diluar uang kembalian) saat penutupan hari, lalu catat di sini:
          </p>

          {isEditingClosing ? (
            <form onSubmit={handleSaveClosing} className="space-y-3">
              <div>
                <label className="block text-[9px] font-mono tracking-wider text-slate-400 uppercase font-bold mb-1">
                  Uang Fisik Kasir (Penutupan)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs font-bold">Rp</span>
                  <input
                    type="number"
                    placeholder="Hitung uang riil laci"
                    value={closingInput}
                    onChange={(e) => setClosingInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded py-1.5 pl-7 pr-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold py-1.5 rounded transition-colors cursor-pointer"
              >
                Simpan & Evaluasi
              </button>
            </form>
          ) : (
            <div className="space-y-3 bg-slate-50 p-3 rounded border border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-600 font-medium">Uang Fisik Tercatat</span>
                <span className="font-mono text-sm font-bold text-slate-900">
                  {formatRupiah(parseInt(closingInput) || 0)}
                </span>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setIsEditingClosing(true)}
                  className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10px] font-bold py-1 rounded transition-colors cursor-pointer"
                >
                  Ubah Nominal
                </button>
                <button
                  onClick={() => {
                    onUpdateSession(selectedDate, { closingPhysicalCash: undefined });
                    setClosingInput('');
                    setIsEditingClosing(true);
                  }}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold px-2.5 py-1 rounded transition-colors cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Evaluasi Arus Kas Diagnostics */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2.5">
              <FileCheck2 className="w-3.5 h-3.5 text-slate-700" /> Hasil Evaluasi Arus Kas ({getFormattedDate(selectedDate)})
            </h3>

            <div className="grid grid-cols-2 gap-3 py-2 border-t border-b border-slate-100 text-[11px] mb-3">
              <div>
                <div className="text-slate-400 font-mono text-[9px] uppercase tracking-wider font-semibold">Catatan di Buku (Sistem)</div>
                <div className="font-mono text-xs font-bold text-slate-700 mt-0.5">{formatRupiah(dailyBookBalance)}</div>
                <div className="text-[9px] text-slate-400 mt-0.5">Saldo Awal + Masuk - Keluar</div>
              </div>
              <div>
                <div className="text-slate-400 font-mono text-[9px] uppercase tracking-wider font-semibold">Fisik di Kasir (Riil)</div>
                <div className="font-mono text-xs font-bold text-slate-700 mt-0.5">
                  {dailyClosingPhysical !== undefined ? formatRupiah(dailyClosingPhysical) : 'Belum diisi'}
                </div>
                <div className="text-[9px] text-slate-400 mt-0.5">Jumlah riil di laci kasir</div>
              </div>
            </div>

            {/* Diagnostics Message based on Discrepancy */}
            {dailyDiscrepancy === null ? (
              <div className="bg-slate-50 border border-slate-200 text-slate-600 rounded p-3 flex items-start gap-2 text-[11px]">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-700">Menunggu Input Fisik</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Silakan isi jumlah fisik uang kasir di sebelah kiri untuk melihat evaluasi kecocokan pencatatan buku dan laci kasir Anda.
                  </p>
                </div>
              </div>
            ) : dailyDiscrepancy === 0 ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded p-3 flex items-start gap-2 text-[11px]">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-emerald-950 flex items-center gap-1.5 flex-wrap">
                    Kas Sesuai & Seimbang! <span className="font-mono text-emerald-600 font-bold">(Selisih: Rp0)</span>
                  </p>
                  <p className="text-[10px] text-emerald-800/95 mt-1 leading-relaxed">
                    Sangat luar biasa! Uang fisik di kasir pas cocok dengan seluruh catatan transaksi di buku harian. Ini membuktikan kedisiplinan dan akurasi kasir Anda berjalan sempurna tanpa ada kebocoran.
                  </p>
                </div>
              </div>
            ) : dailyDiscrepancy < 0 ? (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded p-3 flex items-start gap-2 text-[11px]">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-950 flex items-center gap-1.5 flex-wrap">
                    Kekurangan Uang Fisik! <span className="font-mono text-rose-600 font-bold">(Selisih: {formatRupiah(dailyDiscrepancy)})</span>
                  </p>
                  <p className="text-[10px] text-rose-800/95 mt-1 leading-relaxed">
                    Uang fisik di kasir <strong>kurang</strong> dari yang seharusnya tercatat di buku. Ini indikasi potensi kebocoran arus kas:
                  </p>
                  <ul className="list-disc list-inside text-[9.5px] mt-1 space-y-0.5 text-rose-950/85 font-semibold">
                    <li>Ada pemasukan yang belum dicatat di sistem.</li>
                    <li>Ada pengeluaran kembalian yang keliru / berlebih.</li>
                    <li>Ada transaksi keluar yang lupa ditulis.</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded p-3 flex items-start gap-2 text-[11px]">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-950 flex items-center gap-1.5 flex-wrap">
                    Kelebihan Uang Fisik! <span className="font-mono text-amber-600 font-bold">(Selisih: +{formatRupiah(dailyDiscrepancy)})</span>
                  </p>
                  <p className="text-[10px] text-amber-800/95 mt-1 leading-relaxed">
                    Uang fisik di kasir <strong>lebih banyak</strong> dibanding catatan buku. Hal ini biasanya terjadi jika:
                  </p>
                  <ul className="list-disc list-inside text-[9.5px] mt-1 space-y-0.5 text-amber-800/85 font-semibold">
                    <li>Anda menerima pemasukan yang belum sempat dimasukkan ke jurnal.</li>
                    <li>Seseorang meletakkan uang pribadi atau uang kembalian di laci kasir.</li>
                    <li>Lupa memberikan kembalian yang pas ke pembeli.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-2.5 mt-3 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Evaluasi harian secara konsisten mencegah kebocoran bisnis rata-rata hingga 15% per tahun.
          </div>
        </div>

      </div>

      {/* ================= PRINT-ONLY REPORT TEMPLATE ================= */}
      <div className="hidden print-only mt-6 font-sans text-slate-900 leading-normal" id="print-section">
        {/* Print Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 uppercase">SIKU — Sistem Informasi Keuangan Usaha</h1>
            <p className="text-xs text-slate-600 mt-1">Laporan Ringkasan Kesehatan & Arus Kas Bisnis</p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Dicetak pada: {new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-slate-950">{settings?.shopName || 'Nama Toko / UMKM'}</h2>
            <p className="text-xs text-slate-700 mt-0.5">{settings?.shopAddress || 'Alamat Toko Belum Ditentukan'}</p>
            <p className="text-xs text-slate-700">{settings?.shopContact || 'Kontak Belum Ditentukan'}</p>
          </div>
        </div>

        {/* Report Meta Info */}
        <div className="mb-6 bg-slate-100 p-3 rounded border border-slate-300">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold">Jangka Waktu Laporan</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {range === 'day' 
                  ? `Harian (${getFormattedDate(selectedDate)})` 
                  : range === 'week' 
                    ? 'Mingguan (7 Hari Terakhir)' 
                    : 'Semua Waktu'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold">Status Evaluasi Kasir</p>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {dailyDiscrepancy === null 
                  ? 'Belum Dievaluasi (Uang Fisik Kasir Belum Diisi)' 
                  : dailyDiscrepancy === 0 
                    ? 'PAS / SEIMBANG' 
                    : dailyDiscrepancy < 0 
                      ? `SELISIH KURANG (${formatRupiah(dailyDiscrepancy)})` 
                      : `SELISIH LEBIH (+${formatRupiah(dailyDiscrepancy)})`}
              </p>
            </div>
          </div>
        </div>

        {/* Section: Ringkasan Finansial Utama */}
        <div className="mb-6">
          <h3 className="text-xs uppercase font-bold tracking-wider text-slate-950 border-b border-slate-900 pb-1.5 mb-3">1. RINGKASAN KEUANGAN UTAMA</h3>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="p-2 border border-slate-900">Metrik Finansial</th>
                <th className="p-2 border border-slate-900 text-right">Nilai Rupiah</th>
                <th className="p-2 border border-slate-900">Penjelasan / Rasio</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border border-slate-900 font-semibold">Total Pemasukan (Omset Kotor)</td>
                <td className="p-2 border border-slate-900 text-right font-mono font-bold text-emerald-800">{formatRupiah(aggregatedStats.totalIncome)}</td>
                <td className="p-2 border border-slate-900">Dana masuk dari total {filteredTransactions.filter(tx => tx.type === 'masuk').length} transaksi penjualan/pendapatan.</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-900 font-semibold">Total HPP / Modal Kulakan</td>
                <td className="p-2 border border-slate-900 text-right font-mono text-slate-700">{formatRupiah(aggregatedStats.totalHpp)}</td>
                <td className="p-2 border border-slate-900">Rasio HPP terhadap omset: <span className="font-bold">{aggregatedStats.totalIncome > 0 ? Math.round((aggregatedStats.totalHpp / aggregatedStats.totalIncome) * 100) : 0}%</span></td>
              </tr>
              <tr className="bg-slate-50">
                <td className="p-2 border border-slate-900 font-bold">Laba Kotor (Gross Profit)</td>
                <td className="p-2 border border-slate-900 text-right font-mono font-bold text-slate-900">{formatRupiah(aggregatedStats.grossProfit)}</td>
                <td className="p-2 border border-slate-900">Margin laba kotor terhadap omset: <span className="font-bold">{aggregatedStats.totalIncome > 0 ? Math.round((aggregatedStats.grossProfit / aggregatedStats.totalIncome) * 100) : 0}%</span></td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-900 font-semibold">Total Pengeluaran (Biaya Operasional)</td>
                <td className="p-2 border border-slate-900 text-right font-mono text-rose-800">{formatRupiah(aggregatedStats.totalExpense)}</td>
                <td className="p-2 border border-slate-900">Dana keluar dari total {filteredTransactions.filter(tx => tx.type === 'keluar').length} pengeluaran/belanja.</td>
              </tr>
              <tr className="bg-slate-100 font-bold text-sm">
                <td className="p-2 border border-slate-900">Arus Kas Bersih (Sisa Saldo Buku)</td>
                <td className="p-2 border border-slate-900 text-right font-mono">{formatRupiah(aggregatedStats.bookEndingBalance)}</td>
                <td className="p-2 border border-slate-900">Saldo Akhir Buku = Saldo Awal Fisik + Total Masuk - Total Keluar</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section: Evaluasi Kasir Fisik */}
        <div className="mb-6">
          <h3 className="text-xs uppercase font-bold tracking-wider text-slate-950 border-b border-slate-900 pb-1.5 mb-3">2. EVALUASI DAN ANALISIS KECOCOKAN KAS</h3>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="p-2 border border-slate-900">Indikator</th>
                <th className="p-2 border border-slate-900 text-right font-mono">Nilai (IDR)</th>
                <th className="p-2 border border-slate-900">Status / Catatan Diagnostik</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border border-slate-900">Saldo Awal Fisik Hari Ini</td>
                <td className="p-2 border border-slate-900 text-right font-mono">{formatRupiah(dailyOpeningPhysical)}</td>
                <td className="p-2 border border-slate-900 text-slate-500">Saldo kas yang dipegang di awal hari kerja</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-900">Sisa Saldo Kas Seharusnya (Catatan Buku)</td>
                <td className="p-2 border border-slate-900 text-right font-mono font-bold">{formatRupiah(dailyBookBalance)}</td>
                <td className="p-2 border border-slate-900 text-slate-500">Hasil perhitungan otomatis sistem (Awal + Masuk - Keluar)</td>
              </tr>
              <tr>
                <td className="p-2 border border-slate-900">Jumlah Uang Fisik Aktual di Laci Kasir</td>
                <td className="p-2 border border-slate-900 text-right font-mono font-bold">
                  {dailyClosingPhysical !== undefined ? formatRupiah(dailyClosingPhysical) : 'Belum diisi'}
                </td>
                <td className="p-2 border border-slate-900 text-slate-500">Jumlah riil yang dihitung kasir secara manual</td>
              </tr>
              <tr className={`font-bold ${dailyDiscrepancy === 0 ? 'bg-emerald-50 text-emerald-950' : dailyDiscrepancy !== null && dailyDiscrepancy < 0 ? 'bg-rose-50 text-rose-950' : 'bg-amber-50 text-amber-950'}`}>
                <td className="p-2 border border-slate-900">Selisih Kas / Discrepancy</td>
                <td className="p-2 border border-slate-900 text-right font-mono">
                  {dailyDiscrepancy !== null ? (dailyDiscrepancy >= 0 ? '+' : '') + formatRupiah(dailyDiscrepancy) : 'Belum dihitung'}
                </td>
                <td className="p-2 border border-slate-900">
                  {dailyDiscrepancy === null 
                    ? 'Uang fisik belum dimasukkan, analisis tidak dapat dilakukan.' 
                    : dailyDiscrepancy === 0 
                      ? 'PAS & SEIMBANG! Tidak ada kebocoran atau kesalahan pencatatan.' 
                      : dailyDiscrepancy < 0 
                        ? 'KEKURANGAN FISIK! Ada pengeluaran yang tidak dicatat, atau kesalahan pemberian kembalian.' 
                        : 'KELEBIHAN FISIK! Ada pemasukan yang belum dicatat, atau kelebihan uang pribadi.'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section: Riwayat Transaksi Lengkap */}
        <div className="mb-6">
          <h3 className="text-xs uppercase font-bold tracking-wider text-slate-950 border-b border-slate-900 pb-1.5 mb-3">3. RIWAYAT TRANSAKSI JURNAL</h3>
          {filteredTransactions.length === 0 ? (
            <p className="text-xs text-slate-500 italic">Tidak ada transaksi yang tercatat dalam jangka waktu ini.</p>
          ) : (
            <table className="w-full text-left text-[10px]">
              <thead>
                <tr className="bg-slate-100 font-bold">
                  <th className="p-1.5 border border-slate-900 text-center w-8">No</th>
                  <th className="p-1.5 border border-slate-900 w-24">Tanggal</th>
                  <th className="p-1.5 border border-slate-900">Deskripsi</th>
                  <th className="p-1.5 border border-slate-900 w-20">Kategori</th>
                  <th className="p-1.5 border border-slate-900 w-16">Metode</th>
                  <th className="p-1.5 border border-slate-900 w-16 text-center">Tipe</th>
                  <th className="p-1.5 border border-slate-900 text-right w-28 font-mono">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx, idx) => (
                  <tr key={tx.id}>
                    <td className="p-1.5 border border-slate-900 text-center">{idx + 1}</td>
                    <td className="p-1.5 border border-slate-900">{getFormattedDate(tx.date)}</td>
                    <td className="p-1.5 border border-slate-900 font-medium">{tx.description}</td>
                    <td className="p-1.5 border border-slate-900 capitalize">{tx.category}</td>
                    <td className="p-1.5 border border-slate-900 capitalize">{tx.paymentMethod || 'Tunai'}</td>
                    <td className={`p-1.5 border border-slate-900 text-center font-bold ${tx.type === 'masuk' ? 'text-emerald-800' : 'text-rose-800'}`}>
                      {tx.type === 'masuk' ? 'MASUK' : 'KELUAR'}
                    </td>
                    <td className={`p-1.5 border border-slate-900 text-right font-mono font-semibold ${tx.type === 'masuk' ? 'text-emerald-800' : 'text-rose-800'}`}>
                      {tx.type === 'masuk' ? '+' : '-'}{formatRupiah(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Tanda Tangan */}
        <div className="mt-12 flex justify-between items-end text-xs">
          <div>
            <p className="text-slate-500">Laporan Keuangan Otomatis SIKU</p>
            <p className="text-slate-400 text-[10px] mt-0.5">Sistem Informasi Keuangan Usaha Berbasis Cloud</p>
          </div>
          <div className="text-center w-48 border-t border-dashed border-slate-400 pt-2">
            <p className="font-bold text-slate-800">{settings?.shopName || 'Pemilik Toko'}</p>
            <p className="text-[10px] text-slate-400 mt-1">Tanda Tangan & Cap Resmi</p>
          </div>
        </div>
      </div>

    </div>
  );
}
