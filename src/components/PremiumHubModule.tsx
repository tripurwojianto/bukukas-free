import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, TrendingUp, AlertTriangle, Lightbulb, Share2, Clipboard, 
  Printer, Bell, RefreshCw, Layers, CheckCircle2, Database, Shield, 
  Download, Upload, Activity, ArrowRight, User, ArrowUpRight, ArrowDownRight, 
  Radio, ShoppingBag, Receipt, Copy, ExternalLink, Calendar, Check, X,
  Smartphone, Volume2, Truck, Eye, RefreshCcw, Mail, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppSettings, Product, Transaction, Receivable, Payable } from '../types';

interface PremiumHubModuleProps {
  settings: AppSettings;
  products: Product[];
  transactions: Transaction[];
  receivables: Receivable[];
  payables: Payable[];
  onActivatePremium: () => void;
  onGoToSettings: () => void;
  onAddTransaction: (newTx: Omit<Transaction, 'id' | 'date'>) => void;
  onRestoreAllData: (restoredData: any) => void;
}

interface SimulatedOrder {
  id: string;
  source: 'Tokopedia' | 'Shopee' | 'GrabFood' | 'Lazada';
  customerName: string;
  items: { productName: string; qty: number; price: number; productId: string }[];
  total: number;
  time: string;
  status: 'pending' | 'proses' | 'selesai';
}

export default function PremiumHubModule({
  settings,
  products,
  transactions,
  receivables,
  payables,
  onActivatePremium,
  onGoToSettings,
  onAddTransaction,
  onRestoreAllData,
}: PremiumHubModuleProps) {
  // Navigation Tabs inside Premium Hub
  const [premiumTab, setPremiumTab] = useState<'insights' | 'automation' | 'security'>('insights');

  // Backup & Recovery States
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [backupSuccessMessage, setBackupSuccessMessage] = useState('');
  const [backupErrorMessage, setBackupErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLog, setSyncLog] = useState<string[]>([]);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  // Print format option
  const [printFormat, setPrintFormat] = useState<'receipt' | 'shipping_label'>('receipt');

  // Report Style Option
  const [reportStyle, setReportStyle] = useState<'casual' | 'financial' | 'tactical'>('tactical');

  // SMS / WhatsApp alert states
  const [alertPhone, setAlertPhone] = useState('081234567890');
  const [alertEmail, setAlertEmail] = useState('admin@toko.com');
  const [alertSaveSuccess, setAlertSaveSuccess] = useState(false);

  // Simulated Orders State (Operational Automation)
  const [simulatedOrders, setSimulatedOrders] = useState<SimulatedOrder[]>([
    {
      id: 'ORD-TKP-101',
      source: 'Tokopedia',
      customerName: 'Budi Santoso',
      items: [
        { productName: 'Kecap Sachet ABC', qty: 5, price: 2000, productId: 'prod-5' }
      ],
      total: 10000,
      time: 'Baru saja',
      status: 'pending'
    },
    {
      id: 'ORD-SHP-204',
      source: 'Shopee',
      customerName: 'Siti Rahma',
      items: [
        { productName: 'Minyak Goreng Bimoli 2L', qty: 1, price: 38500, productId: 'prod-3' }
      ],
      total: 38500,
      time: '3 menit yang lalu',
      status: 'pending'
    }
  ]);

  // Real-time toast state for new order alert
  const [activeToastOrder, setActiveToastOrder] = useState<SimulatedOrder | null>(null);

  // Notifications Log
  const [notifications, setNotifications] = useState<string[]>([
    'Sistem Uptime Monitor aktif: Semua koneksi berjalan normal (99.99%)',
    'Sinkronisasi Stok otomatis berhasil diselaraskan dengan server Shopee pukul 08:00',
    'Cadangan Harian Otomatis tersimpan dengan aman pada lokasi cloud backup terpisah',
  ]);

  // Selected receipt to print
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(
    transactions.length > 0 ? transactions[0] : null
  );
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Uptime Heartbeat simulation
  const [latency, setLatency] = useState(14);
  const [uptimeLogs, setUptimeLogs] = useState<{ time: string; status: 'online' | 'warning'; latency: number }[]>([]);

  useEffect(() => {
    // Generate initial uptime logs
    const now = new Date();
    const tempLogs = [];
    for (let i = 5; i >= 1; i--) {
      const checkTime = new Date(now.getTime() - i * 15 * 60 * 1000);
      tempLogs.push({
        time: checkTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'online' as const,
        latency: Math.floor(Math.random() * 8) + 10
      });
    }
    setUptimeLogs(tempLogs);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(prev => {
        const diff = Math.floor(Math.random() * 5) - 2;
        const nextLatency = Math.max(8, prev + diff);
        
        // Add new log entry occasionally
        setUptimeLogs(prevLogs => {
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const newEntry = { time: nowStr, status: 'online' as const, latency: nextLatency };
          return [newEntry, ...prevLogs.slice(0, 4)];
        });

        return nextLatency;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Web Audio chime generator to simulate real physical receipt printer beeps / push alerts
  const playNotificationChime = (type: 'order' | 'print' | 'success') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      if (type === 'order') {
        // High double beep
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc2.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6
        
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        osc1.start();
        osc2.start();
        
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        setTimeout(() => {
          osc1.stop();
          osc2.stop();
          
          // Second beep
          const ctx2 = new AudioContextClass();
          const osc3 = ctx2.createOscillator();
          const osc4 = ctx2.createOscillator();
          const gain2 = ctx2.createGain();
          osc3.connect(gain2);
          osc4.connect(gain2);
          gain2.connect(ctx2.destination);
          
          osc3.frequency.setValueAtTime(880, ctx2.currentTime);
          osc4.frequency.setValueAtTime(1046.5, ctx2.currentTime);
          gain2.gain.setValueAtTime(0.1, ctx2.currentTime);
          osc3.start();
          osc4.start();
          gain2.gain.exponentialRampToValueAtTime(0.01, ctx2.currentTime + 0.25);
          setTimeout(() => {
            osc3.stop();
            osc4.stop();
          }, 300);
        }, 150);
      } else if (type === 'print') {
        // Soft printer mechanical sound simulation
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(220, ctx.currentTime); // low buzz
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        osc.start();
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        setTimeout(() => osc.stop(), 400);
      } else if (type === 'success') {
        // Sweet ascending notification
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        setTimeout(() => osc.stop(), 300);
      }
    } catch (e) {
      console.warn("Audio Context blocked or not supported on this browser context.");
    }
  };

  // Trigger a simulated incoming marketplace order (WhatsApp / Push Notification)
  const triggerSimulatedIncomingOrder = () => {
    const names = ['Lutfi Hakim', 'Rini Indah', 'Dewi Lestari', 'Joko Susilo', 'Yanto Bakrie'];
    const selectedName = names[Math.floor(Math.random() * names.length)];
    const shpProducts = products.length > 0 ? products : [
      { id: 'prod-2', name: 'Indomie Goreng', sellingPrice: 3500, stock: 120, minStock: 20, costPrice: 2800, unit: 'pcs', sku: 'IND-GORENG' }
    ];
    const chosenProd = shpProducts[Math.floor(Math.random() * shpProducts.length)];
    const qty = Math.floor(Math.random() * 4) + 1;
    const sources: ('Tokopedia' | 'Shopee' | 'GrabFood' | 'Lazada')[] = ['Tokopedia', 'Shopee', 'GrabFood', 'Lazada'];
    const source = sources[Math.floor(Math.random() * sources.length)];
    const orderId = `ORD-${source.substring(0,3).toUpperCase()}-${Math.floor(Math.random() * 900) + 100}`;
    
    const newOrder: SimulatedOrder = {
      id: orderId,
      source,
      customerName: selectedName,
      items: [
        { productName: chosenProd.name, qty, price: chosenProd.sellingPrice, productId: chosenProd.id }
      ],
      total: chosenProd.sellingPrice * qty,
      time: 'Baru saja',
      status: 'pending'
    };

    setSimulatedOrders(prev => [newOrder, ...prev]);
    setActiveToastOrder(newOrder);
    playNotificationChime('order');
    setNotifications(prev => [
      `[REAL-TIME ALERT] Pesanan baru ${orderId} masuk dari ${source} (an. ${selectedName})!`,
      ...prev
    ]);
  };

  // Compute calculated metrics for business insights
  const totalRevenue = transactions
    .filter(t => t.type === 'masuk')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'keluar')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCOGS = transactions
    .filter(t => t.type === 'masuk')
    .reduce((sum, t) => sum + (t.hpp || 0), 0);

  const netProfit = totalRevenue - totalCOGS - totalExpense;

  // Inventory Health calculation
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const totalStockItems = products.reduce((sum, p) => sum + p.stock, 0);

  // Receivables risks
  const unpaidReceivables = receivables
    .filter(r => r.status !== 'lunas')
    .reduce((sum, r) => sum + (r.amount - r.paidAmount), 0);

  // Curated Insights Builder based on selected products and actual ledger transactions
  const insights = [];
  if (unpaidReceivables > totalRevenue * 0.15) {
    insights.push({
      type: 'warning',
      category: 'Keuangan',
      title: 'Kritis: Rasio Piutang Tinggi',
      description: `Piutang belum tertagih sebesar Rp ${unpaidReceivables.toLocaleString('id-ID')} menghambat kelancaran kas toko. Kami menyarankan untuk menerapkan batas waktu pembayaran maksimal 7 hari untuk meminimalisir macetnya modal kerja.`,
      action: 'Tagih Piutang'
    });
  } else {
    insights.push({
      type: 'success',
      category: 'Keuangan',
      title: 'Arus Kas Kasir Sehat',
      description: 'Laju piutang pelanggan terkendali dengan sangat baik. Ini membuktikan bahwa kebijakan kredit toko berjalan disiplin dan kas memiliki likuiditas tinggi.',
      action: 'Lihat Piutang'
    });
  }

  if (lowStockProducts.length > 0) {
    insights.push({
      type: 'danger',
      category: 'Inventori',
      title: 'Darurat Restock Produk',
      description: `Ada ${lowStockProducts.length} barang krusial yang sudah melampaui batas persediaan pengaman (termasuk ${lowStockProducts.slice(0, 2).map(p => p.name).join(', ')}). Ada potensi kehilangan transaksi hingga 15% jika restock ditunda.`,
      action: 'Kulakan Sekarang'
    });
  } else {
    insights.push({
      type: 'success',
      category: 'Inventori',
      title: 'Aman: Ketersediaan Stok Terjamin',
      description: 'Seluruh barang kebutuhan pelanggan Anda tercatat di atas batas keselamatan operasional. Tidak terdeteksi risiko kehilangan omset akibat kekosongan barang.',
      action: 'Lihat Stok'
    });
  }

  // Margin insight
  const avgMargin = totalRevenue > 0 ? ((totalRevenue - totalCOGS) / totalRevenue) * 100 : 0;
  if (avgMargin > 0) {
    insights.push({
      type: 'info',
      category: 'Performa Produk',
      title: `Interpretasi Margin (${avgMargin.toFixed(1)}%)`,
      description: `Rata-rata keuntungan kotor per item bernilai tinggi. Untuk meningkatkan performa, coba lakukan bundling strategis: gabungkan produk terlaris bermargin tipis dengan barang penunjang bermargin tebal.`,
      action: 'Analisis Margin'
    });
  }

  // Visitor traffic & Conversion simulation translated into clear business insights
  const weeklyVisitors = totalRevenue > 0 ? Math.floor(totalRevenue / 18500) + 125 : 340;
  const simulatedSalesCount = transactions.filter(t => t.type === 'masuk').length;
  const conversionRate = weeklyVisitors > 0 ? ((simulatedSalesCount || 10) / weeklyVisitors) * 100 : 8.5;

  insights.push({
    type: 'info',
    category: 'Sirkulasi Pengunjung',
    title: 'Analisis Tingkat Konversi Toko',
    description: `Toko dikunjungi sekitar ${weeklyVisitors} calon pembeli minggu ini dengan tingkat pembelian nyata sebesar ${conversionRate.toFixed(1)}%. Angka konversi di atas 5% menunjukkan daya tarik display produk dan harga Anda sudah sangat baik.`,
    action: 'Tingkatkan Trafik'
  });

  // Generate automated Monthly Report text with distinct selectable styles
  const currentMonthName = new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' });
  
  const getMonthlyReportContent = () => {
    if (reportStyle === 'casual') {
      return `*LAPORAN SANTAI PERFORMA TOKO* 🚀
Toko: ${settings.shopName || 'Buku Catatan Toko'}
Bulan: ${currentMonthName}

Halo Bos! Berikut rangkuman performa toko kita bulan ini dengan bahasa santai biar gampang dipahami:

📈 *OMSET & COAN KITA*
• Duit Masuk (Omset): Rp ${totalRevenue.toLocaleString('id-ID')}
• Belanja Modal (HPP): Rp ${totalCOGS.toLocaleString('id-ID')}
• Pengeluaran Operasional: Rp ${totalExpense.toLocaleString('id-ID')}
• Bersihnya (Profit): Rp ${netProfit.toLocaleString('id-ID')}
• Margin Kasar: ${avgMargin.toFixed(1)}% (Sangat oke!)

🎯 *YANG BERHASIL BULAN INI (WHAT WENT WELL)*
• Keuangan stabil, margin penjualan per barang terjaga aman di angka ${avgMargin.toFixed(1)}%.
• Rasio konversi pengunjung toko sangat positif, pelanggan betah belanja.
• Piutang macet minim, perputaran kas cepat berputar untuk modal baru.

⚠️ *YANG PERLU DIPERBAIKI (WHAT TO IMPROVE)*
${lowStockProducts.length > 0 
  ? `• Hati-hati Bos! Ada ${lowStockProducts.length} barang yang kritis dan mau habis stoknya. Harus buru-buru kulakan biar pelanggan nggak kecewa karena barang kosong.` 
  : '• Stok barang saat ini terpantau aman terkendali, tapi jangan lengah untuk terus monitor barang terlaris.'}
• Pertahankan komunikasi yang ramah dengan pembeli setia agar mereka rajin merekomendasikan toko fisik kita ke tetangganya.

💪 *REKOMENDASI AI BUAT BOS:*
1. Segera belanja barang yang stoknya menipis.
2. Buat promo khusus akhir pekan (bundling produk) biar omset makin melesat!

Laporan Premium AI generated. Tetap semangat jalani bisnis, Bosku!`;
    }

    if (reportStyle === 'financial') {
      return `*EXECUTIVE FINANCIAL & OPERATIONAL REPORT*
Establishment: ${settings.shopName || 'Buku Catatan Toko'}
Period: ${currentMonthName}
Classification: Strictly Confidential

This automated report provides a formalized financial translation of operational ledgers for executive overview.

I. FINANCIAL SUMMARY
• Gross Revenue (Sales): IDR ${totalRevenue.toLocaleString('id-ID')}
• Cost of Goods Sold (COGS): IDR ${totalCOGS.toLocaleString('id-ID')}
• Operational Expenditures (OPEX): IDR ${totalExpense.toLocaleString('id-ID')}
• Net Earnings (EBIT): IDR ${netProfit.toLocaleString('id-ID')}
• Gross Profit Margin: ${avgMargin.toFixed(1)}%

II. CORE BUSINESS RATIOS & HEALTH INDICATORS
• Liquidity Ratio: Outstanding receivables stand at IDR ${unpaidReceivables.toLocaleString('id-ID')}, indicating reasonable debt turnover.
• Asset Turnover: Total product inventory units active: ${totalStockItems} items.
• Critical Inventory Ratio: ${lowStockProducts.length} SKU(s) operating below threshold values.

III. STRATEGIC AUDIT & INSIGHTS
• Positives: Healthy EBIT margins of ${avgMargin.toFixed(1)}% suggest pricing structures align with target demographics. Cash conservation is optimal.
• Vulnerabilities: ${lowStockProducts.length > 0 ? 'Exposed supply chain risk on fast-moving consumer goods. Stock shortages will suppress quarterly yield.' : 'Supply stability is validated. Operational risk remains low.'}

IV. POLICY RECOMMENDATIONS
1. Expedite replenishment of depleted inventory categories to secure consumer retention.
2. Maintain accounts receivable policies strictly to protect cash flow margins.

Authorized by Bookkeeper Premium Services.`;
    }

    // Default: Tactical AI
    return `*LAPORAN ANALIS DATA BISNIS PREMIUM* 🧠
Toko: ${settings.shopName || 'Buku Catatan Toko'}
Periode: ${currentMonthName}

--- RINGKASAN FINANSIAL TERJEMAHAN ---
• Total Omset (Duit Masuk): Rp ${totalRevenue.toLocaleString('id-ID')}
• Total HPP (Harga Pokok): Rp ${totalCOGS.toLocaleString('id-ID')}
• Beban Operasional Toko: Rp ${totalExpense.toLocaleString('id-ID')}
• Proyeksi Keuntungan Bersih: Rp ${netProfit.toLocaleString('id-ID')}
• Margin Keuntungan Rata-rata: ${avgMargin.toFixed(1)}%

--- DIAGNOSA & KESEHATAN OPERASIONAL ---
• Piutang Pelanggan Tertahan: Rp ${unpaidReceivables.toLocaleString('id-ID')}
  ↳ *Interpretasi*: ${unpaidReceivables > totalRevenue * 0.15 ? 'Status Waspada! Piutang mulai menumpuk. Segera kirim tagihan berkala.' : 'Status Aman! Likuiditas toko sangat sehat.'}
• Tingkat Kritis Persediaan: ${lowStockProducts.length} barang berada di zona merah (di bawah batas minimum).
  ↳ *Interpretasi*: ${lowStockProducts.length > 0 ? 'Segera lakukan kulakan untuk menghindari hilangnya potensi penjualan.' : 'Ketersediaan barang prima.'}

--- APA YANG BERHASIL BULAN INI ---
1. Margin penjualan kotor yang sangat sehat mencapai ${avgMargin.toFixed(1)}%, memberikan ruang gerak operasional yang fleksibel.
2. Alur keuangan dari kas masuk berjalan dinamis dan tercatat dengan akurasi tinggi.

--- APA YANG PERLU DIPERBAIKI ---
1. Manajemen stok pengaman (safety stock) perlu ditingkatkan agar tidak terjadi penundaan order.
2. Disiplinkan penagihan utang tempo pada pelanggan agar modal kerja cepat kembali berbentuk tunai.

--- REKOMENDASI TAKTIS AI ---
1. Lakukan pesanan pembelian (kulakan) ke supplier untuk produk kritis sesegera mungkin.
2. Terapkan diskon kecil (misal 2%) bagi pelanggan piutang yang membayar lunas sebelum jatuh tempo 7 hari.

Laporan Terkurasi Otomatis didukung oleh Asisten Premium AI.`;
  };

  const monthlyReportText = getMonthlyReportContent();

  // Handler to copy report
  const handleCopyReport = () => {
    navigator.clipboard.writeText(monthlyReportText);
    setCopiedSuccess(true);
    playNotificationChime('success');
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  // Handler to Share via WhatsApp
  const handleShareWhatsApp = () => {
    const textEncoded = encodeURIComponent(monthlyReportText);
    const waUrl = `https://api.whatsapp.com/send?text=${textEncoded}`;
    window.open(waUrl, '_blank');
  };

  // Handler to Share via Email
  const handleShareEmail = () => {
    const subjectEncoded = encodeURIComponent(`Laporan Analitis Premium - ${settings.shopName || 'Buku Catatan Toko'}`);
    const bodyEncoded = encodeURIComponent(monthlyReportText);
    const mailUrl = `mailto:?subject=${subjectEncoded}&body=${bodyEncoded}`;
    window.open(mailUrl, '_blank');
  };

  // Save Alert settings simulation
  const handleSaveAlerts = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertSaveSuccess(true);
    playNotificationChime('success');
    setTimeout(() => setAlertSaveSuccess(false), 3000);
    setNotifications(prev => [
      `[CONFIG] Kontak alarm Uptime disimpan: ${alertPhone} & ${alertEmail}`,
      ...prev
    ]);
  };

  // Multi-channel Stock Synchronization Simulation
  const handleSyncStock = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncSuccess(false);
    setSyncLog([]);

    const logSteps = [
      'Menghubungi server API Marketplace Shopee, Tokopedia & Lazada...',
      'Membaca data SKU produk terdaftar...',
      'Mencocokkan stok fisik internal dengan stok e-commerce...',
      `Sinkronisasi SKU KCP-SCH-ABC (Kecap Sachet ABC): Stok Shopee diperbarui ke ${products.find(p => p.id === 'prod-5')?.stock || 80} pcs.`,
      `Sinkronisasi SKU IND-GORENG (Indomie Goreng): Stok Tokopedia diselaraskan ke ${products.find(p => p.id === 'prod-2')?.stock || 120} pcs.`,
      'Menyeimbangkan stok Lazada untuk seluruh katalog terdaftar...',
      'Sinkronisasi multi-channel berhasil diselesaikan tanpa kesalahan!'
    ];

    for (let i = 0; i < logSteps.length; i++) {
      await new Promise(r => setTimeout(r, 450));
      setSyncLog(prev => [...prev, logSteps[i]]);
    }
    setIsSyncing(false);
    setSyncSuccess(true);
    playNotificationChime('success');
    setNotifications(prev => [
      `Sinkronisasi Stok multi-channel selesai dengan sukses pada pukul ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      ...prev
    ]);
  };

  // Operational Order Processing
  const handleAcceptSimulatedOrder = (order: SimulatedOrder) => {
    // Process order by generating transactions
    order.items.forEach(item => {
      const matchedProduct = products.find(p => p.id === item.productId);
      const hppValue = matchedProduct ? matchedProduct.costPrice * item.qty : undefined;

      onAddTransaction({
        description: `[Order Online ${order.source}] ${item.productName} (x${item.qty}) - an. ${order.customerName}`,
        type: 'masuk',
        category: 'rutin',
        amount: item.price * item.qty,
        hpp: hppValue,
        productId: item.productId,
        productQty: item.qty,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      });
    });

    // Update order status
    setSimulatedOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'proses' } : o));
    playNotificationChime('success');
    if (activeToastOrder?.id === order.id) {
      setActiveToastOrder(null);
    }
    setNotifications(prev => [
      `Pesanan ${order.id} dari ${order.customerName} telah disetujui, kas masuk bertambah & stok terpotong otomatis!`,
      ...prev
    ]);

    // Simulasikan Auto-Sync Stok jika diaktifkan
    if (autoSyncEnabled) {
      setNotifications(prev => [
        `[AUTO-SYNC] Mendeteksi perubahan stok fisik. Menyelaraskan stok SKU marketplace terhubung secara instan!`,
        ...prev
      ]);
    }
  };

  // Simulated Order Reject
  const handleRejectSimulatedOrder = (id: string) => {
    setSimulatedOrders(prev => prev.filter(o => o.id !== id));
    if (activeToastOrder?.id === id) {
      setActiveToastOrder(null);
    }
  };

  // Native Browser Print for Thermal Receipt / Thermal Shipping Label
  const handlePrintReceiptThermal = (tx: Transaction) => {
    playNotificationChime('print');
    const matchedProduct = products.find(p => p.id === tx.productId);
    const qty = tx.productQty || 1;
    
    let receiptHtml = '';

    if (printFormat === 'receipt') {
      // 58mm Receipt format
      receiptHtml = `
        <div class="text-center bold" style="font-size: 13px; text-transform: uppercase;">
          ${settings.shopName || 'Toko Kami'}
        </div>
        <div class="text-center" style="font-size: 9px; margin-bottom: 5px;">
          ${settings.shopAddress || 'Jl. Raya Kemakmuran No. 12, Jakarta'}
          <br>
          Telp: ${settings.shopContact || '081234567890'}
        </div>
        <div class="divider"></div>
        <table style="font-size: 9px;">
          <tr>
            <td>Nota: ${tx.id}</td>
            <td class="text-right">${tx.date} ${tx.time}</td>
          </tr>
          <tr>
            <td>Kasir: Super Admin</td>
            <td class="text-right">Metode: Tunai</td>
          </tr>
        </table>
        <div class="divider"></div>
        
        <table style="font-size: 10px;">
          <tr class="bold">
            <td>Item</td>
            <td class="text-right">Qty</td>
            <td class="text-right">Subtotal</td>
          </tr>
          <tr>
            <td>${tx.description.replace(/\[Order Online.*?\]\s*/, '')}</td>
            <td class="text-right">${qty}</td>
            <td class="text-right">Rp ${tx.amount.toLocaleString('id-ID')}</td>
          </tr>
        </table>
        
        <div class="divider"></div>
        
        <table style="font-size: 10px; font-weight: bold;">
          <tr>
            <td>TOTAL BELANJA</td>
            <td class="text-right">Rp ${tx.amount.toLocaleString('id-ID')}</td>
          </tr>
          <tr>
            <td>BAYAR TUNAI</td>
            <td class="text-right">Rp ${tx.amount.toLocaleString('id-ID')}</td>
          </tr>
          <tr>
            <td>KEMBALIAN</td>
            <td class="text-right">Rp 0</td>
          </tr>
        </table>
        
        <div class="divider" style="margin-top: 8px;"></div>
        <div class="text-center footer">
          Terima Kasih Atas Kunjungan Anda!
          <br>
          Layanan Didukung Buku Catatan Toko Premium
          <br>
          * Nota dicetak via Printer Thermal *
        </div>
      `;
    } else {
      // 100mm x 150mm standard thermal Shipping Label
      const fakeTracking = 'JP' + Math.floor(1000000000 + Math.random() * 9000000000);
      const isOnline = tx.description.includes('[Order Online');
      const originName = settings.shopName || 'Buku Catatan Toko';
      const originContact = settings.shopContact || '081234567890';
      const courier = isOnline ? (tx.description.includes('Tokopedia') ? 'J&T EXPRESS' : 'SHOPEE XPRESS') : 'SICEPAT REG';
      
      receiptHtml = `
        <table style="border: 2px solid #000; width: 100%; border-collapse: collapse; font-family: Arial, sans-serif;">
          <tr>
            <td style="border-bottom: 2px solid #000; padding: 8px; font-weight: bold; font-size: 16px; width: 50%;">
              ${courier}
            </td>
            <td style="border-bottom: 2px solid #000; padding: 8px; text-align: right; font-weight: bold; font-size: 12px;">
              REGULER
            </td>
          </tr>
          <tr>
            <td colspan="2" style="border-bottom: 1px solid #000; padding: 6px; text-align: center;">
              <!-- Simulated CSS Barcode -->
              <div style="font-size: 11px; margin-bottom: 3px; letter-spacing: 1.5px; font-family: monospace;">No. Resi: ${fakeTracking}</div>
              <div style="display: flex; justify-content: center; align-items: stretch; height: 32px; background: #000; width: 85%; margin: 0 auto; margin-bottom: 4px;">
                <div style="flex: 1; background: #fff; width: 2px;"></div>
                <div style="flex: 2; background: #000; width: 4px;"></div>
                <div style="flex: 1; background: #fff; width: 2px;"></div>
                <div style="flex: 3; background: #000; width: 6px;"></div>
                <div style="flex: 2; background: #fff; width: 4px;"></div>
                <div style="flex: 2; background: #000; width: 4px;"></div>
                <div style="flex: 1; background: #fff; width: 2px;"></div>
                <div style="flex: 4; background: #000; width: 8px;"></div>
                <div style="flex: 2; background: #fff; width: 4px;"></div>
                <div style="flex: 2; background: #000; width: 4px;"></div>
                <div style="flex: 1; background: #fff; width: 2px;"></div>
                <div style="flex: 3; background: #000; width: 6px;"></div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 6px; font-size: 10px; width: 50%;">
              <strong>PENGIRIM (FROM):</strong><br>
              ${originName}<br>
              ${originContact}<br>
              ${settings.shopAddress || 'DKI Jakarta'}
            </td>
            <td style="border-bottom: 1px solid #000; padding: 6px; font-size: 10px;">
              <strong>PENERIMA (TO):</strong><br>
              ${isOnline ? tx.description.split(' - an. ')[1] || 'Pelanggan Setia' : 'Pelanggan Toko Fisik'}<br>
              0858-XXXX-XXXX<br>
              Jl. Kebon Jeruk No. 15, RT 02/05, Jakarta Barat
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 6px; font-size: 10px; border-bottom: 1px solid #000; background-color: #f0f0f0;">
              <strong>KETERANGAN ISI PAKET:</strong><br>
              ${tx.description.replace(/\[Order Online.*?\]\s*/, '')} (Qty: ${qty})
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 6px; text-align: center; font-size: 9px; font-style: italic;">
              Dicetak Otomatis via Buku Catatan Toko Premium Thermal Order Engine
            </td>
          </tr>
        </table>
      `;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${printFormat === 'receipt' ? 'Cetak Nota Thermal' : 'Cetak Label Pengiriman'}</title>
            <style>
              @page { margin: 0; }
              body { 
                font-family: 'Courier New', Courier, monospace; 
                width: ${printFormat === 'receipt' ? '58mm' : '100mm'}; 
                margin: 0; 
                padding: 4mm; 
                font-size: 10px; 
                line-height: 1.3;
                color: #000;
                background-color: #fff;
              }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .bold { font-weight: bold; }
              .divider { border-top: 1px dashed #000; margin: 6px 0; }
              table { width: 100%; border-collapse: collapse; }
              td { padding: 3px 0; vertical-align: top; }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            ${receiptHtml}
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Back up data to local JSON file download
  const handleDownloadBackup = () => {
    const dataToBackup = {
      appId: 'cc19ea6e-ea84-457c-88eb-96d93667c592',
      timestamp: new Date().toISOString(),
      shopName: settings.shopName,
      products,
      transactions,
      receivables,
      payables,
      settings
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `BukuToko_Backup_${settings.shopName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    playNotificationChime('success');
    setBackupSuccessMessage('Backup database berhasil diunduh secara aman ke penyimpanan lokal Anda!');
    setTimeout(() => setBackupSuccessMessage(''), 5000);
  };

  // File Upload Restore implementation
  const handleUploadFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBackupFile(e.target.files[0]);
    }
  };

  const handleRestoreDataSubmit = () => {
    if (!backupFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonContent = JSON.parse(event.target?.result as string);
        if (jsonContent && jsonContent.products && jsonContent.transactions) {
          // Trigger restoration in the parent state
          onRestoreAllData(jsonContent);
          playNotificationChime('success');
          setBackupSuccessMessage('SANGAT SUKSES! Seluruh database toko berhasil dipulihkan dari file cadangan.');
          setBackupFile(null);
          setTimeout(() => setBackupSuccessMessage(''), 5000);
        } else {
          setBackupErrorMessage('Format file tidak valid. Pastikan Anda mengunggah file cadangan resmi (.json) dari Buku Catatan Toko.');
          setTimeout(() => setBackupErrorMessage(''), 5000);
        }
      } catch (err) {
        setBackupErrorMessage('Gagal mem-parsing file backup. Pastikan file JSON utuh dan tidak rusak.');
        setTimeout(() => setBackupErrorMessage(''), 5000);
      }
    };
    reader.readAsText(backupFile);
  };

  // IF PREMIUM IS LOCKED
  if (!settings.isPremiumActive) {
    return (
      <div className="bg-white border border-slate-200 rounded-md shadow-xs p-6 flex flex-col items-center justify-center text-center max-w-2xl mx-auto my-6" id="premium-locked-container">
        <div className="p-3 bg-slate-900 text-amber-400 rounded-full animate-bounce mb-4 shadow-sm">
          <Sparkles className="w-8 h-8 fill-amber-400 text-slate-900" />
        </div>

        <h2 className="text-base font-bold text-slate-900 tracking-tight">Membuka Portal Layanan Premium Super Admin</h2>
        <p className="text-xs text-slate-500 mt-1.5 max-w-md">
          Nikmati kedaulatan digital penuh, otomatisasi cetak thermal, sinkronisasi inventori marketplace, dan analisis performa terjemahan otomatis.
        </p>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full my-6 text-left">
          <div className="bg-slate-50 border border-slate-200 rounded p-3.5 space-y-1.5">
            <div className="p-1 bg-slate-100 text-slate-800 rounded w-fit">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Analitik & Wawasan</h4>
            <p className="text-[10px] text-slate-400 leading-snug">Metrik kesehatan terjemahan otomatis, rasio piutang tertahan, dan ekspor instan Laporan Bulanan ke WhatsApp.</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-3.5 space-y-1.5">
            <div className="p-1 bg-slate-100 text-slate-800 rounded w-fit">
              <Printer className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Otomatisasi Nota Thermal</h4>
            <p className="text-[10px] text-slate-400 leading-snug">Cetak struk belanja 58mm/80mm dalam satu klik, dan terima serta proses pesanan toko online otomatis.</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-3.5 space-y-1.5">
            <div className="p-1 bg-slate-100 text-slate-800 rounded w-fit">
              <Database className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Kedaulatan & Backup</h4>
            <p className="text-[10px] text-slate-400 leading-snug">Cadangkan seluruh data pembukuan Anda ke file lokal .json dan pulihkan kapan saja tanpa takut kehilangan data.</p>
          </div>
        </div>

        {/* Unlock Button */}
        <div className="border-t border-slate-100 pt-5 w-full flex flex-col sm:flex-row justify-center items-center gap-3">
          <button
            onClick={() => {
              onActivatePremium();
              alert("Selamat! Layanan Premium Super Admin berhasil diaktifkan. Anda sekarang memiliki akses ke Premium Hub.");
            }}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-2.5 rounded-md flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
            Aktifkan Layanan Premium Instan
          </button>
          
          <button
            onClick={onGoToSettings}
            className="w-full sm:w-auto bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs px-6 py-2.5 rounded-md flex items-center justify-center gap-1 cursor-pointer transition-all"
          >
            Buka Pengaturan Admin
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // PREMIUM MODULE RENDER
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-md shadow-xs p-4 space-y-4" id="premium-hub-workspace">
      
      {/* REAL-TIME SIMULATED INCOMING PUSH TOAST */}
      <AnimatePresence>
        {activeToastOrder && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-4 right-4 z-50 bg-slate-950 text-white border border-amber-400 shadow-2xl rounded-lg p-4 max-w-sm w-full space-y-3"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="text-[10px] font-bold tracking-wider text-amber-300 uppercase">PESANAN BARU MASUK!</span>
              </div>
              <button onClick={() => setActiveToastOrder(null)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="text-xs space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded">
                  {activeToastOrder.source}
                </span>
                <span className="font-mono text-slate-400 text-[10px]">{activeToastOrder.id}</span>
              </div>
              <p className="font-bold text-slate-200 text-[11px]">Pelanggan: {activeToastOrder.customerName}</p>
              <div className="text-[10px] bg-slate-900 border border-slate-800 p-2 rounded text-slate-300">
                {activeToastOrder.items.map(it => `${it.productName} (x${it.qty})`).join(', ')}
                <div className="font-black text-white mt-1">Total: Rp {activeToastOrder.total.toLocaleString('id-ID')}</div>
              </div>
            </div>

            <div className="flex gap-2 text-xs pt-1">
              <button
                onClick={() => handleAcceptSimulatedOrder(activeToastOrder)}
                className="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black py-2 rounded text-center cursor-pointer transition-colors shadow-sm"
              >
                Terima & Cetak Nota
              </button>
              <button
                onClick={() => handleRejectSimulatedOrder(activeToastOrder.id)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-2 rounded text-center cursor-pointer transition-colors"
              >
                Tolak
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER WITH REALTIME INFOBAR */}
      <div className="bg-slate-900 text-white rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-amber-400 text-slate-900 rounded-md animate-pulse">
            <Sparkles className="w-5 h-5 fill-slate-900 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-extrabold tracking-tight">Layanan Premium Super Admin</h2>
              <span className="text-[8px] bg-amber-400 text-slate-950 font-bold px-1.5 py-0.2 rounded uppercase font-mono">PRO</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-none">Pusat otomatisasi operasional toko, wawasan performa analitis terjemahan, dan jaminan cadangan harian.</p>
          </div>
        </div>

        {/* Real-time status bar */}
        <div className="flex items-center gap-4 bg-slate-800/80 px-3.5 py-2 rounded border border-slate-700 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] text-slate-300 font-medium">Uptime Monitor: <strong className="text-emerald-400">100% Active</strong></span>
          </div>
          <div className="w-px h-4 bg-slate-700" />
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-amber-400 animate-pulse" />
            <span className="text-[10px] text-slate-300 font-mono">Latency: {latency}ms</span>
          </div>
        </div>
      </div>

      {/* CORE MODULAR TABS */}
      <div className="flex border-b border-slate-200 bg-white rounded-md p-1 shadow-2xs gap-1" id="premium-hub-tabs">
        <button
          onClick={() => setPremiumTab('insights')}
          className={`flex-1 py-2.5 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            premiumTab === 'insights'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          1. Analitik & Wawasan
        </button>

        <button
          onClick={() => setPremiumTab('automation')}
          className={`flex-1 py-2.5 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            premiumTab === 'automation'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Printer className="w-3.5 h-3.5 text-cyan-400" />
          2. Otomatisasi Operasional
        </button>

        <button
          onClick={() => setPremiumTab('security')}
          className={`flex-1 py-2.5 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            premiumTab === 'security'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-amber-400" />
          3. Backup & Monitoring Uptime
        </button>
      </div>

      {/* TAB CONTENT PANEL */}
      <div className="bg-white border border-slate-200 rounded-md p-4 min-h-[420px]">
        
        {/* ======================= TAB 1: INSIGHTS & REPORTS ======================= */}
        {premiumTab === 'insights' && (
          <div className="space-y-4 animate-fadeIn" id="premium-tab-insights">
            
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-md flex items-start gap-2.5 text-xs leading-normal">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Konsep Penerjemahan Data Bisnis:</strong> Halaman ini mengolah angka ledger kas mentah, rasio piutang, dan sirkulasi trafik pembeli untuk diterjemahkan langsung ke dalam bahasa keputusan operasional taktis yang mudah dipahami pemilik usaha.
              </div>
            </div>

            {/* Curated Health Insights Bento */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="border border-slate-200 bg-slate-50 p-3.5 rounded-lg flex flex-col justify-between hover:shadow-2xs transition-shadow">
                <div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-[9px] font-mono uppercase font-black">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    Profitabilitas Bersih
                  </div>
                  <h4 className="text-xl font-extrabold text-slate-900 mt-1">
                    Rp {netProfit.toLocaleString('id-ID')}
                  </h4>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight mt-2.5">
                  Proyeksi laba bersih dikurangi HPP (Beban Pokok) & biaya pengeluaran operasional.
                </p>
              </div>

              <div className="border border-slate-200 bg-slate-50 p-3.5 rounded-lg flex flex-col justify-between hover:shadow-2xs transition-shadow">
                <div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-[9px] font-mono uppercase font-black">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    Beban Piutang Pelanggan
                  </div>
                  <h4 className="text-xl font-extrabold text-rose-600 mt-1">
                    Rp {unpaidReceivables.toLocaleString('id-ID')}
                  </h4>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight mt-2.5">
                  Saldo kas belum ditagih. Rasio piutang saat ini: <strong>{(totalRevenue > 0 ? (unpaidReceivables / totalRevenue) * 100 : 0).toFixed(1)}%</strong> dari total penjualan.
                </p>
              </div>

              <div className="border border-slate-200 bg-slate-50 p-3.5 rounded-lg flex flex-col justify-between hover:shadow-2xs transition-shadow">
                <div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-[9px] font-mono uppercase font-black">
                    <Layers className="w-3.5 h-3.5 text-amber-500" />
                    Kritikalitas Stok Produk
                  </div>
                  <h4 className="text-xl font-extrabold text-slate-900 mt-1">
                    {lowStockProducts.length} Produk Kritis
                  </h4>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight mt-2.5">
                  Jumlah produk di bawah stok aman (safety stock). Segera kulakan untuk menghindari rugi kesempatan.
                </p>
              </div>

              <div className="border border-slate-200 bg-slate-50 p-3.5 rounded-lg flex flex-col justify-between hover:shadow-2xs transition-shadow">
                <div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-[9px] font-mono uppercase font-black">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    Pengunjung & Konversi
                  </div>
                  <h4 className="text-xl font-extrabold text-slate-900 mt-1">
                    {weeklyVisitors} Calon Pembeli
                  </h4>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight mt-2.5">
                  Rasio transaksi berbayar dari total kunjungan pembeli bernilai sehat di angka <strong>{conversionRate.toFixed(1)}%</strong>.
                </p>
              </div>
            </div>

            {/* Natural-Language Translated Insights List */}
            <div className="space-y-3">
              <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase block">Interpretasi Analisis Bisnis (Dashboard Performa Toko):</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {insights.map((insight, idx) => (
                  <div key={idx} className="border border-slate-200 rounded p-3 flex.5 gap-3 bg-white hover:border-slate-300 transition-all flex items-start">
                    <div className="shrink-0 mr-3">
                      {insight.type === 'danger' && (
                        <div className="p-2 bg-rose-50 text-rose-600 rounded">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      )}
                      {insight.type === 'warning' && (
                        <div className="p-2 bg-amber-50 text-amber-600 rounded">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      )}
                      {insight.type === 'success' && (
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                      {insight.type === 'info' && (
                        <div className="p-2 bg-blue-50 text-blue-600 rounded">
                          <Lightbulb className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] bg-slate-100 text-slate-600 font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">{insight.category}</span>
                        <h5 className="text-xs font-bold text-slate-800">{insight.title}</h5>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">{insight.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Automated Monthly Report Card Generator */}
            <div className="border border-slate-200 rounded-md overflow-hidden bg-slate-50/50">
              <div className="bg-slate-900 text-white px-3 py-2.5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  Pembuat Laporan Rutin Bulanan Otomatis
                </span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono uppercase">
                  Siap Kirim
                </span>
              </div>

              <div className="p-4 flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Pilih Gaya Bahasa Interpretasi:</span>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => setReportStyle('tactical')}
                        className={`px-2 py-1 text-[9px] font-bold rounded cursor-pointer transition-all ${reportStyle === 'tactical' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        Taktis AI
                      </button>
                      <button 
                        onClick={() => setReportStyle('casual')}
                        className={`px-2 py-1 text-[9px] font-bold rounded cursor-pointer transition-all ${reportStyle === 'casual' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        Santai Bisnis
                      </button>
                      <button 
                        onClick={() => setReportStyle('financial')}
                        className={`px-2 py-1 text-[9px] font-bold rounded cursor-pointer transition-all ${reportStyle === 'financial' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        Formal Executive
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-slate-200 rounded p-3.5 font-mono text-[10px] text-slate-800 whitespace-pre-wrap leading-relaxed shadow-2xs h-64 overflow-y-auto border-l-4 border-l-slate-800">
                    {monthlyReportText}
                  </div>
                </div>

                <div className="w-full md:w-64 flex flex-col justify-between py-1 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-4">
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Share2 className="w-4 h-4 text-slate-500" />
                      Kirim & Bagikan Langsung
                    </h5>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Laporan bulanan di atas telah mengonversi tabel audit keuangan menjadi tulisan narasi profesional. Gunakan tombol share instan di bawah ini untuk mengirimkannya ke klien atau pemilik toko via WhatsApp atau Email.
                    </p>
                  </div>

                  <div className="space-y-2 pt-4">
                    <button
                      onClick={handleShareWhatsApp}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-200" />
                      Kirim via WhatsApp Klien
                    </button>

                    <button
                      onClick={handleShareEmail}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-amber-200" />
                      Kirim via Email Klien
                    </button>

                    <button
                      onClick={handleCopyReport}
                      className="w-full bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold py-2 rounded flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      {copiedSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          Berhasil Disalin!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          Salin Teks Laporan
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ======================= TAB 2: AUTOMATION & THERMAL PRINT ======================= */}
        {premiumTab === 'automation' && (
          <div className="space-y-5 animate-fadeIn" id="premium-tab-automation">
            
            <div className="bg-cyan-50 border border-cyan-200 text-cyan-900 p-3 rounded-md flex items-start gap-2.5 text-xs leading-normal">
              <Smartphone className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
              <div>
                <strong>Otomatisasi Operasional Terpadu:</strong> Rasakan integrasi langsung antara pesanan online (marketplace feed), verifikasi stok anti-overselling, dan persiapan pengiriman fisik dengan printer thermal.
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* REAL-TIME SIMULATED ORDERS & WORKFLOW PHYSICAL */}
              <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50/50 lg:col-span-7">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-rose-500 animate-pulse" />
                    <h4 className="text-xs font-extrabold text-slate-900">Integrasi Notifikasi Real-time & Pesanan HP</h4>
                  </div>
                  <button 
                    onClick={triggerSimulatedIncomingOrder}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[9px] px-2.5 py-1 rounded cursor-pointer active:scale-95 transition-all flex items-center gap-1"
                  >
                    <Volume2 className="w-3 h-3" /> Simulasikan Order Masuk
                  </button>
                </div>

                <p className="text-[10px] text-slate-500 leading-normal">
                  Sistem mensimulasikan notifikasi instan yang biasanya masuk ke HP atau tablet klien saat ada pesanan online. Klik tombol di kanan atas untuk memicu notifikasi pesanan baru lengkap dengan nada panggil!
                </p>

                {/* Simulated Order Queue */}
                <div className="space-y-2.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Antrean Pesanan Menunggu Persetujuan:</span>
                  {simulatedOrders.map((order) => (
                    <div key={order.id} className="bg-white border border-slate-200 rounded p-3 text-xs space-y-2 hover:border-slate-300 transition-all shadow-3xs">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          order.source === 'Tokopedia' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          order.source === 'Shopee' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                          order.source === 'Lazada' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          🛍️ {order.source}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono font-bold">{order.time}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] font-black text-slate-800">
                          Nama Klien: {order.customerName}
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono">
                          {order.items.map((it, i) => `${it.productName} (x${it.qty})`).join(', ')}
                        </div>
                        <div className="text-[10px] font-extrabold text-slate-900">
                          Total Bayar: Rp {order.total.toLocaleString('id-ID')}
                        </div>
                      </div>

                      {order.status === 'pending' ? (
                        <div className="flex gap-2 pt-1.5 border-t border-slate-100">
                          <button
                            onClick={() => handleAcceptSimulatedOrder(order)}
                            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] py-1.5 rounded cursor-pointer transition-all flex items-center justify-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400" /> Terima & Proses
                          </button>
                          <button
                            onClick={() => handleRejectSimulatedOrder(order.id)}
                            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 text-[10px] px-3 py-1.5 rounded cursor-pointer transition-all"
                          >
                            Tolak Order
                          </button>
                        </div>
                      ) : (
                        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-[9px] font-black py-1.5 rounded text-center flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Pesanan Diterima & Persediaan Sinkron Otomatis
                        </div>
                      )}
                    </div>
                  ))}

                  {simulatedOrders.length === 0 && (
                    <div className="text-center py-8 text-[10px] text-slate-400 italic bg-white rounded border border-slate-200">
                      Tidak ada antrean pesanan aktif. Coba picu simulasi di kanan atas!
                    </div>
                  )}
                </div>

                {/* SINKRONISASI INVENTARIS MULTI-CHANNEL (STOK FISIK DAN ONLINE) */}
                <div className="border-t border-slate-200 pt-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <RefreshCw className="w-4 h-4 text-slate-500 animate-spin-slow" />
                      Sinkronisasi Inventaris Multi-Channel (Shopee, Tokopedia, Lazada)
                    </h4>
                    <label className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-600 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={autoSyncEnabled} 
                        onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-3.5 h-3.5"
                      />
                      Auto-Sync Instan
                    </label>
                  </div>
                  
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Jika diaktifkan, setiap transaksi POS luring (offline) atau pemakaian bahan baku akan langsung memicu penyelarasan stok ke marketplace Anda demi menghindari resiko over-selling (penjualan berlebih).
                  </p>

                  <div className="space-y-1 bg-white p-2.5 rounded border border-slate-200">
                    <div className="grid grid-cols-3 gap-2 text-[9px] text-slate-600 font-bold border-b border-slate-100 pb-1.5">
                      <span>Marketplace</span>
                      <span>Koneksi API</span>
                      <span className="text-right">SLA Delay</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[9px] py-1">
                      <span className="font-medium text-slate-800">Tokopedia Store</span>
                      <span className="text-emerald-600 font-bold">● Terhubung</span>
                      <span className="text-right text-slate-400 font-mono">Real-time</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[9px] py-1 border-t border-slate-50">
                      <span className="font-medium text-slate-800">Shopee Seller</span>
                      <span className="text-emerald-600 font-bold">● Terhubung</span>
                      <span className="text-right text-slate-400 font-mono">Real-time</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[9px] py-1 border-t border-slate-50">
                      <span className="font-medium text-slate-800">Lazada Mall</span>
                      <span className="text-emerald-600 font-bold">● Terhubung</span>
                      <span className="text-right text-slate-400 font-mono">Real-time</span>
                    </div>

                    {isSyncing && (
                      <div className="mt-2.5 space-y-1.5 border-t border-slate-100 pt-2.5">
                        <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                          <div className="bg-slate-900 h-full rounded-full animate-progress" style={{ width: '85%' }} />
                        </div>
                        <div className="text-[8px] font-mono text-slate-400 h-24 overflow-y-auto pt-1 space-y-0.5 border border-slate-100 p-1.5 rounded bg-slate-50/50">
                          {syncLog.map((log, idx) => (
                            <div key={idx} className="truncate">↳ {log}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    {syncSuccess && !isSyncing && (
                      <div className="text-[9px] text-emerald-800 bg-emerald-50 p-2 rounded-md font-bold mt-2.5 border border-emerald-100 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Semua data inventaris terhubung dan sinkron! Mencegah penalti marketplace akibat kehabisan stok.
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleSyncStock}
                    disabled={isSyncing}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold py-2 rounded flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Menghubungi Server Marketplace...' : 'Sinkronkan Persediaan Multi-Channel Secara Manual'}
                  </button>
                </div>

              </div>

              {/* INSTANT THERMAL PRINTER AND PREVIEW */}
              <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-white lg:col-span-5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <Printer className="w-4 h-4 text-slate-700" />
                    <h4 className="text-xs font-extrabold text-slate-900">Pencetakan Order Thermal</h4>
                  </div>
                  <span className="text-[8px] bg-slate-800 text-white font-mono font-bold px-1 rounded uppercase">1-Click</span>
                </div>

                <p className="text-[10px] text-slate-500 leading-normal">
                  Cetak dokumen langsung ke printer thermal fisik (ukuran 58mm atau label stiker thermal 100mm) tanpa perlu export dokumen manual.
                </p>

                {/* Print format selector */}
                <div className="bg-slate-50 rounded p-2.5 border border-slate-100 space-y-2">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Format Cetak Dokumen:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPrintFormat('receipt')}
                      className={`py-1.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                        printFormat === 'receipt' 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-3xs' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      📄 Nota Kasir (58mm)
                    </button>
                    <button
                      onClick={() => setPrintFormat('shipping_label')}
                      className={`py-1.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                        printFormat === 'shipping_label' 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-3xs' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      📦 Label Pengiriman
                    </button>
                  </div>
                </div>

                {/* Transaction Selector */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Pilih Transaksi Kasir:</label>
                  <select 
                    value={selectedReceiptTx ? selectedReceiptTx.id : ''}
                    onChange={(e) => {
                      const tx = transactions.find(t => t.id === e.target.value);
                      if (tx) setSelectedReceiptTx(tx);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 outline-none cursor-pointer focus:border-slate-800 focus:bg-white"
                  >
                    {transactions.slice(0, 15).map(tx => (
                      <option key={tx.id} value={tx.id}>
                        {tx.date} - {tx.description.slice(0, 22)}... (Rp {tx.amount.toLocaleString('id-ID')})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Receipt Thermal Preview card */}
                {selectedReceiptTx ? (
                  <div className="border border-slate-200 rounded bg-slate-50 p-4 space-y-2 max-w-[260px] mx-auto shadow-2xs font-mono text-[9px] text-slate-800 select-none border-t-4 border-t-slate-800">
                    <div className="text-[8px] font-bold text-slate-400 text-center uppercase tracking-widest mb-1">Pratinjau Kertas Thermal</div>
                    
                    {printFormat === 'receipt' ? (
                      <>
                        <div className="text-center font-bold text-[10px] uppercase border-b border-dashed border-slate-300 pb-2 mb-2 text-slate-950">
                          {settings.shopName || 'Buku Catatan Toko'}
                          <div className="text-[8px] text-slate-400 font-normal mt-0.5 leading-snug font-sans">
                            {settings.shopAddress || 'Jl. Raya Kemakmuran No. 12, Jakarta'}
                            <br />
                            Telp: {settings.shopContact || '081234567890'}
                          </div>
                        </div>

                        <div className="flex justify-between text-[8px]">
                          <span>Nota: {selectedReceiptTx.id}</span>
                          <span>{selectedReceiptTx.time || '12:00'}</span>
                        </div>

                        <div className="border-t border-dashed border-slate-300 pt-2 my-2 space-y-1">
                          <div className="flex justify-between font-bold">
                            <span>Item</span>
                            <span>Qty</span>
                            <span>Total</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span className="truncate max-w-[120px]">{selectedReceiptTx.description.replace(/\[Order Online.*?\]\s*/, '')}</span>
                            <span>{selectedReceiptTx.productQty || 1}</span>
                            <span>Rp {selectedReceiptTx.amount.toLocaleString('id-ID')}</span>
                          </div>
                        </div>

                        <div className="border-t border-dashed border-slate-300 pt-2 font-bold text-slate-950 flex justify-between">
                          <span>TOTAL BELANJA</span>
                          <span>Rp {selectedReceiptTx.amount.toLocaleString('id-ID')}</span>
                        </div>

                        <div className="text-center text-[7px] text-slate-400 pt-3 border-t border-dashed border-slate-200">
                          Terima Kasih Atas Kunjungan Anda!
                        </div>
                      </>
                    ) : (
                      <div className="border border-slate-300 p-2 bg-white rounded space-y-2">
                        <div className="flex justify-between font-bold border-b pb-1">
                          <span>SHOPEE XPRESS</span>
                          <span className="text-right">REGULER</span>
                        </div>
                        <div className="text-center py-1 bg-slate-100 font-bold border-b font-mono tracking-wider">
                          JP839572948274
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[8px] text-slate-600 border-b pb-1">
                          <div>
                            <strong>DARI:</strong><br />
                            {settings.shopName}<br />
                            {settings.shopContact}
                          </div>
                          <div>
                            <strong>UNTUK:</strong><br />
                            {selectedReceiptTx.description.split(' - an. ')[1] || 'Lutfi Hakim'}
                          </div>
                        </div>
                        <div className="text-[8px] truncate">
                          <strong>ISI:</strong> {selectedReceiptTx.description.replace(/\[Order Online.*?\]\s*/, '')}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-10 text-[10px] text-slate-400 italic bg-slate-50 rounded">
                    Belum ada transaksi kasir yang tercatat untuk dicetak.
                  </div>
                )}

                {selectedReceiptTx && (
                  <button
                    onClick={() => handlePrintReceiptThermal(selectedReceiptTx)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 rounded flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Printer className="w-4 h-4 text-amber-400" />
                    Cetak Langsung via Printer Thermal
                  </button>
                )}

              </div>

            </div>

          </div>
        )}

        {/* ======================= TAB 3: DIGITAL SOVEREIGNTY & SECURITY ======================= */}
        {premiumTab === 'security' && (
          <div className="space-y-4 animate-fadeIn" id="premium-tab-security">
            
            {/* Jaminan Backup Harian & Monitoring Uptime */}
            <div className="bg-slate-900 text-white rounded-lg p-4 space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-full">
                    <Shield className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-white">Jaminan Perlindungan Data Harian Cloud Secure</h4>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Sistem kami secara otomatis mem-backup data ledger Anda ke database cold storage eksternal yang terpisah dari hosting utama (di luar Vercel/server utama).
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded font-mono font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Cloud Backup: AKTIF
                </div>
              </div>

              {/* Uptime Monitoring Live Console */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Konsol Live Monitoring Uptime 24/7 (SLA Keandalan):</h5>
                  <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono border border-emerald-500/20 animate-pulse">● SISTEM OPERASIONAL (100% UP)</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {uptimeLogs.map((log, i) => (
                    <div key={i} className="bg-slate-800/80 border border-slate-700/60 rounded p-2 text-center space-y-1">
                      <div className="text-[8px] text-slate-400 font-mono">{log.time}</div>
                      <div className="text-[11px] font-bold text-emerald-400">ONLINE</div>
                      <div className="text-[8px] text-slate-500 font-mono">{log.latency} ms latency</div>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-slate-400 leading-normal">
                  Sistem monitor melakukan ping otomatis ke applet Anda setiap 5 menit. Jika server utama mengalami kendala atau offline, alarm instan akan langsung terkirim sesuai dengan rincian alarm di bawah ini.
                </p>

                {/* Downtime alert notification setup */}
                <form onSubmit={handleSaveAlerts} className="bg-slate-850 border border-slate-800 rounded p-3 space-y-3">
                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Kirim Notifikasi Darurat Jika Toko Sedang Down:</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] text-slate-400 font-bold mb-1">WhatsApp / No. HP Penerima:</label>
                      <input 
                        type="text" 
                        value={alertPhone} 
                        onChange={(e) => setAlertPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-750 text-xs text-white rounded p-2 outline-none focus:border-amber-400"
                        placeholder="Contoh: 081234567890"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-400 font-bold mb-1">Alamat Email Penerima:</label>
                      <input 
                        type="email" 
                        value={alertEmail} 
                        onChange={(e) => setAlertEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-750 text-xs text-white rounded p-2 outline-none focus:border-amber-400"
                        placeholder="Contoh: admin@toko.com"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[8px] text-slate-500 font-mono">Status SLA: Terjamin oleh Super Admin 24/7 Engine</span>
                    <button 
                      type="submit"
                      className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-[10px] font-black px-3 py-1.5 rounded cursor-pointer transition-colors"
                    >
                      Simpan Pengaturan Alarm
                    </button>
                  </div>

                  {alertSaveSuccess && (
                    <div className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded">
                      ✓ Kontak alarm berhasil diperbarui! Kami akan mengirimi Anda peringatan darurat jika toko Anda terdeteksi tidak dapat diakses.
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* BACKUP & RECOVERY ACTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              
              {/* BACKUP PANEL */}
              <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-white flex flex-col justify-between hover:shadow-2xs transition-shadow">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-slate-700" />
                    <h4 className="text-xs font-extrabold text-slate-900">Cadangkan Manual Ke File Eksternal</h4>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Lakukan kedaulatan data penuh dengan mengunduh salinan cadangan instan berisi seluruh produk, transaksi, hutang, piutang, dan konfigurasi toko Anda ke dalam file JSON portable.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={handleDownloadBackup}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 rounded flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    Unduh File Cadangan (.json)
                  </button>
                </div>
              </div>

              {/* RECOVERY PANEL */}
              <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-white flex flex-col justify-between hover:shadow-2xs transition-shadow">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-slate-700" />
                    <h4 className="text-xs font-extrabold text-slate-900">Pulihkan Seluruh Database Toko</h4>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Gunakan file cadangan Buku Catatan Toko (.json) yang Anda simpan sebelumnya untuk memulihkan seluruh riwayat pembukuan toko secara seketika pada perangkat ini.
                  </p>

                  {/* Drag and Drop Zone / File Input */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-slate-400 transition-colors bg-slate-50 flex flex-col items-center justify-center gap-1"
                  >
                    <Upload className="w-6 h-6 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-600">
                      {backupFile ? backupFile.name : 'Pilih atau Tarik File Backup (.json) Anda di sini'}
                    </span>
                    <span className="text-[8px] text-slate-400 font-mono">Mendukung file keluaran JSON (*.json)</span>
                    <input 
                      type="file" 
                      accept=".json"
                      ref={fileInputRef}
                      onChange={handleUploadFileChange}
                      className="hidden" 
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={handleRestoreDataSubmit}
                    disabled={!backupFile}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 rounded flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Pulihkan Sekarang
                  </button>
                  {backupFile && (
                    <button
                      onClick={() => setBackupFile(null)}
                      className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 font-medium text-xs px-2.5 py-2 rounded cursor-pointer transition-all"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* Success and Error notifications banner */}
            {backupSuccessMessage && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded p-3 text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-bounce" />
                {backupSuccessMessage}
              </div>
            )}

            {backupErrorMessage && (
              <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded p-3 text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-2xs">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                {backupErrorMessage}
              </div>
            )}

          </div>
        )}

      </div>

      {/* REAL-TIME NOTIFICATIONS SIDE LOGS */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs">
        <span className="text-[8px] font-mono font-bold text-slate-400 tracking-widest uppercase block mb-2">Aktivitas Sistem & Otomatisasi Premium Terakhir:</span>
        <div className="space-y-1.5 max-h-24 overflow-y-auto font-mono text-[8px] text-slate-500">
          {notifications.map((notif, idx) => (
            <div key={idx} className="flex gap-2 items-start leading-snug border-b border-slate-50 pb-1.5 last:border-0">
              <span className="text-emerald-500 shrink-0">●</span>
              <span>{notif}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
