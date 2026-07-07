import React, { useState, useEffect } from 'react';
import { BukuKasProvider, useBukuKas } from './context/BukuKasContext';
import { BottomNavigation } from './components/BottomNavigation';
import { DashboardView } from './components/DashboardView';
import { KasbonView } from './components/KasbonView';
import { TambahView } from './components/TambahView';
import { LaporanView } from './components/LaporanView';
import { PengaturanView } from './components/PengaturanView';
import { Store, User, ArrowRight, ShieldCheck } from 'lucide-react';

function AppContent() {
  const {
    data,
    isLoading,
    updateProfile,
    syncQueue,
    processSyncQueue,
    user,
    loginWithGoogle,
    isGuestReadOnly,
    setGuestReadOnly,
    isOfflineMode,
    setOfflineMode,
  } = useBukuKas();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  // Profile onboarding fields
  const [onboardingName, setOnboardingName] = useState('');
  const [onboardingOwner, setOnboardingOwner] = useState('');

  // Check if shop has been set up, otherwise trigger onboarding
  useEffect(() => {
    if (!isLoading && data.profile.name === 'Toko Kelontong Saya' && !data.profile.phone && !isGuestReadOnly) {
      setShowOnboarding(true);
    }
  }, [isLoading, data, isGuestReadOnly]);

  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingName.trim() || !onboardingOwner.trim()) return;

    updateProfile({
      name: onboardingName.trim(),
      ownerName: onboardingOwner.trim(),
    });
    setShowOnboarding(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center animate-bounce mb-4 text-2xl font-black">
          BK
        </div>
        <p className="text-sm font-bold text-slate-300 tracking-wide animate-pulse">Memuat BukuKas Free...</p>
      </div>
    );
  }

  if (!user && !isGuestReadOnly && !isOfflineMode) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-slate-900/95 rounded-[2.5rem] border border-slate-800 p-7 text-center shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="space-y-6 my-auto py-6">
            <div className="space-y-3">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white font-black text-2xl tracking-tighter">
                BK
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight leading-none pt-2">BukuKas Free</h1>
              <p className="text-[11px] text-slate-400 max-w-[280px] mx-auto leading-relaxed font-bold">
                Pindahkan pembukuan fisik Anda ke HP secara praktis, instan, & aman.
              </p>
            </div>

            <div className="space-y-3 pt-3">
              {/* Google login */}
              <button
                onClick={() => loginWithGoogle().catch(console.error)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-lg shadow-indigo-600/10 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span className="bg-white/10 p-1 rounded-lg flex items-center justify-center">
                  <span className="text-[10px] font-black leading-none">G</span>
                </span>
                Masuk dengan Akun Google
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800/80"></div>
                <span className="flex-shrink mx-3 text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">Atau</span>
                <div className="flex-grow border-t border-slate-800/80"></div>
              </div>

              {/* Guest login (Read Only) */}
              <button
                onClick={() => {
                  setGuestReadOnly(true);
                  alert('Mode Tamu (Read-Only) diaktifkan dengan data contoh Warung Sejahtera!');
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-400 hover:text-indigo-300 font-extrabold text-xs py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                👤 Masuk sebagai Tamu (Read-Only)
              </button>

              {/* Offline local full access */}
              <button
                onClick={() => {
                  setOfflineMode(true);
                }}
                className="w-full bg-transparent hover:bg-slate-800/30 text-slate-500 hover:text-slate-300 font-bold text-[11px] py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                📴 Gunakan Mode Offline (Penuh)
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/40 flex items-center justify-center gap-1.5 text-slate-600">
            <ShieldCheck className="w-4 h-4 text-slate-600" />
            <span className="text-[9px] font-semibold">Seluruh data tersimpan aman secara lokal</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-800 dark:text-slate-100 font-sans antialiased flex justify-center transition-colors duration-200">
      {/* Mobile Device Frame Mockup on Desktop, standard responsive container */}
      <div className="w-full max-w-md min-h-screen bg-slate-50 dark:bg-slate-900 border-x border-slate-200 dark:border-slate-800/80 shadow-2xl relative flex flex-col pb-20 overflow-x-hidden transition-colors duration-200">
        
        {/* Guest Mode indicator banner */}
        {isGuestReadOnly && (
          <div className="bg-slate-800 dark:bg-slate-900 text-slate-100 px-4 py-2 flex items-center justify-between text-[10px] font-bold shadow-md border-b border-slate-700/80 relative z-40 transition-all">
            <span className="flex items-center gap-1.5">
              <span className="bg-amber-500/20 text-amber-400 px-1 py-0.5 rounded text-[8px] font-black uppercase tracking-wide border border-amber-500/30">Mode Tamu</span>
              <span>Laporan & Kasbon (Hanya Baca)</span>
            </span>
            <button
              onClick={() => loginWithGoogle().catch(console.error)}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-[9px] text-white font-black rounded-md flex items-center gap-1 cursor-pointer transition-all shadow border border-indigo-400/30"
            >
              🔑 Hubungkan Google
            </button>
          </div>
        )}

        {/* Sync queue status banner */}
        {syncQueue && syncQueue.length > 0 && (
          <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-xs font-black shadow-md border-b border-amber-600 animate-pulse relative z-40 transition-all">
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <span>{syncQueue.length} Transaksi Tertunda Sync (Offline)</span>
            </span>
            <button
              onClick={() => processSyncQueue().catch(console.error)}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-[10px] font-black rounded-md flex items-center gap-1 cursor-pointer transition-all border border-amber-400/40"
            >
              Sync
            </button>
          </div>
        )}

         {/* Main View Render */}
        <div className="p-4.5 flex-1 pb-4">
          {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} />}
          {activeTab === 'kasbon' && <KasbonView />}
          {activeTab === 'tambah' && <TambahView />}
          {activeTab === 'laporan' && <LaporanView />}
          {activeTab === 'pengaturan' && <PengaturanView />}
        </div>

        {/* Footer */}
        <footer id="app-footer" className="text-center py-4 pb-6 text-[10px] text-slate-400 dark:text-slate-500 font-bold border-t border-slate-100/80 dark:border-slate-800/40 mx-4">
          &copy; {new Date().getFullYear()}{' '}
          <a
            href="https://www.bukukas.biz.id"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline transition-colors font-black"
          >
            BukuKas
          </a>{' '}
          powered by{' '}
          <span className="font-extrabold text-slate-500 dark:text-slate-400">KulinaSystem</span>
        </footer>

        {/* Floating / Fixed Bottom navigation bar */}
        <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* 1-Step Onboarding Modal if fresh install */}
        {showOnboarding && (
          <div className="absolute inset-0 z-[100] bg-slate-900/95 flex flex-col justify-center px-6 text-white animate-fade-in">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <span className="text-4xl">🏪</span>
                <h1 className="text-2xl font-black tracking-tight">Selamat Datang di BukuKas!</h1>
                <p className="text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                  Pindahkan buku catatan fisik Anda ke HP secara instan, aman, dan tanpa biaya.
                </p>
              </div>

              <form onSubmit={handleOnboardingSubmit} className="bg-white text-slate-800 p-5 rounded-3xl space-y-4 shadow-xl border border-slate-100">
                <h2 className="text-sm font-black text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                  <Store className="w-4.5 h-4.5 text-indigo-600" />
                  Atur Profil Pertama Anda
                </h2>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Toko / Usaha *</label>
                  <input
                    type="text"
                    value={onboardingName}
                    onChange={(e) => setOnboardingName(e.target.value)}
                    placeholder="e.g. Toko Kelontong Berkah"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800 dark:text-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Pemilik *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={onboardingOwner}
                      onChange={(e) => setOnboardingOwner(e.target.value)}
                      placeholder="e.g. Pak Ahmad"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800 dark:text-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-400"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-2xl shadow-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  Mulai Mencatat <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Data security disclaimer */}
              <div className="text-center flex items-center justify-center gap-1.5 text-slate-500">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span className="text-[10px] font-semibold">Semua data disimpan di HP Anda & Google Drive</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BukuKasProvider>
      <AppContent />
    </BukuKasProvider>
  );
}
