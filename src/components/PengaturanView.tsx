import React, { useState } from 'react';
import { useBukuKas } from '../context/BukuKasContext';
import { User, Phone, MapPin, Store, Star, ArrowRight, CheckCircle2, RefreshCw, Sparkles, LogOut, Check, Bell, HardDrive, UploadCloud, DownloadCloud, Sun, Moon } from 'lucide-react';

export const PengaturanView: React.FC = () => {
  const { data, updateProfile, user, handleLogout, loginWithGoogle, spreadsheetId, isSheetsConnected, connectSheets, disconnectSheets, lastSyncTime, syncStatus, backupToDrive, restoreFromDrive, driveSyncStatus, lastDriveSyncTime, theme, toggleTheme, syncQueue, processSyncQueue, isGuestReadOnly, setGuestReadOnly } = useBukuKas();

  // Profile edit states
  const [name, setName] = useState(data.profile.name || '');
  const [ownerName, setOwnerName] = useState(data.profile.ownerName || '');
  const [logo, setLogo] = useState(data.profile.logo || '🏪');
  const [phone, setPhone] = useState(data.profile.phone || '');
  const [address, setAddress] = useState(data.profile.address || '');
  
  // Daily reminder states
  const [reminderEnabled, setReminderEnabled] = useState(data.profile.reminderEnabled !== false);
  const [reminderTime, setReminderTime] = useState(data.profile.reminderTime || '16:00');

  const [isSaved, setIsSaved] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showProModal, setShowProModal] = useState(false);

  const emojis = ['🏪', '🛍️', '🛒', '☕', '🍜', '🍰', '💊', '🔋', '🔌', '🧱', '👚', '🥦', '🌾', '🧼'];

  const handleToggleReminder = async (enabled: boolean) => {
    setReminderEnabled(enabled);
    if (enabled && 'Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch (err) {
          console.error('Notification permission request error', err);
        }
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: name.trim(),
      ownerName: ownerName.trim(),
      logo,
      phone: phone.trim(),
      address: address.trim(),
      reminderEnabled,
      reminderTime,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Mode Tamu (Read-Only) Status */}
      {isGuestReadOnly && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl shadow-sm space-y-4 animate-fade-in text-left">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">👤</span>
            <div>
              <h2 className="text-sm font-black text-amber-600 dark:text-amber-400">Mode Tamu (Read-Only) Aktif</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Anda sedang menjelajahi BukuKas menggunakan data sampel.</p>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
            Dalam Mode Tamu, Anda dapat melihat seluruh visualisasi laporan, grafik profit, dan kasbon secara interaktif. Namun, Anda tidak dapat mengubah data, mencatat transaksi baru, atau menyinkronkan data ke cloud. Hubungkan akun Google Anda untuk mengaktifkan seluruh fitur.
          </p>
          <div className="flex gap-2.5 pt-1">
            <button
              onClick={() => {
                setGuestReadOnly(false);
                alert('Keluar dari Mode Tamu. Silakan masuk menggunakan akun Google atau gunakan mode offline.');
              }}
              className="flex-1 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white font-black text-[11px] rounded-xl transition-all cursor-pointer text-center border border-slate-700/50"
            >
              🚪 Keluar Mode Tamu
            </button>
            <button
              onClick={() => loginWithGoogle().catch(console.error)}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] rounded-xl transition-all cursor-pointer text-center shadow-md shadow-indigo-600/15"
            >
              🔑 Hubungkan Google
            </button>
          </div>
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
        <h2 className="text-base font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Store className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Profil Toko / Usaha
        </h2>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Logo selection */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-colors flex flex-col items-center justify-center text-3xl cursor-pointer shadow-sm relative group"
            >
              <span>{logo}</span>
              <span className="text-[8px] font-black uppercase text-indigo-600 tracking-wider mt-1 opacity-70">Ganti</span>
            </button>

            <div className="flex-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Nama Toko / Usaha *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800 dark:text-slate-800 font-bold placeholder:text-slate-400 dark:placeholder:text-slate-400"
                placeholder="e.g. Warung Sembako Berkah"
                required
              />
            </div>
          </div>

          {/* Emoji lists */}
          {showEmojiPicker && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-7 gap-2 animate-fade-in">
              {emojis.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => {
                    setLogo(em);
                    setShowEmojiPicker(false);
                  }}
                  className="w-10 h-10 rounded-lg bg-white border border-slate-200 hover:border-indigo-500 flex items-center justify-center text-xl cursor-pointer"
                >
                  {em}
                </button>
              ))}
            </div>
          )}

          {/* Owner, Phone, Address */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Nama Pemilik *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800 dark:text-slate-800 font-bold placeholder:text-slate-400 dark:placeholder:text-slate-400"
                  placeholder="Nama Pemilik"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Nomor WhatsApp
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800 dark:text-slate-800 font-bold placeholder:text-slate-400 dark:placeholder:text-slate-400"
                  placeholder="Nomor WA"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Alamat Lengkap Toko
            </label>
            <div className="relative">
              <span className="absolute top-2.5 left-3 text-slate-400">
                <MapPin className="w-4 h-4" />
              </span>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white h-12 resize-none text-slate-800 dark:text-slate-800 font-bold placeholder:text-slate-400 dark:placeholder:text-slate-400"
                placeholder="Alamat Toko"
              />
            </div>
          </div>

          {/* Daily Sore Reminder section */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
              <Bell className="w-4 h-4 text-indigo-600 animate-pulse" />
              Pengingat Sore Harian
            </h3>
            <p className="text-[10px] text-slate-500 leading-normal">
              Aktifkan pengingat sore agar tidak lupa mencatat omset dan pengeluaran toko Anda hari ini.
            </p>
            
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="min-w-0 pr-2">
                <span className="text-xs font-bold text-slate-700 block">Pengingat Sore Aktif</span>
                <span className="text-[9px] text-slate-400 block mt-0.5 leading-tight">Beritahu saya jika belum menginput hari ini</span>
              </div>
              
              <button
                type="button"
                onClick={() => handleToggleReminder(!reminderEnabled)}
                className={`w-10 h-5.5 flex items-center rounded-full p-0.5 transition-colors duration-300 focus:outline-none cursor-pointer flex-shrink-0 ${
                  reminderEnabled ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <span className="bg-white w-4.5 h-4.5 rounded-full shadow-md transform duration-300" />
              </button>
            </div>

            {reminderEnabled && (
              <div className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50 animate-fade-in">
                <span className="text-[11px] font-bold text-indigo-900">Atur Jam Pengingat:</span>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="bg-white border border-indigo-200 text-slate-800 dark:text-slate-800 rounded-lg px-2.5 py-1 text-xs font-black focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            {isSaved && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 animate-fade-in">
                <Check className="w-4 h-4" /> Profil Berhasil Disimpan
              </span>
            )}
            <button
              type="submit"
              className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2 rounded-xl shadow-md cursor-pointer transition-colors"
            >
              Simpan Profil
            </button>
          </div>
        </form>
      </div>

      {/* Theme Toggle Section */}
      <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <div>
          <h2 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            {theme === 'dark' ? (
              <Moon className="w-5 h-5 text-indigo-400" />
            ) : (
              <Sun className="w-5 h-5 text-amber-500 animate-pulse" />
            )}
            Tema Aplikasi
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Pilih tampilan aplikasi yang nyaman untuk mata Anda saat mencatat pembukuan toko.
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => { if (theme !== 'light') toggleTheme(); }}
            className={`flex-1 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500" />
            Mode Terang
          </button>
          <button
            type="button"
            onClick={() => { if (theme !== 'dark') toggleTheme(); }}
            className={`flex-1 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Moon className="w-4 h-4 text-indigo-400" />
            Mode Gelap
          </button>
        </div>
      </div>

      {/* Google Cloud Sync Status */}
      <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <h2 className="text-base font-black text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Koneksi Google Sheets
        </h2>

        {user && (
          <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 animate-fade-in">
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{user.displayName || 'Google User'}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-[10px] bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        )}

        {isSheetsConnected ? (
          <div className="space-y-3 animate-fade-in">
            {/* Spreadsheet URL info */}
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium space-y-1 bg-indigo-50/40 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30">
              <p className="flex justify-between">
                <span>Spreadsheet ID:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300 select-all max-w-[150px] truncate">
                  {spreadsheetId || 'Menghubungkan...'}
                </span>
              </p>
              <p className="flex justify-between">
                <span>Sinkronisasi Terakhir:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{lastSyncTime || 'Belum tersinkron'}</span>
              </p>
              {syncQueue && syncQueue.length > 0 ? (
                <div className="pt-2 border-t border-amber-200/40 mt-2">
                  <p className="text-amber-600 dark:text-amber-400 font-bold text-[10px] flex justify-between items-center">
                    <span>⚠️ Antrean Sinkronisasi (Offline):</span>
                    <span className="bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded font-black text-amber-800 dark:text-amber-300">
                      {syncQueue.length} Transaksi Tertunda
                    </span>
                  </p>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                    Transaksi tersimpan aman secara lokal di HP ini. Sinkronisasi ke Google Sheets akan berjalan otomatis setelah koneksi internet Anda pulih.
                  </p>
                  <button
                    type="button"
                    onClick={() => processSyncQueue()}
                    disabled={syncStatus === 'syncing'}
                    className="w-full mt-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-[10px] font-black rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                    Sync Sekarang (Paksa)
                  </button>
                </div>
              ) : (
                <p className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold pt-1 border-t border-emerald-100/10 mt-1">
                  <span>Status Antrean:</span>
                  <span>✅ Semua data tersinkron</span>
                </p>
              )}
              {spreadsheetId && (
                <p className="pt-2 text-center">
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold underline text-[9px]"
                  >
                    Buka Spreadsheet Database Anda ↗
                  </a>
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={disconnectSheets}
              className="w-full text-center py-2 bg-red-50 dark:bg-red-950/10 hover:bg-red-100 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Putuskan Google Sheets Cloud Sync
            </button>
          </div>
        ) : (
          <div className="p-5 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900/20 text-center space-y-3.5 animate-fade-in">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
              Hubungkan BukuKas ke Google Sheets untuk mencadangkan data secara otomatis dan memulihkannya kapan saja.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
              {!user && (
                <button
                  type="button"
                  onClick={loginWithGoogle}
                  className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Sign In with Google
                </button>
              )}
              <button
                type="button"
                onClick={connectSheets}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
              >
                Hubungkan Google Sheets Cloud Sync
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Google Drive Manual Sync */}
      <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <h2 className="text-base font-black text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          Cadangan Google Drive (Manual)
        </h2>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Amankan seluruh pembukuan Anda dengan menyimpannya secara manual ke Google Drive sebagai file cadangan JSON (`BukuKas_Backup_Database.json`). Anda dapat memulihkannya kapan saja di perangkat lain dengan aman.
        </p>

        {isSheetsConnected ? (
          <div className="space-y-3.5 animate-fade-in">
            <div className="text-[10px] text-indigo-950 dark:text-indigo-300 font-medium space-y-1 bg-indigo-50/40 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-100/50 dark:border-indigo-900/30">
              <p className="flex justify-between">
                <span>Status Sinkronisasi Drive:</span>
                <span className={`font-black ${
                  driveSyncStatus === 'syncing' ? 'text-amber-600' :
                  driveSyncStatus === 'success' ? 'text-emerald-600 animate-pulse' :
                  driveSyncStatus === 'error' ? 'text-red-600' : 'text-slate-600 dark:text-slate-400'
                }`}>
                  {driveSyncStatus === 'syncing' ? '🔄 Mengunggah...' :
                   driveSyncStatus === 'success' ? '✅ Berhasil Sinkron' :
                   driveSyncStatus === 'error' ? '❌ Gagal Sinkron' : 'Siap'}
                </span>
              </p>
              <p className="flex justify-between">
                <span>Penyimpanan Terakhir ke Drive:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{lastDriveSyncTime || 'Belum pernah disimpan'}</span>
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={backupToDrive}
                disabled={driveSyncStatus === 'syncing'}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-[11px] font-black rounded-xl shadow-md cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-colors"
              >
                <UploadCloud className="w-4 h-4" />
                Cadangkan ke Drive
              </button>
              <button
                onClick={restoreFromDrive}
                disabled={driveSyncStatus === 'syncing'}
                className="flex-1 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-black rounded-xl shadow-sm cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-colors"
              >
                <DownloadCloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Pulihkan dari Drive
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/20 text-center space-y-3">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
              Hubungkan ke Google Sheets Cloud Sync terlebih dahulu untuk mengaktifkan fitur penyimpanan file database cadangan di Google Drive Anda.
            </p>
            <button
              onClick={connectSheets}
              className="mx-auto flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] uppercase px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              Hubungkan Google Sheets Cloud Sync
            </button>
          </div>
        )}
      </div>

      {/* Upgrade to Pro Section */}
      <div className="bg-gradient-to-tr from-violet-700 via-indigo-700 to-indigo-600 rounded-2xl p-5 text-white shadow-lg space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-15">
          <Sparkles className="w-20 h-20" />
        </div>

        <div>
          <span className="bg-amber-400 text-amber-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-300">
            Dukung UMKM Anda
          </span>
          <h2 className="text-xl font-black mt-2 tracking-tight">Upgrade ke BukuKas Pro</h2>
          <p className="text-xs text-indigo-100 mt-1 leading-relaxed">
            Dapatkan fitur kecerdasan buatan dan otomatisasi terbaik untuk melipatgandakan omset toko Anda.
          </p>
        </div>

        <a
          href="https://landing.bukukas.biz.id"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-white text-indigo-700 font-extrabold text-xs py-3 rounded-xl shadow-md hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center block"
        >
          🚀 Mulai Uji Coba BukuKas Pro
        </a>
      </div>

      {/* Pro Version Modal */}
      {showProModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4 animate-fade-in relative max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              BukuKas Pro (Upgrade)
            </h3>

            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Dapatkan keunggulan bersaing di BukuKas Pro dan pindahkan seluruh data Anda dari BukuKas Free dengan 1 klik:
            </p>

            <div className="space-y-2.5">
              {[
                { title: '🤖 AI Financial Advisor', desc: 'Konsultasi kecerdasan bisnis, analisis laba kotor, dan prediksi belanja stok.' },
                { title: '💬 WhatsApp Reminder Otomatis', desc: 'Pesan tagihan terkirim otomatis ke WA pelanggan tanpa ketik manual.' },
                { title: '📊 Analitik Multi-Dimensi', desc: 'Grafik performa interaktif, tren harian, mingguan, bulanan yang mendalam.' },
                { title: '👥 Sinkronisasi Multi-User', desc: 'Bagikan akses kasir dengan karyawan dan pantau langsung dari mana saja.' },
                { title: '⚡ Kecepatan Super Pro', desc: 'Akses kueri database tak terbatas dengan sinkronisasi 10x lebih cepat.' },
              ].map((f) => (
                <div key={f.title} className="flex gap-2.5 items-start">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 leading-tight">{f.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => setShowProModal(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Kembali
              </button>
              <a
                href="https://landing.bukukas.biz.id"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowProModal(false)}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1 text-center"
              >
                Beli Pro Sekarang <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
