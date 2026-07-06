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
  ChevronLeft,
  Cpu,
  Key,
  Eye,
  EyeOff,
  Check,
  Lock,
  ShieldCheck,
  BarChart3,
  Activity,
  AlertTriangle,
  Bell
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
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

  // AI Settings (BYOK) - Load from localStorage on mount
  const [aiPlatform, setAiPlatform] = useState<string>(() => {
    return localStorage.getItem('siku_byok_platform') || 'gemini';
  });
  const [aiModel, setAiModel] = useState<string>(() => {
    return localStorage.getItem('siku_byok_model') || 'Gemini 2.5 Flash';
  });
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('siku_byok_key') || '';
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [chartView, setChartView] = useState<'bar' | 'trend'>('trend');
  const [showOverdueDetails, setShowOverdueDetails] = useState(false);

  const PLATFORM_MODELS: Record<string, string[]> = {
    gemini: ['Gemini 2.5 Flash', 'Gemini 2.5 Pro'],
    openai: ['GPT-5', 'GPT-5 Mini'],
    qwen: ['Qwen3-235B', 'Qwen3-32B']
  };

  const handlePlatformChange = (platformId: string) => {
    setAiPlatform(platformId);
    const defaultModel = PLATFORM_MODELS[platformId][0];
    setAiModel(defaultModel);
  };

  const handleSaveAiSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('siku_byok_platform', aiPlatform);
    localStorage.setItem('siku_byok_model', aiModel);
    localStorage.setItem('siku_byok_key', apiKey);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

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

  // Filter utang & piutang jatuh tempo
  const overdueAlerts = useMemo(() => {
    const overdueR = (receivables || [])
      .filter((r) => r.dueDate < selectedDate && r.status !== 'lunas')
      .map((r) => ({
        id: r.id,
        type: 'piutang' as const,
        name: r.customerName,
        dueDate: r.dueDate,
        amount: r.amount - r.paidAmount,
        originalAmount: r.amount,
        description: r.description,
      }));

    const overdueP = (payables || [])
      .filter((p) => p.dueDate < selectedDate && p.status !== 'lunas')
      .map((p) => ({
        id: p.id,
        type: 'utang' as const,
        name: p.supplierName,
        dueDate: p.dueDate,
        amount: p.amount - p.paidAmount,
        originalAmount: p.amount,
        description: p.description,
      }));

    return [...overdueR, ...overdueP].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [receivables, payables, selectedDate]);

  // Generate safe 7-day array leading up to selectedDate to avoid any timezone offset issues
  const lastSevenDays = useMemo(() => {
    const dates: string[] = [];
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date(year, month, day - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        dates.push(`${yyyy}-${mm}-${dd}`);
      }
    }
    return dates;
  }, [selectedDate]);

  // Map each date to revenue and expense totals
  const chartData = useMemo(() => {
    return lastSevenDays.map((dateStr) => {
      const dayTx = transactions.filter((t) => t.date === dateStr);
      const income = dayTx
        .filter((t) => t.type === 'masuk')
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = dayTx
        .filter((t) => t.type === 'keluar')
        .reduce((sum, t) => sum + t.amount, 0);

      const parts = dateStr.split('-');
      const dayLabel = `${parts[2]}/${parts[1]}`;

      const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const dayName = dayNames[dateObj.getDay()];

      return {
        date: dateStr,
        label: `${dayName} (${dayLabel})`,
        'Pendapatan': income,
        'Pengeluaran': expense,
        rawDate: dateStr,
      };
    });
  }, [lastSevenDays, transactions]);

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
 
      {/* Overdue Utang & Piutang Alerts */}
      {overdueAlerts.length > 0 && (
        <div className="bg-rose-50 border border-rose-200/85 rounded-xl p-4 shadow-xs" id="dashboard-overdue-notifications">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-500 text-white rounded-lg shrink-0">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wider flex items-center gap-1.5">
                  Peringatan Jatuh Tempo ({overdueAlerts.length})
                </h4>
                <p className="text-[10px] text-rose-700 font-semibold mt-0.5">
                  Ada {overdueAlerts.length} tagihan utang/piutang yang telah melewati batas jatuh tempo (hingga tanggal {getFormattedDate(selectedDate)}).
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setShowOverdueDetails(!showOverdueDetails)}
                className="text-[10px] bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                {showOverdueDetails ? 'Sembunyikan Rincian' : 'Lihat Rincian'}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('utang_piutang')}
                className="text-[10px] bg-slate-900 hover:bg-slate-950 text-white font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                Kelola Utang/Piutang
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Collapsible Details */}
          {showOverdueDetails && (
            <div className="mt-4 pt-4 border-t border-rose-200/50 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Piutang (Receivables) Column */}
                <div>
                  <h5 className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Piutang Pelanggan ({overdueAlerts.filter(a => a.type === 'piutang').length})
                  </h5>
                  {overdueAlerts.filter(a => a.type === 'piutang').length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic bg-white/40 border border-slate-100 rounded-lg p-3 text-center">Tidak ada piutang jatuh tempo</p>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-none">
                      {overdueAlerts.filter(a => a.type === 'piutang').map((item) => {
                        const parts = item.dueDate.split('-');
                        const formattedDue = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : item.dueDate;
                        return (
                          <div key={item.id} className="bg-white border border-rose-100 rounded-lg p-2.5 shadow-xs flex justify-between items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-xs text-slate-800 block truncate">{item.name}</span>
                              <span className="text-[9px] text-slate-400 font-medium block truncate mt-0.5">{item.description || 'Tanpa keterangan'}</span>
                              <span className="inline-block mt-1 text-[8px] font-mono font-bold bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded">
                                Jatuh Tempo: {formattedDue}
                              </span>
                            </div>
                            <div className="text-right shrink-0 ml-2">
                              <span className="font-mono font-bold text-xs text-slate-800 block">{formatRupiah(item.amount)}</span>
                              <span className="text-[8px] text-slate-400 block mt-0.5">Sisa Tagihan</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Utang (Payables) Column */}
                <div>
                  <h5 className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    Utang Supplier ({overdueAlerts.filter(a => a.type === 'utang').length})
                  </h5>
                  {overdueAlerts.filter(a => a.type === 'utang').length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic bg-white/40 border border-slate-100 rounded-lg p-3 text-center">Tidak ada utang jatuh tempo</p>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-none">
                      {overdueAlerts.filter(a => a.type === 'utang').map((item) => {
                        const parts = item.dueDate.split('-');
                        const formattedDue = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : item.dueDate;
                        return (
                          <div key={item.id} className="bg-white border border-rose-100 rounded-lg p-2.5 shadow-xs flex justify-between items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-xs text-slate-800 block truncate">{item.name}</span>
                              <span className="text-[9px] text-slate-400 font-medium block truncate mt-0.5">{item.description || 'Tanpa keterangan'}</span>
                              <span className="inline-block mt-1 text-[8px] font-mono font-bold bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded">
                                Jatuh Tempo: {formattedDue}
                              </span>
                            </div>
                            <div className="text-right shrink-0 ml-2">
                              <span className="font-mono font-bold text-xs text-slate-800 block">{formatRupiah(item.amount)}</span>
                              <span className="text-[8px] text-slate-400 block mt-0.5">Sisa Tagihan</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>
      )}

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

      {/* Chart Section: Tren Keuangan & Perbandingan Mingguan */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs" id="dashboard-chart-comparison">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-slate-700" />
              {chartView === 'trend' ? 'Tren Alur Kas Mingguan' : 'Perbandingan Kas Mingguan'}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {chartView === 'trend' 
                ? `Grafik tren fluktuasi pendapatan dan pengeluaran (7 hari terakhir hingga ${getFormattedDate(selectedDate)})`
                : `Perbandingan nominal masuk vs keluar (7 hari terakhir hingga ${getFormattedDate(selectedDate)})`}
            </p>
          </div>
          
          {/* Controls: Chart Type Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setChartView('trend')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  chartView === 'trend'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Activity className="w-3 h-3" />
                Garis Tren
              </button>
              <button
                type="button"
                onClick={() => setChartView('bar')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  chartView === 'bar'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <BarChart3 className="w-3 h-3" />
                Diagram Batang
              </button>
            </div>

            {/* Quick legend info */}
            <div className="flex items-center gap-3 text-[11px] font-medium bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 block"></span>
                <span className="text-slate-600">Masuk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 block"></span>
                <span className="text-slate-600">Keluar</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recharts container */}
        <div className="w-full h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === 'trend' ? (
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                onClick={(state: any) => {
                  if (state && state.activePayload && state.activePayload.length > 0) {
                    const clickedDate = state.activePayload[0].payload.rawDate;
                    if (clickedDate) {
                      setSelectedDate(clickedDate);
                    }
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  stroke="#64748b" 
                  fontSize={10}
                  fontWeight="medium"
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10}
                  fontWeight="medium"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => {
                    if (val === 0) return 'Rp 0';
                    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}jt`;
                    if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)}rb`;
                    return `Rp ${val}`;
                  }}
                />
                <Tooltip 
                  cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      const isSelected = d.rawDate === selectedDate;
                      return (
                        <div className={`p-3 bg-white border rounded-lg shadow-md font-sans text-xs ${
                          isSelected ? 'border-slate-900 ring-1 ring-slate-950/10' : 'border-slate-200'
                        }`}>
                          <div className="flex items-center justify-between gap-4 mb-1.5 pb-1 border-b border-slate-100">
                            <span className="font-bold text-slate-800">{getFormattedDate(d.rawDate)}</span>
                            {isSelected ? (
                              <span className="text-[9px] bg-slate-900 text-white font-bold px-1.5 py-0.2 rounded uppercase font-mono">Aktif</span>
                            ) : (
                              <span className="text-[8px] text-slate-400 font-mono font-bold">Pilih Hari</span>
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between gap-6 text-emerald-600 font-medium">
                              <span>Pendapatan:</span>
                              <span className="font-mono font-bold">{formatRupiah(d['Pendapatan'])}</span>
                            </div>
                            <div className="flex justify-between gap-6 text-rose-600 font-medium">
                              <span>Pengeluaran:</span>
                              <span className="font-mono font-bold">{formatRupiah(d['Pengeluaran'])}</span>
                            </div>
                            <div className="border-t border-slate-100 pt-1 mt-1 flex justify-between gap-6 text-slate-700 font-bold">
                              <span>Selisih:</span>
                              <span className={`font-mono ${d['Pendapatan'] >= d['Pengeluaran'] ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {d['Pendapatan'] >= d['Pengeluaran'] ? '+' : ''}{formatRupiah(d['Pendapatan'] - d['Pengeluaran'])}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="Pendapatan" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorIncome)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="Pengeluaran" 
                  stroke="#f43f5e" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorExpense)" 
                />
              </AreaChart>
            ) : (
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                barGap={4}
                onClick={(state: any) => {
                  if (state && state.activePayload && state.activePayload.length > 0) {
                    const clickedDate = state.activePayload[0].payload.rawDate;
                    if (clickedDate) {
                      setSelectedDate(clickedDate);
                    }
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  stroke="#64748b" 
                  fontSize={10}
                  fontWeight="medium"
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10}
                  fontWeight="medium"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => {
                    if (val === 0) return 'Rp 0';
                    if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}jt`;
                    if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)}rb`;
                    return `Rp ${val}`;
                  }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      const isSelected = d.rawDate === selectedDate;
                      return (
                        <div className={`p-3 bg-white border rounded-lg shadow-md font-sans text-xs ${
                          isSelected ? 'border-slate-900 ring-1 ring-slate-950/10' : 'border-slate-200'
                        }`}>
                          <div className="flex items-center justify-between gap-4 mb-1.5 pb-1 border-b border-slate-100">
                            <span className="font-bold text-slate-800">{getFormattedDate(d.rawDate)}</span>
                            {isSelected ? (
                              <span className="text-[9px] bg-slate-900 text-white font-bold px-1.5 py-0.2 rounded uppercase font-mono">Aktif</span>
                            ) : (
                              <span className="text-[8px] text-slate-400 font-mono font-bold">Pilih Hari</span>
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between gap-6 text-emerald-600 font-medium">
                              <span>Pendapatan:</span>
                              <span className="font-mono font-bold">{formatRupiah(d['Pendapatan'])}</span>
                            </div>
                            <div className="flex justify-between gap-6 text-rose-600 font-medium">
                              <span>Pengeluaran:</span>
                              <span className="font-mono font-bold">{formatRupiah(d['Pengeluaran'])}</span>
                            </div>
                            <div className="border-t border-slate-100 pt-1 mt-1 flex justify-between gap-6 text-slate-700 font-bold">
                              <span>Selisih:</span>
                              <span className={`font-mono ${d['Pendapatan'] >= d['Pengeluaran'] ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {d['Pendapatan'] >= d['Pengeluaran'] ? '+' : ''}{formatRupiah(d['Pendapatan'] - d['Pengeluaran'])}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="Pendapatan" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={32}
                />
                <Bar 
                  dataKey="Pengeluaran" 
                  fill="#f43f5e" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={32}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        <div className="mt-2.5 flex items-center justify-end text-[9px] font-mono text-slate-400 gap-1">
          <span>*Klik salah satu titik atau batang grafik untuk mengubah tanggal aktif pembukuan Anda</span>
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

      {/* Card: Pengaturan AI (BYOK) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs" id="dashboard-ai-byok-settings">
        <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100">
          <div className="p-2.5 bg-slate-900 text-white rounded-lg">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider">Pengaturan AI (BYOK)</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Konfigurasikan kunci API Anda sendiri (Bring Your Own Key) untuk mengaktifkan fitur cerdas</p>
          </div>
        </div>

        <form onSubmit={handleSaveAiSettings} className="space-y-5 pt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left Column: Platform & Model */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Platform AI
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['gemini', 'openai', 'qwen'] as const).map((platformId) => {
                    const isSelected = aiPlatform === platformId;
                    return (
                      <button
                        key={platformId}
                        type="button"
                        onClick={() => handlePlatformChange(platformId)}
                        className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all capitalize cursor-pointer flex flex-col items-center gap-1 ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
                        }`}
                      >
                        <span className="font-mono">{platformId}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Model AI
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(PLATFORM_MODELS[aiPlatform] || []).map((modelName) => {
                    const isSelected = aiModel === modelName;
                    return (
                      <button
                        key={modelName}
                        type="button"
                        onClick={() => setAiModel(modelName)}
                        className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-slate-50 text-slate-950 border-slate-900 ring-1 ring-slate-950/10 font-bold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                        }`}
                      >
                        <span className="truncate">{modelName}</span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: API Key & Security Info */}
            <div className="space-y-4 flex flex-col justify-between">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Key className="w-3 h-3 text-slate-400" /> API Key ({aiPlatform === 'gemini' ? 'Gemini' : aiPlatform === 'openai' ? 'OpenAI' : 'Qwen'})
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={`Masukkan API Key untuk platform ${aiPlatform.toUpperCase()}...`}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-3 pr-10 text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <p className="text-[10px] text-slate-500 leading-normal">
                  <span className="font-bold text-slate-700 block mb-0.5">Privasi Terjamin Lokal</span>
                  API Key hanya disimpan di perangkat ini dan tidak dikirim atau disimpan di server. Semua proses kalkulasi dilakukan langsung menggunakan kunci lokal Anda.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              {saveSuccess && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-200/50 px-2.5 py-1 rounded-md">
                  <ShieldCheck className="w-3.5 h-3.5 animate-bounce" />
                  <span>Pengaturan Berhasil Disimpan di Perangkat!</span>
                </div>
              )}
            </div>
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold py-2.5 px-5 rounded-lg transition-all active:scale-95 cursor-pointer shadow-xs inline-flex items-center gap-1.5 font-sans"
            >
              Simpan Pengaturan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
