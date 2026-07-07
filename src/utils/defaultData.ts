import { BukuKasData, Category } from '../types';

export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const defaultCategories: Category[] = [
  // Penjualan
  { id: 'cat-p-1', type: 'penjualan', name: 'Sembako' },
  { id: 'cat-p-2', type: 'penjualan', name: 'Makanan & Camilan' },
  { id: 'cat-p-3', type: 'penjualan', name: 'Minuman' },
  { id: 'cat-p-4', type: 'penjualan', name: 'Pulsa & Paket Data' },
  { id: 'cat-p-5', type: 'penjualan', name: 'Token Listrik' },
  { id: 'cat-p-6', type: 'penjualan', name: 'Rokok' },
  { id: 'cat-p-7', type: 'penjualan', name: 'Jasa / Lain-lain' },
  
  // Pengeluaran
  { id: 'cat-e-1', type: 'pengeluaran', name: 'Kulakan (Stok Barang)' },
  { id: 'cat-e-2', type: 'pengeluaran', name: 'Biaya Listrik & Air' },
  { id: 'cat-e-3', type: 'pengeluaran', name: 'Transportasi / Bensin' },
  { id: 'cat-e-4', type: 'pengeluaran', name: 'Gaji Karyawan' },
  { id: 'cat-e-5', type: 'pengeluaran', name: 'Sewa Tempat' },
  { id: 'cat-e-6', type: 'pengeluaran', name: 'Kemasan / Kresek' },
  { id: 'cat-e-7', type: 'pengeluaran', name: 'Keperluan Toko' },
  { id: 'cat-e-8', type: 'pengeluaran', name: 'Pengeluaran Lainnya' },
];

export const initialBukuKasData = (email?: string): BukuKasData => {
  return {
    profile: {
      name: 'Toko Kelontong Saya',
      ownerName: 'Pemilik Toko',
      logo: '🏪',
      phone: '',
      address: '',
      email: email || '',
      reminderEnabled: true,
      reminderTime: '16:00',
    },
    categories: defaultCategories,
    penjualan: [],
    pengeluaran: [],
    kasbon: [],
    pembayaranKasbon: [],
    pelanggan: [],
    logs: [
      {
        timestamp: new Date().toISOString(),
        activity: 'Database BukuKas Free diinisialisasi',
      }
    ]
  };
};

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
