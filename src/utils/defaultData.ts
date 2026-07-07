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

export const getGuestDemoData = (): BukuKasData => {
  const today = getTodayDateString();
  const d = new Date();
  
  const subDays = (days: number): string => {
    const copy = new Date(d);
    copy.setDate(copy.getDate() - days);
    const year = copy.getFullYear();
    const month = String(copy.getMonth() + 1).padStart(2, '0');
    const day = String(copy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    profile: {
      name: 'Warung Sejahtera (Mode Tamu)',
      ownerName: 'Budi Santoso',
      logo: '☕',
      phone: '081234567890',
      address: 'Jl. Merdeka No. 12, Jakarta',
      email: 'warung.sejahtera@gmail.com',
      reminderEnabled: true,
      reminderTime: '18:00',
    },
    categories: defaultCategories,
    penjualan: [
      { id: 'p-demo-1', date: today, category: 'Makanan & Camilan', amount: 150000, notes: 'Pesanan camilan Bu RT' },
      { id: 'p-demo-2', date: today, category: 'Minuman', amount: 85000, notes: 'Es teh & jus' },
      { id: 'p-demo-3', date: subDays(1), category: 'Sembako', amount: 340000, notes: 'Beras 10kg & minyak' },
      { id: 'p-demo-4', date: subDays(1), category: 'Rokok', amount: 120000, notes: 'Gudang Garam filter' },
      { id: 'p-demo-5', date: subDays(2), category: 'Pulsa & Paket Data', amount: 55000, notes: 'Pulsa telkomsel 50rb' },
      { id: 'p-demo-6', date: subDays(2), category: 'Token Listrik', amount: 202000, notes: 'Token 200rb' },
      { id: 'p-demo-7', date: subDays(3), category: 'Minuman', amount: 110000, notes: 'Grosir air mineral' },
      { id: 'p-demo-8', date: subDays(4), category: 'Sembako', amount: 450000, notes: 'Sembako mingguan' },
      { id: 'p-demo-9', date: subDays(5), category: 'Makanan & Camilan', amount: 95000, notes: 'Kopi & roti' },
    ],
    pengeluaran: [
      { id: 'e-demo-1', date: today, category: 'Kemasan / Kresek', amount: 15000, notes: 'Beli kantong plastik' },
      { id: 'e-demo-2', date: subDays(1), category: 'Kulakan (Stok Barang)', amount: 500000, notes: 'Belanja stok sembako agen' },
      { id: 'e-demo-3', date: subDays(2), category: 'Transportasi / Bensin', amount: 35000, notes: 'Bensin motor kulakan' },
      { id: 'e-demo-4', date: subDays(3), category: 'Biaya Listrik & Air', amount: 120000, notes: 'Bayar PDAM warung' },
      { id: 'e-demo-5', date: subDays(5), category: 'Kulakan (Stok Barang)', amount: 350000, notes: 'Stok minuman botol' },
    ],
    kasbon: [
      { id: 'kasbon-demo-1', customerName: 'Bu Ani', phone: '085711223344', date: subDays(2), amount: 75000, status: 'Belum Lunas' },
      { id: 'kasbon-demo-2', customerName: 'Pak Joko', phone: '081399887766', date: subDays(4), amount: 150000, status: 'Lunas' },
      { id: 'kasbon-demo-3', customerName: 'Mbak Sri', phone: '089944556677', date: subDays(1), amount: 45000, status: 'Belum Lunas' },
    ],
    pembayaranKasbon: [
      { id: 'pay-demo-1', kasbonId: 'kasbon-demo-2', customerName: 'Pak Joko', date: subDays(1), amount: 150000 },
    ],
    pelanggan: [
      { name: 'Bu Ani', phone: '085711223344' },
      { name: 'Pak Joko', phone: '081399887766' },
      { name: 'Mbak Sri', phone: '089944556677' },
    ],
    logs: [
      { timestamp: new Date().toISOString(), activity: 'Mode Demo diaktifkan dengan data sampel Warung Sejahtera' }
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
