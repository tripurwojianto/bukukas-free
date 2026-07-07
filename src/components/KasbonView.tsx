import React, { useState, useEffect } from 'react';
import { useBukuKas } from '../context/BukuKasContext';
import { formatRupiah, getTodayDateString } from '../utils/defaultData';
import { Search, PlusCircle, Calendar, MessageSquare, Check, X, Phone, User as UserIcon, CreditCard, ChevronRight, AlertCircle, Trash, AlertTriangle } from 'lucide-react';

export const KasbonView: React.FC = () => {
  const { data, addKasbon, addPembayaranKasbon, deleteKasbon } = useBukuKas();
  
  // State for search and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnpaidOnly, setFilterUnpaidOnly] = useState(true);
  
  // Detail overlay states
  const [selectedCustomerName, setSelectedCustomerName] = useState<string | null>(null);
  
  // Form states
  const [showNewKasbonModal, setShowNewKasbonModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newKasbonAmount, setNewKasbonAmount] = useState('');
  const [newKasbonDate, setNewKasbonDate] = useState(getTodayDateString());
  const [newKasbonNotes, setNewKasbonNotes] = useState('');

  // Payment form states
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(getTodayDateString());

  // Delete kasbon target state
  const [deleteKasbonTarget, setDeleteKasbonTarget] = useState<{
    id: string;
    amount: number;
    customerName: string;
  } | null>(null);

  // Check if we were triggered to open the new kasbon modal from dashboard quick action
  useEffect(() => {
    const triggerOpen = localStorage.getItem('bukukas_kasbon_open_new');
    if (triggerOpen === 'true') {
      setShowNewKasbonModal(true);
      localStorage.removeItem('bukukas_kasbon_open_new');
    }
  }, []);

  // Compute customer summaries
  // Map customer names to their phone, total owed, total paid, and all logs
  const customerSummaries = React.useMemo(() => {
    const summaries = new Map<string, {
      name: string;
      phone: string;
      totalOwed: number;
      totalPaid: number;
      outstanding: number;
      kasbons: typeof data.kasbon;
      payments: typeof data.pembayaranKasbon;
    }>();

    // Collect all unique customer names from Pelanggan first
    data.pelanggan.forEach(p => {
      summaries.set(p.name.toLowerCase(), {
        name: p.name,
        phone: p.phone,
        totalOwed: 0,
        totalPaid: 0,
        outstanding: 0,
        kasbons: [],
        payments: [],
      });
    });

    // Populate kasbons
    data.kasbon.forEach(k => {
      const key = k.customerName.toLowerCase();
      const current = summaries.get(key) || {
        name: k.customerName,
        phone: k.phone,
        totalOwed: 0,
        totalPaid: 0,
        outstanding: 0,
        kasbons: [],
        payments: [],
      };
      
      current.totalOwed += k.amount;
      current.kasbons.push(k);
      // Ensure we have correct phone
      if (k.phone && !current.phone) {
        current.phone = k.phone;
      }
      summaries.set(key, current);
    });

    // Populate payments
    data.pembayaranKasbon.forEach(p => {
      const key = p.customerName.toLowerCase();
      const current = summaries.get(key) || {
        name: p.customerName,
        phone: '',
        totalOwed: 0,
        totalPaid: 0,
        outstanding: 0,
        kasbons: [],
        payments: [],
      };
      
      current.totalPaid += p.amount;
      current.payments.push(p);
      summaries.set(key, current);
    });

    // Compute outstanding balances & sort internal details
    const list: Array<{
      name: string;
      phone: string;
      totalOwed: number;
      totalPaid: number;
      outstanding: number;
      kasbons: typeof data.kasbon;
      payments: typeof data.pembayaranKasbon;
    }> = [];

    summaries.forEach((value) => {
      const outstanding = value.totalOwed - value.totalPaid;
      list.push({
        ...value,
        outstanding,
        // Sort newest first
        kasbons: value.kasbons.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
        payments: value.payments.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
      });
    });

    return list;
  }, [data]);

  // Handle autocomplete when typing customer name
  const [suggestions, setSuggestions] = useState<string[]>([]);
  useEffect(() => {
    if (newCustomerName.trim().length > 0) {
      const matched = data.pelanggan
        .filter(p => p.name.toLowerCase().includes(newCustomerName.toLowerCase()) && p.name.toLowerCase() !== newCustomerName.toLowerCase())
        .map(p => p.name)
        .slice(0, 5);
      setSuggestions(matched);
    } else {
      setSuggestions([]);
    }
  }, [newCustomerName, data.pelanggan]);

  const selectSuggestion = (name: string) => {
    setNewCustomerName(name);
    const match = data.pelanggan.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (match) {
      setNewCustomerPhone(match.phone);
    }
    setSuggestions([]);
  };

  // Filter list based on search and filters
  const filteredCustomers = customerSummaries.filter(cust => {
    const matchesSearch = cust.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          cust.phone.includes(searchQuery);
    const matchesFilter = filterUnpaidOnly ? cust.outstanding > 0 : true;
    return matchesSearch && matchesFilter;
  });

  const activeCustomer = selectedCustomerName 
    ? customerSummaries.find(c => c.name.toLowerCase() === selectedCustomerName.toLowerCase()) 
    : null;

  // Form submission: New Kasbon
  const handleCreateKasbon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim() || !newKasbonAmount || parseFloat(newKasbonAmount) <= 0) {
      alert('Nama pelanggan dan nominal kasbon wajib diisi dengan benar.');
      return;
    }

    addKasbon({
      customerName: newCustomerName.trim(),
      phone: newCustomerPhone.trim(),
      date: newKasbonDate,
      amount: parseFloat(newKasbonAmount),
    });

    // Reset fields
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewKasbonAmount('');
    setNewKasbonDate(getTodayDateString());
    setNewKasbonNotes('');
    setShowNewKasbonModal(false);
  };

  // Form submission: New Payment
  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('Nominal pembayaran wajib diisi dengan benar.');
      return;
    }

    const payAmt = parseFloat(paymentAmount);
    
    // Warn if payment exceeds outstanding balance
    if (payAmt > activeCustomer.outstanding) {
      const confirmExceed = window.confirm(`Nominal pembayaran (${formatRupiah(payAmt)}) melebihi total kasbon pelanggan (${formatRupiah(activeCustomer.outstanding)}). Lanjutkan?`);
      if (!confirmExceed) return;
    }

    addPembayaranKasbon({
      kasbonId: '', // automatically handled chronologically
      customerName: activeCustomer.name,
      date: paymentDate,
      amount: payAmt,
    });

    setPaymentAmount('');
    setPaymentDate(getTodayDateString());
    setShowPaymentForm(false);
  };

  // WA Reminder Link generator
  const getWhatsAppLink = (name: string, phone: string, outstanding: number) => {
    if (!phone) return '#';
    // Clean phone number format
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('62') && cleanPhone.length > 5) {
      cleanPhone = '62' + cleanPhone;
    }

    const shopName = data.profile.name || 'Toko Kami';
    const message = `Halo Kak ${name}, kami dari ${shopName} ingin mengingatkan mengenai catatan kasbon sebesar *${formatRupiah(outstanding)}*. Mohon kesediaannya untuk melakukan pembayaran atau pelunasan. Terima kasih banyak ya Kak! 🙏😊`;
    
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const handleDeleteKasbonClick = (id: string, amount: number, customerName: string) => {
    setDeleteKasbonTarget({ id, amount, customerName });
  };

  return (
    <div className="space-y-4">
      {/* Search Header Bar */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">Catatan Kasbon (Piutang)</h2>
          <button
            onClick={() => setShowNewKasbonModal(true)}
            id="btn-tambah-kasbon"
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors cursor-pointer shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Kasbon Baru
          </button>
        </div>

        {/* Search input and filters */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Cari pelanggan berdasarkan nama/no WA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Filter Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterUnpaidOnly(true)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
              filterUnpaidOnly
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
          >
            🔴 Belum Lunas
          </button>
          <button
            onClick={() => setFilterUnpaidOnly(false)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
              !filterUnpaidOnly
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
          >
            Semua Pelanggan
          </button>
        </div>
      </div>

      {/* Customer List */}
      <div className="space-y-2.5">
        {filteredCustomers.length === 0 ? (
          <div className="bg-white text-center py-10 px-4 rounded-2xl border border-slate-100 shadow-sm">
            <UserIcon className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
            <p className="text-xs text-slate-400 font-bold">Tidak ditemukan data pelanggan.</p>
            <p className="text-[10px] text-slate-400 mt-1">Gunakan tombol "Kasbon Baru" untuk memulai.</p>
          </div>
        ) : (
          filteredCustomers.map((summary) => (
            <div
              key={summary.name}
              onClick={() => setSelectedCustomerName(summary.name)}
              className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200 transition-all flex items-center justify-between gap-3 cursor-pointer group active:scale-[0.99]"
            >
              <div className="min-w-0 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  summary.outstanding > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {summary.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">
                    {summary.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 font-medium mt-0.5">
                    {summary.phone ? (
                      <>
                        <Phone className="w-3 h-3 text-slate-300" />
                        {summary.phone}
                      </>
                    ) : (
                      'Tanpa Nomor WA'
                    )}
                  </p>
                </div>
              </div>

              <div className="text-right flex items-center gap-2 flex-shrink-0">
                <div>
                  <p className={`text-xs font-black tracking-tight ${
                    summary.outstanding > 0 ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {summary.outstanding > 0 ? formatRupiah(summary.outstanding) : 'LUNAS'}
                  </p>
                  {summary.outstanding > 0 && (
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                      Sisa Hutang
                    </p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sub-view: Customer Detail Overlay */}
      {selectedCustomerName && activeCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col animate-slide-up">
            {/* Header */}
            <div className="p-4.5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-800 leading-tight">{activeCustomer.name}</h3>
                <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-1">
                  <Phone className="w-3.5 h-3.5 text-slate-300" />
                  {activeCustomer.phone || 'Belum diatur nomor WA'}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedCustomerName(null);
                  setShowPaymentForm(false);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4.5 space-y-4">
              {/* Debt Summary Badge */}
              <div className={`p-4 rounded-2xl flex items-center justify-between ${
                activeCustomer.outstanding > 0 ? 'bg-amber-50/70 border border-amber-100' : 'bg-emerald-50/70 border border-emerald-100'
              }`}>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sisa Hutang</span>
                  <span className={`text-xl font-black ${
                    activeCustomer.outstanding > 0 ? 'text-amber-800' : 'text-emerald-800'
                  }`}>
                    {formatRupiah(activeCustomer.outstanding)}
                  </span>
                </div>

                {/* WhatsApp & Pay Actions */}
                <div className="flex items-center gap-2">
                  {activeCustomer.outstanding > 0 && activeCustomer.phone && (
                    <a
                      href={getWhatsAppLink(activeCustomer.name, activeCustomer.phone, activeCustomer.outstanding)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-colors shadow-sm"
                      title="Hubungi via WhatsApp"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </a>
                  )}
                  {activeCustomer.outstanding > 0 && (
                    <button
                      onClick={() => setShowPaymentForm(!showPaymentForm)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      Bayar
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Drawer Form */}
              {showPaymentForm && (
                <form onSubmit={handleCreatePayment} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-bold text-slate-700">Catat Pembayaran Kasbon</h4>
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
                      className="text-slate-400 hover:text-slate-600 text-[10px] font-bold"
                    >
                      Batal
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tanggal</label>
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nominal (Rp)</label>
                      <input
                        type="number"
                        placeholder="e.g. 50000"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                        required
                        min="1"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white text-xs font-bold py-2 rounded-lg cursor-pointer"
                  >
                    Simpan Pembayaran
                  </button>
                </form>
              )}

              {/* History Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Riwayat Transaksi</h4>
                
                {/* Unified Timeline Lists */}
                {activeCustomer.kasbons.length === 0 && activeCustomer.payments.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Belum ada riwayat transaksi.</p>
                ) : (
                  <div className="space-y-2.5">
                    {/* Combine kasbons and payments */}
                    {[
                      ...activeCustomer.kasbons.map(k => ({ ...k, itemType: 'kasbon' as const })),
                      ...activeCustomer.payments.map(p => ({ ...p, itemType: 'payment' as const }))
                    ]
                      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
                      .map((item, index) => {
                        const isKasbon = item.itemType === 'kasbon';
                        return (
                          <div
                            key={item.id || index}
                            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                              isKasbon 
                                ? 'bg-amber-50/30 border-amber-100' 
                                : 'bg-emerald-50/20 border-emerald-100'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                  isKasbon 
                                    ? 'bg-amber-100 text-amber-700' 
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {isKasbon ? 'Hutang' : 'Pelunasan'}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                                  <Calendar className="w-3 h-3" />
                                  {item.date}
                                </span>
                              </div>
                              {isKasbon && (item as any).status === 'Lunas' && (
                                <span className="inline-flex items-center text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 mt-1">
                                  <Check className="w-2.5 h-2.5 mr-0.5" /> Lunas
                                </span>
                              )}
                              {isKasbon && (item as any).status === 'Belum Lunas' && (
                                <span className="inline-flex items-center text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 mt-1">
                                  <AlertCircle className="w-2.5 h-2.5 mr-0.5" /> Belum Lunas
                                </span>
                              )}
                            </div>

                            <div className="text-right flex items-center gap-3">
                              <span className={`text-sm font-black tracking-tight ${isKasbon ? 'text-amber-700' : 'text-emerald-700'}`}>
                                {isKasbon ? '+' : '-'} {formatRupiah(item.amount)}
                              </span>
                              
                              {/* Option to delete only for kasbon items to undo mistakes */}
                              {isKasbon && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteKasbonClick(item.id, item.amount, activeCustomer.name)}
                                  className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus Kasbon"
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    }
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Kasbon Form */}
      {showNewKasbonModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4 animate-fade-in relative">
            <button
              onClick={() => {
                setShowNewKasbonModal(false);
                setNewCustomerName('');
                setNewCustomerPhone('');
                setNewKasbonAmount('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
              <PlusCircle className="w-5 h-5 text-indigo-600" />
              Catat Kasbon Baru
            </h3>

            <form onSubmit={handleCreateKasbon} className="space-y-3.5">
              {/* Customer Name with Autocomplete */}
              <div className="relative">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama Pelanggan *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Ketik nama pelanggan..."
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                    required
                  />
                </div>

                {/* Autocomplete dropdown */}
                {suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100 max-h-36 overflow-y-auto">
                    {suggestions.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => selectSuggestion(name)}
                        className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 font-bold"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Phone WA */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nomor WhatsApp (Opsional)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. 08123456789"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                  />
                </div>
                <p className="text-[9px] text-slate-400 font-medium mt-1">Berguna untuk mengirimkan pesan tagihan langsung.</p>
              </div>

              {/* Date and Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tanggal *</label>
                  <input
                    type="date"
                    value={newKasbonDate}
                    onChange={(e) => setNewKasbonDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nominal (Rp) *</label>
                  <input
                    type="number"
                    placeholder="Nominal kasbon"
                    value={newKasbonAmount}
                    onChange={(e) => setNewKasbonAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
                    required
                    min="1"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer shadow-md transition-colors"
                >
                  Simpan Transaksi Kasbon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal for Kasbon */}
      {deleteKasbonTarget && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5 border border-slate-100 text-center space-y-4 animate-scale-up">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                Hapus Catatan Kasbon?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Apakah Anda yakin ingin menghapus catatan kasbon <span className="font-extrabold text-slate-700">{deleteKasbonTarget.customerName}</span> sebesar <span className="font-black text-rose-600">{formatRupiah(deleteKasbonTarget.amount)}</span> ini?
              </p>
              <p className="text-[10px] text-amber-600 font-bold bg-amber-50 py-1.5 px-2.5 rounded-lg border border-amber-100 inline-block leading-snug">
                ⚠️ Catatan pembayaran yang terhubung mungkin akan disesuaikan secara otomatis.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setDeleteKasbonTarget(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteKasbon(deleteKasbonTarget.id);
                  setDeleteKasbonTarget(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md cursor-pointer transition-colors"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
