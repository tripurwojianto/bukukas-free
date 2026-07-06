import { LocalData } from '../types';
import { getTodayDateString } from './helpers';

export const getInitialData = (): LocalData => {
  const today = getTodayDateString();
  
  // Get yesterday's date
  const d = new Date(today);
  d.setDate(d.getDate() - 1);
  const yesterday = d.toISOString().split('T')[0];

  // Get a future date
  const dFuture = new Date(today);
  dFuture.setDate(dFuture.getDate() + 7);
  const futureDate = dFuture.toISOString().split('T')[0];

  // Get a past due date
  const dPast = new Date(today);
  dPast.setDate(dPast.getDate() - 3);
  const pastDate = dPast.toISOString().split('T')[0];

  return {
    sessions: {
      [yesterday]: {
        date: yesterday,
        openingPettyCash: 150000,
        openingPhysicalCash: 150000,
        closingPhysicalCash: 435000, // Matches book balance perfectly: 150000 + 350000 (masuk) - 65000 (keluar) = 435000
      },
      [today]: {
        date: today,
        openingPettyCash: 150000,
        openingPhysicalCash: 150000,
        // Active session, closingPhysicalCash is not set yet
      },
    },
    transactions: [
      // Yesterday transactions
      {
        id: 'tx-1',
        date: yesterday,
        time: '08:30',
        description: 'Penjualan Sembako Paket A',
        type: 'masuk',
        category: 'rutin',
        amount: 250000,
        hpp: 195000, // profit: 55000
      },
      {
        id: 'tx-2',
        date: yesterday,
        time: '11:15',
        description: 'Beli Gas Elpiji Toko',
        type: 'keluar',
        category: 'rutin',
        amount: 65000,
      },
      {
        id: 'tx-3',
        date: yesterday,
        time: '15:45',
        description: 'Penjualan Snack & Minuman',
        type: 'masuk',
        category: 'rutin',
        amount: 100000,
        hpp: 70000, // profit: 30000
      },
      // Today transactions
      {
        id: 'tx-4',
        date: today,
        time: '08:15',
        description: 'Penjualan Beras Cianjur 10kg',
        type: 'masuk',
        category: 'rutin',
        amount: 145000,
        hpp: 120000, // profit: 25000
      },
      {
        id: 'tx-5',
        date: today,
        time: '10:00',
        description: 'Biaya Kebersihan & Keamanan Pasar',
        type: 'keluar',
        category: 'insidental',
        amount: 250000,
      },
      {
        id: 'tx-6',
        date: today,
        time: '11:30',
        description: 'Penjualan Grosir Minyak Goreng 2L',
        type: 'masuk',
        category: 'rutin',
        amount: 320000,
        hpp: 285000, // profit: 35000
      },
      {
        id: 'tx-7',
        date: today,
        time: '14:20',
        description: 'Reparasi Engsel Pintu Etalase',
        type: 'keluar',
        category: 'insidental',
        amount: 75000,
      }
    ],
    receivables: [
      {
        id: 'rec-1',
        customerName: 'Bu Endang (Warung Sebelah)',
        date: yesterday,
        dueDate: futureDate,
        description: 'Gula Pasir 5kg & Kopi Kapal Api',
        amount: 95000,
        paidAmount: 40000,
        status: 'dicicil',
      },
      {
        id: 'rec-2',
        customerName: 'Pak RT (Asep)',
        date: pastDate,
        dueDate: yesterday,
        description: 'Sewa Tikar & Gelas Plastik',
        amount: 120000,
        paidAmount: 0,
        status: 'belum_lunas',
      },
      {
        id: 'rec-3',
        customerName: 'Mbak Sri',
        date: yesterday,
        dueDate: today,
        description: 'Telur Ayam 2kg',
        amount: 56000,
        paidAmount: 56000,
        status: 'lunas',
      }
    ],
    payables: [
      {
        id: 'pay-1',
        supplierName: 'Agen Sembako Makmur',
        date: yesterday,
        dueDate: futureDate,
        description: 'Pasokan Mie Instan & Tepung Terigu',
        amount: 750000,
        paidAmount: 300000,
        status: 'dicicil',
      },
      {
        id: 'pay-2',
        supplierName: 'Distributor Air Mineral Aqua',
        date: pastDate,
        dueDate: today,
        description: 'Aqua Galon 15 Pcs',
        amount: 270000,
        paidAmount: 0,
        status: 'belum_lunas',
      }
    ],
    bankAccounts: [
      { id: 'acc-bca', name: 'Bank BCA', type: 'bank', initialBalance: 2500000 },
      { id: 'acc-mandiri', name: 'Bank Mandiri', type: 'bank', initialBalance: 1000000 },
      { id: 'acc-gopay', name: 'GoPay Bisnis', type: 'e-wallet', initialBalance: 500000 },
      { id: 'acc-shopeepay', name: 'ShopeePay', type: 'e-wallet', initialBalance: 300000 }
    ],
    bankMutations: [
      {
        id: 'mut-1',
        date: yesterday,
        time: '09:00',
        accountId: 'acc-bca',
        type: 'setor',
        description: 'Setoran omset kasir kemarin',
        amount: 500000
      },
      {
        id: 'mut-2',
        date: today,
        time: '10:30',
        accountId: 'acc-gopay',
        type: 'pengeluaran_langsung',
        description: 'Beli token listrik via GoPay',
        amount: 100000
      }
    ],
    products: [
      {
        id: 'prod-1',
        sku: 'BRS-PW-05',
        name: 'Beras Pandan Wangi 5 Kg',
        stock: 20,
        costPrice: 65000,
        sellingPrice: 78000,
        minStock: 5,
        unit: 'Karung'
      },
      {
        id: 'prod-2',
        sku: 'MYK-BML-02',
        name: 'Minyak Goreng Bimoli 2 L',
        stock: 15,
        costPrice: 31000,
        sellingPrice: 36500,
        minStock: 4,
        unit: 'Pouch'
      },
      {
        id: 'prod-3',
        sku: 'GUL-GLK-01',
        name: 'Gula Pasir Gulaku 1 Kg',
        stock: 35,
        costPrice: 14000,
        sellingPrice: 17000,
        minStock: 10,
        unit: 'Bks'
      },
      {
        id: 'prod-4',
        sku: 'MIE-IND-GR',
        name: 'Indomie Goreng Special',
        stock: 120,
        costPrice: 2700,
        sellingPrice: 3500,
        minStock: 20,
        unit: 'Pcs'
      },
      {
        id: 'prod-5',
        sku: 'KCP-SCH-ABC',
        name: 'Kecap Sachet ABC',
        stock: 80,
        costPrice: 1500,
        sellingPrice: 2000,
        minStock: 15,
        unit: 'Bks'
      },
      {
        id: 'prod-6',
        sku: 'KCP-BNG-1000',
        name: 'Kecap Manis Bango 1000 mL',
        stock: 10,
        costPrice: 32000,
        sellingPrice: 38500,
        minStock: 2,
        unit: 'Botol'
      }
    ],
    stockHistory: [
      {
        id: 'st-1',
        productId: 'prod-1',
        date: yesterday,
        time: '08:00',
        type: 'masuk',
        quantity: 20,
        price: 65000,
        notes: 'Stok awal toko dari Supplier Utama'
      },
      {
        id: 'st-2',
        productId: 'prod-2',
        date: yesterday,
        time: '08:15',
        type: 'masuk',
        quantity: 15,
        price: 31000,
        notes: 'Stok awal toko dari Supplier Utama'
      },
      {
        id: 'st-3',
        productId: 'prod-3',
        date: yesterday,
        time: '08:20',
        type: 'masuk',
        quantity: 35,
        price: 14000,
        notes: 'Stok awal toko dari Supplier Utama'
      },
      {
        id: 'st-4',
        productId: 'prod-4',
        date: yesterday,
        time: '08:30',
        type: 'masuk',
        quantity: 120,
        price: 2700,
        notes: 'Restock kulakan Indomie Goreng'
      }
    ],
    categories: [
      { id: 'cat-baju-pria', name: 'Baju Pria' },
      { id: 'cat-terigu', name: 'Terigu' }
    ],
    subcategories: [
      { id: 'sub-gamis', categoryId: 'cat-baju-pria', name: 'Gamis' },
      { id: 'sub-segitiga-biru', categoryId: 'cat-terigu', name: 'Segitiga Biru' }
    ],
    settings: {
      shopName: 'Buku Catatan Toko',
      shopAddress: 'Jl. Raya Kemakmuran No. 12, Jakarta',
      shopContact: '081234567890',
      isPremiumActive: false
    }
  };
};
