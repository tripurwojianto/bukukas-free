import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Cpu, 
  ToggleLeft, 
  ToggleRight, 
  User, 
  Award, 
  Wrench, 
  Database, 
  Brain, 
  Activity, 
  Info, 
  RefreshCw, 
  Check, 
  AlertCircle,
  Wifi,
  WifiOff,
  Clock,
  Play,
  FileText,
  FileCode,
  Lock,
  Sparkles
} from 'lucide-react';
import { AppSettings } from '../types';

interface DeveloperConsoleModuleProps {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  currentUser: any;
}

export default function DeveloperConsoleModule({
  settings,
  onUpdateSettings,
  currentUser
}: DeveloperConsoleModuleProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load backend developer config on mount
  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/developer/config', {
        headers: {
          'x-user-role': settings.userRole || 'developer'
        }
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Gagal memuat: Akses ditolak oleh server (Verifikasi Role Backend Gagal).');
        }
        throw new Error(`Error ${response.status}: Gagal memuat konfigurasi developer dari server.`);
      }
      
      const data = await response.json();
      setConfig(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal terhubung ke backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [settings.userRole]);

  // Handle Feature Flag toggle
  const handleToggleFlag = async (flagKey: string, currentValue: boolean) => {
    try {
      setActionLoading(flagKey);
      const response = await fetch('/api/developer/feature-flags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': settings.userRole || 'developer'
        },
        body: JSON.stringify({
          flags: {
            [flagKey]: !currentValue
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Gagal memperbarui status fitur.');
      }

      const resData = await response.json();
      setConfig((prev: any) => ({
        ...prev,
        featureFlags: resData.featureFlags
      }));
      triggerToast(`Fitur "${flagKey}" berhasil diperbarui!`);
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat memproses permintaan.');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle License update
  const handleUpdateLicense = async (status: string) => {
    try {
      setActionLoading('license');
      const response = await fetch('/api/developer/license', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': settings.userRole || 'developer'
        },
        body: JSON.stringify({
          status,
          activationDate: '2026-07-06',
          expirationDate: status === 'Free' ? '2026-08-06' : '2027-12-31'
        })
      });

      if (!response.ok) {
        throw new Error('Gagal memperbarui lisensi di backend.');
      }

      const resData = await response.json();
      setConfig((prev: any) => ({
        ...prev,
        license: resData.license
      }));
      triggerToast(`Lisensi diubah ke ${status}!`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Trigger Debug Action
  const handleDebugAction = async (action: string) => {
    try {
      setActionLoading(action);
      const response = await fetch(`/api/developer/debug/${action}`, {
        method: 'POST',
        headers: {
          'x-user-role': settings.userRole || 'developer'
        }
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Aksi debug gagal dijalankan.');
      }

      triggerToast(resData.message || 'Aksi berhasil dieksekusi!');
      
      // Refresh config to pull new logs & states
      fetchConfig();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const triggerToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Switch Local Test Role (Frontend Simulator)
  const handleSwitchTestRole = (newRole: any) => {
    onUpdateSettings({ userRole: newRole });
    triggerToast(`Role pengujian diubah ke: ${newRole || 'Default'}`);
  };

  if (loading && !config) {
    return (
      <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-md p-12 text-center flex flex-col items-center justify-center gap-4 min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <div className="text-sm font-mono font-bold">Menghubungkan ke Developer Console Backend...</div>
        <div className="text-xs text-slate-400">Memvalidasi sertifikat role & hak akses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-950 border border-rose-900 rounded-md p-8 text-center flex flex-col items-center justify-center gap-4 min-h-[400px]">
        <AlertCircle className="w-12 h-12 text-rose-500 animate-pulse" />
        <div className="text-sm font-bold text-rose-400 font-mono">ERROR: AKSES DITOLAK / KONEKSI GAGAL</div>
        <div className="text-xs text-slate-300 max-w-md bg-rose-950/40 p-4 rounded border border-rose-900/40 font-mono text-left">
          {error}
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchConfig}
            className="px-4 py-1.5 bg-rose-900 hover:bg-rose-800 text-white rounded text-xs font-mono font-bold transition-all cursor-pointer"
          >
            Coba Hubungkan Ulang
          </button>
          <button 
            onClick={() => handleSwitchTestRole('developer')}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono font-bold transition-all cursor-pointer"
          >
            Kembalikan Role ke Developer
          </button>
        </div>
      </div>
    );
  }

  const { systemInfo, featureFlags, license, aiConfig, systemStatus, about, logs } = config;

  return (
    <div className="bg-slate-950 text-slate-100 border border-slate-800 rounded-md shadow-2xl p-6 font-sans relative overflow-hidden" id="developer-console-panel">
      {/* Background Neon Accent Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-950 border border-blue-800 text-blue-400 rounded-lg shadow-inner">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">Developer Console</h2>
              <span className="text-[8px] bg-blue-900/40 border border-blue-500/50 text-blue-400 font-bold px-1.5 py-0.5 rounded font-mono uppercase">INTERNAL ONLY</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Sistem kontrol dan diagnostik remote config untuk SIKU</p>
          </div>
        </div>

        {/* Global Connection / Status Pill */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          {successMsg && (
            <span className="text-[10px] bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 px-3 py-1 rounded font-bold font-mono animate-fade-in flex items-center gap-1">
              <Check className="w-3 h-3" /> {successMsg}
            </span>
          )}
          <span className="text-[10px] bg-slate-900 border border-slate-800 px-3 py-1 rounded flex items-center gap-1.5 text-emerald-400 font-bold font-mono">
            <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> CLOUD SERVER SECURE
          </span>
        </div>
      </div>

      {/* Main Grid: 9 core requirements distributed beautifully */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10">
        
        {/* LEFT COLUMN: Controls & Configurations (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          
          {/* Section 2: Feature Flags (Remote Config switches) */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-5">
            <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3 mb-4">
              <Cpu className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">2. Feature Flags (Remote Config)</h3>
            </div>
            <p className="text-[10px] text-slate-400 mb-4">
              Aktifkan atau nonaktifkan fitur secara dinamis pada level server. Modifikasi ini disimpan di server lokal.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(featureFlags).map(([key, value]: [string, any]) => {
                const isLoading = actionLoading === key;
                return (
                  <div key={key} className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800/40 rounded hover:border-slate-800 transition-all">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-300 font-mono">{key}</span>
                      <span className="text-[9px] text-slate-500">Status: {value ? 'ON' : 'OFF'}</span>
                    </div>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleToggleFlag(key, value)}
                      className={`cursor-pointer transition-all focus:outline-none ${isLoading ? 'opacity-50' : ''}`}
                    >
                      {value ? (
                        <ToggleRight className="w-9 h-6 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-9 h-6 text-slate-600" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 5 & 6: Debug & Database Tools (Actions) */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-5">
            <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3 mb-4">
              <Wrench className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">5 & 6. Diagnostics & Database Tools</h3>
            </div>
            
            {/* Debug Tools */}
            <div className="mb-4">
              <h4 className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-2.5">Debug Diagnostics</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => handleDebugAction('reload-config')}
                  disabled={!!actionLoading}
                  className="px-2.5 py-1.5 bg-slate-950 hover:bg-indigo-950 border border-slate-800 hover:border-indigo-800 text-[10px] text-slate-300 rounded font-mono font-medium transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                >
                  Reload Config
                </button>
                <button
                  onClick={() => handleDebugAction('clear-cache')}
                  disabled={!!actionLoading}
                  className="px-2.5 py-1.5 bg-slate-950 hover:bg-indigo-950 border border-slate-800 hover:border-indigo-800 text-[10px] text-slate-300 rounded font-mono font-medium transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                >
                  Clear Cache
                </button>
                <button
                  onClick={() => handleDebugAction('refresh-data')}
                  disabled={!!actionLoading}
                  className="px-2.5 py-1.5 bg-slate-950 hover:bg-indigo-950 border border-slate-800 hover:border-indigo-800 text-[10px] text-slate-300 rounded font-mono font-medium transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                >
                  Refresh Data
                </button>
                <button
                  onClick={() => handleDebugAction('test-notification')}
                  disabled={!!actionLoading}
                  className="px-2.5 py-1.5 bg-slate-950 hover:bg-indigo-950 border border-slate-800 hover:border-indigo-800 text-[10px] text-slate-300 rounded font-mono font-medium transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                >
                  Test Notification
                </button>
                <button
                  onClick={() => handleDebugAction('test-ai')}
                  disabled={!!actionLoading}
                  className="px-2.5 py-1.5 bg-slate-950 hover:bg-indigo-950 border border-slate-800 hover:border-indigo-800 text-[10px] text-slate-300 rounded font-mono font-medium transition-all text-center flex items-center justify-center gap-1 cursor-pointer col-span-2"
                >
                  {actionLoading === 'test-ai' ? 'Pinging AI SDK...' : 'Test AI Connection (SDK)'}
                </button>
              </div>
            </div>

            {/* Database Tools */}
            <div>
              <h4 className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider mb-2.5">Database Operations (Mocked Cloud Run/Vercel Blueprints)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => triggerToast('Proses Ekstraksi Backup Database Firestore Berhasil!')}
                  className="px-2 py-1.5 bg-slate-950 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-800 text-[9px] text-emerald-400 rounded font-mono font-bold transition-all text-center cursor-pointer"
                >
                  Backup DB
                </button>
                <button
                  onClick={() => triggerToast('Restore Backup Database Firestore Berhasil!')}
                  className="px-2 py-1.5 bg-slate-950 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-800 text-[9px] text-emerald-400 rounded font-mono font-bold transition-all text-center cursor-pointer"
                >
                  Restore DB
                </button>
                <button
                  onClick={() => triggerToast('Ekspor data JSON skema SIKU berhasil!')}
                  className="px-2 py-1.5 bg-slate-950 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-800 text-[9px] text-emerald-400 rounded font-mono font-bold transition-all text-center cursor-pointer"
                >
                  Export JSON
                </button>
                <button
                  onClick={() => triggerToast('Impor skema struktur data JSON sukses!')}
                  className="px-2 py-1.5 bg-slate-950 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-800 text-[9px] text-emerald-400 rounded font-mono font-bold transition-all text-center cursor-pointer"
                >
                  Import JSON
                </button>
              </div>
            </div>
          </div>

          {/* Section 7: AI Configuration */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-5">
            <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3 mb-4">
              <Brain className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">7. AI Configuration (Gemini API SDK)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-950 border border-slate-800/60 rounded flex justify-between items-center">
                <span className="text-slate-400 text-[10px]">AI PROVIDER:</span>
                <span className="font-bold text-slate-100 text-[11px]">{aiConfig.provider}</span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800/60 rounded flex justify-between items-center">
                <span className="text-slate-400 text-[10px]">SDK CONNECTION:</span>
                <span className={`font-bold text-[11px] ${aiConfig.status.includes('Online') ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {aiConfig.status}
                </span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800/60 rounded flex justify-between items-center">
                <span className="text-slate-400 text-[10px]">ACTIVE MODEL:</span>
                <span className="font-bold text-indigo-400 text-[11px]">{aiConfig.activeModel}</span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800/60 rounded flex justify-between items-center">
                <span className="text-slate-400 text-[10px]">TOKEN METRIC:</span>
                <span className="font-bold text-amber-500 text-[11px]">{aiConfig.tokenUsage}</span>
              </div>
            </div>
            <div className="mt-3.5 p-2 rounded bg-slate-950 border border-slate-800/40 text-[9px] text-amber-400 flex items-center gap-1.5 font-mono">
              <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" /> API Key disembunyikan secara aman di server demi keamanan kredensial.
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Diagnostics, Accounts, and About (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          
          {/* Section 1: System Information */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-5">
            <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3 mb-4">
              <Info className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">1. System Information</h3>
            </div>
            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center border-b border-slate-800/30 pb-1.5">
                <span className="text-slate-400 text-[10px]">APP NAME:</span>
                <span className="font-bold text-slate-100">{systemInfo.appName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800/30 pb-1.5">
                <span className="text-slate-400 text-[10px]">VERSION:</span>
                <span className="font-bold text-sky-400">{systemInfo.version}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800/30 pb-1.5">
                <span className="text-slate-400 text-[10px]">ENVIRONMENT:</span>
                <span className="font-bold text-emerald-400 uppercase">{systemInfo.environment}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-800/30 pb-1.5">
                <span className="text-slate-400 text-[10px]">BUILD VERSION:</span>
                <span className="font-bold text-amber-500">{systemInfo.buildVersion}</span>
              </div>
              <div className="flex flex-col gap-0.5 border-b border-slate-800/30 pb-1.5">
                <span className="text-slate-400 text-[10px]">LAST BUILD TIMESTAMP:</span>
                <span className="text-slate-300 text-[10px] break-all">{systemInfo.lastBuildTime}</span>
              </div>
            </div>
          </div>

          {/* Section 3: User Role Tester */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-5">
            <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3 mb-4">
              <User className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">3. User Role Tester (Simulation)</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-slate-950 p-3 rounded border border-slate-800/60 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">UID:</span>
                  <span className="font-bold text-slate-200 truncate max-w-[180px]" title={currentUser?.uid || 'guest-dev-3112'}>
                    {currentUser?.uid || 'guest-dev-3112'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="font-bold text-slate-200">{currentUser?.email || 'dev.siku@domain.io'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Display Name:</span>
                  <span className="font-bold text-slate-200">{currentUser?.displayName || 'SIKU Senior Developer'}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-800/40 pt-1.5 mt-1">
                  <span className="text-slate-400">ACTIVE ROLE:</span>
                  <span className="bg-indigo-950 border border-indigo-700/60 text-indigo-300 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                    {settings.userRole || 'developer'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">PREMIUM STATE:</span>
                  <span className={`font-bold ${settings.isPremiumActive ? 'text-amber-400' : 'text-slate-400'}`}>
                    {settings.isPremiumActive ? 'ACTIVE (PRO)' : 'FREE STATE'}
                  </span>
                </div>
              </div>

              {/* Role Simulation Toggle triggers reload simulation */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Simulasikan Role (Untuk Pengujian Hak Akses)</label>
                <div className="grid grid-cols-4 gap-1">
                  {(['developer', 'owner', 'admin', 'kasir'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleSwitchTestRole(r)}
                      className={`px-1 py-1 rounded text-[10px] font-bold font-mono transition-all border cursor-pointer ${
                        (settings.userRole || 'developer') === r
                          ? 'bg-blue-600 text-white border-blue-500 shadow'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900 hover:text-slate-200'
                      }`}
                    >
                      {r.toUpperCase()}
                    </button>
                  ))}
                </div>
                <div className="text-[9px] text-rose-400/80 mt-1 font-mono leading-relaxed">
                  *Peringatan: Jika Anda memilih selain <strong>DEVELOPER</strong>, panel menu Developer Console ini akan segera disembunyikan berdasarkan aturan validasi sistem.
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: License Manager */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-5">
            <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3 mb-4">
              <Award className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">4. License Manager</h3>
            </div>
            
            <div className="bg-slate-950 p-3 rounded border border-slate-800/60 font-mono text-xs mb-3 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">LICENSE LEVEL:</span>
                <span className="font-bold text-amber-400 uppercase">{license?.status || 'Premium'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ACTIVE FROM:</span>
                <span className="font-bold text-slate-200">{license?.activationDate || '2026-07-06'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">EXPIRATION DATE:</span>
                <span className="font-bold text-slate-200">{license?.expirationDate || '2027-12-31'}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ganti Status Lisensi Backend</label>
              <div className="grid grid-cols-4 gap-1">
                {['Free', 'Trial', 'Premium', 'Enterprise'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => handleUpdateLicense(lvl)}
                    className={`px-1 py-1 rounded text-[9px] font-bold font-mono transition-all border cursor-pointer ${
                      license?.status === lvl
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900'
                    }`}
                  >
                    {lvl.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 8: System Status Indicators */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-5">
            <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3 mb-4">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">8. System Service Status</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              {Object.entries(systemStatus).map(([srv, stat]: [string, any]) => (
                <div key={srv} className="p-2 bg-slate-950 border border-slate-800/60 rounded flex justify-between items-center">
                  <span className="text-slate-400 uppercase">{srv}:</span>
                  <span className="flex items-center gap-1 font-bold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {stat}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 9: About Card */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-5">
            <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3 mb-4">
              <Info className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">9. About Applet</h3>
            </div>
            <div className="space-y-1.5 font-mono text-[10px] text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">APPLICATION Name:</span>
                <span className="font-bold text-slate-100">{about.appName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">BUILD:</span>
                <span className="font-bold text-indigo-400">{about.buildNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">DEVELOPER TEAM:</span>
                <span className="font-bold text-slate-100">{about.developer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">COPYRIGHT:</span>
                <span className="font-bold text-slate-100">{about.copyright}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Backend Logs Section (Diagnostics) */}
      <div className="mt-5 bg-slate-900/60 border border-slate-800/80 rounded-lg p-5 relative z-10">
        <div className="flex justify-between items-center border-b border-slate-800/60 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">Server Audit Trail & Security Logs</h3>
          </div>
          <button 
            onClick={fetchConfig} 
            title="Refresh logs" 
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="bg-slate-950 p-4 rounded border border-slate-800 font-mono text-[10px] text-slate-300 max-h-40 overflow-y-auto space-y-1 shadow-inner">
          {logs && logs.length > 0 ? (
            logs.map((log: string, idx: number) => (
              <div 
                key={idx} 
                className={`py-0.5 border-b border-slate-900/60 last:border-0 ${
                  log.includes('SECURITY_WARN') ? 'text-rose-400 font-bold bg-rose-950/20 px-1 rounded' :
                  log.includes('DEV_CONFIG') ? 'text-amber-400' :
                  log.includes('AI') ? 'text-purple-300' : 'text-slate-300'
                }`}
              >
                {log}
              </div>
            ))
          ) : (
            <div className="text-center text-slate-600 italic">No logs available.</div>
          )}
        </div>
      </div>

    </div>
  );
}
