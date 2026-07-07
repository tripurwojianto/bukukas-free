import React, { useState, useEffect } from 'react';
import { useBukuKas } from '../context/BukuKasContext';
import { getTodayDateString, formatRupiah } from '../utils/defaultData';
import { TrendingUp, TrendingDown, Landmark, Receipt, CircleCheck, AlertTriangle, CloudRain, CloudLightning, RefreshCw, Smartphone, Bell, Sparkles, Plus, Check, Zap } from 'lucide-react';

interface DashboardViewProps {
  setActiveTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab }) => {
  const { data, syncStatus, lastSyncTime, loginWithGoogle, addPenjualan, addPengeluaran } = useBukuKas();
  const todayStr = getTodayDateString();

  const [isReminderDismissed, setIsReminderDismissed] = useState(false);

  // --- STATE FOR CATATAN CEPAT ---
  const [quickType, setQuickType] = useState<'penjualan' | 'pengeluaran'>('penjualan');
  const [quickAmount, setQuickAmount] = useState<string>('');
  const [quickNotes, setQuickNotes] = useState<string>('');
  const [quickCategory, setQuickCategory] = useState<string>('');
  const [quickSuccess, setQuickSuccess] = useState<string>('');

  const typeCategories = React.useMemo(() => {
    return data.categories.filter((c) => c.type === quickType);
  }, [data.categories, quickType]);

  useEffect(() => {
    if (typeCategories.length > 0) {
      const defaultCat = typeCategories.find(c => 
        c.name.includes('Lain-lain') || 
        c.name.includes('Lainnya') || 
        c.name.includes('Jasa')
      ) || typeCategories[0];
      setQuickCategory(defaultCat.name);
    } else {
      setQuickCategory('');
    }
  }, [typeCategories]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    if (rawVal === '') {
      setQuickAmount('');
      return;
    }
    const parsed = parseInt(rawVal, 10);
    setQuickAmount(parsed.toLocaleString('id-ID'));
  };

  const handleSaveQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(quickAmount.replace(/[^0-9]/g, ''));
    if (!amountVal || isNaN(amountVal) || amountVal <= 0) {
      alert('Silakan masukkan jumlah nominal yang valid!');
      return;
    }

    const todayString = getTodayDateString();
    const noteText = quickNotes.trim() || (quickType === 'penjualan' ? 'Penjualan Cepat' : 'Pengeluaran Cepat');

    if (quickType === 'penjualan') {
      addPenjualan({
        date: todayString,
        category: quickCategory || 'Jasa / Lain-lain',
        amount: amountVal,
        notes: noteText,
      });
    } else {
      addPengeluaran({
        date: todayString,
        category: quickCategory || 'Pengeluaran Lainnya',
        amount: amountVal,
        notes: noteText,
      });
    }

    setQuickSuccess(`Mencatat ${quickType === 'penjualan' ? 'Pemasukan' : 'Pengeluaran'} Rp ${amountVal.toLocaleString('id-ID')} (${noteText})!`);
    setQuickAmount('');
    setQuickNotes('');
    
    setTimeout(() => {
      setQuickSuccess('');
    }, 4000);
  };

  // Time-based checks for sore/afternoon daily reminder
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const [reminderHourStr, reminderMinStr] = (data.profile.reminderTime || '16:00').split(':');
  const rHour = parseInt(reminderHourStr, 10) || 16;
  const rMin = parseInt(reminderMinStr, 10) || 0;

  // Has any sales/expenses recorded with date === today?
  const totalTransactionsToday = data.penjualan.filter(p => p.date === todayStr).length +
                                 data.pengeluaran.filter(e => e.date === todayStr).length;
  const hasNoTransactionsToday = totalTransactionsToday === 0;

  // Is it past reminder time today?
  const isPastReminderTime = currentHour > rHour || (currentHour === rHour && currentMinute >= rMin);

  // Should show the banner on Dashboard
  const showReminderBanner = (data.profile.reminderEnabled !== false) && isPastReminderTime && hasNoTransactionsToday;

  // Native notification effects
  useEffect(() => {
    if (data.profile.reminderEnabled !== false && 'Notification' in window && Notification.permission === 'granted') {
      const checkAndTriggerNotification = () => {
        const todayString = getTodayDateString();
        const totalToday = data.penjualan.filter(p => p.date === todayString).length +
                           data.pengeluaran.filter(e => e.date === todayString).length;
        
        if (totalToday === 0) {
          const currentTime = new Date();
          const curHour = currentTime.getHours();
          const curMin = currentTime.getMinutes();
          const [remHourStr, remMinStr] = (data.profile.reminderTime || '16:00').split(':');
          const remHour = parseInt(remHourStr, 10) || 16;
          const remMin = parseInt(remMinStr, 10) || 0;
          
          const isPast = curHour > remHour || (curHour === remHour && curMin >= remMin);
          
          if (isPast) {
            const lastSentDate = localStorage.getItem('bukukas_last_notification_date');
            if (lastSentDate !== todayString) {
              try {
                new Notification('Pengingat Sore BukuKas ⏰', {
                  body: `Halo ${data.profile.ownerName || 'Juragan'}, Anda belum mencatat transaksi apa pun hari ini. Catat sekarang yuk!`,
                });
                localStorage.setItem('bukukas_last_notification_date', todayString);
              } catch (err) {
                console.error('Failed to trigger native notification:', err);
              }
            }
          }
        }
      };

      checkAndTriggerNotification();
      const interval = setInterval(checkAndTriggerNotification, 60000);
      return () => clearInterval(interval);
    }
  }, [data.profile.reminderEnabled, data.profile.reminderTime, data.profile.ownerName, data.penjualan, data.pengeluaran]);

  // 1. Penjualan Hari Ini
  const penjualanHariIni = data.penjualan
    .filter((p) => p.date === todayStr)
    .reduce((sum, p) => sum + p.amount, 0);

  // 2. Pengeluaran Hari Ini
  const pengeluaranHariIni = data.pengeluaran
    .filter((e) => e.date === todayStr)
    .reduce((sum, e) => sum + e.amount, 0);

  // 3. Piutang (Total Unpaid Kasbon outstanding balance)
  // Calculate outstanding for each customer
  const customerDebts = new Map<string, { totalOwed: number; totalPaid: number }>();
  data.kasbon.forEach((k) => {
    const current = customerDebts.get(k.customerName) || { totalOwed: 0, totalPaid: 0 };
    customerDebts.set(k.customerName, {
      ...current,
      totalOwed: current.totalOwed + k.amount,
    });
  });
  data.pembayaranKasbon.forEach((p) => {
    const current = customerDebts.get(p.customerName) || { totalOwed: 0, totalPaid: 0 };
    customerDebts.set(p.customerName, {
      ...current,
      totalPaid: current.totalPaid + p.amount,
    });
  });

  let totalPiutang = 0;
  customerDebts.forEach((debt) => {
    const balance = debt.totalOwed - debt.totalPaid;
    if (balance > 0) {
      totalPiutang += balance;
    }
  });

  // 4. Saldo Kas = Total Penjualan + Total Pembayaran Kasbon - Total Pengeluaran
  const totalPenjualan = data.penjualan.reduce((sum, p) => sum + p.amount, 0);
  const totalPembayaranKasbon = data.pembayaranKasbon.reduce((sum, p) => sum + p.amount, 0);
  const totalPengeluaran = data.pengeluaran.reduce((sum, e) => sum + e.amount, 0);
  const saldoKas = totalPenjualan + totalPembayaranKasbon - totalPengeluaran;

  // Combine latest 5 transactions for a chronological feed
  // Sales, Expenses, Kasbon, and Payments
  const feedItems: Array<{
    id: string;
    type: 'penjualan' | 'pengeluaran' | 'kasbon' | 'pembayaran';
    title: string;
    subtitle: string;
    amount: number;
    date: string;
    category?: string;
  }> = [];

  data.penjualan.slice(0, 5).forEach((p) => {
    feedItems.push({
      id: p.id,
      type: 'penjualan',
      title: 'Penjualan',
      subtitle: `${p.category}${p.notes ? ` • ${p.notes}` : ''}`,
      amount: p.amount,
      date: p.date,
    });
  });

  data.pengeluaran.slice(0, 5).forEach((e) => {
    feedItems.push({
      id: e.id,
      type: 'pengeluaran',
      title: 'Pengeluaran',
      subtitle: `${e.category}${e.notes ? ` • ${e.notes}` : ''}`,
      amount: e.amount,
      date: e.date,
    });
  });

  data.kasbon.slice(0, 5).forEach((k) => {
    feedItems.push({
      id: k.id,
      type: 'kasbon',
      title: `Kasbon Baru (${k.customerName})`,
      subtitle: `Piutang baru jatuh tempo`,
      amount: k.amount,
      date: k.date,
    });
  });

  data.pembayaranKasbon.slice(0, 5).forEach((p) => {
    feedItems.push({
      id: p.id,
      type: 'pembayaran',
      title: `Pembayaran Kasbon`,
      subtitle: `Dari ${p.customerName}`,
      amount: p.amount,
      date: p.date,
    });
  });

  // Sort feed chronologically (newest first)
  const latestFeed = feedItems
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* App Header Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-3xl leading-none">{data.profile.logo || '🏪'}</span>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">
              {data.profile.name || 'Toko BukuKas'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {data.profile.ownerName || 'Pemilik Toko'}
            </p>
          </div>
        </div>

        {/* Sheets Cloud Connection Indicator */}
        <div className="flex flex-col items-end">
          {syncStatus === 'success' && (
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Google Sheets Aktif
            </div>
          )}
          {syncStatus === 'syncing' && (
            <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-[10px] font-bold border border-indigo-100 animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Menyinkronkan...
            </div>
          )}
          {syncStatus === 'error' && (
            <div className="flex items-center gap-1.5 bg-red-50 text-red-700 px-2.5 py-1 rounded-full text-[10px] font-bold border border-red-100">
              <AlertTriangle className="w-3 h-3" />
              Gagal Sinkron
            </div>
          )}
          {(syncStatus === 'not_logged_in' || syncStatus === 'idle') && !lastSyncTime && (
            <button
              onClick={loginWithGoogle}
              className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 rounded-full font-bold transition-colors border border-slate-200"
            >
              Hubungkan GSheets
            </button>
          )}
          {lastSyncTime && syncStatus === 'idle' && (
            <div className="text-[9px] text-slate-400 mt-0.5">
              Tersinkron: {lastSyncTime.split(',')[1] || lastSyncTime}
            </div>
          )}
        </div>
      </div>

      {/* Saldo Kas - Primary Display */}
      <div className="bg-gradient-to-tr from-indigo-700 to-indigo-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
          <Landmark className="w-48 h-48" />
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-100 opacity-90">
            SALDO KAS (UANG TUNAI)
          </span>
          <Landmark className="w-5 h-5 text-indigo-100" />
        </div>
        <h2 className="text-3xl font-black tracking-tight mb-4 select-all">
          {formatRupiah(saldoKas)}
        </h2>
        <p className="text-[11px] text-indigo-100 bg-indigo-800/40 px-3 py-1.5 rounded-xl inline-block font-medium border border-indigo-500/30">
          *Dihitung dari: Penjualan + Pelunasan Kasbon - Pengeluaran
        </p>
      </div>

      {/* Sore Daily Reminder Banner */}
      {showReminderBanner && !isReminderDismissed && (
        <div className="bg-amber-50 border border-amber-200 p-4.5 rounded-2xl shadow-sm space-y-3 relative overflow-hidden animate-fade-in">
          <div className="absolute -right-3 -top-3 text-amber-100 opacity-30 rotate-12">
            <Bell className="w-16 h-16" />
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 flex-shrink-0">
              <Bell className="w-4.5 h-4.5 animate-bounce" />
            </div>
            <div className="min-w-0 pr-4">
              <h4 className="text-[10px] font-black text-amber-950 leading-none uppercase tracking-wider">
                Pengingat Sore BukuKas ⏰
              </h4>
              <p className="text-[11px] text-amber-900 leading-relaxed font-bold mt-1.5">
                Halo {data.profile.ownerName || 'Juragan'}! Hari sudah sore tapi belum ada transaksi yang dicatat untuk hari ini. Yuk catat sekarang agar pembukuan tetap rapi!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setActiveTab('tambah')}
              className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10px] uppercase px-4 py-2 rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              ✍️ Catat Transaksi Sekarang
            </button>
            <button
              onClick={() => setIsReminderDismissed(true)}
              className="text-amber-700 hover:text-amber-950 font-bold text-[10px] px-3 py-2 cursor-pointer transition-colors"
            >
              Nanti Saja
            </button>
          </div>
        </div>
      )}

      {/* Today Cards Container */}
      <div className="grid grid-cols-2 gap-4">
        {/* Penjualan Hari Ini */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">HARI INI</span>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Penjualan</p>
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
              {formatRupiah(penjualanHariIni)}
            </h3>
          </div>
        </div>

        {/* Pengeluaran Hari Ini */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
              <TrendingDown className="w-4.5 h-4.5" />
            </div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">HARI INI</span>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Pengeluaran</p>
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
              {formatRupiah(pengeluaranHariIni)}
            </h3>
          </div>
        </div>
      </div>

      {/* Outstanding Receivables (Piutang) */}
      <div className="bg-amber-50/50 dark:bg-amber-950/10 rounded-2xl p-4.5 border border-amber-100 dark:border-amber-900/30 shadow-sm flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-amber-800/80 dark:text-amber-400/80 uppercase tracking-wide mb-0.5">Total Piutang (Kasbon Belum Lunas)</p>
            <h4 className="text-lg font-black text-amber-900 dark:text-amber-300 tracking-tight">{formatRupiah(totalPiutang)}</h4>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('kasbon')}
          className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl font-bold transition-colors shadow-sm cursor-pointer"
        >
          Tagih Kasbon
        </button>
      </div>

      {/* Catatan Cepat (Quick Note) Card */}
      <div className="bg-white dark:bg-slate-800/80 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              CATATAN CEPAT (QUICK NOTE)
            </h3>
          </div>
          <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-100/30">
            Satu Langkah
          </span>
        </div>

        <form onSubmit={handleSaveQuickNote} className="space-y-3.5">
          {/* Success Notification */}
          {quickSuccess && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-2.5 rounded-xl flex items-center gap-2 animate-fade-in text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>{quickSuccess}</span>
            </div>
          )}

          {/* Type Selector Toggle */}
          <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-100 dark:border-slate-800/50">
            <button
              type="button"
              onClick={() => setQuickType('penjualan')}
              className={`py-1.5 text-[10px] font-black rounded-lg transition-all uppercase tracking-wider cursor-pointer ${
                quickType === 'penjualan'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              📈 Pemasukan (Jual)
            </button>
            <button
              type="button"
              onClick={() => setQuickType('pengeluaran')}
              className={`py-1.5 text-[10px] font-black rounded-lg transition-all uppercase tracking-wider cursor-pointer ${
                quickType === 'pengeluaran'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              📉 Pengeluaran (Beli)
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Amount Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Nominal (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-black text-slate-400 dark:text-slate-500">
                  Rp
                </span>
                <input
                  type="text"
                  required
                  placeholder="0"
                  value={quickAmount}
                  onChange={handleAmountChange}
                  className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-black text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Category Dropdown Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Kategori
              </label>
              <select
                value={quickCategory}
                onChange={(e) => setQuickCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                {typeCategories.map((c) => (
                  <option key={c.id} value={c.name} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Short Note / Catatan */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Catatan Singkat (Keterangan)
            </label>
            <input
              type="text"
              placeholder={quickType === 'penjualan' ? 'Contoh: Jual beras, isi pulsa...' : 'Contoh: Beli bensin, belanja kopi...'}
              value={quickNotes}
              onChange={(e) => setQuickNotes(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Submit Quick Button */}
          <button
            type="submit"
            className={`w-full py-2.5 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 ${
              quickType === 'penjualan'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10'
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/10'
            }`}
          >
            <Plus className="w-4 h-4" /> Simpan Catatan Cepat
          </button>
        </form>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">PENCATATAN CEPAT</h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => {
              localStorage.setItem('bukukas_tambah_tab', 'penjualan');
              setActiveTab('tambah');
            }}
            id="shortcut-penjualan"
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer border border-emerald-100/50"
          >
            <TrendingUp className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-extrabold tracking-wide uppercase">Penjualan</span>
          </button>
          <button
            onClick={() => {
              localStorage.setItem('bukukas_tambah_tab', 'pengeluaran');
              setActiveTab('tambah');
            }}
            id="shortcut-pengeluaran"
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 transition-colors cursor-pointer border border-red-100/50"
          >
            <TrendingDown className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-extrabold tracking-wide uppercase">Pengeluaran</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('kasbon');
              // Save trigger to open new kasbon modal on the next view
              localStorage.setItem('bukukas_kasbon_open_new', 'true');
            }}
            id="shortcut-kasbon"
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer border border-amber-100/50"
          >
            <Receipt className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-extrabold tracking-wide uppercase">Kasbon</span>
          </button>
        </div>
      </div>

      {/* Recent Feed List */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">AKTIVITAS TERBARU</h3>
          <button
            onClick={() => setActiveTab('laporan')}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
          >
            Lihat Semua
          </button>
        </div>

        {latestFeed.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-150 rounded-xl bg-slate-50/50">
            <Smartphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">Belum ada transaksi dicatat.</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Catatan Anda akan tampil di sini.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {latestFeed.map((item) => {
              const isPlus = item.type === 'penjualan' || item.type === 'pembayaran';
              return (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        item.type === 'penjualan'
                          ? 'bg-emerald-50 text-emerald-600'
                          : item.type === 'pengeluaran'
                          ? 'bg-red-50 text-red-600'
                          : item.type === 'kasbon'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-indigo-50 text-indigo-600'
                      }`}
                    >
                      {item.type === 'penjualan' && 'M'}
                      {item.type === 'pengeluaran' && 'K'}
                      {item.type === 'kasbon' && 'B'}
                      {item.type === 'pembayaran' && 'P'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate leading-snug">{item.title}</p>
                      <p className="text-[10px] text-slate-400 truncate leading-tight font-medium">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xs font-extrabold tracking-tight ${isPlus ? 'text-emerald-600' : 'text-red-600'}`}>
                      {isPlus ? '+' : '-'}
                      {formatRupiah(item.amount).replace('Rp', '').trim()}
                    </p>
                    <p className="text-[9px] text-slate-400 font-medium leading-tight mt-0.5">
                      {item.date}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
