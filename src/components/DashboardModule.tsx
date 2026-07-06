import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  FileText, 
  Plus, 
  DollarSign, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownLeft,
  Calendar,
  ChevronLeft
} from 'lucide-react';
import { LocalData, DailyCashSession, Transaction, Receivable, Payable } from '../types';
import { formatRupiah, getFormattedDate } from '../utils/helpers';

interface DashboardModuleProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  session?: DailyCashSession;
  transactions: Transaction[];
  receivables: Receivable[];
  payables: Payable[];
  onUpdateSession: (date: string, updates: Partial<DailyCashSession>) => void;
  onNavigate: (module: string) => void;
  currentUser: { displayName?: string | null; email?: string | null };
  adjustDateByDays: (days: number) => void;
  getTodayDateString: () => string;
}

export default function DashboardModule({
  selectedDate,
  setSelectedDate,
  session,
  transactions,
  receivables,
  payables,
  onUpdateSession,
  onNavigate,
  currentUser,
  adjustDateByDays,
  getTodayDateString
}: DashboardModuleProps) {
  // Local state to edit cash register opening values
  const [editingOpening, setEditingOpening] = useState(false);
  const [tempPetty, setTempPetty] = useState(session?.openingPettyCash.toString() || '150000');
  const [tempPhysical, setTempPhysical] = useState(session?.openingPhysicalCash.toString() || '150000');

  const pettyCash = session?.openingPettyCash ?? 150000;
  const initialPhysical = session?.openingPhysicalCash ?? 150000;

  // Compute metrics
  const stats = useMemo(() => {
    const activeDayTx = transactions.filter((t) => t.date === selectedDate);
    
    const dailyIncome = activeDayTx
      .filter((t) => t.type === 'masuk')
      .reduce((sum, t) => sum + t.amount, 0);

    const dailyExpense = activeDayTx
      .filter((t) => t.type === 'keluar')
      .reduce((sum, t) => sum + t.amount, 0);

    const bookBalance = initialPhysical + dailyIncome - dailyExpense;

    const remainingPiutang = receivables
      .filter((r) => r.status !== 'lunas')
      .reduce((sum, r) => sum + (r.amount - r.paidAmount), 0);

    return {
      dailyIncome,
      dailyExpense,
      bookBalance,
      remainingPiutang,
      activeDayTx
    };
  }, [transactions, receivables, selectedDate, initialPhysical]);

  const handleSaveOpening = (e: React.FormEvent) => {
    e.preventDefault();
    const pCash = Math.max(0, parseFloat(tempPetty) || 0);
    const pPhys = Math.max(0, parseFloat(tempPhysical) || 0);

    onUpdateSession(selectedDate, {
      openingPettyCash: pCash,
      openingPhysicalCash: pPhys,
    });
    setEditingOpening(false);
  };

  // Get first name for welcome greeting
  const displayName = currentUser.displayName || 'Pemilik Toko';
  const firstName = displayName.split(' ')[0];

  return (
    <div className="space-y-6" id="dashboard-module-container">
      {/* Welcome Title and Date Picker Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h2>
          <p className="text-xs text-slate-500 mt-1">
            Selamat datang kembali, {firstName}!
          </p>
        </div>

        {/* Date Swiper / Picker */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200/80 shadow-xs self-start sm:self-center">
          <button 
            onClick={() => adjustDateByDays(-1)}
            className="p-1 hover:bg-slate-50 text-slate-600 hover:text-slate-950 rounded transition-colors cursor-pointer"
            title="Kemarin"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 px-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono">{getFormattedDate(selectedDate)}</span>
            {selectedDate === getTodayDateString() && (
              <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold px-1.5 py-0.2 rounded ml-1 uppercase">Hari Ini</span>
            )}
          </div>

          <input 
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            className="opacity-0 absolute w-0 h-0"
            id="dashboard-hidden-date"
          />
          <button 
            onClick={() => document.getElementById('dashboard-hidden-date')?.click()}
            className="text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-0.5 px-2 rounded-md transition-colors cursor-pointer"
          >
            Ubah
          </button>

          <button 
            onClick={() => adjustDateByDays(1)}
            className="p-1 hover:bg-slate-50 text-slate-600 hover:text-slate-950 rounded transition-colors cursor-pointer"
            title="Besok"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid: 4 Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Kas Masuk Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">Kas Masuk Hari Ini</span>
            <span className="text-lg font-bold text-emerald-600 font-mono mt-1 block">
              +{formatRupiah(stats.dailyIncome)}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Kas Keluar Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">Keluar Hari Ini</span>
            <span className="text-lg font-bold text-rose-600 font-mono mt-1 block">
              -{formatRupiah(stats.dailyExpense)}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Catatan Buku Kas Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">Catatan Buku Kas</span>
            <span className="text-lg font-bold text-slate-800 font-mono mt-1 block">
              {formatRupiah(stats.bookBalance)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Saldo saat ini</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Tagihan Piutang Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center shadow-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">Tagihan Piutang</span>
            <span className="text-lg font-bold text-amber-600 font-mono mt-1 block">
              {formatRupiah(stats.remainingPiutang)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Perlu ditagih</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Content Area Grid: Saldo Kas & Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left column: Saldo Kas Box & Quick Add Transaction */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Card: Saldo Kas Hari Ini */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">Saldo Kas Hari Ini</span>
                <h3 className="text-2xl font-bold text-slate-800 font-mono mt-1">
                  {formatRupiah(stats.bookBalance)}
                </h3>
              </div>
              {!editingOpening && (
                <button
                  onClick={() => {
                    setTempPetty(pettyCash.toString());
                    setTempPhysical(initialPhysical.toString());
                    setEditingOpening(true);
                  }}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1 rounded-md border border-slate-200 cursor-pointer transition-colors"
                >
                  Ubah
                </button>
              )}
            </div>

            {editingOpening ? (
              <form onSubmit={handleSaveOpening} className="space-y-4 pt-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    Uang Kembalian (Petty Cash)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">Rp</span>
                    <input
                      type="number"
                      value={tempPetty}
                      onChange={(e) => setTempPetty(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-8 pr-3 text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    Uang Fisik Awal
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">Rp</span>
                    <input
                      type="number"
                      value={tempPhysical}
                      onChange={(e) => setTempPhysical(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-8 pr-3 text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors cursor-pointer"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingOpening(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-xs font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-4 pt-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-400 font-medium block">Uang Kembalian</span>
                  <span className="font-mono font-bold text-slate-800 text-sm mt-1 block">{formatRupiah(pettyCash)}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-400 font-medium block">Uang Fisik Awal</span>
                  <span className="font-mono font-bold text-slate-800 text-sm mt-1 block">{formatRupiah(initialPhysical)}</span>
                </div>
                
                <div className="col-span-2 border-l-4 border-l-emerald-600 bg-emerald-50/40 p-3.5 rounded-lg flex items-center gap-3">
                  <div className="p-2 bg-emerald-600 text-white rounded-lg">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Total Kas Bersih</span>
                    <span className="font-mono text-base font-bold text-emerald-800 block mt-0.5">
                      {formatRupiah(initialPhysical + pettyCash)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Access Card: Pencatatan Transaksi */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs" id="quick-add-section">
            <span className="text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider block mb-2">Pencatatan Transaksi</span>
            <button
              onClick={() => onNavigate('kas')}
              className="w-full flex items-center gap-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 hover:border-slate-300 p-4 rounded-lg transition-all text-left cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Plus className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-800 block">Tambah Transaksi</h4>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">Catat pemasukan atau pengeluaran baru harian</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right column: Recent Transactions list */}
        <div className="lg:col-span-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wider">Transaksi Terakhir</h3>
              </div>
              <button
                onClick={() => onNavigate('jurnal')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
              >
                Lihat Semua
              </button>
            </div>

            <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[340px]">
              {stats.activeDayTx.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center h-full min-h-[220px]">
                  <FileText className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-500">Belum ada transaksi hari ini</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Catat transaksi melalui menu Kas</p>
                </div>
              ) : (
                stats.activeDayTx.map((tx) => {
                  const isIncome = tx.type === 'masuk';
                  return (
                    <div key={tx.id} className="p-3.5 hover:bg-slate-50/50 transition-colors flex justify-between items-center gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Type Icon indicator */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                        </div>
                        
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 text-xs block truncate">{tx.description}</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5 font-sans capitalize">
                            {tx.category === 'rutin' ? 'Operasional' : 'Lainnya'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`font-mono text-xs font-bold block ${
                          isIncome ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {isIncome ? '+' : '-'}{formatRupiah(tx.amount)}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 block mt-0.5">{tx.time}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
