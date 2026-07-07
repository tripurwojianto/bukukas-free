import React, { useState, useEffect } from 'react';
import { useBukuKas } from '../context/BukuKasContext';
import { getTodayDateString, formatRupiah } from '../utils/defaultData';
import { Calendar, Tag, FileText, CheckCircle, PlusCircle, AlertCircle } from 'lucide-react';

export const TambahView: React.FC = () => {
  const { data, addPenjualan, addPengeluaran, addCategory } = useBukuKas();

  // Active form type: 'penjualan' or 'pengeluaran'
  const [activeType, setActiveType] = useState<'penjualan' | 'pengeluaran'>('penjualan');

  // Load active type from localStorage if set by shortcuts
  useEffect(() => {
    const cachedType = localStorage.getItem('bukukas_tambah_tab');
    if (cachedType === 'penjualan' || cachedType === 'pengeluaran') {
      setActiveType(cachedType);
      localStorage.removeItem('bukukas_tambah_tab');
    }
  }, []);

  // Form states
  const [date, setDate] = useState(getTodayDateString());
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  // Category expansion
  const [showAddCategoryInline, setShowAddCategoryInline] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Success indicator
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter categories for the current active type
  const filteredCategories = data.categories.filter((c) => c.type === activeType);

  // Set first category as default on load/tab switch
  useEffect(() => {
    if (filteredCategories.length > 0) {
      setCategory(filteredCategories[0].name);
    } else {
      setCategory('');
    }
  }, [activeType, data.categories]);

  // Handle category submission
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    // Add category using context
    addCategory(activeType, newCategoryName.trim());
    setCategory(newCategoryName.trim()); // auto select newly created category
    setNewCategoryName('');
    setShowAddCategoryInline(false);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || !category) {
      alert('Nominal dan Kategori wajib diisi.');
      return;
    }

    const payload = {
      date,
      category,
      amount: parseFloat(amount),
      notes: notes.trim(),
    };

    if (activeType === 'penjualan') {
      addPenjualan(payload);
      setSuccessMessage(`Berhasil menyimpan Penjualan: ${formatRupiah(payload.amount)}!`);
    } else {
      addPengeluaran(payload);
      setSuccessMessage(`Berhasil menyimpan Pengeluaran: ${formatRupiah(payload.amount)}!`);
    }

    // Reset some fields but keep date for consecutive logs!
    setAmount('');
    setNotes('');
    
    // Auto clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  return (
    <div className="space-y-4">
      {/* Tab Selector */}
      <div className="bg-white p-1 rounded-2xl border border-slate-100 shadow-sm flex">
        <button
          onClick={() => {
            setActiveType('penjualan');
            setShowAddCategoryInline(false);
          }}
          className={`flex-1 py-3 text-xs font-black rounded-xl transition-all uppercase tracking-wider cursor-pointer ${
            activeType === 'penjualan'
              ? 'bg-emerald-500 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          📈 Penjualan (Kas Masuk)
        </button>
        <button
          onClick={() => {
            setActiveType('pengeluaran');
            setShowAddCategoryInline(false);
          }}
          className={`flex-1 py-3 text-xs font-black rounded-xl transition-all uppercase tracking-wider cursor-pointer ${
            activeType === 'pengeluaran'
              ? 'bg-red-500 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          📉 Pengeluaran (Kas Keluar)
        </button>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className={`p-4 rounded-xl border flex items-center gap-2.5 animate-fade-in ${
          activeType === 'penjualan' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
            : 'bg-red-50 border-red-100 text-red-800'
        }`}>
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-xs font-bold">{successMessage}</p>
        </div>
      )}

      {/* Form Content */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main big amount field */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
              Nominal Transaksi (Rp) *
            </label>
            <div className="relative">
              <span className={`absolute inset-y-0 left-0 flex items-center pl-4.5 font-extrabold text-lg ${
                activeType === 'penjualan' ? 'text-emerald-500' : 'text-red-500'
              }`}>
                Rp
              </span>
              <input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 text-xl font-black bg-slate-50 border rounded-2xl focus:outline-none transition-colors text-slate-800 dark:text-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-400 ${
                  activeType === 'penjualan'
                    ? 'focus:border-emerald-500 focus:bg-white border-slate-200'
                    : 'focus:border-red-500 focus:bg-white border-slate-200'
                }`}
                required
                min="1"
              />
            </div>

            {/* Shortcut Nominal Buttons */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[
                { label: '5rb', value: 5000 },
                { label: '10rb', value: 10000 },
                { label: '20rb', value: 20000 },
                { label: '50rb', value: 50000 },
                { label: '100rb', value: 100000 },
                { label: '200rb', value: 200000 },
                { label: '500rb', value: 500000 },
              ].map((shortcut) => {
                const isSelected = parseFloat(amount) === shortcut.value;
                return (
                  <button
                    key={shortcut.value}
                    type="button"
                    onClick={() => setAmount(shortcut.value.toString())}
                    className={`px-3 py-1.5 text-[11px] font-extrabold rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? activeType === 'penjualan'
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                          : 'bg-red-500 border-red-500 text-white shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 dark:text-slate-800'
                    }`}
                  >
                    {shortcut.label}
                  </button>
                );
              })}
              {amount && (
                <button
                  type="button"
                  onClick={() => setAmount('')}
                  className="px-3 py-1.5 text-[11px] font-black rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-all cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            {amount && (
              <p className="text-[11px] text-slate-500 font-bold mt-2 pl-1">
                Terbaca: {formatRupiah(parseFloat(amount) || 0)}
              </p>
            )}
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
              Tanggal Transaksi *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Calendar className="w-4 h-4" />
              </span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white text-xs font-bold text-slate-800 dark:text-slate-800"
                required
              />
            </div>
          </div>

          {/* Category List Picker */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Pilih Kategori *
              </label>
              
              {!showAddCategoryInline && (
                <button
                  type="button"
                  onClick={() => setShowAddCategoryInline(true)}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                >
                  <PlusCircle className="w-3 h-3" /> Tambah Kategori
                </button>
              )}
            </div>

            {/* Inline add category form */}
            {showAddCategoryInline && (
              <div className="mb-3 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2 animate-fade-in">
                <input
                  type="text"
                  placeholder="Kategori baru..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none text-slate-800 dark:text-slate-800 font-bold placeholder:text-slate-400 dark:placeholder:text-slate-400"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Tambah
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCategoryInline(false);
                    setNewCategoryName('');
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold px-1"
                >
                  Batal
                </button>
              </div>
            )}

            {/* Interactive Grid of Category Buttons */}
            {filteredCategories.length === 0 ? (
              <div className="p-4 border border-dashed border-slate-200 text-center rounded-xl">
                <AlertCircle className="w-5 h-5 text-slate-300 mx-auto mb-1" />
                <p className="text-[11px] text-slate-400">Belum ada kategori. Tambah kategori di atas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                {filteredCategories.map((cat) => {
                  const isSelected = category === cat.name;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.name)}
                      className={`px-3 py-2.5 rounded-xl text-left text-xs font-bold border truncate transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? activeType === 'penjualan'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                            : 'bg-red-50 border-red-500 text-red-700 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{cat.name}</span>
                      {isSelected && (
                        <span className={`w-2 h-2 rounded-full ${activeType === 'penjualan' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
              Keterangan / Catatan (Opsional)
            </label>
            <div className="relative">
              <span className="absolute top-2.5 left-3.5 text-slate-400">
                <FileText className="w-4 h-4" />
              </span>
              <textarea
                placeholder="Ketik keterangan barang, pembeli, dll..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white text-xs h-16 resize-none font-medium text-slate-800 dark:text-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              className={`w-full text-white font-extrabold py-3 rounded-2xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeType === 'penjualan'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                  : 'bg-red-600 hover:bg-red-700 shadow-red-200'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              Simpan Transaksi {activeType === 'penjualan' ? 'Masuk' : 'Keluar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
