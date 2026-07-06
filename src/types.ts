export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  description: string;
  type: 'masuk' | 'keluar';
  category: 'rutin' | 'insidental';
  amount: number;
  hpp?: number; // Harga Pokok Penjualan, optional, only for 'masuk'
  productId?: string;
  productQty?: number;
}

export interface DailyCashSession {
  date: string; // YYYY-MM-DD
  openingPettyCash: number; // Saldo awal uang kembalian
  openingPhysicalCash: number; // Uang fisik awal di kasir
  closingPhysicalCash?: number; // Uang fisik akhir di kasir (optional, filled at end of day)
}

export interface Receivable {
  id: string;
  customerName: string;
  date: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  description: string;
  amount: number;
  paidAmount: number;
  status: 'belum_lunas' | 'dicicil' | 'lunas';
  whatsappNumber?: string;
}

export interface Payable {
  id: string;
  supplierName: string;
  date: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  description: string;
  amount: number;
  paidAmount: number;
  status: 'belum_lunas' | 'dicicil' | 'lunas';
  whatsappNumber?: string;
}

export interface AppSettings {
  shopName: string;
  shopAddress?: string;
  shopContact?: string;
  isPremiumActive: boolean;
  userRole?: 'developer' | 'owner' | 'kasir' | 'admin';
}

export interface LocalData {
  sessions: Record<string, DailyCashSession>; // keyed by date (YYYY-MM-DD)
  transactions: Transaction[];
  receivables: Receivable[];
  payables: Payable[];
  bankAccounts?: BankWalletAccount[];
  bankMutations?: BankWalletMutation[];
  products?: Product[];
  stockHistory?: StockHistory[];
  categories?: ProductCategory[];
  subcategories?: ProductSubcategory[];
  settings?: AppSettings;
}

export interface BankWalletAccount {
  id: string;
  name: string;
  type: 'bank' | 'e-wallet';
  initialBalance: number;
}

export interface BankWalletMutation {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  accountId: string; // Target Bank/Wallet account
  type: 'setor' | 'tarik' | 'pendapatan_langsung' | 'pengeluaran_langsung' | 'transfer_ke_rekening'; // setor: Kas -> Bank/Wallet, tarik: Bank/Wallet -> Kas
  description: string;
  amount: number;
  sourceAccountId?: string; // only for transfer_ke_rekening
}

export interface ProductCategory {
  id: string;
  name: string;
}

export interface ProductSubcategory {
  id: string;
  categoryId: string; // Refers to ProductCategory
  name: string;
}

export interface Product {
  id: string;
  sku?: string;
  name: string;
  stock: number;
  costPrice: number; // Harga Beli / HPP
  sellingPrice: number; // Harga Jual
  minStock?: number; // Batas minimum stok
  unit: string; // e.g., Pcs, Pack, Kg, Unit
  categoryId?: string; // Category selection ID
  subcategoryId?: string; // Subcategory selection ID
}

export interface StockHistory {
  id: string;
  productId: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  type: 'masuk' | 'keluar' | 'penyesuaian'; // masuk: kulakan/restock, keluar: penjualan/rusak, penyesuaian: stock opname
  quantity: number; // Jumlah perubahan stok (positif)
  price?: number; // Harga per unit saat transaksi berlangsung
  notes: string;
}
