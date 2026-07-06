import React, { useState } from 'react';
import { Shield, Building2, MapPin, Phone, Sparkles, Check, HelpCircle, Trash2, Plus, X, FolderSync, User } from 'lucide-react';
import { AppSettings, ProductCategory, ProductSubcategory } from '../types';

interface SuperAdminSettingsModuleProps {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  categories: ProductCategory[];
  subcategories: ProductSubcategory[];
  onAddCategory: (name: string) => ProductCategory;
  onAddSubcategory: (categoryId: string, name: string) => ProductSubcategory;
  onDeleteCategory: (id: string) => void;
  onDeleteSubcategory: (id: string) => void;
}

export default function SuperAdminSettingsModule({
  settings,
  onUpdateSettings,
  categories,
  subcategories,
  onAddCategory,
  onAddSubcategory,
  onDeleteCategory,
  onDeleteSubcategory,
}: SuperAdminSettingsModuleProps) {
  const [shopName, setShopName] = useState(settings.shopName || '');
  const [shopAddress, setShopAddress] = useState(settings.shopAddress || '');
  const [shopContact, setShopContact] = useState(settings.shopContact || '');
  const [isPremiumActive, setIsPremiumActive] = useState(!!settings.isPremiumActive);
  const [userRole, setUserRole] = useState(settings.userRole || 'developer');
  const [isSaved, setIsSaved] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      shopName,
      shopAddress,
      shopContact,
      isPremiumActive,
      userRole,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-xs p-6" id="super-admin-settings-container">
      {/* Module Header */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-6">
        <div className="p-2 bg-slate-100 text-slate-800 rounded-lg">
          <Shield className="w-5 h-5 text-slate-900" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900">Super Admin Settings</h2>
          <p className="text-[10px] text-slate-400">Kelola informasi utama identitas toko dan status lisensi fitur premium</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Toko Identity */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">1. Identitas & Informasi Toko</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nama Toko */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Nama Judul Aplikasi / Toko
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Misal: Toko Kelontong Berkah"
                  className="pl-10 w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white font-medium"
                />
              </div>
            </div>

            {/* Nomor Kontak */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Nomor Kontak Toko
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={shopContact}
                  onChange={(e) => setShopContact(e.target.value)}
                  placeholder="Misal: 081234567890"
                  className="pl-10 w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white font-medium"
                />
              </div>
            </div>

            {/* Alamat Toko */}
            <div className="space-y-1 md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Alamat Toko
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 pt-2.5 flex items-start pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </span>
                <textarea
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  placeholder="Misal: Jl. Kemakmuran Raya No. 12, Blok A, Jakarta Barat"
                  rows={2}
                  className="pl-10 w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white font-medium resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 1.5: Simulasi Hak Akses (Role) */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">1.5. Simulasi Hak Akses (Role)</h3>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <User className="w-4 h-4 text-indigo-600" />
                Simulasi Role Pengguna Aktif
              </span>
              <p className="text-[10px] text-slate-400 leading-normal">
                Ganti role simulasi untuk menguji fungsionalitas dan hak akses tampilan UI. Pilihan role <strong className="text-slate-800">DEVELOPER</strong> akan membuka menu rahasia <strong className="text-indigo-600">Developer Console</strong>.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {(['developer', 'owner', 'admin', 'kasir'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setUserRole(r)}
                  className={`px-3 py-1.5 rounded text-xs font-bold font-mono transition-all border cursor-pointer ${
                    userRole === r
                      ? 'bg-slate-900 text-white border-slate-850 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Premium Feature Flags */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">2. Lisensi & Fitur Premium</h3>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono ${isPremiumActive ? 'bg-emerald-100 border border-emerald-200 text-emerald-800' : 'bg-slate-100 border border-slate-200 text-slate-500'}`}>
              {isPremiumActive ? 'PREMIUM AKTIF' : 'BASIC EDITION'}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1 max-w-xl">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                Aktifkan Fitur Premium (Asisten AI & Agen Bisnis)
              </span>
              <p className="text-[10px] text-slate-400 leading-normal">
                Membuka fitur Asisten AI Pintar yang otomatis terintegrasi dengan pembukuan Anda. AI dapat menganalisis kesehatan alur keuangan (cash flow), mendeteksi barang terlaris, merekomendasikan stok kulakan baru, serta memantau tagihan piutang yang hampir jatuh tempo.
              </p>
            </div>

            {/* Toggle switch */}
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={isPremiumActive}
                onChange={(e) => setIsPremiumActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
            </label>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-amber-50/50 border border-amber-200/60 rounded p-3 text-[10px] text-amber-800/90 leading-relaxed flex gap-2">
          <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Informasi Super Admin:</span> Perubahan identitas toko akan langsung diperbarui di seluruh bagian aplikasi (Header, PDF laporan, tanda terima kas, dan asisten analisis finansial). Pastikan nomor kontak dan alamat diisi dengan benar untuk kredibilitas laporan ekspor.
          </div>
        </div>

        {/* Actions Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-2.5 rounded shadow-xs cursor-pointer flex items-center gap-2 transition-colors"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                Berhasil Disimpan!
              </>
            ) : (
              'Simpan Konfigurasi Admin'
            )}
          </button>
        </div>
      </form>

      {/* Section 3: Categories & Subcategories Management */}
      <div className="space-y-4 pt-6 mt-6 border-t border-slate-100" id="admin-categories-section">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-100 text-slate-800 rounded">
            <FolderSync className="w-4 h-4 text-slate-900" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">3. Kelola Kategori & Sub-Kategori Produk</h3>
            <p className="text-[10px] text-slate-400">Atur master data klasifikasi produk untuk mempermudah inventarisasi dan pelaporan finansial</p>
          </div>
        </div>

        {/* Input Add Category */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
            <div className="space-y-0.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Tambah Kategori Master Baru
              </label>
              <p className="text-[9px] text-slate-400">Masukkan nama kategori utama untuk mengelompokkan produk Anda</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Misal: Sembako, Makanan Ringan, Kosmetik"
                id="admin-new-category-name"
                className="bg-white border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-slate-800 w-full sm:w-64"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
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
                type="button"
                onClick={() => {
                  const input = document.getElementById('admin-new-category-name') as HTMLInputElement;
                  if (input && input.value.trim()) {
                    onAddCategory(input.value.trim());
                    triggerToast(`Kategori "${input.value.trim()}" berhasil dibuat!`);
                    input.value = '';
                  } else {
                    triggerToast('Nama kategori tidak boleh kosong', 'error');
                  }
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-1.5 rounded cursor-pointer shrink-0 transition-colors"
              >
                + Kategori
              </button>
            </div>
          </div>
        </div>

        {/* Categories Bento Grid */}
        {categories.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 p-8 rounded text-center text-slate-400 text-xs">
            Belum ada kategori master yang dibuat. Tambahkan kategori di atas untuk memulai.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const catSubs = subcategories.filter(s => s.categoryId === cat.id);
              return (
                <div key={cat.id} className="bg-white border border-slate-200 rounded-md shadow-xs p-3.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
                  <div>
                    {/* Category Header */}
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-slate-900 rounded-full"></span>
                        {cat.name}
                      </span>
                      <button
                        type="button"
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
                              className="inline-flex items-center gap-1 bg-slate-50 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer group"
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

                  {/* Add Subcategory field inside Card */}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex gap-1">
                      <input
                        type="text"
                        placeholder="Tambah sub-kategori..."
                        id={`admin-new-sub-input-${cat.id}`}
                        className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-[11px] text-slate-700 outline-none focus:border-slate-800 focus:bg-white w-full"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
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
                        type="button"
                        onClick={() => {
                          const input = document.getElementById(`admin-new-sub-input-${cat.id}`) as HTMLInputElement;
                          if (input && input.value.trim()) {
                            onAddSubcategory(cat.id, input.value.trim());
                            triggerToast(`Sub-kategori "${input.value.trim()}" ditambahkan ke ${cat.name}!`);
                            input.value = '';
                          } else {
                            triggerToast('Nama sub-kategori tidak boleh kosong', 'error');
                          }
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] px-2.5 py-1 rounded cursor-pointer shrink-0 transition-colors"
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

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-slate-900 border border-slate-800 text-white px-4 py-2.5 rounded shadow-lg text-xs animate-fade-in">
          {toast.type === 'success' ? (
            <span className="text-emerald-400">✓</span>
          ) : (
            <span className="text-rose-400">⚠️</span>
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
