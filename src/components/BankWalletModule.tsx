import React, { useState, useMemo } from 'react';
import { 
  Wallet, 
  CreditCard, 
  ArrowRightLeft, 
  Plus, 
  Trash2, 
  Building, 
  Smartphone, 
  PlusCircle, 
  History, 
  Calendar, 
  Info,
  DollarSign,
  X,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Check
} from 'lucide-react';
import { BankWalletAccount, BankWalletMutation } from '../types';
import { formatRupiah, getFormattedDate, getTodayDateString } from '../utils/helpers';

interface BankWalletModuleProps {
  selectedDate: string;
  bankAccounts: BankWalletAccount[];
  bankMutations: BankWalletMutation[];
  onAddMutation: (mutation: Omit<BankWalletMutation, 'id'>) => void;
  onDeleteMutation: (id: string) => void;
  onAddAccount: (account: Omit<BankWalletAccount, 'id'>) => void;
  onUpdateAccount: (id: string, updates: Partial<BankWalletAccount>) => void;
  onDeleteAccount: (id: string) => void;
}

export default function BankWalletModule({
  selectedDate,
  bankAccounts,
  bankMutations,
  onAddMutation,
  onDeleteMutation,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount
}: BankWalletModuleProps) {
  // Modal states
  const [showAccModal, setShowAccModal] = useState(false);
  const [showMutModal, setShowMutModal] = useState(false);
  
  // Selected Account for Ledger Filter
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>('all');

  // Account Form state
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<'bank' | 'e-wallet'>('bank');
  const [accInitialBalance, setAccInitialBalance] = useState<number>(0);

  // Mutation Form state
  const [mutDate, setMutDate] = useState(selectedDate);
  const [mutTime, setMutTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [mutType, setMutType] = useState<BankWalletMutation['type']>('setor');
  const [mutAccountId, setMutAccountId] = useState('');
  const [mutSourceAccountId, setMutSourceAccountId] = useState('');
  const [mutAmount, setMutAmount] = useState<number>(0);
  const [mutDescription, setMutDescription] = useState('');

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Compute live balances
  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    
    // Set initial balances
    bankAccounts.forEach(acc => {
      balances[acc.id] = acc.initialBalance;
    });

    // Apply mutations in chronological order
    const sortedMutations = [...bankMutations].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });

    sortedMutations.forEach(m => {
      if (m.type === 'setor' || m.type === 'pendapatan_langsung') {
        if (balances[m.accountId] !== undefined) {
          balances[m.accountId] += m.amount;
        }
      } else if (m.type === 'tarik' || m.type === 'pengeluaran_langsung') {
        if (balances[m.accountId] !== undefined) {
          balances[m.accountId] -= m.amount;
        }
      } else if (m.type === 'transfer_ke_rekening') {
        if (m.sourceAccountId && balances[m.sourceAccountId] !== undefined) {
          balances[m.sourceAccountId] -= m.amount;
        }
        if (balances[m.accountId] !== undefined) {
          balances[m.accountId] += m.amount;
        }
      }
    });

    return balances;
  }, [bankAccounts, bankMutations]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalBank = 0;
    let totalWallet = 0;

    bankAccounts.forEach(acc => {
      const bal = accountBalances[acc.id] || 0;
      if (acc.type === 'bank') {
        totalBank += bal;
      } else {
        totalWallet += bal;
      }
    });

    return {
      totalBank,
      totalWallet,
      grandTotal: totalBank + totalWallet
    };
  }, [bankAccounts, accountBalances]);

  // Handle Create Account
  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim()) {
      triggerToast('Nama rekening harus diisi', 'error');
      return;
    }
    onAddAccount({
      name: accName.trim(),
      type: accType,
      initialBalance: accInitialBalance || 0
    });
    triggerToast(`Rekening "${accName}" berhasil ditambahkan!`);
    
    // Reset Form
    setAccName('');
    setAccType('bank');
    setAccInitialBalance(0);
    setShowAccModal(false);
  };

  // Handle Create Mutation
  const handleCreateMutation = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mutAccountId) {
      triggerToast('Pilih rekening terlebih dahulu', 'error');
      return;
    }

    if (mutType === 'transfer_ke_rekening' && !mutSourceAccountId) {
      triggerToast('Pilih rekening pengirim terlebih dahulu', 'error');
      return;
    }

    if (mutType === 'transfer_ke_rekening' && mutAccountId === mutSourceAccountId) {
      triggerToast('Rekening asal dan tujuan tidak boleh sama', 'error');
      return;
    }

    if (mutAmount <= 0) {
      triggerToast('Jumlah mutasi harus lebih besar dari Rp 0', 'error');
      return;
    }

    if (!mutDescription.trim()) {
      triggerToast('Tulis deskripsi atau keterangan mutasi', 'error');
      return;
    }

    onAddMutation({
      date: mutDate,
      time: mutTime,
      accountId: mutAccountId,
      type: mutType,
      description: mutDescription.trim(),
      amount: mutAmount,
      sourceAccountId: mutType === 'transfer_ke_rekening' ? mutSourceAccountId : undefined
    });

    triggerToast('Mutasi berhasil dicatat!');
    
    // Reset form
    setMutAmount(0);
    setMutDescription('');
    setShowMutModal(false);
  };

  // Delete Account safely
  const handleDeleteAccountConfirm = (acc: BankWalletAccount) => {
    const hasMutations = bankMutations.some(m => m.accountId === acc.id || m.sourceAccountId === acc.id);
    const msg = hasMutations 
      ? `Rekening "${acc.name}" memiliki riwayat transaksi mutasi. Menghapus rekening ini juga akan menghapus riwayat mutasi terkait. Lanjutkan?`
      : `Hapus rekening "${acc.name}"?`;
      
    if (window.confirm(msg)) {
      onDeleteAccount(acc.id);
      triggerToast(`Rekening "${acc.name}" berhasil dihapus.`);
    }
  };

  // Filter and Chronological Sorting of Mutations
  const filteredMutations = useMemo(() => {
    return bankMutations
      .filter(m => {
        if (selectedAccountFilter === 'all') return true;
        return m.accountId === selectedAccountFilter || m.sourceAccountId === selectedAccountFilter;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date); // Newest date first for journal
        return b.time.localeCompare(a.time); // Newest time first
      });
  }, [bankMutations, selectedAccountFilter]);

  // Helper to get friendly type label
  const getMutationTypeBadge = (type: BankWalletMutation['type'], accountName: string, srcAccountName?: string) => {
    switch (type) {
      case 'setor':
        return (
          <span className="inline-flex items-center gap-1 bg-cyan-50 border border-cyan-200 text-cyan-700 px-2 py-0.5 rounded text-[10px] font-semibold">
            <ArrowUpRight className="w-3 h-3" /> Setor dari Kasir
          </span>
        );
      case 'tarik':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded text-[10px] font-semibold">
            <ArrowDownLeft className="w-3 h-3" /> Tarik Tunai ke Kasir
          </span>
        );
      case 'pendapatan_langsung':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-semibold">
            <TrendingUp className="w-3 h-3" /> Transfer Masuk
          </span>
        );
      case 'pengeluaran_langsung':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 rounded text-[10px] font-semibold">
            <TrendingDown className="w-3 h-3" /> Transfer Keluar
          </span>
        );
      case 'transfer_ke_rekening':
        return (
          <span className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-semibold">
            <ArrowRightLeft className="w-3 h-3" /> Transfer Rekening
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-4 font-sans" id="bank-wallet-workspace">
      
      {/* 1. Header Information & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 p-4 rounded-md shadow-xs flex items-center justify-between" id="stat-grand-total">
          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-bold">Total Kas Non-Tunai</div>
            <div className="font-mono text-xl font-black text-slate-900 mt-1">{formatRupiah(stats.grandTotal)}</div>
            <p className="text-[9px] text-slate-400 mt-0.5">Gabungan saldo Bank & E-Wallet</p>
          </div>
          <div className="p-2.5 bg-slate-900 text-white rounded-md">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-md shadow-xs flex items-center justify-between" id="stat-total-bank">
          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-bold">Total Rekening Bank</div>
            <div className="font-mono text-xl font-black text-slate-800 mt-1">{formatRupiah(stats.totalBank)}</div>
            <p className="text-[9px] text-slate-400 mt-0.5">BCA, Mandiri, BRI, dsb.</p>
          </div>
          <div className="p-2.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-md">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-md shadow-xs flex items-center justify-between" id="stat-total-wallet">
          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-bold">Total Saldo E-Wallet</div>
            <div className="font-mono text-xl font-black text-slate-800 mt-1">{formatRupiah(stats.totalWallet)}</div>
            <p className="text-[9px] text-slate-400 mt-0.5">GoPay, ShopeePay, OVO, dsb.</p>
          </div>
          <div className="p-2.5 bg-teal-50 border border-teal-100 text-teal-600 rounded-md">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Linked Cash Info Warning */}
      <div className="bg-slate-900 text-slate-100 border border-slate-800 p-3 rounded-md flex items-start gap-2.5 text-xs">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-cyan-400">Pencatatan Otomatis:</span> Setiap mutasi tipe <span className="font-semibold text-slate-200">"Setor dari Kasir"</span> atau <span className="font-semibold text-slate-200">"Tarik Tunai ke Kasir"</span> akan otomatis dicatat sebagai transaksi pengeluaran/pemasukan kas harian pada hari yang dipilih. Hal ini menjaga agar kalkulasi sisa uang fisik di laci kasir (Kas Harian) selalu akurat dan seimbang!
        </div>
      </div>

      {/* 2. Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Side: Account List */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
            <div className="p-3 border-b border-slate-200 bg-white flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-slate-900">Daftar Rekening</h3>
                <p className="text-[9px] text-slate-400">Kelola rekening Bank & dompet digital</p>
              </div>
              <button
                onClick={() => setShowAccModal(true)}
                className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] px-2 py-1 rounded shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah
              </button>
            </div>

            <div className="p-3 flex flex-col gap-2.5 divide-y divide-slate-100 max-h-[450px] overflow-y-auto">
              {bankAccounts.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Belum ada rekening terdaftar. Silakan tambahkan rekening bank atau e-wallet Anda.
                </div>
              ) : (
                bankAccounts.map((acc, index) => {
                  const currentBal = accountBalances[acc.id] || 0;
                  return (
                    <div key={acc.id} className={`flex items-center justify-between ${index > 0 ? 'pt-2.5' : ''}`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded ${acc.type === 'bank' ? 'bg-blue-50 text-blue-600' : 'bg-teal-50 text-teal-600'}`}>
                          {acc.type === 'bank' ? <Building className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            {acc.name}
                            <span className={`text-[8px] font-bold px-1 rounded-sm uppercase ${
                              acc.type === 'bank' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-teal-50 text-teal-600 border border-teal-100'
                            }`}>
                              {acc.type === 'bank' ? 'Bank' : 'E-Wallet'}
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono">
                            Awal: {formatRupiah(acc.initialBalance)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-xs font-mono font-bold text-slate-900">{formatRupiah(currentBal)}</div>
                        </div>
                        <button
                          onClick={() => handleDeleteAccountConfirm(acc)}
                          className="p-1 hover:text-rose-600 text-slate-300 rounded hover:bg-rose-50/50 transition-colors"
                          title="Hapus rekening"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Ledger / Mutations Journal */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden">
            
            {/* Header with Filter & Add Mutation button */}
            <div className="p-3 border-b border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-slate-500" /> Jurnal & Riwayat Mutasi Rekening
                </h3>
                <p className="text-[9px] text-slate-400">Arsip mutasi uang masuk, keluar, dan pemindahan saldo</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <select
                  value={selectedAccountFilter}
                  onChange={(e) => setSelectedAccountFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-semibold rounded px-2 py-1.5 outline-none cursor-pointer"
                >
                  <option value="all">Semua Rekening</option>
                  {bankAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    // Set default account in dropdown if available
                    if (bankAccounts.length > 0) {
                      setMutAccountId(bankAccounts[0].id);
                      if (bankAccounts.length > 1) {
                        setMutSourceAccountId(bankAccounts[1].id);
                      } else {
                        setMutSourceAccountId(bankAccounts[0].id);
                      }
                    }
                    setShowMutModal(true);
                  }}
                  className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] px-2.5 py-1.5 rounded shadow-xs cursor-pointer active:scale-95 transition-all ml-auto sm:ml-0"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Catat Mutasi Baru
                </button>
              </div>
            </div>

            {/* Mutations Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[9px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="p-3 font-medium">Waktu</th>
                    <th className="p-3 font-medium">Rekening</th>
                    <th className="p-3 font-medium">Tipe Mutasi</th>
                    <th className="p-3 font-medium">Keterangan</th>
                    <th className="p-3 font-medium text-right">Jumlah</th>
                    <th className="p-3 font-medium text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredMutations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Tidak ada riwayat mutasi tercatat untuk filter ini.
                      </td>
                    </tr>
                  ) : (
                    filteredMutations.map((m) => {
                      const accObj = bankAccounts.find(a => a.id === m.accountId);
                      const srcAccObj = m.sourceAccountId ? bankAccounts.find(a => a.id === m.sourceAccountId) : null;
                      
                      // Format account representation
                      let accountDisplay = accObj ? accObj.name : 'Terhapus';
                      if (m.type === 'transfer_ke_rekening') {
                        accountDisplay = `${srcAccObj ? srcAccObj.name : 'Terhapus'} → ${accObj ? accObj.name : 'Terhapus'}`;
                      }

                      // Check direction for color coding
                      let isIncrement = m.type === 'setor' || m.type === 'pendapatan_langsung';
                      let amountSign = isIncrement ? '+' : '-';
                      let amountColor = isIncrement ? 'text-emerald-600' : 'text-slate-700';
                      
                      if (m.type === 'transfer_ke_rekening') {
                        // Transfer is gray as it's an internal movement
                        amountSign = '⇄';
                        amountColor = 'text-indigo-600';
                      } else if (m.type === 'tarik' || m.type === 'pengeluaran_langsung') {
                        amountSign = '-';
                        amountColor = 'text-rose-600';
                      }

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="p-3 text-[10px] text-slate-400 whitespace-nowrap">
                            <div className="font-bold text-slate-600">{getFormattedDate(m.date)}</div>
                            <div className="mt-0.5 font-mono">{m.time}</div>
                          </td>
                          <td className="p-3 font-bold text-slate-800">
                            {accountDisplay}
                          </td>
                          <td className="p-3">
                            {getMutationTypeBadge(m.type, accObj?.name || '', srcAccObj?.name || '')}
                          </td>
                          <td className="p-3 text-slate-500 max-w-xs truncate">
                            {m.description}
                          </td>
                          <td className="p-3 text-right font-mono font-bold whitespace-nowrap">
                            <span className={amountColor}>
                              {amountSign}{formatRupiah(m.amount)}
                            </span>
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => {
                                if (window.confirm('Hapus transaksi mutasi ini? Jika mutasi ini berupa setor/tarik dari Kasir, transaksi penyeimbang kasir juga akan otomatis terhapus.')) {
                                  onDeleteMutation(m.id);
                                  triggerToast('Mutasi berhasil dihapus!');
                                }
                              }}
                              className="p-1 hover:text-rose-600 text-slate-300 rounded hover:bg-rose-50 transition-colors"
                              title="Hapus mutasi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>

      </div>

      {/* ==================== 3. MODALS ==================== */}

      {/* A. ADD ACCOUNT MODAL */}
      {showAccModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-md border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h4 className="text-xs font-black text-slate-900">Tambah Rekening Baru</h4>
                <p className="text-[9px] text-slate-400">Daftarkan Bank atau E-Wallet untuk buku digital</p>
              </div>
              <button onClick={() => setShowAccModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-4 flex flex-col gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tipe Rekening</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccType('bank')}
                    className={`p-2 border rounded flex items-center justify-center gap-1.5 font-bold cursor-pointer transition-all ${
                      accType === 'bank' 
                        ? 'border-slate-800 bg-slate-900 text-white shadow-xs' 
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" /> Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccType('e-wallet')}
                    className={`p-2 border rounded flex items-center justify-center gap-1.5 font-bold cursor-pointer transition-all ${
                      accType === 'e-wallet' 
                        ? 'border-slate-800 bg-slate-900 text-white shadow-xs' 
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" /> E-Wallet
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Rekening</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: BCA Bisnis, ShopeePay Toko, Mandiri"
                  value={accName}
                  onChange={(e) => setAccName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Saldo Awal Saat Ini</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-bold">Rp</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={accInitialBalance || ''}
                    onChange={(e) => setAccInitialBalance(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 pl-8 font-mono text-slate-800 outline-none focus:border-slate-800 focus:bg-white"
                  />
                </div>
                <p className="text-[9px] text-slate-400 mt-1">Saldo yang sudah ada di dalam rekening ini saat ini.</p>
              </div>

              <div className="flex gap-2 justify-end mt-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAccModal(false)}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold px-3.5 py-1.5 rounded cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-1.5 rounded cursor-pointer shadow-xs transition-colors"
                >
                  Simpan Rekening
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. ADD MUTATION MODAL */}
      {showMutModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-md border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h4 className="text-xs font-black text-slate-900">Catat Mutasi / Transaksi Non-Tunai</h4>
                <p className="text-[9px] text-slate-400">Mutasikan kas, transfer antar rekening, atau catat transaksi digital</p>
              </div>
              <button onClick={() => setShowMutModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMutation} className="p-4 flex flex-col gap-3 text-xs">
              
              {/* Row: Date and Time */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={mutDate}
                    onChange={(e) => setMutDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-slate-800 outline-none focus:border-slate-800 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Waktu</label>
                  <input
                    type="time"
                    required
                    value={mutTime}
                    onChange={(e) => setMutTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-slate-800 outline-none focus:border-slate-800 focus:bg-white font-mono"
                  />
                </div>
              </div>

              {/* Mutation Type Select */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Jenis Mutasi / Transaksi</label>
                <select
                  value={mutType}
                  onChange={(e) => {
                    const type = e.target.value as BankWalletMutation['type'];
                    setMutType(type);
                    // Autofills account defaults
                    if (bankAccounts.length > 0) {
                      if (!mutAccountId) setMutAccountId(bankAccounts[0].id);
                      if (!mutSourceAccountId) {
                        if (bankAccounts.length > 1) {
                          setMutSourceAccountId(bankAccounts[0].id);
                          setMutAccountId(bankAccounts[1].id);
                        } else {
                          setMutSourceAccountId(bankAccounts[0].id);
                        }
                      }
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded p-2 outline-none focus:border-slate-800 cursor-pointer font-semibold"
                >
                  <option value="setor">Setor Kasir ke Rekening (Tunai → Digital)</option>
                  <option value="tarik">Tarik Rekening ke Kasir (Digital → Tunai)</option>
                  <option value="pendapatan_langsung">Pendapatan Langsung Digital (Customer transfer)</option>
                  <option value="pengeluaran_langsung">Pengeluaran Langsung Digital (Bayar tagihan/biaya via Rekening)</option>
                  <option value="transfer_ke_rekening">Transfer Antar Rekening (e.g. BCA → GoPay)</option>
                </select>
              </div>

              {/* Conditionals based on type */}
              {mutType === 'transfer_ke_rekening' ? (
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded border border-slate-150">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Rekening Asal (Pengirim)</label>
                    <select
                      value={mutSourceAccountId}
                      onChange={(e) => setMutSourceAccountId(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded p-1.5 outline-none"
                    >
                      <option value="">Pilih Asal...</option>
                      {bankAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Rekening Tujuan (Penerima)</label>
                    <select
                      value={mutAccountId}
                      onChange={(e) => setMutAccountId(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded p-1.5 outline-none"
                    >
                      <option value="">Pilih Tujuan...</option>
                      {bankAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {mutType === 'setor' || mutType === 'pendapatan_langsung' ? 'Rekening Tujuan' : 'Rekening Asal'}
                  </label>
                  <select
                    value={mutAccountId}
                    onChange={(e) => setMutAccountId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded p-2 outline-none focus:border-slate-800"
                  >
                    <option value="">Pilih Rekening...</option>
                    {bankAccounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Amount input */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Jumlah Nominal (Rupiah)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-bold">Rp</span>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Nominal transfer"
                    value={mutAmount || ''}
                    onChange={(e) => setMutAmount(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 pl-8 font-mono text-slate-800 outline-none focus:border-slate-800 focus:bg-white font-bold"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Keterangan / Memo</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Setor omset laci siang, Top-up e-wallet bisnis, dsb."
                  value={mutDescription}
                  onChange={(e) => setMutDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              {/* Help tip based on type */}
              <div className="bg-slate-50 p-2.5 rounded border border-slate-100 text-[10px] text-slate-500 flex gap-2">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  {mutType === 'setor' && "Uang tunai di Kasir berkurang, saldo Rekening bertambah. Buku Kas & Rekening akan disinkronisasikan otomatis."}
                  {mutType === 'tarik' && "Uang di Rekening berkurang, uang tunai di laci Kasir bertambah. Buku Kas & Rekening akan disinkronisasikan otomatis."}
                  {mutType === 'pendapatan_langsung' && "Saldo Rekening bertambah secara digital. Tidak memengaruhi Kasir fisik harian."}
                  {mutType === 'pengeluaran_langsung' && "Saldo Rekening berkurang secara digital. Tidak memengaruhi Kasir fisik harian."}
                  {mutType === 'transfer_ke_rekening' && "Saldo berpindah antar Bank/E-Wallet. Tidak memengaruhi Kasir fisik harian."}
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMutModal(false)}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold px-3.5 py-1.5 rounded cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-1.5 rounded cursor-pointer shadow-xs transition-colors"
                >
                  Catat Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-slate-900 text-white text-xs px-3.5 py-2.5 rounded shadow-lg flex items-center gap-2 border border-slate-800 font-sans animate-bounce">
          <span className={`w-2 h-2 rounded-full shrink-0 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <span className="font-semibold text-slate-100">{toast.message}</span>
        </div>
      )}

    </div>
  );
}
