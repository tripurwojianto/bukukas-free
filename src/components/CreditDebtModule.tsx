import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  User, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Trash2, 
  ArrowRight, 
  DollarSign, 
  AlertCircle,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Receipt,
  Bell,
  Settings,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Receivable, Payable } from '../types';
import { formatRupiah, getTodayDateString, getFormattedDate, getRelativeDueDate, getWhatsAppLink } from '../utils/helpers';

interface CreditDebtModuleProps {
  receivables: Receivable[];
  payables: Payable[];
  onAddReceivable: (item: Omit<Receivable, 'id'>) => void;
  onUpdateReceivable: (id: string, updates: Partial<Receivable>) => void;
  onDeleteReceivable: (id: string) => void;
  onAddPayable: (item: Omit<Payable, 'id'>) => void;
  onUpdatePayable: (id: string, updates: Partial<Payable>) => void;
  onDeletePayable: (id: string) => void;
  defaultTab?: 'piutang' | 'utang';
}

export default function CreditDebtModule({
  receivables,
  payables,
  onAddReceivable,
  onUpdateReceivable,
  onDeleteReceivable,
  onAddPayable,
  onUpdatePayable,
  onDeletePayable,
  defaultTab,
}: CreditDebtModuleProps) {
  // Tabs: 'piutang' (pelanggan berutang) or 'utang' (kita berutang ke supplier)
  const [activeTab, setActiveTab] = useState<'piutang' | 'utang'>(defaultTab || 'piutang');

  // Incremental rendering and load-more limits
  const [visibleLimitReceivables, setVisibleLimitReceivables] = useState(10);
  const [visibleLimitPayables, setVisibleLimitPayables] = useState(10);

  React.useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // Automatic Due Date Notification state
  const [isAutoNotifyActive, setIsAutoNotifyActive] = useState<boolean>(() => {
    const saved = localStorage.getItem('debt_auto_notify_active');
    return saved !== null ? saved === 'true' : true;
  });
  const [customTemplate, setCustomTemplate] = useState<string>(() => {
    return localStorage.getItem('debt_notification_template') || 
      'Halo {nama}, kami ingin mengingatkan catatan piutang Anda sebesar {nominal} yang telah melewati batas waktu pelunasan (jatuh tempo pada {jatuh_tempo}). Mohon untuk segera diselesaikan. Terima kasih!';
  });
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [showNotificationsList, setShowNotificationsList] = useState(false);

  const handleToggleAutoNotify = (val: boolean) => {
    setIsAutoNotifyActive(val);
    localStorage.setItem('debt_auto_notify_active', String(val));
  };

  const handleSaveTemplate = (val: string) => {
    setCustomTemplate(val);
    localStorage.setItem('debt_notification_template', val);
    setIsEditingTemplate(false);
  };

  // Form states for adding Receivable
  const [showAddReceivable, setShowAddReceivable] = useState(false);
  const [recCustomer, setRecCustomer] = useState('');
  const [recDesc, setRecDesc] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recDueDate, setRecDueDate] = useState('');
  const [recWhatsapp, setRecWhatsapp] = useState('');

  // Form states for adding Payable
  const [showAddPayable, setShowAddPayable] = useState(false);
  const [paySupplier, setPaySupplier] = useState('');
  const [payDesc, setPayDesc] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payDueDate, setPayDueDate] = useState('');
  const [payWhatsapp, setPayWhatsapp] = useState('');

  // Inline installment states
  const [payingItemId, setPayingItemId] = useState<string | null>(null);
  const [payingItemType, setPayingItemType] = useState<'piutang' | 'utang' | null>(null);
  const [installmentAmount, setInstallmentAmount] = useState('');

  // Handle forms
  const handleAddRec = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recCustomer.trim() || !recAmount || !recDueDate) return;

    onAddReceivable({
      customerName: recCustomer.trim(),
      date: getTodayDateString(),
      dueDate: recDueDate,
      description: recDesc.trim() || 'Pembelian barang',
      amount: parseFloat(recAmount) || 0,
      paidAmount: 0,
      status: 'belum_lunas',
      whatsappNumber: recWhatsapp.trim() || undefined,
    });

    // Reset
    setRecCustomer('');
    setRecDesc('');
    setRecAmount('');
    setRecDueDate('');
    setRecWhatsapp('');
    setShowAddReceivable(false);
  };

  const handleAddPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paySupplier.trim() || !payAmount || !payDueDate) return;

    onAddPayable({
      supplierName: paySupplier.trim(),
      date: getTodayDateString(),
      dueDate: payDueDate,
      description: payDesc.trim() || 'Pasokan barang',
      amount: parseFloat(payAmount) || 0,
      paidAmount: 0,
      status: 'belum_lunas',
      whatsappNumber: payWhatsapp.trim() || undefined,
    });

    // Reset
    setPaySupplier('');
    setPayDesc('');
    setPayAmount('');
    setPayDueDate('');
    setPayWhatsapp('');
    setShowAddPayable(false);
  };

  // Installment payment logic
  const handleInstallmentSubmit = (e: React.FormEvent, id: string, type: 'piutang' | 'utang') => {
    e.preventDefault();
    const payVal = parseFloat(installmentAmount) || 0;
    if (payVal <= 0) return;

    if (type === 'piutang') {
      const item = receivables.find(r => r.id === id);
      if (item) {
        const newPaid = Math.min(item.amount, item.paidAmount + payVal);
        const newStatus = newPaid >= item.amount ? 'lunas' : 'dicicil';
        onUpdateReceivable(id, {
          paidAmount: newPaid,
          status: newStatus
        });
      }
    } else {
      const item = payables.find(p => p.id === id);
      if (item) {
        const newPaid = Math.min(item.amount, item.paidAmount + payVal);
        const newStatus = newPaid >= item.amount ? 'lunas' : 'dicicil';
        onUpdatePayable(id, {
          paidAmount: newPaid,
          status: newStatus
        });
      }
    }

    setPayingItemId(null);
    setPayingItemType(null);
    setInstallmentAmount('');
  };

  const markComplete = (id: string, type: 'piutang' | 'utang') => {
    if (type === 'piutang') {
      const item = receivables.find(r => r.id === id);
      if (item) {
        onUpdateReceivable(id, {
          paidAmount: item.amount,
          status: 'lunas'
        });
      }
    } else {
      const item = payables.find(p => p.id === id);
      if (item) {
        onUpdatePayable(id, {
          paidAmount: item.amount,
          status: 'lunas'
        });
      }
    }
  };

  // Sum calculations
  const totalPiutangBelumLunas = receivables
    .filter(r => r.status !== 'lunas')
    .reduce((sum, r) => sum + (r.amount - r.paidAmount), 0);

  const totalUtangBelumLunas = payables
    .filter(p => p.status !== 'lunas')
    .reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);

  return (
    <div className="space-y-4" id="utang-piutang-container">
      
      {/* Header Cards: Summary of Receivables & Payables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card: Total Piutang */}
        <div className="bg-white border border-slate-200 rounded-md p-3.5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Total Piutang Toko</span>
          </div>
          <p className="text-lg font-mono font-bold tracking-tight text-slate-900">
            <span className="underline decoration-emerald-200 underline-offset-4 decoration-2">{formatRupiah(totalPiutangBelumLunas)}</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-1 leading-tight">
            Jumlah uang yang masih harus kita tagih dari pelanggan berutang.
          </p>
        </div>

        {/* Card: Total Utang */}
        <div className="bg-white border border-slate-200 rounded-md p-3.5 relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1 bg-amber-50 text-amber-700 rounded border border-amber-200">
              <TrendingDown className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Total Utang Supplier</span>
          </div>
          <p className="text-lg font-mono font-bold tracking-tight text-slate-900">
            <span className="underline decoration-amber-200 underline-offset-4 decoration-2">{formatRupiah(totalUtangBelumLunas)}</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-1 leading-tight">
            Jumlah kewajiban pembayaran kita ke distributor atau pihak luar.
          </p>
        </div>
      </div>

      {/* AUTOMATIC OVERDUE NOTIFICATION SYSTEM */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5" id="overdue-notification-center">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full relative ${
              receivables.filter(item => item.status !== 'lunas' && getRelativeDueDate(item.dueDate).isOverdue).length > 0 && isAutoNotifyActive
                ? 'bg-rose-50 text-rose-600 border border-rose-100 animate-pulse'
                : 'bg-slate-50 text-slate-400 border border-slate-150'
            }`}>
              <Bell className="w-5 h-5" />
              {receivables.filter(item => item.status !== 'lunas' && getRelativeDueDate(item.dueDate).isOverdue).length > 0 && isAutoNotifyActive && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-rose-600 text-white text-[9px] font-mono font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {receivables.filter(item => item.status !== 'lunas' && getRelativeDueDate(item.dueDate).isOverdue).length}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs font-bold text-slate-800">Sistem Notifikasi Piutang Jatuh Tempo</h4>
                <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                  isAutoNotifyActive 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isAutoNotifyActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                  {isAutoNotifyActive ? 'Pemantauan Otomatis Aktif' : 'Pemantauan Nonaktif'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {receivables.filter(item => item.status !== 'lunas' && getRelativeDueDate(item.dueDate).isOverdue).length > 0 
                  ? `Terdeteksi ${receivables.filter(item => item.status !== 'lunas' && getRelativeDueDate(item.dueDate).isOverdue).length} piutang pelanggan yang telah melewati jatuh tempo (total tagihan: ${formatRupiah(receivables.filter(item => item.status !== 'lunas' && getRelativeDueDate(item.dueDate).isOverdue).reduce((sum, item) => sum + (item.amount - item.paidAmount), 0))}).`
                  : 'Hebat! Semua piutang pelanggan saat ini aman dan belum melewati batas waktu pelunasan.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end md:self-auto">
            <button
              onClick={() => handleToggleAutoNotify(!isAutoNotifyActive)}
              className={`text-[10px] font-bold py-1 px-2 rounded cursor-pointer transition-all border ${
                isAutoNotifyActive 
                  ? 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200' 
                  : 'bg-slate-800 hover:bg-slate-900 text-white border-transparent'
              }`}
            >
              {isAutoNotifyActive ? 'Matikan Monitor' : 'Aktifkan Monitor'}
            </button>
            
            {receivables.filter(item => item.status !== 'lunas' && getRelativeDueDate(item.dueDate).isOverdue).length > 0 && isAutoNotifyActive && (
              <button
                onClick={() => setShowNotificationsList(!showNotificationsList)}
                className="text-[10px] font-bold py-1 px-2.5 rounded bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1 shadow-sm transition-all cursor-pointer"
              >
                {showNotificationsList ? 'Sembunyikan' : 'Lihat Notifikasi'}
                {showNotificationsList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}

            <button
              onClick={() => { setIsEditingTemplate(!isEditingTemplate); setShowNotificationsList(false); }}
              className="text-[10px] font-bold py-1 px-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition-all cursor-pointer"
              title="Atur template pesan peringatan"
            >
              <Settings className="w-3.5 h-3.5" />
              Template
            </button>
          </div>
        </div>

        <AnimatePresence>
          {/* Template Editing Panel */}
          {isEditingTemplate && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-3 pt-3 border-t border-slate-100 space-y-3"
            >
              <div className="bg-slate-50 p-3 rounded border border-slate-100">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold font-semibold">Kustomisasi Pesan Pengingat WA</span>
                  <div className="flex gap-1">
                    {['{nama}', '{nominal}', '{jatuh_tempo}'].map((placeholder) => (
                      <button
                        key={placeholder}
                        type="button"
                        onClick={() => {
                          const textarea = document.getElementById('template-textarea') as HTMLTextAreaElement;
                          if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const text = textarea.value;
                            const newText = text.substring(0, start) + placeholder + text.substring(end);
                            setCustomTemplate(newText);
                            setTimeout(() => {
                              textarea.focus();
                              textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
                            }, 50);
                          }
                        }}
                        className="text-[8px] font-mono bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                        title={`Klik untuk menyisipkan variabel ${placeholder}`}
                      >
                        {placeholder}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  id="template-textarea"
                  value={customTemplate}
                  onChange={(e) => setCustomTemplate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-700 font-sans focus:outline-none focus:border-slate-800 focus:bg-white h-20 transition-all"
                  placeholder="Ketik template pesan pengingat..."
                />
                <p className="text-[8px] text-slate-400 mt-1 leading-normal">
                  Variabel dinamis: <strong className="text-slate-600">{`{nama}`}</strong> (Nama Pelanggan), <strong className="text-slate-600">{`{nominal}`}</strong> (Sisa Tagihan), <strong className="text-slate-600">{`{jatuh_tempo}`}</strong> (Tanggal Jatuh Tempo).
                </p>
                <div className="flex gap-1.5 justify-end mt-2.5">
                  <button
                    onClick={() => handleSaveTemplate(customTemplate)}
                    className="bg-slate-800 hover:bg-slate-900 text-white text-[9px] font-bold py-1 px-2.5 rounded transition-colors cursor-pointer"
                  >
                    Simpan Template
                  </button>
                  <button
                    onClick={() => {
                      setCustomTemplate(localStorage.getItem('debt_notification_template') || 'Halo {nama}, kami ingin mengingatkan catatan piutang Anda sebesar {nominal} yang telah melewati batas waktu pelunasan (jatuh tempo pada {jatuh_tempo}). Mohon untuk segera diselesaikan. Terima kasih!');
                      setIsEditingTemplate(false);
                    }}
                    className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[9px] font-bold px-2.5 py-1 rounded transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Overdue Notification Lists Panel */}
          {showNotificationsList && receivables.filter(item => item.status !== 'lunas' && getRelativeDueDate(item.dueDate).isOverdue).length > 0 && isAutoNotifyActive && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-3 pt-3 border-t border-slate-100 space-y-2"
            >
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold font-semibold">Daftar Tagihan Melewati Jatuh Tempo ({receivables.filter(item => item.status !== 'lunas' && getRelativeDueDate(item.dueDate).isOverdue).length})</span>
                <span className="text-[9px] font-medium text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 animate-pulse flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Memerlukan Tindakan Segera
                </span>
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {receivables.filter(item => item.status !== 'lunas' && getRelativeDueDate(item.dueDate).isOverdue).map((item) => {
                  const { text: dueText } = getRelativeDueDate(item.dueDate);
                  const rem = item.amount - item.paidAmount;
                  const messageText = customTemplate
                    .replace(/{nama}/g, item.customerName)
                    .replace(/{nominal}/g, formatRupiah(item.amount - item.paidAmount))
                    .replace(/{jatuh_tempo}/g, getFormattedDate(item.dueDate));
                  
                  return (
                    <div 
                      key={item.id} 
                      className="bg-rose-50/40 border border-rose-100/80 rounded p-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 transition-all hover:bg-rose-50/75"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-800">{item.customerName}</span>
                          <span className="text-[9px] font-mono bg-rose-50 text-rose-700 px-1 py-0.2 rounded border border-rose-200 font-bold">
                            {dueText}
                          </span>
                          {item.whatsappNumber ? (
                            <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-150 font-bold">
                              WA: {item.whatsappNumber}
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono text-slate-400 bg-slate-50 px-1 py-0.2 rounded border border-slate-200 italic">
                              No WA Belum Ditambahkan
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Barang: <span className="font-semibold text-slate-700">{item.description}</span> | Jatuh tempo: <span className="font-semibold text-slate-700">{getFormattedDate(item.dueDate)}</span>
                        </p>
                        <p className="text-[9px] italic text-slate-400 bg-white/70 border border-slate-100 rounded px-1.5 py-0.5 max-w-xl">
                          &ldquo;{messageText}&rdquo;
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <div className="text-right mr-1.5 sm:block hidden">
                          <p className="text-[9px] text-slate-400 font-medium">Sisa Tagihan</p>
                          <p className="text-xs font-mono font-bold text-rose-700">{formatRupiah(rem)}</p>
                        </div>
                        {item.whatsappNumber ? (
                          <a
                            href={getWhatsAppLink(item.whatsappNumber, messageText)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1 px-2.5 rounded transition-all cursor-pointer shadow-3xs"
                            title="Kirim Pesan Pengingat Otomatis"
                          >
                            <Send className="w-3 h-3" />
                            Kirim WA
                          </a>
                        ) : (
                          <button
                            onClick={() => {
                              alert('Silakan tambahkan nomor WhatsApp terlebih dahulu dengan mengubah data atau saat mendaftarkan piutang baru.');
                            }}
                            className="inline-flex items-center gap-1 bg-slate-100 text-slate-400 text-[10px] font-bold py-1 px-2.5 rounded border border-slate-200 cursor-not-allowed"
                            title="WhatsApp tidak tersedia"
                          >
                            <Send className="w-3 h-3" />
                            Kirim WA
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selector Tab */}
      <div className="flex border-b border-slate-200 bg-white" id="ledger-tabs">
        <button
          onClick={() => { setActiveTab('piutang'); setPayingItemId(null); }}
          className={`px-4 py-1.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'piutang'
              ? 'border-slate-800 text-slate-950 bg-slate-50/50 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/30'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-slate-500" /> Piutang Pelanggan
        </button>
        <button
          onClick={() => { setActiveTab('utang'); setPayingItemId(null); }}
          className={`px-4 py-1.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'utang'
              ? 'border-slate-800 text-slate-950 bg-slate-50/50 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/30'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5 text-slate-500" /> Utang Toko
        </button>
      </div>

      {/* Main Ledger Content */}
      <div className="bg-white border border-slate-200 rounded-md p-3.5">
        
        {/* PIUTANG SECTION */}
        {activeTab === 'piutang' && (
          <div className="space-y-3.5" id="piutang-list-view">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Catatan Piutang Pelanggan</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-none">Jaga hubungan baik melalui pencatatan jatuh tempo yang transparan</p>
              </div>
              {!showAddReceivable && (
                <button
                  onClick={() => setShowAddReceivable(true)}
                  className="flex items-center gap-1 text-[10px] font-bold bg-slate-800 hover:bg-slate-900 text-white px-2 py-1 rounded shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Catat Piutang
                </button>
              )}
            </div>

            {/* Add Receivable Form */}
            <AnimatePresence>
              {showAddReceivable && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddRec}
                  className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2.5 overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[9px] font-mono tracking-wider text-slate-400 uppercase font-bold mb-1">
                        Nama Pelanggan
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Bu Endang, Warung Pojok"
                        value={recCustomer}
                        onChange={(e) => setRecCustomer(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded py-1 px-2 text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono tracking-wider text-slate-400 uppercase font-bold mb-1">
                        No WhatsApp Pelanggan (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 08123456789"
                        value={recWhatsapp}
                        onChange={(e) => setRecWhatsapp(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded py-1 px-2 text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono tracking-wider text-slate-400 uppercase font-bold mb-1">
                        Tanggal Jatuh Tempo (Batas Waktu)
                      </label>
                      <input
                        type="date"
                        value={recDueDate}
                        onChange={(e) => setRecDueDate(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded py-1 px-2 text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[9px] font-mono tracking-wider text-slate-400 uppercase font-bold mb-1">
                        Jumlah Piutang (Rp)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">Rp</span>
                        <input
                          type="number"
                          placeholder="0"
                          value={recAmount}
                          onChange={(e) => setRecAmount(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded py-1 pl-7 pr-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white transition-all"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono tracking-wider text-slate-400 uppercase font-bold mb-1">
                        Keterangan Barang / Catatan
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Belanja Sembako, Susu Bayi"
                        value={recDesc}
                        onChange={(e) => setRecDesc(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded py-1 px-2 text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex gap-1.5 justify-end pt-1">
                    <button
                      type="submit"
                      className="bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold py-1 px-2.5 rounded transition-colors cursor-pointer"
                    >
                      Simpan Catatan
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddReceivable(false)}
                      className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11px] font-bold px-2.5 py-1 rounded transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* List receivables */}
            <div className="space-y-2">
              {receivables.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Belum ada catatan piutang pelanggan.
                </div>
              ) : (
                receivables.slice(0, visibleLimitReceivables).map((item) => {
                  const rem = item.amount - item.paidAmount;
                  const { text: dueText, isOverdue } = getRelativeDueDate(item.dueDate);
                  const isPaying = payingItemId === item.id && payingItemType === 'piutang';

                  return (
                    <div 
                      key={item.id} 
                      className={`border rounded p-3 transition-all border-l-4 ${
                        item.status === 'lunas' 
                          ? 'border-slate-200 border-l-slate-400 bg-slate-50/50 opacity-60' 
                          : 'border-slate-200 border-l-emerald-600 bg-white hover:border-slate-400 shadow-2xs'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded ${
                            item.status === 'lunas' 
                              ? 'bg-slate-100 text-slate-400' 
                              : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h4 className="font-bold text-slate-800 text-xs">{item.customerName}</h4>
                              {item.whatsappNumber && (
                                <a
                                  href={getWhatsAppLink(
                                    item.whatsappNumber,
                                    `Halo ${item.customerName}, kami dari Toko ingin mengingatkan catatan piutang Anda sebesar ${formatRupiah(item.amount - item.paidAmount)} dengan tanggal jatuh tempo pada ${getFormattedDate(item.dueDate)}. Terima kasih!`
                                  )}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded border border-emerald-200 transition-all cursor-pointer"
                                  title="Kirim Pengingat WhatsApp"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                  WA: {item.whatsappNumber}
                                </a>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                              <Calendar className="w-3 h-3" /> Dicatat: {getFormattedDate(item.date)}
                            </p>
                          </div>
                        </div>

                        {/* Status badge & Due tag */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {item.status !== 'lunas' && (
                            <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                              isOverdue 
                                ? 'bg-rose-50 text-rose-700 border-rose-200' 
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              <Clock className="w-2.5 h-2.5" /> {dueText}
                            </span>
                          )}

                          <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase ${
                            item.status === 'lunas' 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : item.status === 'dicicil'
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {item.status === 'lunas' ? 'Lunas' : item.status === 'dicicil' ? 'Dicicil' : 'Belum Lunas'}
                          </span>
                        </div>
                      </div>

                      {/* Detail row */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-1.5 border-t border-b border-slate-100 text-[11px]">
                        <div className="sm:col-span-4">
                          <div className="text-slate-400 text-[9px] font-mono uppercase tracking-wider font-semibold">Barang / Keterangan</div>
                          <div className="font-semibold text-slate-800 mt-0.5">{item.description}</div>
                        </div>
                        <div className="sm:col-span-3">
                          <div className="text-slate-400 text-[9px] font-mono uppercase tracking-wider font-semibold">Total Utang</div>
                          <div className="font-mono font-semibold text-slate-700 mt-0.5">{formatRupiah(item.amount)}</div>
                        </div>
                        <div className="sm:col-span-3">
                          <div className="text-slate-400 text-[9px] font-mono uppercase tracking-wider font-semibold">Terbayar</div>
                          <div className="font-mono font-bold text-emerald-600 mt-0.5">
                            {formatRupiah(item.paidAmount)}
                          </div>
                        </div>
                        <div className="sm:col-span-2 text-right">
                          <div className="text-slate-400 text-[9px] font-mono uppercase tracking-wider font-semibold">Sisa Tagihan</div>
                          <div className="font-mono font-bold text-indigo-600 mt-0.5">{formatRupiah(rem)}</div>
                        </div>
                      </div>

                      {/* Action Row */}
                      <div className="flex justify-between items-center mt-2">
                        <button
                          onClick={() => onDeleteReceivable(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus Catatan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {item.status !== 'lunas' && (
                          <div className="flex gap-1.5">
                            {isPaying ? (
                              <form 
                                onSubmit={(e) => handleInstallmentSubmit(e, item.id, 'piutang')} 
                                className="flex items-center gap-1"
                              >
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[9px]">Rp</span>
                                  <input
                                    type="number"
                                    placeholder="Nominal cicilan"
                                    value={installmentAmount}
                                    onChange={(e) => setInstallmentAmount(e.target.value)}
                                    className="bg-white border border-slate-200 rounded py-0.5 pl-6 pr-1 text-xs font-mono w-24 focus:outline-none focus:border-slate-800"
                                    required
                                    autoFocus
                                  />
                                </div>
                                <button
                                  type="submit"
                                  className="bg-slate-800 hover:bg-slate-900 text-white text-[9px] font-bold py-0.5 px-2 rounded transition-colors cursor-pointer"
                                >
                                  OK
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setPayingItemId(null); setPayingItemType(null); }}
                                  className="text-slate-400 hover:text-slate-600 text-[10px] px-1"
                                >
                                  Batal
                                </button>
                              </form>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setPayingItemId(item.id);
                                    setPayingItemType('piutang');
                                    setInstallmentAmount('');
                                  }}
                                  className="text-[10px] font-bold text-slate-700 hover:bg-slate-50 border border-slate-200 px-2 py-1 rounded transition-all cursor-pointer"
                                >
                                  Cicil (+)
                                </button>
                                <button
                                  onClick={() => markComplete(item.id, 'piutang')}
                                  className="text-[10px] font-bold text-white bg-slate-800 hover:bg-slate-900 px-2 py-1 rounded transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <CheckCircle className="w-3 h-3" /> Lunas
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {receivables.length > visibleLimitReceivables && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setVisibleLimitReceivables(prev => prev + 10)}
                    className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-md shadow-2xs cursor-pointer transition-all active:scale-95 font-sans"
                  >
                    Tampilkan Lebih Banyak ({receivables.length - visibleLimitReceivables} Piutang Tersisa)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* UTANG SECTION */}
        {activeTab === 'utang' && (
          <div className="space-y-3.5" id="utang-list-view">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Catatan Utang ke Supplier</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-none">Pastikan pembayaran tepat waktu untuk menjaga reputasi toko Anda</p>
              </div>
              {!showAddPayable && (
                <button
                  onClick={() => setShowAddPayable(true)}
                  className="flex items-center gap-1 text-[10px] font-bold bg-slate-800 hover:bg-slate-900 text-white px-2 py-1 rounded shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Catat Utang
                </button>
              )}
            </div>

            {/* Add Payable Form */}
            <AnimatePresence>
              {showAddPayable && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddPay}
                  className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2.5 overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[9px] font-mono tracking-wider text-slate-400 uppercase font-bold mb-1">
                        Nama Pemasok / Supplier
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Agen Sembako Makmur, Sales Unilever"
                        value={paySupplier}
                        onChange={(e) => setPaySupplier(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded py-1 px-2 text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono tracking-wider text-slate-400 uppercase font-bold mb-1">
                        No WhatsApp Supplier (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 08123456789"
                        value={payWhatsapp}
                        onChange={(e) => setPayWhatsapp(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded py-1 px-2 text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono tracking-wider text-slate-400 uppercase font-bold mb-1">
                        Tanggal Jatuh Tempo (Due Date)
                      </label>
                      <input
                        type="date"
                        value={payDueDate}
                        onChange={(e) => setPayDueDate(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded py-1 px-2 text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[9px] font-mono tracking-wider text-slate-400 uppercase font-bold mb-1">
                        Nominal Utang (Rp)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">Rp</span>
                        <input
                          type="number"
                          placeholder="0"
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded py-1 pl-7 pr-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white transition-all"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono tracking-wider text-slate-400 uppercase font-bold mb-1">
                        Keterangan Barang / Catatan
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Nota Konsinyasi, Kulakan Sabun & Mie"
                        value={payDesc}
                        onChange={(e) => setPayDesc(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded py-1 px-2 text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex gap-1.5 justify-end pt-1">
                    <button
                      type="submit"
                      className="bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold py-1 px-2.5 rounded transition-colors cursor-pointer"
                    >
                      Simpan Catatan
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddPayable(false)}
                      className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11px] font-bold px-2.5 py-1 rounded transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* List payables */}
            <div className="space-y-2">
              {payables.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Belum ada catatan utang toko ke supplier.
                </div>
              ) : (
                payables.slice(0, visibleLimitPayables).map((item) => {
                  const rem = item.amount - item.paidAmount;
                  const { text: dueText, isOverdue } = getRelativeDueDate(item.dueDate);
                  const isPaying = payingItemId === item.id && payingItemType === 'utang';

                  return (
                    <div 
                      key={item.id} 
                      className={`border rounded p-3 transition-all border-l-4 ${
                        item.status === 'lunas' 
                          ? 'border-slate-200 border-l-slate-400 bg-slate-50/50 opacity-70' 
                          : 'border-slate-200 border-l-amber-500 bg-white hover:border-slate-400 shadow-2xs'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded ${
                            item.status === 'lunas' 
                              ? 'bg-slate-100 text-slate-400' 
                              : 'bg-amber-50 text-amber-600'
                          }`}>
                            <Receipt className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h4 className="font-bold text-slate-800 text-xs">{item.supplierName}</h4>
                              {item.whatsappNumber && (
                                <a
                                  href={getWhatsAppLink(
                                    item.whatsappNumber,
                                    `Halo ${item.supplierName}, kami dari Toko ingin mengonfirmasi mengenai catatan utang kami sebesar ${formatRupiah(item.amount - item.paidAmount)} yang jatuh tempo pada ${getFormattedDate(item.dueDate)}. Terima kasih!`
                                  )}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded border border-amber-200 transition-all cursor-pointer"
                                  title="Hubungi Supplier via WhatsApp"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                  WA: {item.whatsappNumber}
                                </a>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                              <Calendar className="w-3 h-3" /> Dicatat: {getFormattedDate(item.date)}
                            </p>
                          </div>
                        </div>

                        {/* Status badge & Due tag */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {item.status !== 'lunas' && (
                            <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                              isOverdue 
                                ? 'bg-rose-50 text-rose-700 border-rose-200' 
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              <Clock className="w-2.5 h-2.5" /> {dueText}
                            </span>
                          )}

                          <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase ${
                            item.status === 'lunas' 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : item.status === 'dicicil'
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {item.status === 'lunas' ? 'Lunas' : item.status === 'dicicil' ? 'Dicicil' : 'Belum Lunas'}
                          </span>
                        </div>
                      </div>

                      {/* Detail row */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 py-1.5 border-t border-b border-slate-100 text-[11px]">
                        <div className="sm:col-span-4">
                          <div className="text-slate-400 text-[9px] font-mono uppercase tracking-wider font-semibold">Barang / Keterangan</div>
                          <div className="font-semibold text-slate-800 mt-0.5">{item.description}</div>
                        </div>
                        <div className="sm:col-span-3">
                          <div className="text-slate-400 text-[9px] font-mono uppercase tracking-wider font-semibold">Total Utang</div>
                          <div className="font-mono font-semibold text-slate-700 mt-0.5">{formatRupiah(item.amount)}</div>
                        </div>
                        <div className="sm:col-span-3">
                          <div className="text-slate-400 text-[9px] font-mono uppercase tracking-wider font-semibold">Sudah Kita Bayar</div>
                          <div className="font-mono font-bold text-amber-600 mt-0.5 font-bold">
                            {formatRupiah(item.paidAmount)}
                          </div>
                        </div>
                        <div className="sm:col-span-2 text-right">
                          <div className="text-slate-400 text-[9px] font-mono uppercase tracking-wider font-semibold">Sisa Utang</div>
                          <div className="font-mono font-bold text-rose-600 mt-0.5">{formatRupiah(rem)}</div>
                        </div>
                      </div>

                      {/* Action Row */}
                      <div className="flex justify-between items-center mt-2">
                        <button
                          onClick={() => onDeletePayable(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus Catatan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {item.status !== 'lunas' && (
                          <div className="flex gap-1.5">
                            {isPaying ? (
                              <form 
                                onSubmit={(e) => handleInstallmentSubmit(e, item.id, 'utang')} 
                                className="flex items-center gap-1"
                              >
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-[9px]">Rp</span>
                                  <input
                                    type="number"
                                    placeholder="Nominal pembayaran"
                                    value={installmentAmount}
                                    onChange={(e) => setInstallmentAmount(e.target.value)}
                                    className="bg-white border border-slate-200 rounded py-0.5 pl-6 pr-1 text-xs font-mono w-24 focus:outline-none focus:border-slate-800"
                                    required
                                    autoFocus
                                  />
                                </div>
                                <button
                                  type="submit"
                                  className="bg-slate-800 hover:bg-slate-900 text-white text-[9px] font-bold py-0.5 px-2 rounded transition-colors cursor-pointer"
                                >
                                  OK
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setPayingItemId(null); setPayingItemType(null); }}
                                  className="text-slate-400 hover:text-slate-600 text-[10px] px-1"
                                >
                                  Batal
                                </button>
                              </form>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setPayingItemId(item.id);
                                    setPayingItemType('utang');
                                    setInstallmentAmount('');
                                  }}
                                  className="text-[10px] font-bold text-slate-700 hover:bg-slate-50 border border-slate-200 px-2 py-1 rounded transition-all cursor-pointer"
                                >
                                  Bayar Cicilan
                                </button>
                                <button
                                  onClick={() => markComplete(item.id, 'utang')}
                                  className="text-[10px] font-bold text-white bg-slate-800 hover:bg-slate-900 px-2 py-1 rounded transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" /> Lunas
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {payables.length > visibleLimitPayables && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setVisibleLimitPayables(prev => prev + 10)}
                    className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-md shadow-2xs cursor-pointer transition-all active:scale-95 font-sans"
                  >
                    Tampilkan Lebih Banyak ({payables.length - visibleLimitPayables} Utang Tersisa)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
