import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  HeartPulse, 
  Download, 
  Upload, 
  RotateCcw, 
  Calendar, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  AlertCircle,
  HelpCircle,
  FolderSync,
  Cloud,
  LogOut,
  RefreshCw,
  Check,
  Wallet,
  Package,
  Settings,
  Terminal,
  Menu,
  X,
  Home,
  Users,
  Truck,
  Tag,
  BarChart3,
  BookOpen,
  Bell,
  ArrowUpRight,
  ArrowDownLeft,
  Moon,
  Sun
} from 'lucide-react';
import { LocalData, DailyCashSession, Transaction, Receivable, Payable, BankWalletAccount, BankWalletMutation, Product, StockHistory, AppSettings } from './types';
import { getTodayDateString, getFormattedDate, formatRupiah } from './utils/helpers';
import { getInitialData } from './utils/initialData';

// Import Google Auth & Google Sheets Sync Helpers
import { initAuth, googleSignIn, logout, getAccessToken } from './utils/firebaseAuth';
import { findSpreadsheet, createSpreadsheet, syncLocalDataToSheets, downloadDataFromSheets } from './utils/googleSheetsSync';

// Import modules
import DashboardModule from './components/DashboardModule';

// Lazy load non-essential modules to optimize initial load
const CashFlowModule = React.lazy(() => import('./components/CashFlowModule'));
const CreditDebtModule = React.lazy(() => import('./components/CreditDebtModule'));
const BusinessHealthSummary = React.lazy(() => import('./components/BusinessHealthSummary'));
const BankWalletModule = React.lazy(() => import('./components/BankWalletModule'));
const InventoryModule = React.lazy(() => import('./components/InventoryModule'));
const SuperAdminSettingsModule = React.lazy(() => import('./components/SuperAdminSettingsModule'));
const AiAgentModule = React.lazy(() => import('./components/AiAgentModule'));
const PremiumHubModule = React.lazy(() => import('./components/PremiumHubModule'));
const DeveloperConsoleModule = React.lazy(() => import('./components/DeveloperConsoleModule'));

// Visual and high contrast loader for lazy-loaded modules
function ModuleLoader() {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200/80 shadow-xs min-h-[350px]">
      <RefreshCw className="w-8 h-8 text-slate-600 animate-spin mb-3" />
      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider animate-pulse">Memuat Modul SIKU...</span>
      <p className="text-[10px] text-slate-400 font-medium mt-1">Sistem Informasi Keuangan Usaha • Cepat & Efisien</p>
    </div>
  );
}

export default function App() {
  // 1. Core Persistent State
  const [data, setData] = useState<LocalData>(() => {
    const saved = localStorage.getItem('buku_catatan_toko_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.transactions) {
          const loaded = parsed as LocalData;
          // Backfill bank & e-wallet structures if missing
          if (!loaded.bankAccounts) {
            const initial = getInitialData();
            loaded.bankAccounts = initial.bankAccounts || [];
            loaded.bankMutations = initial.bankMutations || [];
          }
          // Backfill product & stock history structures if missing
          if (!loaded.products) {
            const initial = getInitialData();
            loaded.products = initial.products || [];
            loaded.stockHistory = initial.stockHistory || [];
          }
          // Backfill categories & subcategories if missing
          if (!loaded.categories) {
            const initial = getInitialData();
            loaded.categories = initial.categories || [];
            loaded.subcategories = initial.subcategories || [];
          }
          // Backfill settings if missing
          if (!loaded.settings) {
            const initial = getInitialData();
            loaded.settings = initial.settings || {
              shopName: 'Buku Catatan Toko',
              shopAddress: 'Jl. Raya Kemakmuran No. 12, Jakarta',
              shopContact: '081234567890',
              isPremiumActive: false,
              userRole: 'developer'
            };
          }
          if (loaded.settings && !loaded.settings.userRole) {
            loaded.settings.userRole = 'developer';
          }
          return loaded;
        }
      } catch (e) {
        console.error("Failed to parse localStorage data, fallback to initial data", e);
      }
    }
    return getInitialData();
  });

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('buku_catatan_toko_data', JSON.stringify(data));
  }, [data]);

  // Synchronize Dark Mode to Document Element Class
  useEffect(() => {
    const isDark = !!data.settings?.darkMode;
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [data.settings?.darkMode]);

  // 2. Active Date State (defaults to today)
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString);

  // 3. Active Module Tab
  const [activeModule, setActiveModule] = useState<
    | 'dashboard'
    | 'kas'
    | 'stok_barang'
    | 'utang_piutang'
    | 'summary'
    | 'ai_agent'
    | 'barang_master'
    | 'kategori'
    | 'pelanggan'
    | 'supplier'
    | 'laporan'
    | 'jurnal'
    | 'settings'
    | 'premium_hub'
    | 'developer_console'
    | 'bank_wallet'
  >('dashboard');

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inventoryTab, setInventoryTab] = useState<'list' | 'history' | 'categories'>('list');
  const [creditDebtTab, setCreditDebtTab] = useState<'piutang' | 'utang'>('piutang');

  const getActiveModuleLabel = () => {
    switch (activeModule) {
      case 'dashboard': return '🏠 Dashboard';
      case 'kas': return '💰 Kas Harian';
      case 'bank_wallet': return '🏦 Bank & E-Wallet';
      case 'barang':
        return inventoryTab === 'categories' ? '🏷️ Kategori Master' : '📦 Stok Barang';
      case 'utang_piutang':
        return creditDebtTab === 'utang' ? '🚚 Utang Supplier' : '👥 Piutang Pelanggan';
      case 'summary': return '📊 Laporan & Kesehatan';
      case 'ai_agent': return '🤖 Asisten AI';
      case 'premium_hub': return '🏆 Layanan Premium';
      case 'settings': return '⚙️ Pengaturan Super Admin';
      case 'developer_console': return '🛠 Developer Console';
      default: return 'Buku Catatan Toko';
    }
  };

  // Safety redirect: If the active module is developer_console but the role is no longer developer, bounce to dashboard
  useEffect(() => {
    if (activeModule === 'developer_console' && data.settings?.userRole !== 'developer') {
      setActiveModule('dashboard');
    }
  }, [activeModule, data.settings?.userRole]);

  // 4. File import reference
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 4b. Google Sheets Sync & Auth State
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem('google_sheets_last_sync_time');
  });
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => {
    return localStorage.getItem('google_sheets_spreadsheet_id');
  });

  // Track authentication status
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setSyncStatus('Menghubungkan ke Google...');
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setSyncStatus('Terhubung!');
        setTimeout(() => setSyncStatus(''), 3000);
      }
    } catch (error: any) {
      console.error(error);
      alert(`Gagal masuk Google: ${error.message || error}`);
      setSyncStatus('');
    }
  };

  const handleGoogleLogout = async () => {
    if (window.confirm('Keluar dari Google Sheets?')) {
      await logout();
      setUser(null);
      setAccessToken(null);
      setSyncStatus('');
    }
  };

  const handleBackupToSheets = async () => {
    let token = accessToken;
    if (!token) {
      try {
        setSyncStatus('Menghubungkan ke Google...');
        const result = await googleSignIn();
        if (result) {
          setUser(result.user);
          setAccessToken(result.accessToken);
          token = result.accessToken;
        }
      } catch (error: any) {
        console.error(error);
        alert(`Gagal masuk Google: ${error.message || error}`);
        setSyncStatus('');
        return;
      }
    }

    if (!token) {
      alert('Token tidak tersedia. Silakan hubungkan akun Google Anda terlebih dahulu.');
      return;
    }

    setIsSyncing(true);
    setSyncStatus('Mencari file spreadsheet...');
    try {
      let currentId = spreadsheetId;
      if (!currentId) {
        currentId = await findSpreadsheet(token);
      }

      if (!currentId) {
        setSyncStatus('Membuat spreadsheet baru...');
        currentId = await createSpreadsheet(token);
        setSpreadsheetId(currentId);
        localStorage.setItem('google_sheets_spreadsheet_id', currentId);
      }

      setSyncStatus('Mengunggah data ke Google Sheets...');
      await syncLocalDataToSheets(token, currentId, data);

      const nowStr = new Date().toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
      setLastSyncTime(nowStr);
      localStorage.setItem('google_sheets_last_sync_time', nowStr);
      
      setSyncStatus('Berhasil sinkronisasi!');
      setTimeout(() => setSyncStatus(''), 3000);
    } catch (err: any) {
      console.error('Error backing up to Sheets:', err);
      alert(`Gagal mencadangkan data ke Google Sheets: ${err.message || err}`);
      setSyncStatus('');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestoreFromSheets = async () => {
    let token = accessToken;
    if (!token) {
      try {
        setSyncStatus('Menghubungkan ke Google...');
        const result = await googleSignIn();
        if (result) {
          setUser(result.user);
          setAccessToken(result.accessToken);
          token = result.accessToken;
        }
      } catch (error: any) {
        console.error(error);
        alert(`Gagal masuk Google: ${error.message || error}`);
        setSyncStatus('');
        return;
      }
    }

    if (!token) {
      alert('Token tidak tersedia. Silakan hubungkan akun Google Anda terlebih dahulu.');
      return;
    }

    if (!window.confirm('Apakah Anda yakin ingin memulihkan data dari Google Sheets? Tindakan ini akan menimpa seluruh data lokal Anda saat ini.')) {
      return;
    }

    setIsSyncing(true);
    setSyncStatus('Mencari file spreadsheet...');
    try {
      const currentId = await findSpreadsheet(token);
      if (!currentId) {
        alert('File cadangan di Google Sheets tidak ditemukan. Pastikan Anda telah melakukan ekspor minimal sekali sebelumnya.');
        setSyncStatus('');
        return;
      }

      setSyncStatus('Mengunduh data...');
      const remoteData = await downloadDataFromSheets(token, currentId);
      setData(remoteData);

      setSyncStatus('Berhasil memulihkan data!');
      setTimeout(() => setSyncStatus(''), 3000);
    } catch (err: any) {
      console.error('Error restoring from Sheets:', err);
      alert(`Gagal memulihkan data dari Google Sheets: ${err.message || err}`);
      setSyncStatus('');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestoreAllData = (restoredData: any) => {
    setData((prev) => ({
      ...prev,
      products: restoredData.products || prev.products,
      transactions: restoredData.transactions || prev.transactions,
      receivables: restoredData.receivables || prev.receivables,
      payables: restoredData.payables || prev.payables,
      settings: {
        ...prev.settings,
        ...(restoredData.settings || {}),
        isPremiumActive: true
      }
    }));
  };

  // Ensure current date has a session initialized
  const currentSession = useMemo(() => {
    const existing = data.sessions[selectedDate];
    if (existing) return existing;

    // Quality of life: search for the closest previous session to copy petty cash and opening cash
    const previousDates = Object.keys(data.sessions)
      .filter((d) => d < selectedDate)
      .sort();

    let fallbackPetty = 150000;
    let fallbackPhysical = 150000;

    if (previousDates.length > 0) {
      const closestPastDate = previousDates[previousDates.length - 1];
      const closestSess = data.sessions[closestPastDate];
      if (closestSess) {
        fallbackPetty = closestSess.openingPettyCash;
        // The closing physical cash of yesterday is the perfect opening physical cash for today!
        fallbackPhysical = closestSess.closingPhysicalCash !== undefined 
          ? closestSess.closingPhysicalCash 
          : closestSess.openingPhysicalCash;
      }
    }

    return {
      date: selectedDate,
      openingPettyCash: fallbackPetty,
      openingPhysicalCash: fallbackPhysical,
    };
  }, [data.sessions, selectedDate]);

  // Effect to automatically persist the auto-initialized session so children find it
  useEffect(() => {
    if (!data.sessions[selectedDate]) {
      setData((prev) => ({
        ...prev,
        sessions: {
          ...prev.sessions,
          [selectedDate]: currentSession,
        },
      }));
    }
  }, [selectedDate, currentSession, data.sessions]);

  // 5. Handlers for Cash Sessions
  const handleUpdateSession = (date: string, updates: Partial<DailyCashSession>) => {
    setData((prev) => {
      const existing = prev.sessions[date] || {
        date,
        openingPettyCash: 150000,
        openingPhysicalCash: 150000,
      };
      return {
        ...prev,
        sessions: {
          ...prev.sessions,
          [date]: {
            ...existing,
            ...updates,
          } as DailyCashSession,
        },
      };
    });
  };

  // 6. Handlers for Transactions
  const handleAddTransaction = (newTx: Omit<Transaction, 'id' | 'date'>) => {
    const txId = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const tx: Transaction = {
      ...newTx,
      id: txId,
      date: selectedDate,
    };
    setData((prev) => {
      let updatedProducts = prev.products || [];
      let updatedStockHistory = prev.stockHistory || [];

      if (newTx.productId && newTx.productQty && newTx.type === 'masuk') {
        const qty = Number(newTx.productQty);
        updatedProducts = updatedProducts.map((p) => {
          if (p.id === newTx.productId) {
            return {
              ...p,
              stock: Math.max(0, p.stock - qty),
            };
          }
          return p;
        });

        const newStockHist: StockHistory = {
          id: `st-tx-${txId}`,
          productId: newTx.productId,
          date: selectedDate,
          time: newTx.time,
          type: 'keluar',
          quantity: qty,
          notes: `Penjualan Kas: ${newTx.description || 'Barang terjual'}`,
        };
        updatedStockHistory = [newStockHist, ...updatedStockHistory];
      }

      return {
        ...prev,
        transactions: [tx, ...prev.transactions],
        products: updatedProducts,
        stockHistory: updatedStockHistory,
      };
    });
  };

  const handleDeleteTransaction = (id: string) => {
    setData((prev) => {
      const txToDelete = prev.transactions.find((t) => t.id === id);
      let updatedProducts = prev.products || [];
      let updatedStockHistory = prev.stockHistory || [];

      if (txToDelete && txToDelete.productId && txToDelete.productQty && txToDelete.type === 'masuk') {
        const qty = Number(txToDelete.productQty);
        updatedProducts = updatedProducts.map((p) => {
          if (p.id === txToDelete.productId) {
            return {
              ...p,
              stock: p.stock + qty,
            };
          }
          return p;
        });
        updatedStockHistory = updatedStockHistory.filter((sh) => sh.id !== `st-tx-${id}`);
      }

      return {
        ...prev,
        transactions: prev.transactions.filter((t) => t.id !== id),
        products: updatedProducts,
        stockHistory: updatedStockHistory,
      };
    });
  };

  // 7. Handlers for Receivables (Piutang)
  const handleAddReceivable = (item: Omit<Receivable, 'id'>) => {
    const rec: Receivable = {
      ...item,
      id: `rec-${Date.now()}`,
    };
    setData((prev) => ({
      ...prev,
      receivables: [rec, ...prev.receivables],
    }));
  };

  const handleUpdateReceivable = (id: string, updates: Partial<Receivable>) => {
    setData((prev) => ({
      ...prev,
      receivables: prev.receivables.map((r) => r.id === id ? { ...r, ...updates } as Receivable : r),
    }));
  };

  const handleDeleteReceivable = (id: string) => {
    setData((prev) => ({
      ...prev,
      receivables: prev.receivables.filter((r) => r.id !== id),
    }));
  };

  // 8. Handlers for Payables (Utang)
  const handleAddPayable = (item: Omit<Payable, 'id'>) => {
    const pay: Payable = {
      ...item,
      id: `pay-${Date.now()}`,
    };
    setData((prev) => ({
      ...prev,
      payables: [pay, ...prev.payables],
    }));
  };

  const handleUpdatePayable = (id: string, updates: Partial<Payable>) => {
    setData((prev) => ({
      ...prev,
      payables: prev.payables.map((p) => p.id === id ? { ...p, ...updates } as Payable : p),
    }));
  };

  const handleDeletePayable = (id: string) => {
    setData((prev) => ({
      ...prev,
      payables: prev.payables.filter((p) => p.id !== id),
    }));
  };

  // 8b. Handlers for Bank & E-Wallet Accounts and Mutations
  const handleAddBankMutation = (mutation: Omit<BankWalletMutation, 'id'>) => {
    const mutId = `mut-${Date.now()}`;
    const newMut: BankWalletMutation = {
      ...mutation,
      id: mutId,
    };

    setData((prev) => {
      const updatedMutations = [newMut, ...(prev.bankMutations || [])];
      let updatedTransactions = [...prev.transactions];

      // If it's a mutation involving physical Kas (setor Kas -> Rekening or tarik Rekening -> Kas), sync to Cash Flow
      if (mutation.type === 'setor' || mutation.type === 'tarik') {
        const account = (prev.bankAccounts || []).find(a => a.id === mutation.accountId);
        const accountName = account ? account.name : 'Rekening';
        
        const tx: Transaction = {
          id: `tx-mut-${mutId}`,
          date: mutation.date,
          time: mutation.time,
          description: mutation.type === 'setor' 
            ? `[Mutasi Keluar] Setor Kas ke ${accountName}: ${mutation.description}`
            : `[Mutasi Masuk] Tarik Tunai dari ${accountName}: ${mutation.description}`,
          type: mutation.type === 'setor' ? 'keluar' : 'masuk',
          category: 'insidental',
          amount: mutation.amount,
        };
        updatedTransactions = [tx, ...updatedTransactions];
      }

      return {
        ...prev,
        bankMutations: updatedMutations,
        transactions: updatedTransactions,
      };
    });
  };

  const handleDeleteBankMutation = (id: string) => {
    setData((prev) => {
      const updatedMutations = (prev.bankMutations || []).filter(m => m.id !== id);
      // Also delete the linked Cash Flow transaction if it exists
      const updatedTransactions = prev.transactions.filter(t => t.id !== `tx-mut-${id}`);
      return {
        ...prev,
        bankMutations: updatedMutations,
        transactions: updatedTransactions,
      };
    });
  };

  const handleAddBankAccount = (account: Omit<BankWalletAccount, 'id'>) => {
    const newAcc: BankWalletAccount = {
      ...account,
      id: `acc-${Date.now()}`,
    };
    setData((prev) => ({
      ...prev,
      bankAccounts: [...(prev.bankAccounts || []), newAcc],
    }));
  };

  const handleUpdateBankAccount = (id: string, updates: Partial<BankWalletAccount>) => {
    setData((prev) => ({
      ...prev,
      bankAccounts: (prev.bankAccounts || []).map(a => a.id === id ? { ...a, ...updates } as BankWalletAccount : a),
    }));
  };

  const handleDeleteBankAccount = (id: string) => {
    setData((prev) => ({
      ...prev,
      bankAccounts: (prev.bankAccounts || []).filter(a => a.id !== id),
      bankMutations: (prev.bankMutations || []).filter(m => m.accountId !== id && m.sourceAccountId !== id),
    }));
  };

  // 8c. Handlers for Merchandise & Stock (Barang Dagangan)
  const handleAddProduct = (product: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...product,
      id: `prod-${Date.now()}`,
    };
    setData((prev) => ({
      ...prev,
      products: [...(prev.products || []), newProd],
    }));
  };

  const handleUpdateProduct = (id: string, updates: Partial<Product>) => {
    setData((prev) => ({
      ...prev,
      products: (prev.products || []).map(p => p.id === id ? { ...p, ...updates } as Product : p),
    }));
  };

  const handleDeleteProduct = (id: string) => {
    setData((prev) => ({
      ...prev,
      products: (prev.products || []).filter(p => p.id !== id),
      stockHistory: (prev.stockHistory || []).filter(h => h.productId !== id),
    }));
  };

  const handleAddStockHistory = (history: Omit<StockHistory, 'id'>) => {
    const newHist: StockHistory = {
      ...history,
      id: `st-${Date.now()}`,
    };
    setData((prev) => {
      const updatedProducts = (prev.products || []).map(p => {
        if (p.id === history.productId) {
          let newStock = p.stock;
          if (history.type === 'masuk') {
            newStock = p.stock + history.quantity;
          } else if (history.type === 'keluar') {
            newStock = Math.max(0, p.stock - history.quantity);
          } else if (history.type === 'penyesuaian') {
            newStock = history.quantity; // opname sets absolute value
          }
          return { ...p, stock: newStock };
        }
        return p;
      });

      const updatedHistory = [newHist, ...(prev.stockHistory || [])];
      return {
        ...prev,
        products: updatedProducts,
        stockHistory: updatedHistory,
      };
    });
  };

  const handleAddCategory = (name: string) => {
    const newCat = {
      id: `cat-${Date.now()}`,
      name: name.trim()
    };
    setData((prev) => ({
      ...prev,
      categories: [...(prev.categories || []), newCat]
    }));
    return newCat;
  };

  const handleAddSubcategory = (categoryId: string, name: string) => {
    const newSub = {
      id: `sub-${Date.now()}`,
      categoryId,
      name: name.trim()
    };
    setData((prev) => ({
      ...prev,
      subcategories: [...(prev.subcategories || []), newSub]
    }));
    return newSub;
  };

  const handleDeleteCategory = (id: string) => {
    setData((prev) => ({
      ...prev,
      categories: (prev.categories || []).filter(c => c.id !== id),
      subcategories: (prev.subcategories || []).filter(s => s.categoryId !== id)
    }));
  };

  const handleDeleteSubcategory = (id: string) => {
    setData((prev) => ({
      ...prev,
      subcategories: (prev.subcategories || []).filter(s => s.id !== id)
    }));
  };

  const handleUpdateSettings = (updates: Partial<AppSettings>) => {
    setData((prev) => ({
      ...prev,
      settings: prev.settings ? { ...prev.settings, ...updates } : {
        shopName: 'Buku Catatan Toko',
        shopAddress: 'Jl. Raya Kemakmuran No. 12, Jakarta',
        shopContact: '081234567890',
        isPremiumActive: false,
        ...updates
      }
    }));
  };

  // 9. Day Swiping
  const adjustDateByDays = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const dateStr = d.toISOString().split('T')[0];
    setSelectedDate(dateStr);
  };

  // 10. Backup & Restore logic
  const handleExportData = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `buku_catatan_toko_backup_${selectedDate}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === 'object' && parsed.transactions && parsed.sessions) {
          setData(parsed);
          alert('Berhasil memulihkan data dari file cadangan!');
        } else {
          alert('Format berkas backup tidak valid.');
        }
      } catch (err) {
        alert('Gagal membaca berkas cadangan. Pastikan format file adalah JSON.');
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  const handleResetToDefault = () => {
    if (window.confirm('Apakah Anda yakin ingin menyetel ulang data? Seluruh catatan yang Anda buat akan dihapus dan diganti dengan data contoh.')) {
      setData(getInitialData());
    }
  };

  // Fast statistics for Header bar
  const quickHeaderStats = useMemo(() => {
    const activeDayTx = data.transactions.filter((t) => t.date === selectedDate);
    
    const dailyIncome = activeDayTx
      .filter((t) => t.type === 'masuk')
      .reduce((sum, t) => sum + t.amount, 0);

    const dailyExpense = activeDayTx
      .filter((t) => t.type === 'keluar')
      .reduce((sum, t) => sum + t.amount, 0);

    const bookBalance = (data.sessions[selectedDate]?.openingPhysicalCash ?? 150000) + dailyIncome - dailyExpense;

    const remainingPiutang = data.receivables
      .filter((r) => r.status !== 'lunas')
      .reduce((sum, r) => sum + (r.amount - r.paidAmount), 0);

    return {
      dailyIncome,
      dailyExpense,
      bookBalance,
      remainingPiutang,
    };
  }, [data, selectedDate]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased selection:bg-slate-200 selection:text-slate-950">
      {/* HEADER SECTION */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs" id="app-header">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center gap-4">
          
          {/* Hamburger Menu & Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 hover:bg-slate-100 text-slate-700 rounded-md transition-colors cursor-pointer shrink-0"
              id="sidebar-toggle-btn"
              title="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Store Branding */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 bg-slate-800 text-white rounded-md flex items-center justify-center shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5 flex-wrap">
                  <span className="truncate">{data.settings?.shopName || 'Buku Catatan Toko'}</span>
                  <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-700 font-bold px-1.5 py-0.2 rounded uppercase shrink-0">
                    {data.settings?.isPremiumActive ? '🏆 Premium' : 'Minimalis'}
                  </span>
                </h1>
                <p className="text-[10px] text-slate-400 font-medium leading-none mt-1 truncate">
                  {data.settings?.shopAddress || data.settings?.shopContact ? (
                    <>
                      {data.settings?.shopAddress && <span>📍 {data.settings.shopAddress}</span>}
                      {data.settings?.shopAddress && data.settings?.shopContact && <span className="mx-1.5">•</span>}
                      {data.settings?.shopContact && <span>📞 {data.settings.shopContact}</span>}
                    </>
                  ) : (
                    'Kesehatan finansial dan kedisiplinan arus kas toko Anda'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Header Actions (Quick Dark Mode & Module Indicator) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Active Module Indicator */}
            <div className="hidden md:flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200/50 uppercase tracking-wider select-none">
              {getActiveModuleLabel()}
            </div>

            {/* Quick Dark Mode Toggle Button */}
            <button
              onClick={() => handleUpdateSettings({ darkMode: !data.settings?.darkMode })}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer flex items-center justify-center border border-slate-200/40"
              title={data.settings?.darkMode ? "Aktifkan Mode Terang" : "Aktifkan Mode Gelap"}
              id="header-theme-quick-toggle"
            >
              {data.settings?.darkMode ? (
                <Sun className="w-4 h-4 text-amber-500 fill-amber-100" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 fill-indigo-100" />
              )}
            </button>
          </div>

        </div>
      </header>

      {/* SCROLLABLE UTILITIES & STATS */}
      <div className="bg-white border-b border-slate-200" id="scrollable-header-utilities">
        <div className="max-w-7xl mx-auto px-4 py-2.5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            
            {/* Google Sheets Sync Control Panel */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs w-full md:w-auto md:max-w-md" id="google-sheets-sync-panel">
              {user ? (
                <div className="flex items-center justify-between gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-1.5">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        className="w-5 h-5 rounded-full border border-slate-300"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-800 text-white font-bold text-[9px] flex items-center justify-center">
                        {(user.displayName || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="leading-none">
                      <p className="text-[9px] font-bold text-slate-700">{user.displayName || 'Terhubung'}</p>
                      <p className="text-[8px] text-slate-400 font-mono mt-0.5">
                        {syncStatus ? (
                          <span className="text-emerald-600 font-bold animate-pulse">{syncStatus}</span>
                        ) : lastSyncTime ? (
                          `Selesai: ${lastSyncTime}`
                        ) : (
                          'Belum pernah sinkron'
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleBackupToSheets}
                      disabled={isSyncing}
                      className="text-[9px] bg-slate-800 hover:bg-slate-900 text-white font-bold py-1 px-2 rounded flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                      title="Sinkronisasikan data ke Google Sheets"
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      Ekspor
                    </button>
                    <button
                      onClick={handleRestoreFromSheets}
                      disabled={isSyncing}
                      className="text-[9px] bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-1 px-2 rounded flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                      title="Pulihkan data dari Google Sheets"
                    >
                      <Download className="w-2.5 h-2.5" />
                      Impor
                    </button>
                    <button
                      onClick={handleGoogleLogout}
                      className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Keluar dari Google"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 w-full md:w-auto">
                  <div className="text-left">
                    <p className="text-[9px] font-bold text-slate-700 flex items-center gap-1">
                      <Cloud className="w-3 h-3 text-emerald-600" /> Google Sheets Cloud Sync
                    </p>
                    <p className="text-[8px] text-slate-400 leading-tight">Cadangkan data utang piutang, WA, & kas</p>
                  </div>
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isSyncing}
                    className="text-[9px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-2 rounded flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  >
                    Hubungkan
                  </button>
                </div>
              )}
            </div>

            {/* Date Swiper / Picker */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md border border-slate-200/80 w-full md:w-auto" id="date-swiper">
              <button 
                onClick={() => adjustDateByDays(-1)}
                className="p-1 hover:bg-white text-slate-600 hover:text-slate-950 rounded transition-colors cursor-pointer"
                title="Kemarin"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 px-1.5">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span className="font-mono">{getFormattedDate(selectedDate)}</span>
                {selectedDate === getTodayDateString() && (
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold px-1 py-0.2 rounded uppercase">Hari Ini</span>
                )}
              </div>

              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="opacity-0 absolute w-0 h-0"
                id="hidden-date-picker"
              />
              <button 
                onClick={() => document.getElementById('hidden-date-picker')?.click()}
                className="text-[9px] bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-0.5 px-1.5 rounded transition-colors cursor-pointer"
              >
                Pilih
              </button>

              <button 
                onClick={() => adjustDateByDays(1)}
                className="p-1 hover:bg-white text-slate-600 hover:text-slate-950 rounded transition-colors cursor-pointer"
                title="Besok"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          {/* Quick Header Mini Dashboard Stats (High Density) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 pt-2 border-t border-slate-100">
            <div className="bg-slate-50/70 p-2 rounded-md border border-slate-200/60">
              <div className="text-[9px] text-slate-400 font-mono uppercase tracking-wider font-semibold">Omset Hari Ini</div>
              <div className="font-mono text-xs font-bold text-emerald-600 mt-0.5">+{formatRupiah(quickHeaderStats.dailyIncome)}</div>
            </div>
            <div className="bg-slate-50/70 p-2 rounded-md border border-slate-200/60">
              <div className="text-[9px] text-slate-400 font-mono uppercase tracking-wider font-semibold">Keluar Hari Ini</div>
              <div className="font-mono text-xs font-bold text-rose-600 mt-0.5">-{formatRupiah(quickHeaderStats.dailyExpense)}</div>
            </div>
            <div className="bg-slate-50/70 p-2 rounded-md border border-slate-200/60">
              <div className="text-[9px] text-slate-400 font-mono uppercase tracking-wider font-semibold">Catatan Buku Kas</div>
              <div className="font-mono text-xs font-bold text-slate-700 mt-0.5">{formatRupiah(quickHeaderStats.bookBalance)}</div>
            </div>
            <div className="bg-slate-50/70 p-2 rounded-md border border-slate-200/60">
              <div className="text-[9px] text-slate-400 font-mono uppercase tracking-wider font-semibold">Tagihan Piutang</div>
              <div className="font-mono text-xs font-bold text-amber-600 mt-0.5">{formatRupiah(quickHeaderStats.remainingPiutang)}</div>
            </div>
          </div>

        </div>
      </div>

      {/* CORE MODULE NAVIGATOR */}
      <div className="max-w-7xl mx-auto px-4 pt-3 w-full flex-1 flex flex-col">
        
        {/* Active Module Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 mb-4 select-none" id="active-module-header">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-800 uppercase tracking-tight">
              {getActiveModuleLabel()}
            </span>
          </div>
          {activeModule !== 'dashboard' && (
            <button
              onClick={() => setActiveModule('dashboard')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-200/60 shadow-2xs transition-all cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Kembali ke Dashboard</span>
            </button>
          )}
        </div>

        {/* ACTIVE WORKSPACE / MODULE VIEW */}
        <main className="flex-1 pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.1 }}
              className="h-full"
            >
              <React.Suspense fallback={<ModuleLoader />}>
                {activeModule === 'dashboard' && (
                  <DashboardModule
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    session={data.sessions[selectedDate]}
                    transactions={data.transactions}
                    receivables={data.receivables}
                    payables={data.payables}
                    onUpdateSession={handleUpdateSession}
                    onNavigate={(module) => {
                      if (module === 'kas') {
                        setActiveModule('kas');
                      } else if (module === 'stok_barang' || module === 'barang') {
                        setActiveModule('barang');
                        setInventoryTab('list');
                      } else if (module === 'utang_piutang' || module === 'piutang') {
                        setActiveModule('utang_piutang');
                        setCreditDebtTab('piutang');
                      } else if (module === 'utang') {
                        setActiveModule('utang_piutang');
                        setCreditDebtTab('utang');
                      } else if (module === 'summary') {
                        setActiveModule('summary');
                      } else if (module === 'settings') {
                        setActiveModule('settings');
                      } else {
                        setActiveModule(module as any);
                      }
                    }}
                    currentUser={user || { displayName: data.settings?.shopName || 'Pemilik Toko', email: '' }}
                    adjustDateByDays={adjustDateByDays}
                    getTodayDateString={getTodayDateString}
                  />
                )}

                {activeModule === 'kas' && (
                  <CashFlowModule
                    selectedDate={selectedDate}
                    session={data.sessions[selectedDate]}
                    transactions={data.transactions}
                    onUpdateSession={handleUpdateSession}
                    onAddTransaction={handleAddTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                    products={data.products || []}
                  />
                )}

                {activeModule === 'bank_wallet' && (
                  <BankWalletModule
                    selectedDate={selectedDate}
                    bankAccounts={data.bankAccounts || []}
                    bankMutations={data.bankMutations || []}
                    onAddMutation={handleAddBankMutation}
                    onDeleteMutation={handleDeleteBankMutation}
                    onAddAccount={handleAddBankAccount}
                    onUpdateAccount={handleUpdateBankAccount}
                    onDeleteAccount={handleDeleteBankAccount}
                  />
                )}

                {activeModule === 'barang' && (
                  <InventoryModule
                    selectedDate={selectedDate}
                    products={data.products || []}
                    stockHistory={data.stockHistory || []}
                    onAddProduct={handleAddProduct}
                    onUpdateProduct={handleUpdateProduct}
                    onDeleteProduct={handleDeleteProduct}
                    onAddStockHistory={handleAddStockHistory}
                    bankAccounts={data.bankAccounts || []}
                    onAddBankMutation={handleAddBankMutation}
                    onAddTransaction={handleAddTransaction}
                    categories={data.categories || []}
                    subcategories={data.subcategories || []}
                    onAddCategory={handleAddCategory}
                    onAddSubcategory={handleAddSubcategory}
                    onDeleteCategory={handleDeleteCategory}
                    onDeleteSubcategory={handleDeleteSubcategory}
                    defaultTab={inventoryTab}
                  />
                )}

                {activeModule === 'utang_piutang' && (
                  <CreditDebtModule
                    receivables={data.receivables}
                    payables={data.payables}
                    onAddReceivable={handleAddReceivable}
                    onUpdateReceivable={handleUpdateReceivable}
                    onDeleteReceivable={handleDeleteReceivable}
                    onAddPayable={handleAddPayable}
                    onUpdatePayable={handleUpdatePayable}
                    onDeletePayable={handleDeletePayable}
                    defaultTab={creditDebtTab}
                  />
                )}

                {activeModule === 'summary' && (
                  <BusinessHealthSummary
                    selectedDate={selectedDate}
                    sessions={data.sessions}
                    transactions={data.transactions}
                    onUpdateSession={handleUpdateSession}
                    settings={data.settings}
                  />
                )}

                {activeModule === 'ai_agent' && (
                  <AiAgentModule
                    settings={data.settings || {
                      shopName: 'Buku Catatan Toko',
                      shopAddress: 'Jl. Raya Kemakmuran No. 12, Jakarta',
                      shopContact: '081234567890',
                      isPremiumActive: false
                    }}
                    products={data.products || []}
                    transactions={data.transactions || []}
                    receivables={data.receivables || []}
                    payables={data.payables || []}
                    onActivatePremium={() => handleUpdateSettings({ isPremiumActive: true })}
                    onGoToSettings={() => setActiveModule('settings')}
                    onAddTransaction={handleAddTransaction}
                  />
                )}

                {activeModule === 'premium_hub' && (
                  <PremiumHubModule
                    settings={data.settings || {
                      shopName: 'Buku Catatan Toko',
                      shopAddress: 'Jl. Raya Kemakmuran No. 12, Jakarta',
                      shopContact: '081234567890',
                      isPremiumActive: false
                    }}
                    products={data.products || []}
                    transactions={data.transactions || []}
                    receivables={data.receivables || []}
                    payables={data.payables || []}
                    onActivatePremium={() => handleUpdateSettings({ isPremiumActive: true })}
                    onGoToSettings={() => setActiveModule('settings')}
                    onAddTransaction={handleAddTransaction}
                    onRestoreAllData={handleRestoreAllData}
                  />
                )}

                {activeModule === 'settings' && (
                  <SuperAdminSettingsModule
                    settings={data.settings || {
                      shopName: 'Buku Catatan Toko',
                      shopAddress: 'Jl. Raya Kemakmuran No. 12, Jakarta',
                      shopContact: '081234567890',
                      isPremiumActive: false
                    }}
                    onUpdateSettings={handleUpdateSettings}
                    categories={data.categories || []}
                    subcategories={data.subcategories || []}
                    onAddCategory={handleAddCategory}
                    onAddSubcategory={handleAddSubcategory}
                    onDeleteCategory={handleDeleteCategory}
                    onDeleteSubcategory={handleDeleteSubcategory}
                  />
                )}

                {activeModule === 'developer_console' && data.settings?.userRole === 'developer' && (
                  <DeveloperConsoleModule
                    settings={data.settings || {
                      shopName: 'Buku Catatan Toko',
                      shopAddress: 'Jl. Raya Kemakmuran No. 12, Jakarta',
                      shopContact: '081234567890',
                      isPremiumActive: false,
                      userRole: 'developer'
                    }}
                    onUpdateSettings={handleUpdateSettings}
                    currentUser={user}
                  />
                )}
              </React.Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* FOOTER & DATA SECURITY MANAGEMENT */}
      <footer className="bg-white border-t border-slate-200 py-3 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-3 text-[10px] text-slate-400">
          <div>
            <p>© {new Date().getFullYear()} Buku Catatan Toko Minimalis • Berjalan secara lokal & aman.</p>
          </div>

          {/* Backup & Restore Panel */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              ref={fileInputRef}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded text-[10px] transition-all cursor-pointer font-medium text-slate-600"
              title="Pulihkan cadangan dari file JSON"
            >
              <Upload className="w-3 h-3" /> Pulihkan Data
            </button>

            <button
              onClick={handleExportData}
              className="inline-flex items-center gap-1 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-100/50 border border-slate-200 px-2.5 py-1 rounded text-[10px] transition-all cursor-pointer font-medium text-slate-600"
              title="Unduh cadangan data toko dalam format JSON"
            >
              <Download className="w-3 h-3" /> Ekspor Cadangan
            </button>

            <button
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1 hover:text-rose-700 bg-slate-50 hover:bg-rose-100/50 border border-slate-200 px-2.5 py-1 rounded text-[10px] transition-all cursor-pointer font-medium text-rose-600/80"
              title="Kembalikan data ke awal (data contoh)"
            >
              <RotateCcw className="w-3 h-3" /> Atur Ulang (Reset)
            </button>
          </div>
        </div>
      </footer>

      {/* SIDEBAR NAVIGATION DRAWER */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-slate-950/40 z-50 cursor-pointer"
              id="sidebar-backdrop"
            />

            {/* Sidebar drawer container */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 bottom-0 left-0 w-72 bg-white border-r border-slate-200 shadow-2xl z-50 flex flex-col h-full font-sans overflow-hidden"
              id="app-sidebar"
            >
              {/* Sidebar Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 bg-slate-800 text-white rounded-md flex items-center justify-center shrink-0">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xs font-bold text-slate-900 tracking-tight truncate">
                      {data.settings?.shopName || 'Buku Catatan Toko'}
                    </h2>
                    <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-600 font-bold px-1.5 py-0.2 rounded uppercase mt-0.5 inline-block shrink-0">
                      {data.settings?.isPremiumActive ? '🏆 Premium Active' : 'Minimalis'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-md transition-all cursor-pointer shrink-0"
                  title="Tutup Menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sidebar Navigation Items - Scrollable */}
              <div className="flex-1 overflow-y-auto p-3 space-y-4 select-none scrollbar-thin scrollbar-thumb-slate-200">
                
                {/* 1. DASHBOARD */}
                <div>
                  <button
                    onClick={() => {
                      setActiveModule('dashboard');
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold transition-all text-left cursor-pointer ${
                      activeModule === 'dashboard'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    <span>🏠 Dashboard</span>
                  </button>
                </div>

                <hr className="border-slate-100" />

                {/* 2. TRANSAKSI GROUP */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 tracking-wider px-3 uppercase block mb-1">Transaksi</span>
                  
                  <button
                    onClick={() => {
                      setActiveModule('kas');
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold transition-all text-left cursor-pointer ${
                      activeModule === 'kas'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Coins className="w-4 h-4" />
                    <span>💰 Kas</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveModule('bank_wallet');
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold transition-all text-left cursor-pointer ${
                      activeModule === 'bank_wallet'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    <span>🏦 Bank & E-Wallet</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveModule('barang');
                      setInventoryTab('list');
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold transition-all text-left cursor-pointer ${
                      activeModule === 'barang' && inventoryTab === 'list'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>📦 Stok Barang</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveModule('utang_piutang');
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold transition-all text-left cursor-pointer ${
                      activeModule === 'utang_piutang'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <FolderSync className="w-4 h-4" />
                    <span>💳 Utang Piutang</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveModule('summary');
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold transition-all text-left cursor-pointer ${
                      activeModule === 'summary'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <HeartPulse className="w-4 h-4" />
                    <span>❤️ Kesehatan Toko</span>
                  </button>
                </div>

                <hr className="border-slate-100" />

                {/* 3. AI GROUP */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 tracking-wider px-3 uppercase block mb-1">AI</span>
                  
                  <button
                    onClick={() => {
                      setActiveModule('ai_agent');
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold transition-all text-left cursor-pointer ${
                      activeModule === 'ai_agent'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className={`w-4 h-4 ${data.settings?.isPremiumActive ? 'text-amber-500 fill-amber-500 animate-pulse' : 'text-slate-400'}`} />
                    <span>🤖 Asisten AI</span>
                    {data.settings?.isPremiumActive && (
                      <span className="ml-auto text-[8px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-bold uppercase tracking-wider">PRO</span>
                    )}
                  </button>
                </div>

                <hr className="border-slate-100" />

                {/* 4. MASTER GROUP */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 tracking-wider px-3 uppercase block mb-1">Master</span>
                  
                  <button
                    onClick={() => {
                      setActiveModule('barang');
                      setInventoryTab('list');
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold transition-all text-left cursor-pointer ${
                      activeModule === 'barang' && inventoryTab === 'list'
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Package className="w-4 h-4 text-slate-500" />
                    <span>📦 Barang</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveModule('barang');
                      setInventoryTab('categories');
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold transition-all text-left cursor-pointer ${
                      activeModule === 'barang' && inventoryTab === 'categories'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Tag className="w-4 h-4" />
                    <span>🏷️ Kategori</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveModule('utang_piutang');
                      setCreditDebtTab('piutang');
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold transition-all text-left cursor-pointer ${
                      activeModule === 'utang_piutang' && creditDebtTab === 'piutang'
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-4 h-4 text-slate-500" />
                    <span>👥 Pelanggan</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveModule('utang_piutang');
                      setCreditDebtTab('utang');
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold transition-all text-left cursor-pointer ${
                      activeModule === 'utang_piutang' && creditDebtTab === 'utang'
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Truck className="w-4 h-4 text-slate-500" />
                    <span>🚚 Supplier</span>
                  </button>
                </div>

                <hr className="border-slate-100" />

                {/* 5. LAPORAN GROUP */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 tracking-wider px-3 uppercase block mb-1">Laporan</span>
                  
                  <button
                    onClick={() => {
                      setActiveModule('summary');
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold transition-all text-left cursor-pointer ${
                      activeModule === 'summary'
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 text-slate-500" />
                    <span>📊 Laporan</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveModule('kas');
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold transition-all text-left cursor-pointer ${
                      activeModule === 'kas'
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-slate-500" />
                    <span>📒 Jurnal</span>
                  </button>
                </div>

                <hr className="border-slate-100" />

                {/* 6. PENGATURAN GROUP */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 tracking-wider px-3 uppercase block mb-1">Pengaturan</span>
                  
                  <button
                    onClick={() => {
                      setActiveModule('settings');
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold transition-all text-left cursor-pointer ${
                      activeModule === 'settings'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>⚙️ Pengaturan</span>
                  </button>

                  {data.settings?.userRole === 'developer' && (
                    <button
                      onClick={() => {
                        setActiveModule('developer_console');
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold transition-all text-left cursor-pointer ${
                        activeModule === 'developer_console'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800'
                      }`}
                    >
                      <Terminal className="w-4 h-4" />
                      <span>🛠 Developer Console</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setActiveModule('premium_hub');
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-bold transition-all text-left cursor-pointer ${
                      activeModule === 'premium_hub'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>💎 Layanan Premium</span>
                  </button>
                </div>

              </div>

              {/* Sidebar Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
                <span>v1.0 SIKU</span>
                <span>Offline-first & Aman</span>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
