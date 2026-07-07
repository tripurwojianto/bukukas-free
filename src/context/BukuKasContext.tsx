import React, { createContext, useContext, useState, useEffect } from 'react';
import { BukuKasData, ShopProfile, Category, Penjualan, Pengeluaran, Kasbon, PembayaranKasbon, Pelanggan, AppLog } from '../types';
import { initialBukuKasData, defaultCategories } from '../utils/defaultData';
import { initAuth, googleSignIn, logout as firebaseLogout, setAccessToken } from '../lib/firebase';
import { findSpreadsheet, createSpreadsheet, fetchBukuKasData, backupBukuKasData, backupDataToGoogleDrive, restoreDataFromGoogleDrive } from '../lib/sheetsService';
import { User } from 'firebase/auth';

interface BukuKasContextType {
  data: BukuKasData;
  isLoading: boolean;
  user: User | null;
  needsAuth: boolean;
  spreadsheetId: string | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error' | 'not_logged_in';
  lastSyncTime: string | null;
  driveSyncStatus: 'idle' | 'syncing' | 'success' | 'error' | 'not_logged_in';
  lastDriveSyncTime: string | null;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  
  // Auth actions
  loginWithGoogle: () => Promise<void>;
  handleLogout: () => Promise<void>;
  
  // Data actions
  updateProfile: (profile: Partial<ShopProfile>) => void;
  addCategory: (type: 'penjualan' | 'pengeluaran', name: string) => void;
  addPenjualan: (item: Omit<Penjualan, 'id'>) => void;
  addPengeluaran: (item: Omit<Pengeluaran, 'id'>) => void;
  addKasbon: (item: Omit<Kasbon, 'id' | 'status'>) => void;
  addPembayaranKasbon: (item: Omit<PembayaranKasbon, 'id'>) => void;
  deleteTransaction: (type: 'penjualan' | 'pengeluaran', id: string) => void;
  deleteKasbon: (id: string) => void;
  
  // Sheets actions
  backupToSheets: () => Promise<void>;
  restoreFromSheets: () => Promise<void>;
  syncWithSheets: () => Promise<void>;

  // Drive actions
  backupToDrive: () => Promise<void>;
  restoreFromDrive: () => Promise<void>;
}

const BukuKasContext = createContext<BukuKasContextType | undefined>(undefined);

export const BukuKasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<BukuKasData>(initialBukuKasData());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error' | 'not_logged_in'>('not_logged_in');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [driveSyncStatus, setDriveSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error' | 'not_logged_in'>('not_logged_in');
  const [lastDriveSyncTime, setLastDriveSyncTime] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('bukukas_theme');
    return (savedTheme === 'dark' || savedTheme === 'light') ? savedTheme : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('bukukas_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // 1. Load data from localStorage on mount
  useEffect(() => {
    const localData = localStorage.getItem('bukukas_free_data');
    const localSpreadsheetId = localStorage.getItem('bukukas_spreadsheet_id');
    const localLastSync = localStorage.getItem('bukukas_last_sync');
    const localLastDriveSync = localStorage.getItem('bukukas_last_drive_sync');
    const localToken = localStorage.getItem('bukukas_access_token'); // short cache

    if (localData) {
      try {
        setData(JSON.parse(localData));
      } catch (e) {
        console.error('Failed to parse local BukuKas data', e);
      }
    }
    if (localSpreadsheetId) {
      setSpreadsheetId(localSpreadsheetId);
    }
    if (localLastSync) {
      setLastSyncTime(localLastSync);
    }
    if (localLastDriveSync) {
      setLastDriveSyncTime(localLastDriveSync);
    }
    if (localToken) {
      setToken(localToken);
      setAccessToken(localToken);
    }

    setIsLoading(false);
  }, []);

  // Save data to local storage when changed
  const saveDataLocally = (newData: BukuKasData) => {
    setData(newData);
    localStorage.setItem('bukukas_free_data', JSON.stringify(newData));
  };

  // 2. Initialize Firebase Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      async (firebaseUser, accessToken) => {
        setUser(firebaseUser);
        setToken(accessToken);
        setAccessToken(accessToken);
        setNeedsAuth(false);
        setSyncStatus('idle');
        setDriveSyncStatus('idle');
        localStorage.setItem('bukukas_access_token', accessToken);
        
        // Update user profile email in our local data if not present
        setData(prev => {
          if (!prev.profile.email && firebaseUser.email) {
            const updated = {
              ...prev,
              profile: { ...prev.profile, email: firebaseUser.email, name: prev.profile.name || firebaseUser.displayName || 'Toko Saya' }
            };
            localStorage.setItem('bukukas_free_data', JSON.stringify(updated));
            return updated;
          }
          return prev;
        });

        // Try to automatically find or create Spreadsheet
        try {
          let ssId = spreadsheetId;
          if (!ssId) {
            const foundId = await findSpreadsheet(accessToken);
            if (foundId) {
              ssId = foundId;
              setSpreadsheetId(foundId);
              localStorage.setItem('bukukas_spreadsheet_id', foundId);
            }
          }
        } catch (err) {
          console.error('Auto-linking spreadsheet failed:', err);
        }
      },
      () => {
        setUser(null);
        setToken(null);
        setAccessToken(null);
        setNeedsAuth(true);
        setSyncStatus('not_logged_in');
        setDriveSyncStatus('not_logged_in');
        localStorage.removeItem('bukukas_access_token');
      }
    );

    return () => unsubscribe();
  }, [spreadsheetId]);

  // Auth Operations
  const loginWithGoogle = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
        setSyncStatus('idle');
        setDriveSyncStatus('idle');
        localStorage.setItem('bukukas_access_token', result.accessToken);

        // Fetch or create spreadsheet on successful login
        const ssId = await findSpreadsheet(result.accessToken);
        if (ssId) {
          setSpreadsheetId(ssId);
          localStorage.setItem('bukukas_spreadsheet_id', ssId);
          // Trigger automatic restore/prompt
          const confirmed = window.confirm('Ditemukan data cadangan BukuKas di Google Sheets Anda. Apakah Anda ingin memulihkan (Restore) data tersebut ke HP ini?\n\nKlik OK untuk MEMULIHKAN data dari Google Sheets.\nKlik Batal untuk tetap menggunakan data lokal sekarang dan menimpanya ke Google Sheets nanti.');
          if (confirmed) {
            await restoreFromGoogleSheets(result.accessToken, ssId);
          }
        } else {
          // Create new spreadsheet
          const newId = await createSpreadsheet(result.accessToken);
          setSpreadsheetId(newId);
          localStorage.setItem('bukukas_spreadsheet_id', newId);
          // Initial backup of local data
          await backupToGoogleSheets(result.accessToken, newId, data);
        }
      }
    } catch (error) {
      console.error('Google Login Error:', error);
      alert('Gagal masuk dengan Google: ' + (error as Error).message);
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseLogout();
      setUser(null);
      setToken(null);
      setSpreadsheetId(null);
      setSyncStatus('not_logged_in');
      setDriveSyncStatus('not_logged_in');
      setLastDriveSyncTime(null);
      localStorage.removeItem('bukukas_spreadsheet_id');
      localStorage.removeItem('bukukas_access_token');
      localStorage.removeItem('bukukas_last_drive_sync');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Helper sync functions
  const backupToGoogleSheets = async (accessToken: string, ssId: string, currentData: BukuKasData) => {
    setSyncStatus('syncing');
    try {
      await backupBukuKasData(accessToken, ssId, currentData);
      setSyncStatus('success');
      const now = new Date().toLocaleString('id-ID');
      setLastSyncTime(now);
      localStorage.setItem('bukukas_last_sync', now);
    } catch (err) {
      console.error('Backup failed:', err);
      setSyncStatus('error');
      throw err;
    }
  };

  const restoreFromGoogleSheets = async (accessToken: string, ssId: string) => {
    setSyncStatus('syncing');
    try {
      const sheetsData = await fetchBukuKasData(accessToken, ssId);
      
      // Merge with default initial data in case some properties are missing
      const base = initialBukuKasData(user?.email || undefined);
      const mergedData: BukuKasData = {
        profile: { ...base.profile, ...sheetsData.profile },
        categories: sheetsData.categories && sheetsData.categories.length > 0 ? sheetsData.categories : defaultCategories,
        penjualan: sheetsData.penjualan || [],
        pengeluaran: sheetsData.pengeluaran || [],
        kasbon: sheetsData.kasbon || [],
        pembayaranKasbon: sheetsData.pembayaranKasbon || [],
        pelanggan: sheetsData.pelanggan || [],
        logs: sheetsData.logs && sheetsData.logs.length > 0 ? sheetsData.logs : base.logs,
      };

      // Recalculate Pelanggan just in case
      const pelangganMap = new Map<string, string>();
      mergedData.kasbon.forEach(k => {
        pelangganMap.set(k.customerName, k.phone);
      });
      mergedData.pelanggan = Array.from(pelangganMap.entries()).map(([name, phone]) => ({ name, phone }));

      saveDataLocally(mergedData);
      setSyncStatus('success');
      const now = new Date().toLocaleString('id-ID');
      setLastSyncTime(now);
      localStorage.setItem('bukukas_last_sync', now);
    } catch (err) {
      console.error('Restore failed:', err);
      setSyncStatus('error');
      throw err;
    }
  };

  // Public Sync triggers
  const backupToSheets = async () => {
    if (!token || !spreadsheetId) {
      alert('Silakan masuk dengan Google terlebih dahulu.');
      return;
    }
    const confirmed = window.confirm('Apakah Anda yakin ingin MENCADANGKAN data saat ini ke Google Sheets? Tindakan ini akan menimpa data yang ada di spreadsheet.');
    if (!confirmed) return;

    try {
      await backupToGoogleSheets(token, spreadsheetId, data);
      alert('Data berhasil dicadangkan ke Google Sheets!');
    } catch (err) {
      alert('Gagal mencadangkan data: ' + (err as Error).message);
    }
  };

  const restoreFromSheets = async () => {
    if (!token || !spreadsheetId) {
      alert('Silakan masuk dengan Google terlebih dahulu.');
      return;
    }
    const confirmed = window.confirm('Apakah Anda yakin ingin MEMULIHKAN data dari Google Sheets? Tindakan ini akan menghapus data lokal di HP ini dan menggantinya dengan data dari spreadsheet.');
    if (!confirmed) return;

    try {
      await restoreFromGoogleSheets(token, spreadsheetId);
      alert('Data berhasil dipulihkan dari Google Sheets!');
    } catch (err) {
      alert('Gagal memulihkan data: ' + (err as Error).message);
    }
  };

  const backupToDrive = async () => {
    if (!token) {
      alert('Silakan masuk dengan Google terlebih dahulu.');
      return;
    }
    const confirmed = window.confirm('Apakah Anda yakin ingin MENCADANGKAN data saat ini ke Google Drive? Tindakan ini akan menyimpan seluruh database Anda dalam sebuah file cadangan BukuKas_Backup_Database.json secara aman.');
    if (!confirmed) return;

    setDriveSyncStatus('syncing');
    try {
      await backupDataToGoogleDrive(token, data);
      setDriveSyncStatus('success');
      const nowStr = new Date().toLocaleString('id-ID');
      setLastDriveSyncTime(nowStr);
      localStorage.setItem('bukukas_last_drive_sync', nowStr);
      alert('Data berhasil dicadangkan ke Google Drive!');
    } catch (err) {
      setDriveSyncStatus('error');
      alert('Gagal mencadangkan data ke Google Drive: ' + (err as Error).message);
    }
  };

  const restoreFromDrive = async () => {
    if (!token) {
      alert('Silakan masuk dengan Google terlebih dahulu.');
      return;
    }
    const confirmed = window.confirm('Apakah Anda yakin ingin MEMULIHKAN data dari Google Drive? Tindakan ini akan menghapus data lokal di HP ini dan menggantinya dengan data cadangan yang ada di Google Drive Anda.');
    if (!confirmed) return;

    setDriveSyncStatus('syncing');
    try {
      const driveData = await restoreDataFromGoogleDrive(token);
      
      // Merge with default initial data in case some properties are missing
      const base = initialBukuKasData(user?.email || undefined);
      const mergedData: BukuKasData = {
        profile: { ...base.profile, ...driveData.profile },
        categories: driveData.categories && driveData.categories.length > 0 ? driveData.categories : defaultCategories,
        penjualan: driveData.penjualan || [],
        pengeluaran: driveData.pengeluaran || [],
        kasbon: driveData.kasbon || [],
        pembayaranKasbon: driveData.pembayaranKasbon || [],
        pelanggan: driveData.pelanggan || [],
        logs: driveData.logs && driveData.logs.length > 0 ? driveData.logs : base.logs,
      };

      // Recalculate Pelanggan just in case
      const pelangganMap = new Map<string, string>();
      mergedData.kasbon.forEach(k => {
        pelangganMap.set(k.customerName, k.phone);
      });
      mergedData.pelanggan = Array.from(pelangganMap.entries()).map(([name, phone]) => ({ name, phone }));

      saveDataLocally(mergedData);
      setDriveSyncStatus('success');
      const nowStr = new Date().toLocaleString('id-ID');
      setLastDriveSyncTime(nowStr);
      localStorage.setItem('bukukas_last_drive_sync', nowStr);
      alert('Data berhasil dipulihkan dari Google Drive!');
    } catch (err) {
      setDriveSyncStatus('error');
      alert('Gagal memulihkan data dari Google Drive: ' + (err as Error).message);
    }
  };

  const syncWithSheets = async () => {
    if (!token) return;
    try {
      let ssId = spreadsheetId;
      if (!ssId) {
        ssId = await findSpreadsheet(token);
        if (!ssId) {
          ssId = await createSpreadsheet(token);
        }
        setSpreadsheetId(ssId);
        localStorage.setItem('bukukas_spreadsheet_id', ssId);
      }
      await backupToGoogleSheets(token, ssId, data);
    } catch (err) {
      console.error('Auto sync failed:', err);
    }
  };

  // Local state operations (always saves locally immediately, and syncs in background if token exists)
  const logActivity = (activity: string, currentData: BukuKasData): BukuKasData => {
    const newLog: AppLog = {
      timestamp: new Date().toISOString(),
      activity,
    };
    return {
      ...currentData,
      logs: [newLog, ...currentData.logs].slice(0, 50), // keep last 50 logs
    };
  };

  const updateProfile = (profileUpdate: Partial<ShopProfile>) => {
    const updatedProfile = { ...data.profile, ...profileUpdate };
    const updatedData = { ...data, profile: updatedProfile };
    const finalData = logActivity(`Profil toko diperbarui: ${profileUpdate.name || updatedProfile.name}`, updatedData);
    saveDataLocally(finalData);
    if (token && spreadsheetId) backupToGoogleSheets(token, spreadsheetId, finalData).catch(console.error);
  };

  const addCategory = (type: 'penjualan' | 'pengeluaran', name: string) => {
    // Check if category already exists
    if (data.categories.some(c => c.type === type && c.name.toLowerCase() === name.toLowerCase())) {
      return;
    }
    const newCategory: Category = {
      id: `cat-${type}-${Date.now()}`,
      type,
      name,
    };
    const updatedData = {
      ...data,
      categories: [...data.categories, newCategory],
    };
    const finalData = logActivity(`Kategori baru ditambahkan: ${name} (${type === 'penjualan' ? 'Penjualan' : 'Pengeluaran'})`, updatedData);
    saveDataLocally(finalData);
    if (token && spreadsheetId) backupToGoogleSheets(token, spreadsheetId, finalData).catch(console.error);
  };

  const addPenjualan = (item: Omit<Penjualan, 'id'>) => {
    const newItem: Penjualan = {
      ...item,
      id: `penjualan-${Date.now()}`,
    };
    const updatedData = {
      ...data,
      penjualan: [newItem, ...data.penjualan],
    };
    const finalData = logActivity(`Mencatat penjualan: Rp ${item.amount.toLocaleString()} - ${item.notes || item.category}`, updatedData);
    saveDataLocally(finalData);
    if (token && spreadsheetId) backupToGoogleSheets(token, spreadsheetId, finalData).catch(console.error);
  };

  const addPengeluaran = (item: Omit<Pengeluaran, 'id'>) => {
    const newItem: Pengeluaran = {
      ...item,
      id: `pengeluaran-${Date.now()}`,
    };
    const updatedData = {
      ...data,
      pengeluaran: [newItem, ...data.pengeluaran],
    };
    const finalData = logActivity(`Mencatat pengeluaran: Rp ${item.amount.toLocaleString()} - ${item.notes || item.category}`, updatedData);
    saveDataLocally(finalData);
    if (token && spreadsheetId) backupToGoogleSheets(token, spreadsheetId, finalData).catch(console.error);
  };

  const addKasbon = (item: Omit<Kasbon, 'id' | 'status'>) => {
    const newItem: Kasbon = {
      ...item,
      id: `kasbon-${Date.now()}`,
      status: 'Belum Lunas',
    };

    // Update or add Pelanggan list
    const pelangganExists = data.pelanggan.some(p => p.name.toLowerCase() === item.customerName.toLowerCase());
    const updatedPelanggan = pelangganExists
      ? data.pelanggan
      : [...data.pelanggan, { name: item.customerName, phone: item.phone }];

    const updatedData = {
      ...data,
      kasbon: [newItem, ...data.kasbon],
      pelanggan: updatedPelanggan,
    };
    const finalData = logActivity(`Mencatat kasbon baru: ${item.customerName} - Rp ${item.amount.toLocaleString()}`, updatedData);
    saveDataLocally(finalData);
    if (token && spreadsheetId) backupToGoogleSheets(token, spreadsheetId, finalData).catch(console.error);
  };

  const addPembayaranKasbon = (item: Omit<PembayaranKasbon, 'id'>) => {
    const newItem: PembayaranKasbon = {
      ...item,
      id: `pembayaran-${Date.now()}`,
    };

    const newPembayaranList = [newItem, ...data.pembayaranKasbon];

    // Re-evaluate kasbon statuses for this customer
    // We get all kasbons for this customer sorted chronologically (oldest first)
    const customerKasbons = data.kasbon
      .filter(k => k.customerName.toLowerCase() === item.customerName.toLowerCase())
      .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

    // Get total paid for this customer
    const totalPaid = newPembayaranList
      .filter(p => p.customerName.toLowerCase() === item.customerName.toLowerCase())
      .reduce((sum, p) => sum + p.amount, 0);

    // Apply payments chronologically
    let runningPayment = totalPaid;
    const updatedKasbons = data.kasbon.map(k => {
      if (k.customerName.toLowerCase() !== item.customerName.toLowerCase()) {
        return k;
      }
      
      // If we still have payments to apply to this kasbon
      if (runningPayment >= k.amount) {
        runningPayment -= k.amount;
        return { ...k, status: 'Lunas' as const };
      } else {
        // runningPayment < k.amount, which means either runningPayment is 0, or partial payment.
        // For BukuKas simplicity, if runningPayment is greater than 0, it is still "Belum Lunas" but is partially paid.
        // We can keep it "Belum Lunas" until fully covered.
        runningPayment = 0;
        return { ...k, status: 'Belum Lunas' as const };
      }
    });

    const updatedData = {
      ...data,
      pembayaranKasbon: newPembayaranList,
      kasbon: updatedKasbons,
    };

    const finalData = logActivity(`Pembayaran kasbon diterima: ${item.customerName} - Rp ${item.amount.toLocaleString()}`, updatedData);
    saveDataLocally(finalData);
    if (token && spreadsheetId) backupToGoogleSheets(token, spreadsheetId, finalData).catch(console.error);
  };

  const deleteTransaction = (type: 'penjualan' | 'pengeluaran', id: string) => {
    let deletedItemName = '';
    const updatedData = { ...data };
    if (type === 'penjualan') {
      const item = data.penjualan.find(p => p.id === id);
      deletedItemName = item ? `Rp ${item.amount.toLocaleString()} (${item.category})` : id;
      updatedData.penjualan = data.penjualan.filter(p => p.id !== id);
    } else {
      const item = data.pengeluaran.find(p => p.id === id);
      deletedItemName = item ? `Rp ${item.amount.toLocaleString()} (${item.category})` : id;
      updatedData.pengeluaran = data.pengeluaran.filter(p => p.id !== id);
    }

    const finalData = logActivity(`Menghapus catatan ${type}: ${deletedItemName}`, updatedData);
    saveDataLocally(finalData);
    if (token && spreadsheetId) backupToGoogleSheets(token, spreadsheetId, finalData).catch(console.error);
  };

  const deleteKasbon = (id: string) => {
    const item = data.kasbon.find(k => k.id === id);
    if (!item) return;

    // Delete associated payments if they correspond to this specific kasbonId
    const updatedPembayaran = data.pembayaranKasbon.filter(p => p.kasbonId !== id);
    const updatedKasbonList = data.kasbon.filter(k => k.id !== id);

    // Re-evaluate kasbon status after deletion of this item
    const updatedData = {
      ...data,
      kasbon: updatedKasbonList,
      pembayaranKasbon: updatedPembayaran,
    };

    const finalData = logActivity(`Menghapus kasbon: ${item.customerName} - Rp ${item.amount.toLocaleString()}`, updatedData);
    saveDataLocally(finalData);
    if (token && spreadsheetId) backupToGoogleSheets(token, spreadsheetId, finalData).catch(console.error);
  };

  return (
    <BukuKasContext.Provider
      value={{
        data,
        isLoading,
        user,
        needsAuth,
        spreadsheetId,
        syncStatus,
        lastSyncTime,
        loginWithGoogle,
        handleLogout,
        updateProfile,
        addCategory,
        addPenjualan,
        addPengeluaran,
        addKasbon,
        addPembayaranKasbon,
        deleteTransaction,
        deleteKasbon,
        backupToSheets,
        restoreFromSheets,
        syncWithSheets,
        driveSyncStatus,
        lastDriveSyncTime,
        backupToDrive,
        restoreFromDrive,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </BukuKasContext.Provider>
  );
};

export const useBukuKas = () => {
  const context = useContext(BukuKasContext);
  if (context === undefined) {
    throw new Error('useBukuKas must be used within a BukuKasProvider');
  }
  return context;
};
