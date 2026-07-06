import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, ShieldAlert, CheckCircle2, Bot, ArrowRight, RefreshCw, User, ClipboardList, Package, DollarSign, Mic, MicOff, Check, X, Volume2 } from 'lucide-react';
import { AppSettings, Product, Transaction, Receivable, Payable } from '../types';

interface AiAgentModuleProps {
  settings: AppSettings;
  products: Product[];
  transactions: Transaction[];
  receivables: Receivable[];
  payables: Payable[];
  onActivatePremium: () => void;
  onGoToSettings: () => void;
  onAddTransaction: (newTx: Omit<Transaction, 'id' | 'date'>) => void;
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export default function AiAgentModule({
  settings,
  products,
  transactions,
  receivables,
  payables,
  onActivatePremium,
  onGoToSettings,
  onAddTransaction,
}: AiAgentModuleProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Speech Recognition States
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // States to keep track of processed transaction cards
  const [savedTxIds, setSavedTxIds] = useState<number[]>([]);
  const [dismissedTxIds, setDismissedTxIds] = useState<number[]>([]);

  // Initialize Speech Recognition API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'id-ID'; // Indonesian context

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(prev => (prev ? prev + ' ' + transcript : transcript));
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Maaf, fitur input suara (Speech Recognition) tidak didukung atau belum diizinkan di browser/perangkat Anda.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Execute actual transaction to the parent state
  const handleExecuteTransaction = (tx: any, index: number) => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeString = `${hours}:${minutes}`;

    onAddTransaction({
      description: tx.description,
      type: tx.type,
      category: tx.category,
      amount: Number(tx.amount),
      hpp: tx.hpp ? Number(tx.hpp) : undefined,
      productId: tx.productId || undefined,
      productQty: tx.productQty ? Number(tx.productQty) : undefined,
      time: timeString,
    });
    setSavedTxIds(prev => [...prev, index]);
  };

  const handleDismissTransaction = (index: number) => {
    setDismissedTxIds(prev => [...prev, index]);
  };

  // Quick Action triggers
  const triggerQuickAction = async (promptText: string, actionLabel: string) => {
    if (isLoading) return;
    
    // Append user message
    const userMsg: Message = {
      sender: 'user',
      text: actionLabel,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      setLoadingStep('Membaca database transaksi & inventori...');
      await new Promise(r => setTimeout(r, 600));
      setLoadingStep('Menghitung alur kas masuk & keluar...');
      await new Promise(r => setTimeout(r, 600));
      setLoadingStep('Menghubungi AI Agent Gemini...');
      
      const combinedPrompt = buildPromptContext(promptText);
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: combinedPrompt }),
      });

      const result = await res.json();
      if (result.error) {
        throw new Error(result.error);
      }

      const aiMsg: Message = {
        sender: 'ai',
        text: result.text || 'Gagal menghasilkan jawaban.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      const errorMsg: Message = {
        sender: 'ai',
        text: `⚠️ Maaf, terjadi kesalahan: ${error.message || 'Gagal menghubungi asisten AI.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const textToSend = userInput.trim();
    setUserInput('');

    // Append user message
    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      setLoadingStep('Menganalisis data toko Anda...');
      await new Promise(r => setTimeout(r, 400));
      setLoadingStep('Menyusun tanggapan pintar...');
      
      const combinedPrompt = buildPromptContext(textToSend);
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: combinedPrompt }),
      });

      const result = await res.json();
      if (result.error) {
        throw new Error(result.error);
      }

      const aiMsg: Message = {
        sender: 'ai',
        text: result.text || 'Gagal menghasilkan jawaban.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      const errorMsg: Message = {
        sender: 'ai',
        text: `⚠️ Maaf, terjadi kesalahan: ${error.message || 'Gagal menghubungi asisten AI.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Helper to compile state into context and make prompt hyper-relevant
  const buildPromptContext = (userPrompt: string) => {
    const minifiedProducts = products.map(p => ({
      id: p.id,
      nama: p.name,
      stok: p.stock,
      satuan: p.unit,
      hargaBeli: p.costPrice,
      hargaJual: p.sellingPrice,
      sku: p.sku || '-'
    }));

    const minifiedTx = transactions.slice(0, 30).map(t => ({
      tgl: t.date,
      desc: t.description,
      tipe: t.type,
      jml: t.amount,
      hpp: t.hpp
    }));

    const minifiedReceivables = receivables.map(r => ({
      pelanggan: r.customerName,
      desc: r.description,
      total: r.amount,
      dibayar: r.paidAmount,
      sisa: r.amount - r.paidAmount,
      jatuhTempo: r.dueDate,
      status: r.status
    }));

    const minifiedPayables = payables.map(p => ({
      supplier: p.supplierName,
      desc: p.description,
      total: p.amount,
      dibayar: p.paidAmount,
      sisa: p.amount - p.paidAmount,
      jatuhTempo: p.dueDate,
      status: p.status
    }));

    return `Kamu adalah Agen AI Bisnis Toko yang cerdas, ahli analisis keuangan, dan perencana stok untuk toko bernama "${settings.shopName || 'Toko Kami'}".
    Alamat Toko: ${settings.shopAddress || 'Belum diatur'}
    Kontak: ${settings.shopContact || 'Belum diatur'}
    Hari ini adalah tanggal: ${new Date().toISOString().split('T')[0]}

    Berikut adalah DATA RIIL DAN HISTORIS AKTIF TOKO untuk kamu analisis:
    1. INVENTORI STOK BARANG:
    ${JSON.stringify(minifiedProducts)}

    2. 30 TRANSAKSI KAS TERBARU:
    ${JSON.stringify(minifiedTx)}

    3. DAFTAR PIUTANG (PELANGGAN BELUM LUNAS):
    ${JSON.stringify(minifiedReceivables)}

    4. DAFTAR UTANG (KE SUPPLIER):
    ${JSON.stringify(minifiedPayables)}

    Gunakan data riil di atas untuk menjawab pertanyaan atau perintah berikut. Berikan solusi yang sangat taktis, saran pengelolaan stok, dan peringatan kesehatan keuangan secara komprehensif. Gunakan format Markdown yang indah (tebal, bullet points, dsb) dalam bahasa Indonesia yang ramah, profesional, dan ringkas.

    PENTING - DETEKSI INPUT DATA TRANSAKSI:
    Jika pengguna berniat memasukkan, mencatat, menjual, atau membeli sesuatu melalui teks, kamu WAJIB menganalisis teks tersebut dengan sangat cerdas (meskipun ada TYPO atau bahasa sehari-hari, misal: "jual kecap 2000" atau "maukkan jual kicap rp 2000").
    Cari kecocokan barang terbaik dari daftar INVENTORI STOK BARANG di atas.
    
    PANDUAN PENCOCOKAN YANG SANGAT TEPAT:
    1. Cari kecocokan kata kunci nama produk (misal: "kecap" atau "kicap" bisa berarti "Kecap Sachet ABC" atau "Kecap Manis Bango 1000 mL").
    2. Bandingkan harga transaksi yang disebut user (misal: "2000") dengan harga jual (sellingPrice) produk untuk menemukan varian produk yang paling pas!
       - Contoh: "jual kecap 2000" SANGAT COCOK dengan "Kecap Sachet ABC" (hargaJual: 2000), BUKAN "Kecap Manis Bango 1000 mL" (hargaJual: 38500). Maka pilihlah "Kecap Sachet ABC" (id: prod-5).
    3. Jika transaksi adalah PENJUALAN ("jual", "kas masuk", "pemasukan"), atur tipe sebagai "masuk", kategori sebagai "rutin", amount adalah harga jual atau nominal uang masuk, kuantitas disesuaikan, dan hitung "hpp" secara otomatis dari (hargaBeli produk * kuantitas).
    4. Jika transaksi adalah PENGELUARAN ("beli", "kulakan", "kas keluar"), atur tipe sebagai "keluar", kategori sebagai "rutin", amount adalah nominal uang keluar, dan "hpp" sebagai null.

    Jika terdeteksi bahwa user sedang menginput data transaksi, berikan penjelasan singkat dan ramah yang menyatakan bahwa kamu memahami transaksi tersebut serta telah mencocokkannya ke produk yang tepat dalam sistem. Lalu, di baris paling akhir tanggapanmu, kamu WAJIB menyisipkan satu blok kode JSON valid dengan kunci "detected_transaction" persis seperti format di bawah ini agar tombol simpan otomatis muncul di layar pengguna:
    \`\`\`json
    {
      "detected_transaction": {
        "type": "masuk",
        "category": "rutin",
        "amount": 2000,
        "hpp": 1500,
        "description": "Penjualan Kecap Sachet ABC",
        "productId": "prod-5",
        "productQty": 1,
        "matchedProductName": "Kecap Sachet ABC"
      }
    }
    \`\`\`
    Ingat: Jangan letakkan JSON di tengah-tengah penjelasan. Letakkan di baris paling terakhir pesan Anda agar dapat dipisahkan secara bersih.

    Pertanyaan Pengguna: "${userPrompt}"`;
  };

  // Helper to parse the JSON block if it exists in the message text
  const parseDetectedTransaction = (text: string) => {
    try {
      const jsonMatch = text.match(/```json\s*(\{[\s\S]*?"detected_transaction"[\s\S]*?\})\s*```/i) || 
                        text.match(/(\{[\s\S]*?"detected_transaction"[\s\S]*?\})/i);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1];
        const parsed = JSON.parse(jsonStr);
        if (parsed && parsed.detected_transaction) {
          return parsed.detected_transaction;
        }
      }
    } catch (e) {
      console.error('Gagal memproses draf transaksi otomatis:', e);
    }
    return null;
  };

  // Render text containing simple markdown to HTML tags safely without extra packages
  const formatMarkdown = (text: string) => {
    return text.split('\n').map((line, index) => {
      let formattedLine = line;

      // Handle Bold text **bold** -> <strong>bold</strong>
      formattedLine = formattedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      // Handle Bullet points starting with "- " or "* "
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const content = formattedLine.replace(/^[\-\*]\s+/, '');
        return (
          <li key={index} className="ml-4 list-disc pl-1 text-slate-800 text-xs my-1" dangerouslySetInnerHTML={{ __html: content }} />
        );
      }

      // Handle Headers starting with "### "
      if (line.trim().startsWith('### ')) {
        const content = formattedLine.replace(/^###\s+/, '');
        return (
          <h4 key={index} className="text-xs font-bold text-slate-900 mt-3 mb-1 font-mono uppercase tracking-wider border-b border-slate-100 pb-0.5" dangerouslySetInnerHTML={{ __html: content }} />
        );
      }

      // Handle Headers starting with "## "
      if (line.trim().startsWith('## ')) {
        const content = formattedLine.replace(/^##\s+/, '');
        return (
          <h3 key={index} className="text-sm font-extrabold text-slate-900 mt-4 mb-1.5" dangerouslySetInnerHTML={{ __html: content }} />
        );
      }

      // Render standard paragraph
      if (formattedLine.trim() === '') {
        return <div key={index} className="h-2" />;
      }

      return (
        <p key={index} className="text-xs leading-relaxed text-slate-700" dangerouslySetInnerHTML={{ __html: formattedLine }} />
      );
    });
  };

  // IF PREMIUM IS LOCKED
  if (!settings.isPremiumActive) {
    return (
      <div className="bg-white border border-slate-200 rounded-md shadow-xs p-6 flex flex-col items-center justify-center text-center max-w-2xl mx-auto my-6" id="premium-locked-container">
        <div className="p-3 bg-slate-900 text-amber-400 rounded-full animate-bounce mb-4 shadow-sm">
          <Sparkles className="w-8 h-8 fill-amber-400 text-slate-900" />
        </div>

        <h2 className="text-base font-bold text-slate-900 tracking-tight">Membuka Fitur Premium: Agen AI & Asisten Bisnis</h2>
        <p className="text-xs text-slate-500 mt-1.5 max-w-md">
          Ubah pencatatan toko Anda menjadi konsultan bisnis otomatis dengan integrasi suara, pencocokan cerdas, dan analisis taktis.
        </p>

        {/* Value Proposition Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full my-6 text-left">
          <div className="bg-slate-50 border border-slate-200 rounded p-3.5 space-y-1.5">
            <div className="p-1 bg-slate-100 text-slate-800 rounded w-fit">
              <ClipboardList className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Input Teks & Suara</h4>
            <p className="text-[10px] text-slate-400 leading-snug">Cukup sebutkan penjualan Anda (contoh: "jual kecap 2000"). AI paham typo dan memilih barang yang sesuai otomatis.</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-3.5 space-y-1.5">
            <div className="p-1 bg-slate-100 text-slate-800 rounded w-fit">
              <Package className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Prediksi & Rekomendasi</h4>
            <p className="text-[10px] text-slate-400 leading-snug">Rekomendasi produk mana yang harus di-restock, stok yang mengendap, serta analisis profit secara real-time.</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded p-3.5 space-y-1.5">
            <div className="p-1 bg-slate-100 text-slate-800 rounded w-fit">
              <DollarSign className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Deteksi Utang Piutang</h4>
            <p className="text-[10px] text-slate-400 leading-snug">Audit otomatis tagihan pelanggan maupun supplier yang mendekati batas jatuh tempo untuk mengamankan kasir.</p>
          </div>
        </div>

        {/* Unlock Action Area */}
        <div className="border-t border-slate-100 pt-5 w-full flex flex-col sm:flex-row justify-center items-center gap-3">
          <button
            onClick={() => {
              onActivatePremium();
              alert("Selamat! Fitur Premium Super Admin berhasil diaktifkan secara instan. Sekarang Anda dapat menggunakan Asisten AI!");
            }}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-2.5 rounded-md flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
            Aktifkan Premium Instan
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

  // ACTIVE PREMIUM WORKSPACE
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-md shadow-xs p-4 flex flex-col md:flex-row gap-4 h-[calc(100vh-220px)] min-h-[500px]" id="premium-ai-agent-workspace">
      
      {/* LEFT SIDE: Quick Actions Panel */}
      <div className="w-full md:w-80 bg-white border border-slate-200 rounded-md p-4 flex flex-col justify-between shrink-0" id="ai-quick-actions">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="p-1 bg-slate-100 text-slate-900 rounded-md">
              <Bot className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Konsultan Bisnis AI</h3>
              <p className="text-[9px] text-slate-400">Gemini 3.5 AI Terintegrasi penuh</p>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[9px] text-slate-400 font-bold tracking-wider uppercase block">Pilih Analisis Instan:</span>
            
            <button
              onClick={() => triggerQuickAction(
                "Berikan analisis kesehatan keuangan dari 30 transaksi kas terakhir saya. Hitung estimasi omset, total pengeluaran harian, rasio laba kotor, dan apakah kasir dalam kondisi sehat.",
                "📊 Analisis Kesehatan Keuangan Toko"
              )}
              disabled={isLoading}
              className="w-full text-left bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded p-2.5 text-[11px] font-medium text-slate-700 hover:text-slate-950 flex flex-col gap-0.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <span className="font-bold flex items-center gap-1.5 text-slate-900 text-[11px]">
                <span>📊</span> Analisis Arus Kas & Finansial
              </span>
              <span className="text-[9px] text-slate-400 leading-tight">Analisis laba kotor, perputaran uang, dan rasio pengeluaran.</span>
            </button>

            <button
              onClick={() => triggerQuickAction(
                "Analisis seluruh stok barang saya. Berikan rekomendasi produk apa saja yang harus segera saya restock/kulakan (yang stoknya menipis), dan strategi optimasi pergantian stok (stok mana yang terlalu mengendap).",
                "📦 Analisis Stok & Rekomendasi Kulakan"
              )}
              disabled={isLoading}
              className="w-full text-left bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded p-2.5 text-[11px] font-medium text-slate-700 hover:text-slate-950 flex flex-col gap-0.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <span className="font-bold flex items-center gap-1.5 text-slate-900 text-[11px]">
                <span>📦</span> Peramalan Stok & Kulakan Baru
              </span>
              <span className="text-[9px] text-slate-400 leading-tight">Cari stok menipis dan berikan kalkulasi jumlah kulakan ideal.</span>
            </button>

            <button
              onClick={() => triggerQuickAction(
                "Audit daftar piutang dan utang toko saya. Siapa saja pelanggan dengan piutang belum lunas yang harus segera ditagih? Dan utang mana saja ke supplier yang mendekati jatuh tempo?",
                "⚠️ Audit Utang & Piutang Toko"
              )}
              disabled={isLoading}
              className="w-full text-left bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded p-2.5 text-[11px] font-medium text-slate-700 hover:text-slate-950 flex flex-col gap-0.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <span className="font-bold flex items-center gap-1.5 text-slate-900 text-[11px]">
                <span>⚠️</span> Deteksi Piutang & Utang Jatuh Tempo
              </span>
              <span className="text-[9px] text-slate-400 leading-tight">Rangkum daftar tagihan pelanggan dan tagihan supplier.</span>
            </button>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded p-2.5 text-[9px] text-slate-400 leading-normal">
          <span className="font-bold text-slate-500 block mb-0.5">💡 Tips Input Suara:</span>
          Klik tombol 🎙️ di kolom obrolan, lalu katakan secara alami: <br />
          <span className="font-mono text-slate-700">"jual kecap 2000"</span> atau <br />
          <span className="font-mono text-slate-700">"jual beras 5kg 78000"</span>. <br />
          AI akan mengerti typo dan mencocokkan produk secara otomatis!
        </div>
      </div>

      {/* RIGHT SIDE: Interactive Chat Console */}
      <div className="flex-1 bg-white border border-slate-200 rounded-md flex flex-col justify-between overflow-hidden" id="ai-chat-console">
        
        {/* Chat Stream Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" id="ai-chat-messages-container">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
              <div className="p-3 bg-slate-50 text-slate-400 rounded-full border border-slate-200/50">
                <Bot className="w-8 h-8" />
              </div>
              <div className="max-w-md">
                <h4 className="text-xs font-bold text-slate-800">Tanyakan apa pun atau Input transaksi Anda</h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                  Halo! Saya adalah Asisten AI Toko Anda. Gunakan suara (klik 🎙️) atau ketik langsung transaksi harian Anda. Saya akan mencocokkan nama barang dan kategorinya dengan cerdas meskipun ada kesalahan pengetikan (typo).
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => {
                const detectedTx = msg.sender === 'ai' ? parseDetectedTransaction(msg.text) : null;
                // Strip raw JSON block from displayed content to keep UI absolutely pristine
                const cleanText = msg.sender === 'ai' && detectedTx 
                  ? msg.text.replace(/```json[\s\S]*?```/gi, '').replace(/\{[\s\S]*?"detected_transaction"[\s\S]*?\}/gi, '').trim()
                  : msg.text;

                return (
                  <div key={index} className="space-y-2">
                    <div
                      className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                      {/* Avatar */}
                      <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${msg.sender === 'user' ? 'bg-slate-800 text-white' : 'bg-amber-100 text-slate-900 border border-amber-200'}`}>
                        {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />}
                      </div>

                      {/* Message Bubble */}
                      <div className={`rounded-lg p-3 space-y-2 border ${msg.sender === 'user' ? 'bg-slate-900 border-slate-950 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                        <div className="space-y-1.5 overflow-x-auto">
                          {msg.sender === 'user' ? (
                            <p className="text-xs font-medium whitespace-pre-wrap">{cleanText}</p>
                          ) : (
                            formatMarkdown(cleanText)
                          )}
                        </div>
                        <span className="block text-[8px] text-slate-400 text-right mt-1 font-mono">{msg.timestamp}</span>
                      </div>
                    </div>

                    {/* Interactive Draf Transaksi Card if detected */}
                    {detectedTx && (
                      <div className="ml-9 max-w-[80%] bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs animate-fadeIn" id={`ai-tx-card-${index}`}>
                        <div className="bg-slate-900 text-white px-3 py-1.5 flex items-center justify-between">
                          <span className="text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400 animate-pulse" />
                            Draf Pencatatan Otomatis (Asisten AI)
                          </span>
                          <span className="text-[8px] bg-slate-800 text-emerald-400 font-mono px-1 py-0.5 rounded font-bold">
                            TEPAT & TYPO-TOLERANT
                          </span>
                        </div>

                        <div className="p-3 space-y-2.5">
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <span className="block text-[8px] text-slate-400 uppercase font-mono">Jenis Kas</span>
                              <span className={`inline-block font-bold mt-0.5 px-1 rounded text-[9px] ${detectedTx.type === 'masuk' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                {detectedTx.type === 'masuk' ? '📥 Kas Masuk (Penjualan)' : '📤 Kas Keluar (Pengeluaran)'}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[8px] text-slate-400 uppercase font-mono">Kategori Terkait</span>
                              <span className="font-bold text-slate-800 block mt-1">
                                {detectedTx.category === 'rutin' ? 'Rutin (Operasional)' : 'Insidental'}
                              </span>
                            </div>
                            <div className="col-span-2 border-t border-slate-100 pt-1.5">
                              <span className="block text-[8px] text-slate-400 uppercase font-mono">Deskripsi</span>
                              <span className="font-bold text-slate-800 block mt-0.5">{detectedTx.description}</span>
                            </div>
                            
                            {detectedTx.productId && (
                              <>
                                <div className="border-t border-slate-100 pt-1.5">
                                  <span className="block text-[8px] text-slate-400 uppercase font-mono">Nama Barang Terpilih</span>
                                  <span className="font-bold text-slate-800 block mt-0.5">
                                    📦 {detectedTx.matchedProductName || products.find(p => p.id === detectedTx.productId)?.name || 'Barang Terkait'}
                                  </span>
                                </div>
                                <div className="border-t border-slate-100 pt-1.5">
                                  <span className="block text-[8px] text-slate-400 uppercase font-mono">Stok Keluar (Dukungan Otomatis)</span>
                                  <span className="font-bold text-rose-600 block mt-0.5">
                                    - {detectedTx.productQty || 1} {products.find(p => p.id === detectedTx.productId)?.unit || 'pcs'}
                                  </span>
                                </div>
                              </>
                            )}

                            <div className="col-span-2 border-t border-slate-100 pt-1.5 grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded">
                              <div>
                                <span className="block text-[8px] text-slate-500 font-mono font-bold">TOTAL NOMINAL KAS</span>
                                <span className="font-extrabold text-xs text-slate-900 block mt-0.5">
                                  Rp {Number(detectedTx.amount).toLocaleString('id-ID')}
                                </span>
                              </div>
                              {detectedTx.hpp && (
                                <div>
                                  <span className="block text-[8px] text-slate-500 font-mono font-bold">ESTIMASI LABA KOTOR</span>
                                  <span className="font-bold text-emerald-600 block mt-0.5 text-xs">
                                    + Rp {(Number(detectedTx.amount) - Number(detectedTx.hpp)).toLocaleString('id-ID')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Confirmation buttons */}
                          {savedTxIds.includes(index) ? (
                            <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded py-1.5 text-xs font-bold flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Transaksi Berhasil Disimpan ke Kasir! (Kas Masuk & Stok Terpotong)
                            </div>
                          ) : dismissedTxIds.includes(index) ? (
                            <div className="bg-slate-50 border border-slate-100 text-slate-400 rounded py-1 text-xs text-center italic">
                              Draf dibatalkan.
                            </div>
                          ) : (
                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleExecuteTransaction(detectedTx, index)}
                                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-1.5 rounded flex items-center justify-center gap-1 cursor-pointer shadow-xs transition-all"
                              >
                                <Check className="w-3 h-3 text-emerald-400" />
                                Setujui & Simpan Transaksi
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDismissTransaction(index)}
                                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 font-medium text-xs px-2.5 py-1.5 rounded cursor-pointer transition-all"
                              >
                                Batal
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Ref to keep scrolling */}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 max-w-[80%] mr-auto items-start">
              <div className="w-6 h-6 rounded-full shrink-0 bg-slate-100 border border-slate-200 flex items-center justify-center">
                <RefreshCw className="w-3 h-3 text-slate-600 animate-spin" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-500 text-xs italic space-y-1 shadow-2xs">
                <span className="font-bold text-slate-700 animate-pulse block">Asisten AI sedang berpikir...</span>
                {loadingStep && <span className="text-[9px] text-slate-400 font-mono block">↳ {loadingStep}</span>}
              </div>
            </div>
          )}
        </div>

        {/* Input Text Form */}
        <form onSubmit={handleSendMessage} className="border-t border-slate-200 p-3 bg-slate-50 flex gap-2 items-center" id="ai-chat-input-form">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={isLoading}
            placeholder={isListening ? "Mendengarkan suara Anda..." : isLoading ? "Sedang memproses analisis..." : "Ketik transaksi (misal: 'jual kecap 2000') atau klik tombol mic..."}
            className={`flex-1 bg-white border rounded px-3 py-2 text-xs text-slate-800 outline-none transition-all ${isListening ? 'border-red-500 bg-red-50 placeholder-red-400 font-semibold animate-pulse' : 'border-slate-200 focus:border-slate-800 focus:bg-white'} disabled:bg-slate-100 disabled:text-slate-400`}
          />
          
          {/* Micro Recording Button */}
          <button
            type="button"
            onClick={toggleListening}
            disabled={isLoading}
            className={`p-2 rounded cursor-pointer transition-colors flex items-center justify-center shrink-0 border ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 text-white border-red-600 animate-bounce' 
                : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
            }`}
            title="Gunakan Input Suara (Speech to Text)"
          >
            {isListening ? (
              <MicOff className="w-4 h-4 text-white" />
            ) : (
              <Mic className="w-4 h-4 text-slate-600" />
            )}
          </button>

          <button
            type="submit"
            disabled={!userInput.trim() || isLoading}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded cursor-pointer disabled:opacity-50 disabled:bg-slate-400 transition-colors shrink-0"
            title="Kirim pertanyaan ke AI"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>

    </div>
  );
}
