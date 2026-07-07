import React, { useState, useEffect } from 'react';
import { useBukuKas } from '../context/BukuKasContext';
import { formatRupiah, getTodayDateString } from '../utils/defaultData';
import { Calendar, Download, RefreshCw, ChevronRight, AlertCircle, FileSpreadsheet, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
];

export const LaporanView: React.FC = () => {
  const { data, deleteTransaction, backupToSheets, restoreFromSheets, syncStatus, lastSyncTime } = useBukuKas();
  
  // Period tab: 'hari' | 'minggu' | 'bulan'
  const [activePeriod, setActivePeriod] = useState<'hari' | 'minggu' | 'bulan'>('hari');

  // Category filter state
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // Reset category filter when period changes
  useEffect(() => {
    setCategoryFilter('');
  }, [activePeriod]);

  // Deletion target state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'penjualan' | 'pengeluaran';
    id: string;
    amount: number;
    category: string;
  } | null>(null);

  // Helper to check date range
  const isWithinPeriod = (dateStr: string): boolean => {
    const today = new Date();
    const itemDate = new Date(dateStr);
    
    if (activePeriod === 'hari') {
      return dateStr === getTodayDateString();
    }
    
    if (activePeriod === 'minggu') {
      // Last 7 days
      const diffTime = Math.abs(today.getTime() - itemDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }
    
    if (activePeriod === 'bulan') {
      // Same month and year
      return (
        itemDate.getMonth() === today.getMonth() &&
        itemDate.getFullYear() === today.getFullYear()
      );
    }
    
    return false;
  };

  // Filter and process Transactions (Penjualan and Pengeluaran)
  const filteredPenjualan = data.penjualan.filter(p => isWithinPeriod(p.date));
  const filteredPengeluaran = data.pengeluaran.filter(e => isWithinPeriod(e.date));

  const totalPenjualan = filteredPenjualan.reduce((sum, p) => sum + p.amount, 0);
  const totalPengeluaran = filteredPengeluaran.reduce((sum, e) => sum + e.amount, 0);
  const profitNet = totalPenjualan - totalPengeluaran;

  // Process Category Breakdown
  const salesCategoryBreakdown = React.useMemo(() => {
    const breakdown = new Map<string, number>();
    filteredPenjualan.forEach(p => {
      breakdown.set(p.category, (breakdown.get(p.category) || 0) + p.amount);
    });
    return Array.from(breakdown.entries())
      .map(([name, val]) => ({ name, value: val }))
      .sort((a, b) => b.value - a.value);
  }, [filteredPenjualan]);

  const expenseCategoryBreakdown = React.useMemo(() => {
    const breakdown = new Map<string, number>();
    filteredPengeluaran.forEach(e => {
      breakdown.set(e.category, (breakdown.get(e.category) || 0) + e.amount);
    });
    return Array.from(breakdown.entries())
      .map(([name, val]) => ({ name, value: val }))
      .sort((a, b) => b.value - a.value);
  }, [filteredPengeluaran]);

  const monthlyExpenseCategoryBreakdown = React.useMemo(() => {
    const today = new Date();
    const currentMonthPengeluaran = data.pengeluaran.filter(e => {
      const itemDate = new Date(e.date);
      return (
        itemDate.getMonth() === today.getMonth() &&
        itemDate.getFullYear() === today.getFullYear()
      );
    });
    
    const breakdown = new Map<string, number>();
    currentMonthPengeluaran.forEach(e => {
      breakdown.set(e.category, (breakdown.get(e.category) || 0) + e.amount);
    });
    return Array.from(breakdown.entries())
      .map(([name, val]) => ({ name, value: val }))
      .sort((a, b) => b.value - a.value);
  }, [data.pengeluaran]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-2.5 border border-slate-100 dark:border-slate-700 rounded-xl shadow-lg text-xs">
          <p className="font-extrabold text-slate-700 dark:text-slate-200">{payload[0].name}</p>
          <p className="font-black text-rose-500 dark:text-rose-400 mt-0.5">
            {formatRupiah(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // All transactions within the selected period (before category filtering)
  const allTransactionsForPeriod = React.useMemo(() => {
    const list: Array<{
      id: string;
      type: 'penjualan' | 'pengeluaran';
      date: string;
      category: string;
      amount: number;
      notes: string;
    }> = [];

    filteredPenjualan.forEach(p => {
      list.push({ ...p, type: 'penjualan' });
    });
    filteredPengeluaran.forEach(e => {
      list.push({ ...e, type: 'pengeluaran' });
    });

    // Sort newest first
    return list.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }, [filteredPenjualan, filteredPengeluaran]);

  // Unique categories list from the active transactions (both sales and expenses)
  const availableCategories = React.useMemo(() => {
    const categoriesSet = new Set<string>();
    allTransactionsForPeriod.forEach(item => {
      categoriesSet.add(item.category);
    });
    return Array.from(categoriesSet).sort((a, b) => a.localeCompare(b));
  }, [allTransactionsForPeriod]);

  // Combine chronological transactions list for the selected period
  const combinedTransactions = React.useMemo(() => {
    if (!categoryFilter) {
      return allTransactionsForPeriod;
    }
    return allTransactionsForPeriod.filter(item => item.category === categoryFilter);
  }, [allTransactionsForPeriod, categoryFilter]);

  // Export CSV Data
  const handleExportCSV = () => {
    if (data.penjualan.length === 0 && data.pengeluaran.length === 0 && data.kasbon.length === 0) {
      alert('Tidak ada data transaksi untuk diekspor.');
      return;
    }

    const csvRows = [
      // CSV Headers
      ['ID Transaksi', 'Tanggal', 'Tipe Transaksi', 'Kategori / Pelanggan', 'Nominal (Rp)', 'Keterangan / Catatan / Status'].join(','),
    ];

    // Add Penjualan
    data.penjualan.forEach(p => {
      csvRows.push([
        p.id,
        p.date,
        'Penjualan',
        `"${p.category.replace(/"/g, '""')}"`,
        p.amount,
        `"${p.notes.replace(/"/g, '""')}"`
      ].join(','));
    });

    // Add Pengeluaran
    data.pengeluaran.forEach(e => {
      csvRows.push([
        e.id,
        e.date,
        'Pengeluaran',
        `"${e.category.replace(/"/g, '""')}"`,
        e.amount,
        `"${e.notes.replace(/"/g, '""')}"`
      ].join(','));
    });

    // Add Kasbon
    data.kasbon.forEach(k => {
      csvRows.push([
        k.id,
        k.date,
        'Kasbon',
        `"${k.customerName.replace(/"/g, '""')} (${k.phone})"`,
        k.amount,
        k.status
      ].join(','));
    });

    // Add Payments
    data.pembayaranKasbon.forEach(pay => {
      csvRows.push([
        pay.id,
        pay.date,
        'Pembayaran Kasbon',
        `"${pay.customerName.replace(/"/g, '""')}"`,
        pay.amount,
        '-'
      ].join(','));
    });

    // Generate CSV Blob
    const csvContent = '\uFEFF' + csvRows.join('\n'); // add BOM for Excel Indonesian encoding support
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    
    // Set file name: e.g. BukuKas_Free_Backup_2026-07-06.csv
    const fileDate = getTodayDateString();
    link.setAttribute('download', `BukuKas_Free_Export_${fileDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteItem = (type: 'penjualan' | 'pengeluaran', id: string, amount: number, category: string) => {
    setDeleteTarget({ type, id, amount, category });
  };

  return (
    <div className="space-y-5">
      {/* Period Selection Tab */}
      <div className="bg-white dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex transition-colors">
        {(['hari', 'minggu', 'bulan'] as const).map((period) => (
          <button
            key={period}
            onClick={() => setActivePeriod(period)}
            className={`flex-1 py-2.5 text-[11px] font-black rounded-xl transition-all uppercase tracking-wider cursor-pointer ${
              activePeriod === period
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/30'
            }`}
          >
            {period === 'hari' ? 'Hari Ini' : period === 'minggu' ? '7 Hari Terakhir' : 'Bulan Ini'}
          </button>
        ))}
      </div>

      {/* Summary Stat Cards */}
      <div className="bg-white dark:bg-slate-800/80 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3.5 transition-colors">
        <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">RINGKASAN LAPORAN</h3>
        
        <div className="grid grid-cols-2 gap-3.5">
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100/50 dark:border-emerald-900/30">
            <span className="text-[10px] text-emerald-800/80 dark:text-emerald-400 font-bold uppercase tracking-wider block mb-0.5">Penjualan</span>
            <span className="text-base font-black text-emerald-700 dark:text-emerald-300 tracking-tight">{formatRupiah(totalPenjualan)}</span>
          </div>
          <div className="bg-red-50/50 dark:bg-rose-950/20 p-3 rounded-xl border border-red-100/50 dark:border-rose-900/30">
            <span className="text-[10px] text-red-800/80 dark:text-rose-400 font-bold uppercase tracking-wider block mb-0.5">Pengeluaran</span>
            <span className="text-base font-black text-red-700 dark:text-rose-300 tracking-tight">{formatRupiah(totalPengeluaran)}</span>
          </div>
        </div>

        {/* Profit Net */}
        <div className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
          profitNet >= 0 
            ? 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100/70 dark:border-indigo-900/30 text-indigo-800 dark:text-indigo-300' 
            : 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-300'
        }`}>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-90">Keuntungan / Sisa Kas Bersih</span>
            <span className="text-lg font-black tracking-tight">{formatRupiah(profitNet)}</span>
          </div>
          <span className="text-xl">
            {profitNet >= 0 ? '💰' : '📉'}
          </span>
        </div>
      </div>

      {/* Monthly Expense Pie Chart */}
      <div className="bg-white dark:bg-slate-800/80 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            DISTRIBUSI PENGELUARAN BULAN INI
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-md border border-rose-100/30">
            Pie Chart
          </span>
        </div>

        {monthlyExpenseCategoryBreakdown.length === 0 ? (
          <div className="text-center py-8 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-100 dark:border-slate-800">
            <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">Belum ada pengeluaran di bulan ini.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={monthlyExpenseCategoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {monthlyExpenseCategoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Interactive Legend */}
            <div className="grid grid-cols-2 gap-2 max-h-28 overflow-y-auto pr-1">
              {monthlyExpenseCategoryBreakdown.map((cat, index) => {
                const totalAmount = monthlyExpenseCategoryBreakdown.reduce((s, c) => s + c.value, 0);
                const percentage = totalAmount > 0 ? (cat.value / totalAmount) * 100 : 0;
                return (
                  <div key={cat.name} className="flex items-start gap-1.5 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <span 
                      className="w-2.5 h-2.5 rounded-full mt-0.5 flex-shrink-0" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="min-w-0 leading-tight">
                      <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate">
                        {cat.name}
                      </p>
                      <p className="text-[9px] font-black text-slate-400 dark:text-slate-500">
                        {formatRupiah(cat.value)} ({Math.round(percentage)}%)
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Category Sales / Expenses progress list */}
      <div className="bg-white dark:bg-slate-800/80 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">KATEGORI TERBESAR</h3>

        <div className="grid grid-cols-2 gap-4">
          {/* Sales Breakdown */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide border-b border-slate-100 dark:border-slate-800 pb-1">📈 Penjualan</h4>
            {salesCategoryBreakdown.length === 0 ? (
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Belum ada penjualan</p>
            ) : (
              salesCategoryBreakdown.map((cat) => {
                const percentage = totalPenjualan > 0 ? (cat.value / totalPenjualan) * 100 : 0;
                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      <span className="truncate max-w-[70px]">{cat.name}</span>
                      <span className="text-slate-400 dark:text-slate-500">{Math.round(percentage)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Expense Breakdown */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] font-bold text-red-700 dark:text-rose-400 uppercase tracking-wide border-b border-slate-100 dark:border-slate-800 pb-1">📉 Pengeluaran</h4>
            {expenseCategoryBreakdown.length === 0 ? (
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Belum ada pengeluaran</p>
            ) : (
              expenseCategoryBreakdown.map((cat) => {
                const percentage = totalPengeluaran > 0 ? (cat.value / totalPengeluaran) * 100 : 0;
                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      <span className="truncate max-w-[70px]">{cat.name}</span>
                      <span className="text-slate-400 dark:text-slate-500">{Math.round(percentage)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-red-500 h-full rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Transaction Records List */}
      <div className="bg-white dark:bg-slate-800/80 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3.5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border-b border-slate-100 dark:border-slate-800/60 pb-3">
          <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            DAFTAR TRANSAKSI
          </h3>
          
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Filter Kategori:
            </span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors"
            >
              <option value="">Semua Kategori</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {combinedTransactions.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">
              {allTransactionsForPeriod.length > 0 
                ? 'Tidak ada transaksi dengan kategori ini.' 
                : 'Tidak ada transaksi di periode ini.'}
            </p>
            {categoryFilter && (
              <button
                type="button"
                onClick={() => setCategoryFilter('')}
                className="mt-2 text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Reset Filter Kategori
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto pr-1">
            {combinedTransactions.map((item) => {
              const isSales = item.type === 'penjualan';
              return (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-2.5 group">
                  <div className="min-w-0 flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                      isSales 
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-red-50 dark:bg-rose-950/50 text-red-600 dark:text-rose-400'
                    }`}>
                      {isSales ? 'M' : 'K'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate leading-snug">{item.category}</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate leading-none mt-0.5">
                        {item.notes ? item.notes : 'Tanpa catatan'} • {item.date}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-extrabold tracking-tight ${isSales ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-rose-400'}`}>
                      {isSales ? '+' : '-'} {formatRupiah(item.amount)}
                    </span>
                    
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.type, item.id, item.amount, item.category)}
                      className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-900 p-1.5 rounded-lg cursor-pointer transition-colors"
                      title="Hapus Transaksi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cloud & Backup / Sync Tools Section */}
      <div className="bg-white dark:bg-slate-800/80 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">CADANGAN & EKSPOR</h3>

        <div className="grid grid-cols-2 gap-3">
          {/* Export Excel Button */}
          <button
            onClick={handleExportCSV}
            className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 text-slate-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-400 rounded-xl transition-all cursor-pointer shadow-sm text-center"
          >
            <FileSpreadsheet className="w-6 h-6 mb-1.5" />
            <span className="text-xs font-bold leading-tight">Ekspor Excel</span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 leading-none mt-0.5">Format .CSV</span>
          </button>

          {/* Sync / Manual Backup to Sheets */}
          <button
            onClick={backupToSheets}
            className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border border-slate-200 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-900/50 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-xl transition-all cursor-pointer shadow-sm text-center"
          >
            <Download className="w-6 h-6 mb-1.5" />
            <span className="text-xs font-bold leading-tight">Cadangkan Data</span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 leading-none mt-0.5">Ke Google Sheets</span>
          </button>
        </div>

        {/* Restore from Google Sheets option */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-150 dark:border-slate-800/80 flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase block leading-tight">PEMULIHAN DATA</span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-snug">Butuh memulihkan data dari Google Sheets?</span>
          </div>
          <button
            onClick={restoreFromSheets}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Restore
          </button>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-5 border border-slate-100 dark:border-slate-700 text-center space-y-4 animate-scale-up">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                Konfirmasi Hapus
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Apakah Anda yakin ingin menghapus transaksi <span className="font-extrabold text-slate-700 dark:text-slate-200">{deleteTarget.category}</span> sebesar <span className="font-black text-rose-600 dark:text-rose-400">{formatRupiah(deleteTarget.amount)}</span> ini?
              </p>
              <p className="text-[10px] text-rose-500 font-bold bg-rose-50/50 dark:bg-rose-950/20 py-1 px-2.5 rounded-lg border border-rose-100/30 dark:border-rose-900/30 inline-block">
                ⚠️ Tindakan ini tidak dapat dibatalkan!
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteTransaction(deleteTarget.type, deleteTarget.id);
                  setDeleteTarget(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md cursor-pointer transition-colors"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
