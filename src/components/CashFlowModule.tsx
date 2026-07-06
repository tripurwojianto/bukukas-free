import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Minus, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertTriangle,
  Sparkles,
  DollarSign,
  HelpCircle,
  FileSpreadsheet,
  Calculator,
  Coins,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  Zap,
  FileDown,
  ArrowUpDown
} from 'lucide-react';
import { Transaction, DailyCashSession, Product } from '../types';
import { formatRupiah, getFormattedDate } from '../utils/helpers';
import { jsPDF } from 'jspdf';

const BANKNOTES = [
  { value: 100000, label: 'Rp 100.000', id: 'b100k' },
  { value: 50000, label: 'Rp 50.000', id: 'b50k' },
  { value: 20000, label: 'Rp 20.000', id: 'b20k' },
  { value: 10000, label: 'Rp 10.000', id: 'b10k' },
  { value: 5000, label: 'Rp 5.000', id: 'b5k' },
  { value: 2000, label: 'Rp 2.000', id: 'b2k' },
  { value: 1000, label: 'Rp 1.000', id: 'b1k' },
];

const COINS = [
  { value: 1000, label: 'Rp 1.000', id: 'c1k' },
  { value: 500, label: 'Rp 500', id: 'c500' },
  { value: 200, label: 'Rp 200', id: 'c200' },
  { value: 100, label: 'Rp 100', id: 'c100' },
];

const DEFAULT_QUICK_TEMPLATES = [
  { id: 'water', label: '💧 Air Galon', description: 'Beli Air Minum Galon', amount: 20000, type: 'keluar' as const, category: 'rutin' as const },
  { id: 'electricity', label: '⚡ Token Listrik', description: 'Token Listrik Toko', amount: 100000, type: 'keluar' as const, category: 'rutin' as const },
  { id: 'cleaning', label: '🧹 Iuran Kebersihan', description: 'Iuran Kebersihan & Keamanan', amount: 15000, type: 'keluar' as const, category: 'rutin' as const },
  { id: 'ice', label: '🧊 Es Batu Kristal', description: 'Beli Es Batu Kristal', amount: 12000, type: 'keluar' as const, category: 'rutin' as const },
  { id: 'receipt_paper', label: '🧻 Kertas Struk', description: 'Beli Kertas Struk Kasir', amount: 15000, type: 'keluar' as const, category: 'rutin' as const },
  { id: 'parkir', label: '🚗 Parkir Harian', description: 'Pendapatan Parkir Toko', amount: 30000, type: 'masuk' as const, category: 'rutin' as const },
  { id: 'modal', label: '💵 Modal Tambahan', description: 'Setoran Modal Tambahan', amount: 100000, type: 'masuk' as const, category: 'rutin' as const },
];

interface CashFlowModuleProps {
  selectedDate: string;
  session?: DailyCashSession;
  transactions: Transaction[];
  onUpdateSession: (date: string, updates: Partial<DailyCashSession>) => void;
  onAddTransaction: (tx: Omit<Transaction, 'id' | 'date'>) => void;
  onDeleteTransaction: (id: string) => void;
  products: Product[];
}

export default function CashFlowModule({
  selectedDate,
  session,
  transactions,
  onUpdateSession,
  onAddTransaction,
  onDeleteTransaction,
  products,
}: CashFlowModuleProps) {
  // State for adding a transaction
  const [isAdding, setIsAdding] = useState(false);
  const [type, setType] = useState<'masuk' | 'keluar'>('masuk');
  const [category, setCategory] = useState<'rutin' | 'insidental'>('rutin');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [hpp, setHpp] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productQty, setProductQty] = useState('');

  // Incremental loading limit for transactions
  const [visibleLimit, setVisibleLimit] = useState(15);

  // Sorting state for transactions table
  const [sortField, setSortField] = useState<'time' | 'amount' | 'category' | 'description' | null>('time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: 'time' | 'amount' | 'category' | 'description') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: 'time' | 'amount' | 'category' | 'description') => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300 shrink-0" />;
    }
    if (sortDirection === 'asc') {
      return <ChevronUp className="w-3 h-3 text-slate-800 shrink-0 animate-fade-in" />;
    }
    return <ChevronDown className="w-3 h-3 text-slate-800 shrink-0 animate-fade-in" />;
  };

  // Reset pagination limit when date changes
  React.useEffect(() => {
    setVisibleLimit(15);
  }, [selectedDate]);

  // Local state to edit cash register opening values
  const [editingOpening, setEditingOpening] = useState(false);
  const [tempPetty, setTempPetty] = useState(session?.openingPettyCash.toString() || '150000');
  const [tempPhysical, setTempPhysical] = useState(session?.openingPhysicalCash.toString() || '150000');

  // Physical Cash Calculator state
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [denomCounts, setDenomCounts] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(`cash_denom_counts_${selectedDate}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return {
      b100k: 0,
      b50k: 0,
      b20k: 0,
      b10k: 0,
      b5k: 0,
      b2k: 0,
      b1k: 0,
      c1k: 0,
      c500: 0,
      c200: 0,
      c100: 0,
    };
  });

  const updateDenomCount = (id: string, value: number) => {
    const updated = {
      ...denomCounts,
      [id]: Math.max(0, value),
    };
    setDenomCounts(updated);
    localStorage.setItem(`cash_denom_counts_${selectedDate}`, JSON.stringify(updated));
  };

  const adjustDenomCount = (id: string, delta: number) => {
    const updated = {
      ...denomCounts,
      [id]: Math.max(0, (denomCounts[id] || 0) + delta),
    };
    setDenomCounts(updated);
    localStorage.setItem(`cash_denom_counts_${selectedDate}`, JSON.stringify(updated));
  };

  const handleResetCalculator = () => {
    if (window.confirm('Reset semua hitungan pecahan uang?')) {
      const reset = {
        b100k: 0,
        b50k: 0,
        b20k: 0,
        b10k: 0,
        b5k: 0,
        b2k: 0,
        b1k: 0,
        c1k: 0,
        c500: 0,
        c200: 0,
        c100: 0,
      };
      setDenomCounts(reset);
      localStorage.setItem(`cash_denom_counts_${selectedDate}`, JSON.stringify(reset));
    }
  };

  const totalCalculated = useMemo(() => {
    let total = 0;
    BANKNOTES.forEach(b => {
      total += (denomCounts[b.id] || 0) * b.value;
    });
    COINS.forEach(c => {
      total += (denomCounts[c.id] || 0) * c.value;
    });
    return total;
  }, [denomCounts, selectedDate]);

  // If the session doesn't exist, we can show a prompt or auto-initialize.
  // We should make sure the parent initializes or we provide fallback.
  const pettyCash = session?.openingPettyCash ?? 150000;
  const initialPhysical = session?.openingPhysicalCash ?? 150000;

  // Quick templates state (initialized with DEFAULT_QUICK_TEMPLATES or loaded from localStorage)
  const [quickTemplates, setQuickTemplates] = useState<Array<{
    id: string;
    label: string;
    description: string;
    amount: number;
    type: 'masuk' | 'keluar';
    category: 'rutin' | 'insidental';
  }>>(() => {
    const saved = localStorage.getItem('cash_quick_templates');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return DEFAULT_QUICK_TEMPLATES;
  });

  // Toast alert state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // State for creating a new custom quick template
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTplLabel, setNewTplLabel] = useState('');
  const [newTplDesc, setNewTplDesc] = useState('');
  const [newTplAmount, setNewTplAmount] = useState('');
  const [newTplType, setNewTplType] = useState<'masuk' | 'keluar'>('keluar');

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTplLabel.trim() || !newTplDesc.trim() || !newTplAmount) {
      showToast('Mohon isi semua field template!', 'error');
      return;
    }
    const amt = Math.max(0, parseFloat(newTplAmount) || 0);
    const newTpl = {
      id: 'custom_' + Date.now(),
      label: newTplLabel.trim(),
      description: newTplDesc.trim(),
      amount: amt,
      type: newTplType,
      category: 'rutin' as const,
    };
    const updated = [...quickTemplates, newTpl];
    setQuickTemplates(updated);
    localStorage.setItem('cash_quick_templates', JSON.stringify(updated));
    
    // reset form
    setNewTplLabel('');
    setNewTplDesc('');
    setNewTplAmount('');
    setIsCreatingTemplate(false);
    showToast(`Template "${newTpl.label}" berhasil disimpan!`);
  };

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger template action
    if (window.confirm('Hapus template transaksi cepat ini?')) {
      const updated = quickTemplates.filter(t => t.id !== id);
      setQuickTemplates(updated);
      localStorage.setItem('cash_quick_templates', JSON.stringify(updated));
      showToast('Template berhasil dihapus.');
    }
  };

  const handleLoadTemplateToForm = (tpl: typeof DEFAULT_QUICK_TEMPLATES[0]) => {
    setIsAdding(true);
    setType(tpl.type);
    setCategory(tpl.category);
    setDescription(tpl.description);
    setAmount(tpl.amount.toString());
    setHpp('');
    showToast(`Form diisi: ${tpl.label}`);
    
    // Scroll form into view gently
    const formCard = document.getElementById('add-transaction-card');
    if (formCard) {
      formCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleInstantAdd = (tpl: typeof DEFAULT_QUICK_TEMPLATES[0], e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger load to form
    const now = new Date();
    const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    onAddTransaction({
      time: timeString,
      description: tpl.description,
      type: tpl.type,
      category: tpl.category,
      amount: tpl.amount,
    });
    
    showToast(`Tercatat: ${tpl.description} (${formatRupiah(tpl.amount)})!`);
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Colors
      const primaryColor = [15, 23, 42]; // slate-900 (#0f172a)
      const secondaryColor = [71, 85, 105]; // slate-600
      const lightBgColor = [248, 250, 252]; // slate-50
      const borderColor = [226, 232, 240]; // slate-200

      // Margins
      let posY = 20;

      // 1. Title Header & Branding
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(15, posY, 180, 24, 'F');

      // Title Text inside Dark Header Block
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('LAPORAN PERTANGGUNGJAWABAN KAS HARIAN', 20, posY + 9);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('BUKU CATATAN TOKO MINIMALIS', 20, posY + 15);
      doc.setFont('Helvetica', 'bold');
      doc.text(`Tanggal: ${getFormattedDate(selectedDate)}`, 20, posY + 20);

      posY += 32;

      // 2. Summary Cards (Opening balance, inflow, outflow, projected, actual)
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
      doc.roundedRect(15, posY, 180, 42, 2, 2, 'FD');

      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('IKHTISAR KAS (SUMMARY)', 20, posY + 7);

      // Draw a thin separator line under summary header
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.line(15, posY + 10, 195, posY + 10);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text('Saldo Kas Awal:', 20, posY + 16);
      doc.text('Total Uang Masuk (+):', 20, posY + 22);
      doc.text('Total Uang Keluar (-):', 20, posY + 28);
      doc.text('Saldo Akhir Buku Kas:', 20, posY + 34);

      // Values
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(formatRupiah(pettyCash), 75, posY + 16);
      
      doc.setTextColor(14, 116, 144); // Teal/Cyan
      doc.text(`+${formatRupiah(totalMasuk)}`, 75, posY + 22);
      
      doc.setTextColor(190, 24, 74); // Rose/Red
      doc.text(`-${formatRupiah(totalKeluar)}`, 75, posY + 28);
      
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(formatRupiah(calculatedBookBalance), 75, posY + 34);

      // Vertical Divider for Physical Audit if exists
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.line(110, posY + 12, 110, posY + 38);

      // Physical Audit Summary (Right section of summary box)
      const actualClosing = session?.closingPhysicalCash !== undefined ? session.closingPhysicalCash : 0;
      const difference = actualClosing - calculatedBookBalance;

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text('Uang Fisik Terhitung:', 115, posY + 16);
      doc.text('Status Audit Kas:', 115, posY + 22);
      doc.text('Selisih Uang (Discrepancy):', 115, posY + 28);

      doc.setFont('Helvetica', 'bold');
      if (session?.closingPhysicalCash !== undefined) {
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(formatRupiah(actualClosing), 165, posY + 16);

        if (difference === 0) {
          doc.setTextColor(16, 124, 65); // Green
          doc.text('SEIMBANG / MATCH', 165, posY + 22);
          doc.text('Rp 0', 165, posY + 28);
        } else if (difference < 0) {
          doc.setTextColor(220, 38, 38); // Red
          doc.text('KAS KURANG (MINUS)', 165, posY + 22);
          doc.text(`-${formatRupiah(Math.abs(difference))}`, 165, posY + 28);
        } else {
          doc.setTextColor(217, 119, 6); // Amber
          doc.text('KAS LEBIH (SURPLUS)', 165, posY + 22);
          doc.text(`+${formatRupiah(difference)}`, 165, posY + 28);
        }
      } else {
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text('Belum dihitung', 165, posY + 16);
        doc.text('Belum diaudit', 165, posY + 22);
        doc.text('-', 165, posY + 28);
      }

      posY += 50;

      // 3. Transactions Table Header
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('RINCIAN TRANSAKSI (TRANSACTION JOURNAL)', 15, posY);

      posY += 4;

      // Table Header row
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(15, posY, 180, 7, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('WAKTU', 17, posY + 4.5);
      doc.text('KETERANGAN', 35, posY + 4.5);
      doc.text('KATEGORI', 105, posY + 4.5);
      doc.text('MASUK (+)', 130, posY + 4.5, { align: 'right' });
      doc.text('KELUAR (-)', 160, posY + 4.5, { align: 'right' });
      doc.text('SALDO BUKU', 193, posY + 4.5, { align: 'right' });

      posY += 7;

      // Render Transaction rows
      if (ledgerData.length === 0) {
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.rect(15, posY, 180, 12);
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.setFont('Helvetica', 'normal');
        doc.text('Tidak ada transaksi tercatat pada hari ini.', 105, posY + 7, { align: 'center' });
        posY += 12;
      } else {
        ledgerData.forEach((tx, idx) => {
          // Check page break to avoid overflow
          if (posY > 250) {
            doc.addPage();
            posY = 20;

            // Reprint small header for continuing table
            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.rect(15, posY, 180, 7, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(8);
            doc.text('WAKTU', 17, posY + 4.5);
            doc.text('KETERANGAN (Lanjutan)', 35, posY + 4.5);
            doc.text('KATEGORI', 105, posY + 4.5);
            doc.text('MASUK (+)', 130, posY + 4.5, { align: 'right' });
            doc.text('KELUAR (-)', 160, posY + 4.5, { align: 'right' });
            doc.text('SALDO BUKU', 193, posY + 4.5, { align: 'right' });
            posY += 7;
          }

          // Alternating row background
          if (idx % 2 === 1) {
            doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
            doc.rect(15, posY, 180, 7.5, 'F');
          }

          // Draw thin line separator
          doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
          doc.line(15, posY + 7.5, 195, posY + 7.5);

          // Render Row Text
          doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(8);
          doc.text(tx.time, 17, posY + 5);

          // Cut description if too long
          let desc = tx.description;
          if (desc.length > 38) {
            desc = desc.substring(0, 36) + '...';
          }
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.setFont('Helvetica', 'normal');
          doc.text(desc, 35, posY + 5);

          // Category Badge Label
          const catLabel = tx.category === 'rutin' ? 'Rutin' : 'Tak Terduga';
          doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
          doc.text(catLabel, 105, posY + 5);

          // Inflow/Outflow Values
          if (tx.type === 'masuk') {
            doc.setTextColor(14, 116, 144);
            doc.text(`+${formatRupiah(tx.amount)}`, 130, posY + 5, { align: 'right' });
          } else {
            doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
            doc.text('-', 130, posY + 5, { align: 'right' });
          }

          if (tx.type === 'keluar') {
            doc.setTextColor(190, 24, 74);
            doc.text(`-${formatRupiah(tx.amount)}`, 160, posY + 5, { align: 'right' });
          } else {
            doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
            doc.text('-', 160, posY + 5, { align: 'right' });
          }

          // Balance column
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.setFont('Helvetica', 'bold');
          doc.text(formatRupiah(tx.runningBalance), 193, posY + 5, { align: 'right' });

          posY += 7.5;
        });
      }

      // Check space for signature section
      if (posY > 240) {
        doc.addPage();
        posY = 30;
      } else {
        posY += 15;
      }

      // 4. Signature Section (Tanda Tangan)
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.line(15, posY, 195, posY);
      posY += 8;

      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text('Dibuat Oleh (Operator/Kasir):', 25, posY);
      doc.text('Disetujui Oleh (Owner/Pemilik):', 130, posY);

      posY += 20;
      // Signature lines
      doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.line(25, posY, 75, posY);
      doc.line(130, posY, 180, posY);

      posY += 4;
      doc.setFont('Helvetica', 'bold');
      doc.text('( ............................................. )', 25, posY);
      doc.text('( ............................................. )', 130, posY);

      // Save the PDF
      doc.save(`Laporan_Kas_Harian_${selectedDate}.pdf`);
      showToast('Laporan PDF berhasil diunduh!');
    } catch (error) {
      console.error('PDF error:', error);
      showToast('Gagal mengunduh laporan PDF', 'error');
    }
  };

  // Filter transactions for this specific date
  const filteredTx = useMemo(() => {
    return transactions
      .filter((tx) => tx.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [transactions, selectedDate]);

  // Calculate accumulated balances
  const ledgerData = useMemo(() => {
    let currentBalance = initialPhysical; // Let's start the book running balance from opening physical cash
    
    return filteredTx.map((tx) => {
      if (tx.type === 'masuk') {
        currentBalance += tx.amount;
      } else {
        currentBalance -= tx.amount;
      }
      return {
        ...tx,
        runningBalance: currentBalance,
      };
    });
  }, [filteredTx, initialPhysical]);

  // Sort ledger data for presentation
  const sortedLedgerData = useMemo(() => {
    if (!sortField) return ledgerData;

    const sorted = [...ledgerData];
    sorted.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      // Special cases for comparison
      if (sortField === 'amount') {
        valA = a.amount;
        valB = b.amount;
      } else if (sortField === 'category') {
        valA = a.category === 'rutin' ? 'Rutin' : 'Tak Terduga';
        valB = b.category === 'rutin' ? 'Rutin' : 'Tak Terduga';
      } else if (sortField === 'description') {
        valA = a.description.toLowerCase();
        valB = b.description.toLowerCase();
      } else if (sortField === 'time') {
        valA = a.time;
        valB = b.time;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [ledgerData, sortField, sortDirection]);

  // Totals
  const totalMasuk = filteredTx
    .filter((tx) => tx.type === 'masuk')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalKeluar = filteredTx
    .filter((tx) => tx.type === 'keluar')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const calculatedBookBalance = initialPhysical + totalMasuk - totalKeluar;

  const handleSaveOpening = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSession(selectedDate, {
      openingPettyCash: Math.max(0, parseInt(tempPetty) || 0),
      openingPhysicalCash: Math.max(0, parseInt(tempPhysical) || 0),
    });
    setEditingOpening(false);
  };

  const handleAddTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;

    const parsedAmount = Math.max(0, parseFloat(amount) || 0);
    const parsedHpp = type === 'masuk' && hpp ? Math.max(0, parseFloat(hpp) || 0) : undefined;

    // Get current time formatted as HH:MM
    const now = new Date();
    const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    onAddTransaction({
      time: timeString,
      description: description.trim(),
      type,
      category,
      amount: parsedAmount,
      hpp: parsedHpp,
      productId: type === 'masuk' && selectedProductId ? selectedProductId : undefined,
      productQty: type === 'masuk' && selectedProductId && productQty ? Number(productQty) : undefined,
    });

    // Reset form
    setDescription('');
    setAmount('');
    setHpp('');
    setSelectedProductId('');
    setProductQty('');
    setIsAdding(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" id="kas-harian-container">
      {/* SECTION 1: Kasir Opening Values & Quick Input */}
      <div className="lg:col-span-4 space-y-4">
        
        {/* Card: Status Pembukaan Kas */}
        <div className="bg-white border border-slate-200 rounded-md p-3.5" id="opening-cash-card">
          <div className="flex justify-between items-start mb-3 pb-1 border-b border-slate-100">
            <div>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block leading-none">Awal Operasional</span>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5 underline decoration-slate-200 underline-offset-4 decoration-2">Saldo Kasir Awal</h3>
            </div>
            {!editingOpening && (
              <button
                onClick={() => {
                  setTempPetty(pettyCash.toString());
                  setTempPhysical(initialPhysical.toString());
                  setEditingOpening(true);
                }}
                className="text-[10px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-0.5 rounded transition-all cursor-pointer"
                id="edit-opening-btn"
              >
                Ubah
              </button>
            )}
          </div>

          {editingOpening ? (
            <form onSubmit={handleSaveOpening} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                  Uang Kembalian (Petty Cash)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">Rp</span>
                  <input
                    type="number"
                    value={tempPetty}
                    onChange={(e) => setTempPetty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded py-1 pl-7 pr-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                  Uang Fisik di Laci Kasir (Pembukaan)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">Rp</span>
                  <input
                    type="number"
                    value={tempPhysical}
                    onChange={(e) => setTempPhysical(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded py-1 pl-7 pr-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-1.5 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold py-1 px-2.5 rounded transition-colors cursor-pointer"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setEditingOpening(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-[11px] font-bold px-2.5 py-1 rounded transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Uang Kembalian</span>
                <span className="font-mono font-bold text-slate-700">{formatRupiah(pettyCash)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Uang Fisik Awal</span>
                <span className="font-mono font-bold text-slate-700">{formatRupiah(initialPhysical)}</span>
              </div>
              <div className="border-l-4 border-l-emerald-600 bg-emerald-50/40 p-2.5 rounded-sm flex items-center gap-2.5 mt-2">
                <div className="p-1 bg-emerald-600 text-white rounded">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[9px] text-slate-400 font-mono uppercase tracking-wider leading-none">Total Kasir Pembukaan</div>
                  <div className="font-mono text-sm font-bold text-emerald-800 mt-0.5">{formatRupiah(initialPhysical + pettyCash)}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card: Tambah Transaksi */}
        <div className="bg-white border border-slate-200 rounded-md p-3.5" id="add-transaction-card">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-slate-900">Pencatatan Transaksi</h3>
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-1 text-[10px] font-bold bg-slate-800 hover:bg-slate-900 text-white px-2 py-1 rounded shadow-sm transition-all cursor-pointer"
                id="show-add-form-btn"
              >
                <Plus className="w-3 h-3" /> Catat Baru
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {isAdding ? (
              <motion.form
                key="add-tx-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAddTxSubmit}
                className="space-y-2.5 overflow-hidden"
              >
                {/* Type Selector (Masuk vs Keluar) */}
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded">
                  <button
                    type="button"
                    onClick={() => { setType('masuk'); setCategory('rutin'); }}
                    className={`py-1 text-xs font-semibold rounded flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      type === 'masuk'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <ArrowUpRight className="w-3 h-3" /> Masuk (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setType('keluar'); setCategory('rutin'); }}
                    className={`py-1 text-xs font-semibold rounded flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      type === 'keluar'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <ArrowDownLeft className="w-3 h-3" /> Keluar (-)
                  </button>
                </div>

                {/* Category (Rutin vs Insidental) */}
                <div>
                  <label className="block text-[9px] font-mono tracking-wider text-slate-400 uppercase font-bold mb-1">
                    Klasifikasi
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCategory('rutin')}
                      className={`py-1 border text-[11px] font-medium rounded transition-all cursor-pointer ${
                        category === 'rutin'
                          ? 'border-slate-800 bg-slate-800 text-white'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      💡 Rutin
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategory('insidental')}
                      className={`py-1 border text-[11px] font-medium rounded transition-all cursor-pointer ${
                        category === 'insidental'
                          ? 'border-amber-500 bg-amber-50 text-amber-800'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      ⚠️ Tak Terduga
                    </button>
                  </div>
                </div>

                {/* Auto Stock Deduction (Product Sale) Selector */}
                {type === 'masuk' && products && products.length > 0 && (
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-2" id="auto-stock-deduct-container">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-bold text-slate-700">
                        📦 Hubungkan Penjualan Barang (Potong Stok)
                      </label>
                      {selectedProductId && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProductId('');
                            setProductQty('');
                            setDescription('');
                            setAmount('');
                            setHpp('');
                          }}
                          className="text-[9px] text-rose-600 hover:underline font-bold"
                        >
                          Reset Pilihan
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <select
                          value={selectedProductId}
                          onChange={(e) => {
                            const prodId = e.target.value;
                            setSelectedProductId(prodId);
                            const prod = products.find(p => p.id === prodId);
                            if (prod) {
                              const qty = productQty ? Number(productQty) : 1;
                              if (!productQty) setProductQty('1');
                              setDescription(`Penjualan ${qty} ${prod.unit} ${prod.name}`);
                              setAmount((prod.sellingPrice * qty).toString());
                              setHpp((prod.costPrice * qty).toString());
                            } else {
                              setDescription('');
                              setAmount('');
                              setHpp('');
                            }
                          }}
                          className="w-full bg-white border border-slate-200 rounded py-1 px-2 text-[11px] text-slate-800 focus:outline-none focus:border-slate-800 font-sans"
                        >
                          <option value="">-- Pilih Barang Dagangan --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Stok: {p.stock} {p.unit})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="Jumlah (Qty)"
                          value={productQty}
                          onChange={(e) => {
                            const qtyVal = e.target.value;
                            setProductQty(qtyVal);
                            const qty = Number(qtyVal) || 0;
                            const prod = products.find(p => p.id === selectedProductId);
                            if (prod && qty > 0) {
                              setDescription(`Penjualan ${qty} ${prod.unit} ${prod.name}`);
                              setAmount((prod.sellingPrice * qty).toString());
                              setHpp((prod.costPrice * qty).toString());
                            }
                          }}
                          className="w-full bg-white border border-slate-200 rounded py-1 px-2 text-[11px] text-slate-800 focus:outline-none focus:border-slate-800"
                          disabled={!selectedProductId}
                          min="1"
                        />
                      </div>
                    </div>
                    {selectedProductId && (
                      <p className="text-[9px] text-emerald-600 font-bold leading-tight">
                        ✓ Stok barang ini otomatis berkurang {productQty || 1} {products.find(p => p.id === selectedProductId)?.unit} setelah disimpan.
                      </p>
                    )}
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-[9px] font-mono tracking-wider text-slate-400 uppercase font-bold mb-1">
                    Keterangan Transaksi
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Penjualan Beras, Beli Alat Sapu, dll"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded py-1 px-2 text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white transition-all"
                    required
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-[9px] font-mono tracking-wider text-slate-400 uppercase font-bold mb-1">
                    Nominal Transaksi (Rp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs font-semibold">Rp</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded py-1 pl-7 pr-2 text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white transition-all"
                      required
                    />
                  </div>
                </div>

                {/* HPP (Optional and only for sales/masuk) */}
                {type === 'masuk' && (
                  <div className="bg-slate-50/80 p-2 rounded border border-dashed border-slate-200">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold text-slate-600">
                        Harga Pokok Penjualan (HPP)
                      </label>
                      <span className="text-[9px] text-slate-400 font-medium">Opsional</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">Rp</span>
                      <input
                        type="number"
                        placeholder="Nilai modal / kulakan"
                        value={hpp}
                        onChange={(e) => setHpp(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded py-1 pl-7 pr-2 text-xs font-mono text-slate-600 focus:outline-none focus:border-slate-800 transition-all"
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 mt-0.5">
                      Digunakan untuk kalkulasi Laba Kotor pada Ringkasan Kesehatan Bisnis.
                    </p>
                  </div>
                )}

                <div className="flex gap-1.5 pt-2 border-t border-slate-100">
                  <button
                    type="submit"
                    className={`flex-1 text-white text-[11px] font-bold py-1.5 rounded transition-colors cursor-pointer ${
                      type === 'masuk' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    Simpan Transaksi
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-[11px] font-bold px-3 py-1.5 rounded transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.div
                key="add-tx-prompt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-50/50 rounded p-3 text-center border border-dashed border-slate-200"
              >
                <div className="inline-flex p-1.5 bg-slate-100 rounded text-slate-600 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Masukkan transaksi masuk/keluar untuk memantau sisa saldo dan laba toko Anda hari ini secara real-time.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Card: Transaksi Cepat (Quick Add) */}
        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs" id="quick-add-templates-card">
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block leading-none">Pencatatan Instan</span>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-400" /> Transaksi Cepat
              </h3>
            </div>
            {!isCreatingTemplate && (
              <button
                onClick={() => setIsCreatingTemplate(true)}
                className="text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-1 rounded transition-all cursor-pointer flex items-center gap-1 font-sans"
                id="add-template-btn"
              >
                <Plus className="w-2.5 h-2.5" /> Template
              </button>
            )}
          </div>

          <p className="text-[10px] text-slate-500 mb-3 leading-relaxed font-sans">
            Klik nama untuk mengisi form, atau klik tombol <span className="font-mono font-bold text-amber-600">⚡ Instan</span> untuk langsung merekam ke buku kas hari ini.
          </p>

          <AnimatePresence mode="wait">
            {isCreatingTemplate ? (
              <motion.form
                key="create-template-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCreateTemplate}
                className="bg-slate-50 border border-slate-200 rounded p-3 mb-3 space-y-2.5 overflow-hidden text-xs"
              >
                <h4 className="font-bold text-slate-800 text-[11px] flex items-center gap-1 font-sans">
                  ✨ Buat Template Transaksi Baru
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-mono tracking-wider text-slate-400 uppercase font-bold mb-1">
                      Label Singkat
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 💧 Air Galon"
                      value={newTplLabel}
                      onChange={(e) => setNewTplLabel(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded py-1 px-2 text-xs text-slate-800 focus:outline-none focus:border-slate-800 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono tracking-wider text-slate-400 uppercase font-bold mb-1">
                      Arah Kas
                    </label>
                    <select
                      value={newTplType}
                      onChange={(e) => setNewTplType(e.target.value as 'masuk' | 'keluar')}
                      className="w-full bg-white border border-slate-200 rounded py-1 px-2 text-xs text-slate-800 focus:outline-none focus:border-slate-800 transition-all font-sans"
                    >
                      <option value="keluar">Keluar (-) Pengeluaran</option>
                      <option value="masuk">Masuk (+) Pemasukan</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-mono tracking-wider text-slate-400 uppercase font-bold mb-1">
                    Deskripsi Jurnal Resmi
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pembelian Air Minum Galon Kasir"
                    value={newTplDesc}
                    onChange={(e) => setNewTplDesc(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded py-1 px-2 text-xs text-slate-800 focus:outline-none focus:border-slate-800 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono tracking-wider text-slate-400 uppercase font-bold mb-1">
                    Nominal Rutin (Rp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[10px]">Rp</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={newTplAmount}
                      onChange={(e) => setNewTplAmount(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded py-1 pl-7 pr-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-800 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-1.5 pt-1">
                  <button
                    type="submit"
                    className="flex-1 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded transition-colors cursor-pointer font-sans"
                  >
                    Simpan Template
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingTemplate(false)}
                    className="bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-2 py-1 rounded transition-colors cursor-pointer font-sans"
                  >
                    Batal
                  </button>
                </div>
              </motion.form>
            ) : null}
          </AnimatePresence>

          {/* Grouped lists of templates */}
          <div className="space-y-3 font-sans">
            {/* Keluar (Pengeluaran) Group */}
            <div>
              <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-rose-500 uppercase tracking-wider mb-1.5">
                <ArrowDownLeft className="w-3 h-3" /> Pengeluaran Rutin (-)
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {quickTemplates.filter(t => t.type === 'keluar').map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => handleLoadTemplateToForm(tpl)}
                    className="group flex items-center justify-between p-2 rounded border border-slate-100 hover:border-rose-200 bg-slate-50/50 hover:bg-rose-50/20 transition-all cursor-pointer text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="font-semibold text-slate-700 flex items-center gap-1 truncate">
                        {tpl.label}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{tpl.description}</div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono font-bold text-rose-600 text-[11px]">
                        {formatRupiah(tpl.amount)}
                      </span>
                      
                      <button
                        type="button"
                        onClick={(e) => handleInstantAdd(tpl, e)}
                        title="Catat Instan Hari Ini"
                        className="h-6 px-1.5 rounded bg-rose-100 hover:bg-rose-600 text-rose-700 hover:text-white text-[9px] font-mono font-bold flex items-center gap-0.5 transition-all active:scale-95 cursor-pointer"
                      >
                        <Zap className="w-2.5 h-2.5 fill-current" /> Instan
                      </button>

                      {tpl.id.startsWith('custom_') && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                          title="Hapus Template"
                          className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Masuk (Pemasukan) Group */}
            <div>
              <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-wider mb-1.5">
                <ArrowUpRight className="w-3 h-3" /> Pemasukan Rutin (+)
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {quickTemplates.filter(t => t.type === 'masuk').map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => handleLoadTemplateToForm(tpl)}
                    className="group flex items-center justify-between p-2 rounded border border-slate-100 hover:border-emerald-200 bg-slate-50/50 hover:bg-emerald-50/20 transition-all cursor-pointer text-xs"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="font-semibold text-slate-700 flex items-center gap-1 truncate">
                        {tpl.label}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{tpl.description}</div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono font-bold text-emerald-600 text-[11px]">
                        {formatRupiah(tpl.amount)}
                      </span>
                      
                      <button
                        type="button"
                        onClick={(e) => handleInstantAdd(tpl, e)}
                        title="Catat Instan Hari Ini"
                        className="h-6 px-1.5 rounded bg-emerald-100 hover:bg-emerald-600 text-emerald-700 hover:text-white text-[9px] font-mono font-bold flex items-center gap-0.5 transition-all active:scale-95 cursor-pointer"
                      >
                        <Zap className="w-2.5 h-2.5 fill-current" /> Instan
                      </button>

                      {tpl.id.startsWith('custom_') && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                          title="Hapus Template"
                          className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card: Kalkulator Hitung Fisik Kas */}
        <div className="bg-white border border-slate-200 rounded-md p-3.5 shadow-2xs" id="physical-cash-calculator-card">
          <button
            type="button"
            onClick={() => setIsCalcOpen(!isCalcOpen)}
            className="w-full flex justify-between items-center cursor-pointer text-left focus:outline-none"
          >
            <div>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block leading-none">Alat Bantu Kasir</span>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                <Calculator className="w-4.5 h-4.5 text-slate-600" /> Kalkulator Fisik Kas
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {totalCalculated > 0 && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-sm">
                  {formatRupiah(totalCalculated)}
                </span>
              )}
              {isCalcOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </button>

          <AnimatePresence initial={false}>
            {isCalcOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-3 pt-3 border-t border-slate-100 space-y-4"
              >
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Hitung uang laci dengan memasukkan jumlah lembar kertas dan koin di bawah ini:
                </p>

                {/* Banknotes Section */}
                <div>
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-2">
                    💵 Pecahan Kertas (Banknotes)
                  </h4>
                  <div className="space-y-1.5">
                    {BANKNOTES.map((denom) => {
                      const count = denomCounts[denom.id] || 0;
                      return (
                        <div key={denom.id} className="flex items-center justify-between text-xs py-1 px-1.5 hover:bg-slate-50 rounded transition-colors">
                          <span className="font-mono font-semibold text-slate-700 w-24">
                            {denom.label}
                          </span>
                          
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => adjustDenomCount(denom.id, -1)}
                              className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded cursor-pointer transition-all active:scale-95 text-xs"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={count === 0 ? '' : count}
                              placeholder="0"
                              onChange={(e) => updateDenomCount(denom.id, parseInt(e.target.value) || 0)}
                              className="w-14 h-7 text-center bg-slate-50 border border-slate-200 rounded font-mono text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-800 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => adjustDenomCount(denom.id, 1)}
                              className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded cursor-pointer transition-all active:scale-95 text-xs"
                            >
                              +
                            </button>
                          </div>

                          <span className="font-mono text-slate-500 text-[10px] text-right w-24">
                            = {formatRupiah(count * denom.value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Coins Section */}
                <div>
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-2">
                    🪙 Pecahan Koin (Coins)
                  </h4>
                  <div className="space-y-1.5">
                    {COINS.map((denom) => {
                      const count = denomCounts[denom.id] || 0;
                      return (
                        <div key={denom.id} className="flex items-center justify-between text-xs py-1 px-1.5 hover:bg-slate-50 rounded transition-colors">
                          <span className="font-mono font-semibold text-slate-700 w-24">
                            {denom.label}
                          </span>
                          
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => adjustDenomCount(denom.id, -1)}
                              className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded cursor-pointer transition-all active:scale-95 text-xs"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={count === 0 ? '' : count}
                              placeholder="0"
                              onChange={(e) => updateDenomCount(denom.id, parseInt(e.target.value) || 0)}
                              className="w-14 h-7 text-center bg-slate-50 border border-slate-200 rounded font-mono text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-800 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => adjustDenomCount(denom.id, 1)}
                              className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded cursor-pointer transition-all active:scale-95 text-xs"
                            >
                              +
                            </button>
                          </div>

                          <span className="font-mono text-slate-500 text-[10px] text-right w-24">
                            = {formatRupiah(count * denom.value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Comparison Dashboard */}
                <div className="bg-slate-50 rounded border border-slate-200 p-3 space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500">Uang Fisik Terhitung</span>
                    <strong className="font-mono text-slate-800 text-sm">{formatRupiah(totalCalculated)}</strong>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Saldo Buku Kas (Sistem)</span>
                    <span className="font-mono text-slate-600 font-semibold">{formatRupiah(calculatedBookBalance)}</span>
                  </div>

                  {/* Discrepancy Diagnostics */}
                  {totalCalculated > 0 ? (
                    <div className="pt-1.5">
                      {totalCalculated === calculatedBookBalance ? (
                        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded p-2 flex items-start gap-1.5 text-[10px]">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold">Kas Seimbang & Sesuai!</p>
                            <p className="text-slate-500 mt-0.5">Selisih pencatatan buku dan uang riil di laci adalah Rp0.</p>
                          </div>
                        </div>
                      ) : totalCalculated < calculatedBookBalance ? (
                        <div className="bg-rose-50 text-rose-800 border border-rose-200 rounded p-2 flex items-start gap-1.5 text-[10px]">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-rose-950">Kurang {formatRupiah(calculatedBookBalance - totalCalculated)}</p>
                            <p className="text-slate-500 mt-0.5">Uang fisik di laci kasir kurang dari yang seharusnya tercatat di buku.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-amber-50 text-amber-800 border border-amber-200 rounded p-2 flex items-start gap-1.5 text-[10px]">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-amber-950">Kelebihan +{formatRupiah(totalCalculated - calculatedBookBalance)}</p>
                            <p className="text-slate-500 mt-0.5">Uang fisik di laci kasir lebih banyak dari catatan transaksi buku harian.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 text-center py-1">
                      Masukkan hitungan pecahan uang untuk mencocokkan otomatis.
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleResetCalculator}
                    disabled={totalCalculated === 0}
                    className="flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:pointer-events-none text-slate-600 border border-slate-200 text-[10px] font-bold px-2 py-1.5 rounded cursor-pointer transition-all"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSession(selectedDate, { closingPhysicalCash: totalCalculated });
                      alert(`Berhasil menerapkan hasil hitung fisik ${formatRupiah(totalCalculated)} sebagai Saldo Penutupan Kas harian!`);
                    }}
                    disabled={totalCalculated === 0}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 disabled:pointer-events-none text-white text-[10px] font-bold py-1.5 px-2 rounded cursor-pointer transition-all"
                  >
                    <Check className="w-3.5 h-3.5" /> Terapkan ke Kas Akhir
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* SECTION 2: Daily Transaction Ledger (Tabel Kas Harian) */}
      <div className="lg:col-span-8 space-y-4">
        
        {/* Ledger Panel */}
        <div className="bg-white border border-slate-200 rounded-md overflow-hidden" id="ledger-table-card">
          <div className="p-3 pb-2 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-slate-600" /> Buku Jurnal Kas Harian
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-none">Aliran uang tunai di kasir untuk tanggal terpilih</p>
            </div>
            
            {/* Quick summary & Export Actions */}
            <div className="flex flex-wrap items-center gap-4 text-[11px] w-full sm:w-auto justify-between sm:justify-end">
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] px-2.5 py-1.5 rounded shadow-xs transition-all active:scale-95 cursor-pointer font-sans"
              >
                <FileDown className="w-3.5 h-3.5" /> Unduh Laporan PDF
              </button>

              <div className="flex gap-3">
                <div className="text-right">
                  <div className="text-slate-400">Total Masuk</div>
                  <div className="font-mono font-bold text-emerald-600">+{formatRupiah(totalMasuk)}</div>
                </div>
                <div className="w-px h-6 bg-slate-200"></div>
                <div className="text-right">
                  <div className="text-slate-400">Total Keluar</div>
                  <div className="font-mono font-bold text-rose-600">-{formatRupiah(totalKeluar)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[9px] font-mono font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                  <th 
                    className="py-2 px-3 w-20 text-center cursor-pointer select-none hover:bg-slate-100 hover:text-slate-850 transition-colors"
                    onClick={() => handleSort('time')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Waktu</span>
                      {getSortIcon('time')}
                    </div>
                  </th>
                  <th className="py-2 px-3 select-none">
                    <div className="flex items-center gap-4">
                      <button 
                        type="button" 
                        onClick={() => handleSort('description')}
                        className={`flex items-center gap-1 font-mono font-bold text-[9px] uppercase tracking-wider hover:text-slate-800 focus:outline-none cursor-pointer transition-colors ${
                          sortField === 'description' ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        <span>Keterangan</span>
                        {getSortIcon('description')}
                      </button>
                      <span className="text-slate-300">/</span>
                      <button 
                        type="button" 
                        onClick={() => handleSort('category')}
                        className={`flex items-center gap-1 font-mono font-bold text-[9px] uppercase tracking-wider hover:text-slate-800 focus:outline-none cursor-pointer transition-colors ${
                          sortField === 'category' ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        <span>Kategori</span>
                        {getSortIcon('category')}
                      </button>
                    </div>
                  </th>
                  <th 
                    className="py-2 px-3 text-right cursor-pointer select-none hover:bg-slate-100 hover:text-slate-850 transition-colors"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Masuk (+)</span>
                      {getSortIcon('amount')}
                    </div>
                  </th>
                  <th 
                    className="py-2 px-3 text-right cursor-pointer select-none hover:bg-slate-100 hover:text-slate-850 transition-colors"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Keluar (-)</span>
                      {getSortIcon('amount')}
                    </div>
                  </th>
                  <th className="py-2 px-3 text-right">Sisa Saldo</th>
                  <th className="py-2 px-3 w-10 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {ledgerData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-[11px]">
                      <div className="max-w-xs mx-auto">
                        <p className="font-semibold text-slate-600">Belum ada transaksi hari ini</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Silakan gunakan tombol "Catat Baru" untuk mencatat pemasukan atau pengeluaran pertama Anda.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedLedgerData.slice(0, visibleLimit).map((tx, idx) => {
                    const isIncome = tx.type === 'masuk';
                    const isRoutine = tx.category === 'rutin';

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Time */}
                        <td className="py-1.5 px-3 text-center font-mono text-[10px] text-slate-400">
                          {tx.time}
                        </td>
                        
                        {/* Description & Category badge */}
                        <td className="py-1.5 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-800">{tx.description}</span>
                            <span className={`inline-flex items-center text-[8px] font-bold px-1.5 py-0.2 rounded border ${
                              isRoutine 
                                ? 'bg-slate-100 text-slate-700 border-slate-200/80' 
                                : 'bg-amber-50 text-amber-700 border-amber-200/80'
                            }`}>
                              {isRoutine ? 'Rutin' : 'Tak Terduga'}
                            </span>
                            {tx.hpp && tx.hpp > 0 && (
                              <span className="text-[9px] text-slate-400 font-mono">
                                (HPP: {formatRupiah(tx.hpp)})
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Income (+) */}
                        <td className="py-1.5 px-3 text-right font-mono font-semibold text-emerald-600">
                          {isIncome ? `+${formatRupiah(tx.amount)}` : '-'}
                        </td>

                        {/* Expense (-) */}
                        <td className="py-1.5 px-3 text-right font-mono font-semibold text-rose-500">
                          {!isIncome ? `-${formatRupiah(tx.amount)}` : '-'}
                        </td>

                        {/* Running Balance */}
                        <td className="py-1.5 px-3 text-right font-mono text-slate-700 font-medium">
                          {formatRupiah(tx.runningBalance)}
                        </td>

                        {/* Actions */}
                        <td className="py-1.5 px-3 text-center">
                          <button
                            onClick={() => onDeleteTransaction(tx.id)}
                            className="p-0.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Hapus transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Load More Button for Incremental Fetch */}
          {ledgerData.length > visibleLimit && (
            <div className="p-3 bg-white border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setVisibleLimit(prev => prev + 15)}
                className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-md shadow-2xs cursor-pointer transition-all active:scale-95"
              >
                Tampilkan Lebih Banyak ({ledgerData.length - visibleLimit} Transaksi Tersisa)
              </button>
            </div>
          )}

          {/* Table Footer Summary info */}
          {ledgerData.length > 0 && (
            <div className="bg-slate-50/80 p-2.5 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[10px] text-slate-500">
              <span className="flex items-center gap-1 leading-none">
                <AlertTriangle className="w-3 h-3 text-slate-500 shrink-0" />
                Sisa saldo dihitung berurutan dari saldo awal hari ini.
              </span>
              <div className="font-mono text-slate-600">
                Catatan Buku Akhir: <strong className="text-slate-900 font-bold">{formatRupiah(calculatedBookBalance)}</strong>
              </div>
            </div>
          )}
        </div>

      </div>
      
      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-4 right-4 z-50 max-w-sm bg-slate-900 text-white text-xs px-3.5 py-2.5 rounded shadow-lg flex items-center gap-2 border border-slate-800 font-sans"
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span className="font-semibold text-slate-100">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
