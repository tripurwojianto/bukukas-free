/**
 * Types for BukuKas Free
 */

export interface ShopProfile {
  name: string;
  ownerName: string;
  logo: string; // URL or emoji/icon name
  phone: string;
  address: string;
  email: string;
  reminderEnabled?: boolean;
  reminderTime?: string; // e.g. "16:00"
}

export interface Category {
  id: string;
  type: 'penjualan' | 'pengeluaran';
  name: string;
}

export interface Penjualan {
  id: string;
  date: string; // YYYY-MM-DD
  category: string;
  amount: number;
  notes: string;
}

export interface Pengeluaran {
  id: string;
  date: string; // YYYY-MM-DD
  category: string;
  amount: number;
  notes: string;
}

export interface Kasbon {
  id: string;
  customerName: string;
  phone: string;
  date: string; // YYYY-MM-DD
  amount: number;
  status: 'Lunas' | 'Belum Lunas';
}

export interface PembayaranKasbon {
  id: string;
  kasbonId: string;
  customerName: string;
  date: string; // YYYY-MM-DD
  amount: number;
}

export interface Pelanggan {
  name: string;
  phone: string;
}

export interface AppLog {
  timestamp: string;
  activity: string;
}

export interface BukuKasData {
  profile: ShopProfile;
  categories: Category[];
  penjualan: Penjualan[];
  pengeluaran: Pengeluaran[];
  kasbon: Kasbon[];
  pembayaranKasbon: PembayaranKasbon[];
  pelanggan: Pelanggan[];
  logs: AppLog[];
}

export interface SyncQueueItem {
  id: string;
  timestamp: string;
  type: 'tambah_penjualan' | 'tambah_pengeluaran' | 'tambah_kasbon' | 'tambah_pembayaran' | 'hapus_transaksi' | 'hapus_kasbon' | 'edit_profil' | 'tambah_kategori' | 'umum';
  description: string;
  dataSnapshot: BukuKasData;
}
