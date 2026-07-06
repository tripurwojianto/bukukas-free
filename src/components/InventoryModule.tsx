import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  History, 
  DollarSign, 
  X, 
  Info, 
  Check, 
  AlertCircle,
  BarChart2,
  FileSpreadsheet,
  Layers,
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Settings
} from 'lucide-react';
import { Product, StockHistory, BankWalletAccount, BankWalletMutation, Transaction, ProductCategory, ProductSubcategory } from '../types';
import { formatRupiah, getFormattedDate } from '../utils/helpers';

interface InventoryModuleProps {
  selectedDate: string;
  products: Product[];
  stockHistory: StockHistory[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (id: string, updates: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
  onAddStockHistory: (history: Omit<StockHistory, 'id'>) => void;
  bankAccounts: BankWalletAccount[];
  onAddBankMutation: (mutation: Omit<BankWalletMutation, 'id'>) => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
  categories: ProductCategory[];
  subcategories: ProductSubcategory[];
  onAddCategory: (name: string) => ProductCategory;
  onAddSubcategory: (categoryId: string, name: string) => ProductSubcategory;
  onDeleteCategory: (id: string) => void;
  onDeleteSubcategory: (id: string) => void;
  defaultTab?: 'list' | 'history' | 'categories';
}

export default function InventoryModule({
  selectedDate,
  products,
  stockHistory,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddStockHistory,
  bankAccounts,
  onAddBankMutation,
  onAddTransaction,
  categories,
  subcategories,
  onAddCategory,
  onAddSubcategory,
  onDeleteCategory,
  onDeleteSubcategory,
  defaultTab
}: InventoryModuleProps) {
  // Navigation tab within the module: 'list' or 'history' or 'categories'
  const [activeTab, setActiveTab] = useState<'list' | 'history' | 'categories'>(defaultTab || 'list');

  React.useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'safe'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [isGeneralAdjust, setIsGeneralAdjust] = useState(false);

  // Add/Edit Product form state
  const [prodSku, setProdSku] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodUnit, setProdUnit] = useState('Pcs');
  const [prodCostPrice, setProdCostPrice] = useState<number>(0);
  const [prodSellingPrice, setProdSellingPrice] = useState<number>(0);
  const [prodMinStock, setProdMinStock] = useState<number>(5);
  const [prodInitialStock, setProdInitialStock] = useState<number>(0);
  const [prodCategory, setProdCategory] = useState<string>('');
  const [prodSubcategory, setProdSubcategory] = useState<string>('');

  // On-the-fly category/subcategory creation inside modal
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewSubcategoryInput, setShowNewSubcategoryInput] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');

  // Adjust Stock form state
  const [adjType, setAdjType] = useState<'masuk' | 'keluar' | 'penyesuaian'>('masuk');
  const [adjQuantity, setAdjQuantity] = useState<number>(0);
  const [adjNotes, setAdjNotes] = useState('');
  // Search state for product selector
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  // Financial integration options
  const [syncFinance, setSyncFinance] = useState(false);
  const [paymentSource, setPaymentSource] = useState<'cash' | string>('cash'); // 'cash' or bank account ID

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 1. Calculations & Dashboard Metrics
  const stats = useMemo(() => {
    let totalItems = products.length;
    let totalStockUnits = 0;
    let lowStockCount = 0;
    let totalAssetCost = 0; // Asset Value (stock * costPrice)
    let totalAssetRetail = 0; // Selling Value (stock * sellingPrice)

    products.forEach(p => {
      totalStockUnits += p.stock;
      const minStock = p.minStock !== undefined ? p.minStock : 5;
      if (p.stock <= minStock) {
        lowStockCount++;
      }
      totalAssetCost += p.stock * p.costPrice;
      totalAssetRetail += p.stock * p.sellingPrice;
    });

    const potentialProfit = totalAssetRetail - totalAssetCost;

    return {
      totalItems,
      totalStockUnits,
      lowStockCount,
      totalAssetCost,
      totalAssetRetail,
      potentialProfit
    };
  }, [products]);

  // 2. Filter & Search implementation
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchCategory = categoryFilter === 'all' || p.categoryId === categoryFilter;

      const minStock = p.minStock !== undefined ? p.minStock : 5;
      const matchStock = stockFilter === 'all' || 
        (stockFilter === 'low' && p.stock <= minStock) ||
        (stockFilter === 'safe' && p.stock > minStock);

      return matchSearch && matchCategory && matchStock;
    });
  }, [products, searchTerm, stockFilter, categoryFilter]);

  // 3. Stock movement history mapping
  const sortedHistory = useMemo(() => {
    return [...stockHistory].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date); // newest date first
      return b.time.localeCompare(a.time); // newest time first
    });
  }, [stockHistory]);

  // 4. Save Product (Create or Edit)
  const handleSaveProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!prodName.trim()) {
      triggerToast('Nama barang harus diisi', 'error');
      return;
    }

    if (prodCostPrice < 0 || prodSellingPrice < 0) {
      triggerToast('Harga tidak boleh bernilai negatif', 'error');
      return;
    }

    const payload = {
      sku: prodSku.trim() || undefined,
      name: prodName.trim(),
      stock: editingProduct ? editingProduct.stock : (prodInitialStock || 0),
      costPrice: prodCostPrice || 0,
      sellingPrice: prodSellingPrice || 0,
      minStock: prodMinStock,
      unit: prodUnit.trim() || 'Pcs',
      categoryId: prodCategory || undefined,
      subcategoryId: prodSubcategory || undefined
    };

    if (editingProduct) {
      // Edit mode
      onUpdateProduct(editingProduct.id, payload);
      triggerToast(`Barang "${prodName}" berhasil diperbarui!`);
    } else {
      // Add mode
      onAddProduct(payload);
      
      // If there's initial stock, also log it to stockHistory
      if (prodInitialStock > 0) {
        // Wait briefly for product to be added or use standard delay
        setTimeout(() => {
          // Find the created product or just log it
          const lastCreated = products[products.length - 1];
          // We trigger stock log for initial setup
          onAddStockHistory({
            productId: `prod-${Date.now()}`, // fallback or handled by state
            date: selectedDate,
            time: '08:00',
            type: 'masuk',
            quantity: prodInitialStock,
            price: prodCostPrice,
            notes: `Stok awal barang baru: ${prodName.trim()}`
          });
        }, 100);
      }

      triggerToast(`Barang "${prodName}" berhasil didaftarkan!`);
    }

    // Reset Form & Close Modal
    setProdSku('');
    setProdName('');
    setProdUnit('Pcs');
    setProdCostPrice(0);
    setProdSellingPrice(0);
    setProdMinStock(5);
    setProdInitialStock(0);
    setProdCategory('');
    setProdSubcategory('');
    setShowNewCategoryInput(false);
    setNewCategoryName('');
    setShowNewSubcategoryInput(false);
    setNewSubcategoryName('');
    setEditingProduct(null);
    setShowAddModal(false);
  };

  // Open Edit Product Modal
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setProdSku(p.sku || '');
    setProdName(p.name);
    setProdUnit(p.unit);
    setProdCostPrice(p.costPrice);
    setProdSellingPrice(p.sellingPrice);
    setProdMinStock(p.minStock !== undefined ? p.minStock : 5);
    setProdCategory(p.categoryId || '');
    setProdSubcategory(p.subcategoryId || '');
    setShowAddModal(true);
  };

  // Open Stock Adjust Modal
  const handleOpenAdjust = (p: Product, initialType: 'masuk' | 'keluar' | 'penyesuaian' = 'masuk') => {
    setAdjustingProduct(p);
    setIsGeneralAdjust(false);
    setAdjType(initialType);
    setAdjQuantity(0);
    setAdjNotes('');
    setSyncFinance(false);
    setPaymentSource('cash');
    setProductSearchQuery(p.name);
    setShowProductDropdown(false);
    setShowAdjustModal(true);
  };

  // Open General Stock Adjust Modal for quick manual stock out
  const handleOpenGeneralAdjust = () => {
    setIsGeneralAdjust(true);
    setAdjustingProduct(null);
    setAdjType('keluar'); // default to 'keluar' for manual stock out
    setAdjQuantity(0);
    setAdjNotes('');
    setSyncFinance(false);
    setPaymentSource('cash');
    setProductSearchQuery('');
    setShowProductDropdown(false);
    setShowAdjustModal(true);
  };

  // Handle Stock Adjustment Submit
  const handleAdjustStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!adjustingProduct) {
      triggerToast('Pilih barang terlebih dahulu melalui kolom pencarian di atas', 'error');
      return;
    }

    if (adjQuantity <= 0) {
      triggerToast('Nominal jumlah harus lebih besar dari 0', 'error');
      return;
    }

    if (adjType === 'keluar' && adjQuantity > adjustingProduct.stock) {
      triggerToast(`Stok tidak mencukupi. Stok saat ini ${adjustingProduct.stock} ${adjustingProduct.unit}`, 'error');
      return;
    }

    if (!adjNotes.trim()) {
      triggerToast('Memo atau alasan penyesuaian harus ditulis', 'error');
      return;
    }

    const now = new Date();
    const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // 1. Save stock history (automatically updates product stock state via handlers)
    onAddStockHistory({
      productId: adjustingProduct.id,
      date: selectedDate,
      time: timeString,
      type: adjType,
      quantity: adjQuantity,
      price: adjType === 'masuk' ? adjustingProduct.costPrice : adjustingProduct.sellingPrice,
      notes: adjNotes.trim()
    });

    // 2. Cohesive financial integration if toggled
    if (syncFinance) {
      const calculatedAmount = adjQuantity * (adjType === 'masuk' ? adjustingProduct.costPrice : adjustingProduct.sellingPrice);
      const isExpense = adjType === 'masuk'; // Restocking is a cash outflow, Selling is cash inflow

      const financialMemo = isExpense
        ? `[Restock Barang] Beli ${adjQuantity} ${adjustingProduct.unit} ${adjustingProduct.name}: ${adjNotes.trim()}`
        : `[Penjualan Barang] Jual ${adjQuantity} ${adjustingProduct.unit} ${adjustingProduct.name}: ${adjNotes.trim()}`;

      if (paymentSource === 'cash') {
        // Record on cashier cash flow (Kas Harian)
        onAddTransaction({
          time: timeString,
          description: financialMemo,
          type: isExpense ? 'keluar' : 'masuk',
          category: 'rutin',
          amount: calculatedAmount,
          hpp: isExpense ? undefined : (adjQuantity * adjustingProduct.costPrice) // Record HPP to track margins
        });
      } else {
        // Record on selected Bank/E-Wallet account
        const accObj = bankAccounts.find(a => a.id === paymentSource);
        onAddBankMutation({
          date: selectedDate,
          time: timeString,
          accountId: paymentSource,
          type: isExpense ? 'pengeluaran_langsung' : 'pendapatan_langsung',
          description: financialMemo,
          amount: calculatedAmount
        });
      }
      triggerToast(`Stok disesuaikan & finansial sebesar ${formatRupiah(calculatedAmount)} otomatis dicatat!`);
    } else {
      triggerToast('Perubahan stok berhasil disimpan!');
    }

    setShowAdjustModal(false);
    setAdjustingProduct(null);
  };

  // Safe delete product confirmation
  const handleDeleteProductConfirm = (p: Product) => {
    const hasHistory = stockHistory.some(h => h.productId === p.id);
    const msg = hasHistory
      ? `Apakah Anda yakin ingin menghapus "${p.name}"? Ini juga akan menghapus seluruh riwayat mutasi stok terkait barang ini.`
      : `Hapus barang "${p.name}" dari buku dagangan?`;

    if (window.confirm(msg)) {
      onDeleteProduct(p.id);
      triggerToast(`Barang "${p.name}" berhasil dihapus.`);
    }
  };

  return (
    <div className="flex flex-col gap-4 font-sans" id="inventory-workspace">
      
      {/* 1. Dashboard Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 p-3.5 rounded-md shadow-xs flex items-center justify-between" id="stat-total-sku">
          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-bold">Total Macam Barang (SKU)</div>
            <div className="font-mono text-lg lg:text-xl font-black text-slate-900 mt-1">{stats.totalItems} Barang</div>
            <p className="text-[8px] text-slate-400 mt-0.5">Jumlah varian produk dagang</p>
          </div>
          <div className="p-2 bg-slate-900 text-white rounded hidden sm:block">
            <Layers className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-md shadow-xs flex items-center justify-between" id="stat-total-stock-units">
          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-bold">Total Stok Terhitung</div>
            <div className="font-mono text-lg lg:text-xl font-black text-slate-800 mt-1">
              {stats.totalStockUnits} Unit
            </div>
            {stats.lowStockCount > 0 ? (
              <span className="inline-flex items-center gap-0.5 text-[9px] text-rose-600 font-bold mt-0.5 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-100">
                <AlertCircle className="w-2.5 h-2.5" /> {stats.lowStockCount} Menipis!
              </span>
            ) : (
              <p className="text-[8px] text-emerald-600 font-bold mt-0.5">● Semua stok aman</p>
            )}
          </div>
          <div className="p-2 bg-slate-50 text-slate-600 border border-slate-200 rounded hidden sm:block">
            <Package className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-md shadow-xs flex items-center justify-between" id="stat-asset-cost">
          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-bold">Total Nilai Aset (HPP)</div>
            <div className="font-mono text-lg lg:text-xl font-black text-slate-800 mt-1">
              {formatRupiah(stats.totalAssetCost)}
            </div>
            <p className="text-[8px] text-slate-400 mt-0.5">Kalkulasi: jumlah stok × harga beli</p>
          </div>
          <div className="p-2 bg-blue-50 text-blue-600 border border-blue-100 rounded hidden sm:block">
            <DollarSign className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-md shadow-xs flex items-center justify-between" id="stat-potential-margin">
          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-bold">Estimasi Profit Margin Stok</div>
            <div className="font-mono text-lg lg:text-xl font-black text-emerald-600 mt-1">
              {formatRupiah(stats.potentialProfit)}
            </div>
            <p className="text-[8px] text-slate-400 mt-0.5">Jika seluruh stok habis terjual</p>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded hidden sm:block">
            <TrendingUp className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* 2. Inner Module Sub-tabs Navigation */}
      <div className="bg-white border border-slate-200 rounded-md p-1.5 flex gap-1.5 shadow-xs" id="inventory-sub-nav">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 sm:flex-initial px-4 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'list'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Katalog & Stok Barang
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 sm:flex-initial px-4 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <History className="w-3.5 h-3.5" /> Log Riwayat Mutasi Stok
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex-1 sm:flex-initial px-4 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'categories'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Settings className="w-3.5 h-3.5" /> Kelola Kategori & Sub-Kategori
        </button>
      </div>

      {/* 3. Render Tabs Content */}
      {activeTab === 'list' && (
        <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden" id="inventory-list-tab">
          
          {/* List Search & Control Header */}
          <div className="p-3.5 border-b border-slate-200 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-white">
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <h3 className="text-xs font-bold text-slate-900">Buku Barang Dagangan & Harga Jual</h3>
              <p className="text-[9px] text-slate-400">Atur harga beli (HPP), harga eceran, dan amankan batas minimum stok toko Anda</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
              {/* Search Bar */}
              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama / SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded pl-8 pr-3 py-1.5 text-xs text-slate-700 outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              {/* Stock Filter dropdown */}
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-bold rounded px-2 py-2 outline-none cursor-pointer"
              >
                <option value="all">Semua Stok</option>
                <option value="low">⚠️ Stok Menipis / Habis</option>
                <option value="safe">✓ Stok Aman</option>
              </select>

              {/* Category Filter dropdown */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-bold rounded px-2 py-2 outline-none cursor-pointer"
              >
                <option value="all">Semua Kategori</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              {/* Quick Record Stock Out Button */}
              <button
                onClick={handleOpenGeneralAdjust}
                className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 font-bold text-[11px] px-3 py-2 rounded shadow-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
                title="Catat pemakaian bahan baku atau barang keluar manual"
              >
                <ArrowDownLeft className="w-4 h-4 text-rose-600 animate-pulse" /> Catat Barang Keluar
              </button>

              {/* Add New Product Button */}
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProdSku('');
                  setProdName('');
                  setProdUnit('Pcs');
                  setProdCostPrice(0);
                  setProdSellingPrice(0);
                  setProdMinStock(5);
                  setProdInitialStock(0);
                  setShowAddModal(true);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] px-3 py-2 rounded shadow-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Tambah Barang
              </button>
            </div>
          </div>

          {/* Quick Category Badge Filters */}
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none" id="inventory-category-quick-filters">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0 font-mono">
              <Layers className="w-3.5 h-3.5 text-slate-400" /> Kategori:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  categoryFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-600'
                }`}
              >
                Semua ({products.length})
              </button>
              {categories.map((cat) => {
                const count = products.filter(p => p.categoryId === cat.id).length;
                const isSelected = categoryFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-600'
                    }`}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catalog Products Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[9px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="p-3 font-medium">SKU / Kode</th>
                  <th className="p-3 font-medium">Nama Barang</th>
                  <th className="p-3 font-medium text-center">Stok Saat Ini</th>
                  <th className="p-3 font-medium text-right">Harga Beli (HPP)</th>
                  <th className="p-3 font-medium text-right">Harga Jual</th>
                  <th className="p-3 font-medium text-center">Margin Margin</th>
                  <th className="p-3 font-medium text-center">Tindakan Stok</th>
                  <th className="p-3 font-medium text-right">Kelola</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      {searchTerm ? 'Barang yang Anda cari tidak ditemukan.' : 'Buku barang dagangan Anda masih kosong. Silakan daftarkan barang baru.'}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const minStock = p.minStock !== undefined ? p.minStock : 5;
                    const isLowStock = p.stock <= minStock;
                    const margin = p.sellingPrice - p.costPrice;
                    const marginPercent = p.costPrice > 0 ? ((margin / p.costPrice) * 100).toFixed(0) : '0';

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="p-3 font-mono text-[10px] text-slate-400 font-bold">
                          {p.sku || <span className="italic text-slate-300">tanpa kode</span>}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-slate-800">{p.name}</span>
                            {isLowStock && (
                              <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-700 border border-amber-500/20 text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                Stok Minim (Min: {minStock})
                              </span>
                            )}
                          </div>
                          <div className="text-[9px] text-slate-400 mt-0.5">Satuan: {p.unit}</div>
                          {p.categoryId && (
                            <div className="text-[9px] mt-1 text-slate-500 font-medium flex flex-wrap gap-1">
                              <span className="bg-slate-100 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[8px] font-bold">
                                {categories.find(c => c.id === p.categoryId)?.name || 'Kategori Terhapus'}
                              </span>
                              {p.subcategoryId && (
                                <span className="bg-cyan-50 border border-cyan-100 text-cyan-700 px-1.5 py-0.5 rounded text-[8px] font-bold">
                                  {subcategories.find(s => s.id === p.subcategoryId)?.name || 'Subkategori Terhapus'}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <span className={`inline-flex flex-col items-center justify-center font-mono font-bold px-2 py-1 rounded min-w-[50px] ${
                            p.stock === 0
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : isLowStock
                                ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                                : 'bg-slate-100 text-slate-800'
                          }`}>
                            <span>{p.stock} {p.unit}</span>
                            {isLowStock && (
                              <span className="text-[7px] uppercase font-black tracking-tight text-rose-600 mt-0.5">
                                {p.stock === 0 ? 'Habis' : 'Menipis'}
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono text-slate-600">
                          {formatRupiah(p.costPrice)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(p.sellingPrice)}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-100">
                            {formatRupiah(margin)} ({marginPercent}%)
                          </span>
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenAdjust(p, 'masuk')}
                              className="inline-flex items-center gap-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition-colors"
                              title="Tambah Stok Masuk / Kulakan"
                            >
                              <ArrowUpRight className="w-3 h-3" /> + Masuk
                            </button>
                            <button
                              onClick={() => handleOpenAdjust(p, 'keluar')}
                              className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition-colors"
                              title="Catat Stok Keluar / Pemakaian Bahan"
                            >
                              <ArrowDownLeft className="w-3 h-3" /> - Keluar
                            </button>
                          </div>
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1 text-slate-400 hover:text-slate-800 rounded hover:bg-slate-100 transition-colors"
                              title="Edit Detail Barang"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProductConfirm(p)}
                              className="p-1 text-slate-300 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                              title="Hapus Barang"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Help alert information */}
          <div className="p-3 bg-slate-50 border-t border-slate-150 text-[10px] text-slate-400 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-500">Kalkulasi Aset:</p>
              Setiap kali Anda mendaftarkan barang dagangan dengan margin, sistem dapat melacak total nilai modal belanja yang tertanam di toko Anda (HPP). Batasi minimum stok yang realistis agar Anda menerima notifikasi visual saat persediaan barang mulai menipis sehingga Anda dapat kulakan sebelum kehabisan!
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-md shadow-xs overflow-hidden" id="inventory-history-tab">
          
          {/* History Header */}
          <div className="p-3 border-b border-slate-200 flex justify-between items-center bg-white">
            <div>
              <h3 className="text-xs font-bold text-slate-900">Arsip & Log Mutasi Stok Barang</h3>
              <p className="text-[9px] text-slate-400">Jurnal audit kronologis untuk pelacakan opname, barang masuk (kulakan), dan keluar</p>
            </div>
          </div>

          {/* History Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[9px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="p-3 font-medium">Waktu</th>
                  <th className="p-3 font-medium">Barang Dagangan</th>
                  <th className="p-3 font-medium text-center">Tipe Mutasi</th>
                  <th className="p-3 font-medium text-center">Jumlah Perubahan</th>
                  <th className="p-3 font-medium text-right">Harga Unit Saat Itu</th>
                  <th className="p-3 font-medium text-right">Total Nilai</th>
                  <th className="p-3 font-medium">Memo / Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {sortedHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Belum ada riwayat mutasi stok terekam. Silakan lakukan penyesuaian stok.
                    </td>
                  </tr>
                ) : (
                  sortedHistory.map((h) => {
                    const prodObj = products.find(p => p.id === h.productId);
                    const prodName = prodObj ? prodObj.name : 'Barang Terhapus';
                    const prodUnit = prodObj ? prodObj.unit : 'Unit';

                    // Format Badge
                    let typeBadge = null;
                    let qtyColor = 'text-slate-800';
                    let qtyPrefix = '';

                    if (h.type === 'masuk') {
                      typeBadge = (
                        <span className="inline-flex items-center gap-0.5 bg-cyan-50 border border-cyan-200 text-cyan-700 px-1.5 py-0.5 rounded text-[9px] font-bold">
                          <ArrowUpRight className="w-2.5 h-2.5" /> Masuk / Kulakan
                        </span>
                      );
                      qtyColor = 'text-cyan-700 font-black';
                      qtyPrefix = '+';
                    } else if (h.type === 'keluar') {
                      typeBadge = (
                        <span className="inline-flex items-center gap-0.5 bg-rose-50 border border-rose-200 text-rose-700 px-1.5 py-0.5 rounded text-[9px] font-bold">
                          <ArrowDownLeft className="w-2.5 h-2.5" /> Keluar / Jual
                        </span>
                      );
                      qtyColor = 'text-rose-700 font-black';
                      qtyPrefix = '-';
                    } else {
                      typeBadge = (
                        <span className="inline-flex items-center gap-0.5 bg-slate-100 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[9px] font-bold">
                          Penyesuaian Opname
                        </span>
                      );
                      qtyColor = 'text-slate-800 font-black';
                      qtyPrefix = '⇄ ';
                    }

                    const unitPrice = h.price || 0;
                    const totalVal = h.quantity * unitPrice;

                    return (
                      <tr key={h.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="p-3 text-[10px] text-slate-400 whitespace-nowrap">
                          <div className="font-bold text-slate-600">{getFormattedDate(h.date)}</div>
                          <div className="mt-0.5 font-mono">{h.time}</div>
                        </td>
                        <td className="p-3 font-bold text-slate-800">
                          {prodName}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          {typeBadge}
                        </td>
                        <td className={`p-3 text-center font-mono font-bold whitespace-nowrap ${qtyColor}`}>
                          {qtyPrefix}{h.quantity} {prodUnit}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-500">
                          {unitPrice > 0 ? formatRupiah(unitPrice) : '-'}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-800">
                          {totalVal > 0 ? formatRupiah(totalVal) : '-'}
                        </td>
                        <td className="p-3 text-slate-500 max-w-xs truncate" title={h.notes}>
                          {h.notes}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {activeTab === 'categories' && (
        <div className="bg-slate-50 border border-slate-200 rounded-md shadow-xs p-4 flex flex-col gap-4" id="inventory-categories-tab">
          
          {/* Header & Add Category Bar */}
          <div className="bg-white border border-slate-200 p-4 rounded-md shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900">Pengaturan Kategori & Sub-Kategori</h3>
              <p className="text-[9px] text-slate-400">Buat klasifikasi baju pria, gamis, bahan pangan, terigu, dsb. untuk kerapian laporan</p>
            </div>
            
            {/* Inline Add Category */}
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="text"
                placeholder="Nama kategori baru (misal: Baju Pria)"
                id="direct-new-category-name"
                className="bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-slate-800 focus:bg-white w-full md:w-64"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.currentTarget;
                    if (input.value.trim()) {
                      onAddCategory(input.value.trim());
                      triggerToast(`Kategori "${input.value.trim()}" berhasil dibuat!`);
                      input.value = '';
                    } else {
                      triggerToast('Nama kategori tidak boleh kosong', 'error');
                    }
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.getElementById('direct-new-category-name') as HTMLInputElement;
                  if (input && input.value.trim()) {
                    onAddCategory(input.value.trim());
                    triggerToast(`Kategori "${input.value.trim()}" berhasil dibuat!`);
                    input.value = '';
                  } else {
                    triggerToast('Nama kategori tidak boleh kosong', 'error');
                  }
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-1.5 rounded cursor-pointer shrink-0"
              >
                + Kategori
              </button>
            </div>
          </div>

          {/* Categories Bento Grid */}
          {categories.length === 0 ? (
            <div className="bg-white border border-slate-200 p-8 rounded text-center text-slate-400 text-xs">
              Belum ada kategori yang dibuat. Masukkan nama kategori di atas untuk memulai.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => {
                const catSubs = subcategories.filter(s => s.categoryId === cat.id);
                return (
                  <div key={cat.id} className="bg-white border border-slate-200 rounded-md shadow-xs p-3.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
                    <div>
                      {/* Category Card Title */}
                      <div className="flex justify-between items-start pb-2 border-b border-slate-100">
                        <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-slate-900 rounded-full"></span>
                          {cat.name}
                        </span>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus kategori "${cat.name}" beserta seluruh sub-kategorinya?`)) {
                              onDeleteCategory(cat.id);
                              triggerToast(`Kategori "${cat.name}" berhasil dihapus`);
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer rounded hover:bg-slate-50 transition-colors"
                          title="Hapus Kategori"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Subcategories List */}
                      <div className="py-3 flex flex-col gap-1.5 min-h-[80px]">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Sub-Kategori ({catSubs.length}):</span>
                        {catSubs.length === 0 ? (
                          <span className="text-[10px] text-slate-400 italic">Belum ada sub-kategori</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {catSubs.map((sub) => (
                              <span
                                key={sub.id}
                                className="inline-flex items-center gap-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer group"
                                onClick={() => {
                                  if (confirm(`Hapus sub-kategori "${sub.name}"?`)) {
                                    onDeleteSubcategory(sub.id);
                                    triggerToast(`Sub-kategori "${sub.name}" berhasil dihapus`);
                                  }
                                }}
                                title="Klik untuk menghapus sub-kategori"
                              >
                                {sub.name}
                                <X className="w-2.5 h-2.5 text-slate-400 group-hover:text-rose-500 transition-colors" />
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Add Subcategory field inside Category Card */}
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex gap-1">
                        <input
                          type="text"
                          placeholder={`Sub baru (misal: ${cat.name === 'Terigu' ? 'Segitiga Biru' : cat.name === 'Baju Pria' ? 'Gamis' : 'Pcs'})`}
                          id={`new-sub-input-${cat.id}`}
                          className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-[11px] text-slate-700 outline-none focus:border-slate-800 focus:bg-white w-full"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const input = e.currentTarget;
                              if (input.value.trim()) {
                                onAddSubcategory(cat.id, input.value.trim());
                                triggerToast(`Sub-kategori "${input.value.trim()}" ditambahkan ke ${cat.name}!`);
                                input.value = '';
                              } else {
                                triggerToast('Nama sub-kategori tidak boleh kosong', 'error');
                              }
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            const input = document.getElementById(`new-sub-input-${cat.id}`) as HTMLInputElement;
                            if (input && input.value.trim()) {
                              onAddSubcategory(cat.id, input.value.trim());
                              triggerToast(`Sub-kategori "${input.value.trim()}" ditambahkan ke ${cat.name}!`);
                              input.value = '';
                            } else {
                              triggerToast('Nama sub-kategori tidak boleh kosong', 'error');
                            }
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] px-2.5 py-1 rounded cursor-pointer shrink-0"
                        >
                          + Sub
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ==================== 4. MODALS ==================== */}

      {/* A. ADD OR EDIT PRODUCT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-md border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h4 className="text-xs font-black text-slate-900">
                  {editingProduct ? 'Perbarui Detail Barang Dagang' : 'Pendaftaran Barang Dagangan Baru'}
                </h4>
                <p className="text-[9px] text-slate-400">
                  {editingProduct ? 'Edit info produk, SKU, dan batas minimum stok' : 'Tambahkan macam barang baru untuk buku digital'}
                </p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProductSubmit} className="p-4 flex flex-col gap-3 text-xs">
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">SKU / Kode Barang (Opsional)</label>
                  <input
                    type="text"
                    placeholder="E.g., IND-GR-01"
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 outline-none focus:border-slate-800 focus:bg-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Satuan Kemasan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pcs, Kg, Box, Pouch"
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 outline-none focus:border-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Lengkap Barang</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Minyak Goreng Filma 2 Liter"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              {/* Category & Subcategory Selection */}
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded flex flex-col gap-2">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kategori Barang</label>
                    {!showNewCategoryInput && (
                      <button
                        type="button"
                        onClick={() => setShowNewCategoryInput(true)}
                        className="text-[9px] font-bold text-slate-900 hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        <Plus className="w-2.5 h-2.5" /> Kategori Baru
                      </button>
                    )}
                  </div>
                  
                  {showNewCategoryInput ? (
                    <div className="flex gap-1.5 items-center bg-white p-1 rounded border border-slate-300">
                      <input
                        type="text"
                        placeholder="Contoh: Baju Pria, Terigu"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-150 rounded px-2 py-1 text-slate-800 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newCategoryName.trim()) {
                            const newCat = onAddCategory(newCategoryName.trim());
                            setProdCategory(newCat.id);
                            setNewCategoryName('');
                            setShowNewCategoryInput(false);
                            triggerToast(`Kategori "${newCat.name}" berhasil dibuat!`);
                          } else {
                            triggerToast('Nama kategori tidak boleh kosong', 'error');
                          }
                        }}
                        className="bg-slate-900 text-white font-bold px-2 py-1 rounded text-[10px] cursor-pointer"
                      >
                        Simpan
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewCategoryInput(false);
                          setNewCategoryName('');
                        }}
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <select
                      value={prodCategory}
                      onChange={(e) => {
                        setProdCategory(e.target.value);
                        setProdSubcategory(''); // Reset subcategory when category changes
                      }}
                      className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 outline-none focus:border-slate-800 cursor-pointer"
                    >
                      <option value="">-- Pilih Kategori --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sub-Kategori</label>
                    {prodCategory && !showNewSubcategoryInput && (
                      <button
                        type="button"
                        onClick={() => setShowNewSubcategoryInput(true)}
                        className="text-[9px] font-bold text-slate-900 hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        <Plus className="w-2.5 h-2.5" /> Sub-Kategori Baru
                      </button>
                    )}
                  </div>

                  {!prodCategory ? (
                    <p className="text-[9px] text-slate-400 italic">Pilih kategori terlebih dahulu</p>
                  ) : showNewSubcategoryInput ? (
                    <div className="flex gap-1.5 items-center bg-white p-1 rounded border border-slate-300">
                      <input
                        type="text"
                        placeholder="Contoh: Gamis, Segitiga Biru"
                        value={newSubcategoryName}
                        onChange={(e) => setNewSubcategoryName(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-150 rounded px-2 py-1 text-slate-800 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newSubcategoryName.trim()) {
                            const newSub = onAddSubcategory(prodCategory, newSubcategoryName.trim());
                            setProdSubcategory(newSub.id);
                            setNewSubcategoryName('');
                            setShowNewSubcategoryInput(false);
                            triggerToast(`Sub-Kategori "${newSub.name}" berhasil dibuat!`);
                          } else {
                            triggerToast('Nama sub-kategori tidak boleh kosong', 'error');
                          }
                        }}
                        className="bg-slate-900 text-white font-bold px-2 py-1 rounded text-[10px] cursor-pointer"
                      >
                        Simpan
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewSubcategoryInput(false);
                          setNewSubcategoryName('');
                        }}
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <select
                      value={prodSubcategory}
                      onChange={(e) => setProdSubcategory(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 outline-none focus:border-slate-800 cursor-pointer"
                    >
                      <option value="">-- Pilih Sub-Kategori --</option>
                      {subcategories
                        .filter((s) => s.categoryId === prodCategory)
                        .map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Harga Modal Beli (HPP)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">Rp</span>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="0"
                      value={prodCostPrice || ''}
                      onChange={(e) => setProdCostPrice(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 pl-8 font-mono text-slate-800 outline-none focus:border-slate-800 focus:bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Harga Jual Retail</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">Rp</span>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="0"
                      value={prodSellingPrice || ''}
                      onChange={(e) => setProdSellingPrice(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 pl-8 font-mono text-slate-800 outline-none focus:border-slate-800 focus:bg-white font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Margin & Profitability Auto-Calculator */}
              {(prodCostPrice > 0 || prodSellingPrice > 0) && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3" id="product-profitability-calculator">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                    <span className="text-[9px] font-bold text-slate-500 font-mono uppercase tracking-wider">Kalkulator Margin Otomatis</span>
                    <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">Real-time</span>
                  </div>
                  
                  {prodSellingPrice < prodCostPrice ? (
                    <div className="bg-rose-50 border border-rose-100 rounded p-2 text-rose-700 text-[10px] font-semibold flex items-center gap-1.5">
                      <span className="animate-pulse">⚠️</span>
                      <span>Harga jual di bawah harga beli! Anda akan mengalami kerugian sebesar <strong>Rp {(prodCostPrice - prodSellingPrice).toLocaleString()}</strong> per unit.</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white border border-slate-150 p-1.5 rounded">
                          <span className="block text-[8px] font-bold text-slate-400 uppercase">Laba / Unit</span>
                          <span className="font-mono text-[11px] font-bold text-emerald-600 block truncate">
                            Rp {(prodSellingPrice - prodCostPrice).toLocaleString()}
                          </span>
                        </div>
                        <div className="bg-white border border-slate-150 p-1.5 rounded">
                          <span className="block text-[8px] font-bold text-slate-400 uppercase">Margin Laba</span>
                          <span className={`font-mono text-xs font-bold ${prodSellingPrice > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                            {prodSellingPrice > 0 ? (((prodSellingPrice - prodCostPrice) / prodSellingPrice) * 100).toFixed(1) : '0'}%
                          </span>
                        </div>
                        <div className="bg-white border border-slate-150 p-1.5 rounded">
                          <span className="block text-[8px] font-bold text-slate-400 uppercase">Markup</span>
                          <span className={`font-mono text-xs font-bold ${prodCostPrice > 0 ? 'text-blue-600' : 'text-slate-500'}`}>
                            {prodCostPrice > 0 ? (((prodSellingPrice - prodCostPrice) / prodCostPrice) * 100).toFixed(1) : '0'}%
                          </span>
                        </div>
                      </div>

                      {/* Visual progress bar representation of Profit vs Cost */}
                      {prodSellingPrice > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[8px] text-slate-400 font-semibold uppercase">
                            <span>Komposisi Harga Jual</span>
                            <span>Modal: {((prodCostPrice / prodSellingPrice) * 100).toFixed(0)}% | Laba: {(((prodSellingPrice - prodCostPrice) / prodSellingPrice) * 100).toFixed(0)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
                            <div 
                              className="h-full bg-slate-400 transition-all duration-300" 
                              style={{ width: `${Math.min(100, (prodCostPrice / prodSellingPrice) * 100)}%` }}
                              title="Modal (HPP)"
                            />
                            <div 
                              className="h-full bg-emerald-500 transition-all duration-300" 
                              style={{ width: `${Math.max(0, 100 - (prodCostPrice / prodSellingPrice) * 100)}%` }}
                              title="Estimasi Margin Laba"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Batas Minimum Stok</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={prodMinStock || ''}
                    onChange={(e) => setProdMinStock(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 outline-none focus:border-slate-800 focus:bg-white"
                  />
                  <p className="text-[8px] text-slate-400 mt-0.5">Alert jika stok di bawah angka ini</p>
                </div>
                {!editingProduct && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Stok Awal Saat Ini</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={prodInitialStock || ''}
                      onChange={(e) => setProdInitialStock(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 outline-none focus:border-slate-800 focus:bg-white font-bold"
                    />
                    <p className="text-[8px] text-slate-400 mt-0.5">Saldo fisik di toko sekarang</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end mt-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold px-3.5 py-1.5 rounded cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-1.5 rounded cursor-pointer shadow-xs transition-colors"
                >
                  {editingProduct ? 'Perbarui Barang' : 'Daftarkan Barang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. ADJUST STOCK LEVEL MODAL WITH OPTIONAL COHESIVE FINANCIAL SYNC */}
      {showAdjustModal && (adjustingProduct || isGeneralAdjust) && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-md border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h4 className="text-xs font-black text-slate-900">
                  {isGeneralAdjust ? 'Catat Barang Keluar Manual' : 'Sesuaikan Stok / Mutasi Barang'}
                </h4>
                {adjustingProduct ? (
                  <p className="text-[9px] text-slate-400">{adjustingProduct.name} (Stok: {adjustingProduct.stock} {adjustingProduct.unit})</p>
                ) : (
                  <p className="text-[9px] text-slate-400">Pilih barang dan jumlah pemakaian</p>
                )}
              </div>
              <button onClick={() => { setShowAdjustModal(false); setAdjustingProduct(null); setIsGeneralAdjust(false); }} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustStockSubmit} className="p-4 flex flex-col gap-3 text-xs">
              
              {/* Searchable Product Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Pilih Barang / Bahan Baku <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-slate-400">
                      <Search className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      placeholder="Ketik nama atau SKU barang..."
                      value={productSearchQuery}
                      onChange={(e) => {
                        setProductSearchQuery(e.target.value);
                        setShowProductDropdown(true);
                        // Clear selected product if typed query changes from selected name
                        if (adjustingProduct && e.target.value !== adjustingProduct.name) {
                          setAdjustingProduct(null);
                        }
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                      className="w-full bg-slate-50 border border-slate-200 rounded p-2 pl-8 text-slate-800 outline-none focus:border-slate-800 focus:bg-white font-bold text-xs"
                    />
                    {productSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setProductSearchQuery('');
                          setAdjustingProduct(null);
                          setShowProductDropdown(true);
                        }}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown click-away overlay overlay */}
                  {showProductDropdown && (
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowProductDropdown(false)} 
                    />
                  )}

                  {/* Dropdown containing filtered list */}
                  {showProductDropdown && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-52 overflow-y-auto font-sans">
                      {products.filter(p => {
                        const query = productSearchQuery.trim().toLowerCase();
                        if (!query) return true; // show all when query is empty
                        return p.name.toLowerCase().includes(query) || (p.sku && p.sku.toLowerCase().includes(query));
                      }).length === 0 ? (
                        <div className="p-3 text-center text-slate-400 text-xs">
                          Tidak ada barang "{productSearchQuery}"
                        </div>
                      ) : (
                        products.filter(p => {
                          const query = productSearchQuery.trim().toLowerCase();
                          if (!query) return true;
                          return p.name.toLowerCase().includes(query) || (p.sku && p.sku.toLowerCase().includes(query));
                        }).map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setAdjustingProduct(p);
                              setProductSearchQuery(p.name);
                              setShowProductDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs flex justify-between items-center hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 cursor-pointer ${
                              adjustingProduct?.id === p.id ? 'bg-slate-50 font-bold text-slate-900' : 'text-slate-700'
                            }`}
                          >
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800">{p.name}</span>
                              {p.sku && <span className="text-[9px] text-slate-400 font-mono">SKU: {p.sku}</span>}
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${p.stock <= (p.minStock || 5) ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-slate-100 text-slate-700'}`}>
                              Stok: {p.stock} {p.unit}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {adjustingProduct ? (
                  <div className="mt-1.5 flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded px-2.5 py-1 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                    Barang Terpilih: {adjustingProduct.name} ({adjustingProduct.stock} {adjustingProduct.unit})
                  </div>
                ) : (
                  <div className="mt-1.5 flex items-center gap-1.5 bg-rose-50 border border-rose-100 text-rose-800 rounded px-2.5 py-1 text-[10px] font-bold animate-pulse">
                    <span className="w-1.5 h-1.5 bg-rose-400 rounded-full"></span>
                    Ketik nama barang di atas untuk mencari & memilih
                  </div>
                )}
              </div>

              {/* Type of stock adjustment */}
              {!isGeneralAdjust && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Aksi Penyesuaian</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => { setAdjType('masuk'); setSyncFinance(false); }}
                      className={`p-1.5 border rounded flex flex-col items-center justify-center font-bold text-[10px] cursor-pointer transition-all ${
                        adjType === 'masuk' 
                          ? 'border-slate-800 bg-slate-900 text-white shadow-xs' 
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4 mb-0.5 text-cyan-400" /> Barang Masuk
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAdjType('keluar'); setSyncFinance(false); }}
                      className={`p-1.5 border rounded flex flex-col items-center justify-center font-bold text-[10px] cursor-pointer transition-all ${
                        adjType === 'keluar' 
                          ? 'border-slate-800 bg-slate-900 text-white shadow-xs' 
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <ArrowDownLeft className="w-4 h-4 mb-0.5 text-rose-400" /> Barang Keluar
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAdjType('penyesuaian'); setSyncFinance(false); }}
                      className={`p-1.5 border rounded flex flex-col items-center justify-center font-bold text-[10px] cursor-pointer transition-all ${
                        adjType === 'penyesuaian' 
                          ? 'border-slate-800 bg-slate-900 text-white shadow-xs' 
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Layers className="w-4 h-4 mb-0.5 text-amber-400" /> Stock Opname
                    </button>
                  </div>
                </div>
              )}

              {/* Quantity input */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {adjType === 'penyesuaian' ? 'Jumlah Fisik Sebenarnya Saat Ini' : 'Jumlah Volume Barang'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="0"
                    value={adjQuantity || ''}
                    onChange={(e) => setAdjQuantity(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-2 pr-12 font-mono text-slate-800 outline-none focus:border-slate-800 focus:bg-white font-bold"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 font-bold">{adjustingProduct?.unit || ''}</span>
                </div>
                <p className="text-[8px] text-slate-400 mt-1">
                  {adjustingProduct && adjType === 'masuk' && `Akan menambahkan stok barang. Stok baru: ${adjustingProduct.stock + adjQuantity} ${adjustingProduct.unit}`}
                  {adjustingProduct && adjType === 'keluar' && `Akan mengurangi stok barang. Stok baru: ${Math.max(0, adjustingProduct.stock - adjQuantity)} ${adjustingProduct.unit}`}
                  {adjustingProduct && adjType === 'penyesuaian' && `Stok akan diganti secara absolut menjadi ${adjQuantity} ${adjustingProduct.unit}`}
                </p>
              </div>

              {/* Notes input */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Memo Alasan / Catatan</label>
                <input
                  type="text"
                  required
                  placeholder={
                    adjType === 'masuk' ? 'Contoh: Kulakan dari Agen Sembako Indah' :
                    adjType === 'keluar' ? 'Contoh: Terjual eceran, barang rusak/tumpah' :
                    'Contoh: Penyesuaian opname berkala akhir bulan'
                  }
                  value={adjNotes}
                  onChange={(e) => setAdjNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-slate-800 outline-none focus:border-slate-800 focus:bg-white"
                />
                
                {/* Clickable quick memo suggestions for 'keluar' (manual stock-out) */}
                {adjType === 'keluar' && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setAdjNotes('Pemakaian bahan baku adonan')}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] px-2 py-0.5 rounded transition-all cursor-pointer font-medium"
                    >
                      🍲 Pemakaian Bahan Baku
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjNotes('Barang rusak / tumpah / expired')}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] px-2 py-0.5 rounded transition-all cursor-pointer font-medium"
                    >
                      ⚠️ Rusak / Expired
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjNotes('Dipakai sendiri / internal')}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] px-2 py-0.5 rounded transition-all cursor-pointer font-medium"
                    >
                      🏠 Konsumsi Sendiri
                    </button>
                  </div>
                )}
              </div>

              {/* Advanced Cohesive Sync with Financial flows */}
              {adjType !== 'penyesuaian' && (
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-md text-slate-200 mt-1 flex flex-col gap-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 font-bold cursor-pointer text-slate-200">
                      <input
                        type="checkbox"
                        checked={syncFinance}
                        onChange={(e) => setSyncFinance(e.target.checked)}
                        className="rounded bg-slate-800 border-slate-700 text-slate-900 focus:ring-offset-slate-900 cursor-pointer w-4 h-4"
                      />
                      <span className="text-[11px] text-cyan-400">Catat Finansial Toko?</span>
                    </label>
                    <span className="text-[8px] text-slate-400 font-mono uppercase tracking-wider">Terintegrasi</span>
                  </div>

                  {syncFinance && (
                    <div className="flex flex-col gap-2 pt-2 border-t border-slate-800 text-[11px] animate-fade-in">
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Total Nom. Finansial:</span>
                        <span className="font-mono font-bold text-white">
                          {formatRupiah(adjQuantity * (adjType === 'masuk' ? adjustingProduct.costPrice : adjustingProduct.sellingPrice))}
                        </span>
                      </div>
                      <div className="text-[8px] text-slate-400 italic">
                        {adjType === 'masuk' 
                          ? `Kalkulasi: ${adjQuantity} × Rp ${adjustingProduct.costPrice.toLocaleString()} (Harga Modal Beli)`
                          : `Kalkulasi: ${adjQuantity} × Rp ${adjustingProduct.sellingPrice.toLocaleString()} (Harga Jual Retail)`
                        }
                      </div>

                      <div className="mt-1">
                        <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">Akun Pembayaran / Penerima</label>
                        <select
                          value={paymentSource}
                          onChange={(e) => setPaymentSource(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded p-1.5 outline-none cursor-pointer text-xs"
                        >
                          <option value="cash">Laci Kasir Tunai (Kas Harian)</option>
                          {bankAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name} ({acc.type === 'bank' ? 'Bank' : 'E-Wallet'})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 justify-end mt-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowAdjustModal(false); setAdjustingProduct(null); setIsGeneralAdjust(false); }}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold px-3.5 py-1.5 rounded cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-1.5 rounded cursor-pointer shadow-xs transition-colors"
                >
                  Simpan Perubahan
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
