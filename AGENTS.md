# SIKU - Sistem Informasi Keuangan Usaha
## Single Source of Truth (SSOT) & Project Guidelines

Dokumen ini adalah sumber kebenaran tunggal (Single Source of Truth) untuk proyek SIKU. Semua pengembangan, penambahan fitur, perubahan UI, database, dan alur kerja harus mengikuti panduan dan spesifikasi di bawah ini.

### Aturan Pengembangan Utama:
1. **Patuhi PRD**: Segala bentuk modifikasi kode harus selaras dengan PRD. Jika ada permintaan pengguna yang bertentangan dengan PRD, jangan langsung mengubah kode, melainkan usulkan revisi PRD terlebih dahulu ke pengguna.
2. **Jangan Hapus Fitur**: Jangan pernah menghapus fitur atau modul yang sudah diimplementasikan tanpa alasan yang kuat dan persetujuan eksplisit.
3. **Konsistensi Desain & Kode**: Pertahankan konsistensi arsitektur (React + TypeScript + Tailwind), penamaan komponen, struktur folder, dan bahasa desain antarmuka (Sleek, High Contrast, Modern, fungsional untuk pelaku UMKM).
4. **Pencarian vs Dropdown**: Mengikuti pembaruan terakhir, pilihan barang/bahan baku pada transaksi masuk/keluar harus menggunakan fitur pencarian (searchable autocomplete) bukan dropdown statis tradisional.
5. **Kategori Fleksibel**: Kategori pakaian/terigu hanyalah contoh/placeholder awal. Admin toko dapat mengelola kategori & sub-kategori secara dinamis melalui modul Pengaturan / Master Data.

---

### PRODUCT REQUIREMENTS DOCUMENT (PRD)

#### SIKU v1.0 — Sistem Informasi Keuangan Usaha
**Buku Kas • Utang Piutang • Stok • UMKM**

#### 1. Ringkasan Produk
SIKU adalah aplikasi pembukuan digital sederhana yang dirancang khusus untuk UMKM di Indonesia. Fokus utamanya bukan menjadi aplikasi POS (Point of Sale), tetapi membantu pemilik usaha mencatat seluruh aktivitas keuangan dan persediaan secara praktis.

Aplikasi mampu mencatat:
- Kas Masuk
- Kas Keluar
- Utang Supplier
- Piutang Pelanggan
- Persediaan Barang
- Pemakaian Barang
- Barang Rusak/Basi/Hilang
- Laporan Keuangan

Target utama adalah pemilik usaha yang masih menggunakan buku tulis.

#### 2. Target Pengguna
- **Primer**: Warung Kelontong, Toko Sembako, Toko Baju Kredit, Toko Bangunan.
- **Sekunder**: Pedagang Bakso, Warung Makan, Kedai Kopi, Laundry, Konter HP, UMKM Rumahan, Penjual Frozen Food.

#### 3. Tujuan Produk
Menggantikan pembukuan manual menjadi digital yang:
- Mudah digunakan
- Tidak memerlukan pengetahuan akuntansi
- Data aman
- Dapat digunakan di HP

#### 4. Nilai Jual
✔ Tidak ribet seperti software akuntansi
✔ Tidak hanya kas
✔ Mengelola utang dan piutang
✔ Mengelola stok
✔ Laporan otomatis
✔ Bisa dipakai berbagai jenis usaha

#### 5. Modul Utama

##### A. Dashboard
Menampilkan:
- Saldo Kas
- Total Piutang
- Total Utang
- Nilai Persediaan
- Pendapatan bulan ini
- Pengeluaran bulan ini
- Grafik Kas
- Shortcut transaksi

##### B. Modul Kas
- **Kas Masuk** (Contoh: Penjualan Tunai, Pendapatan Lain, Modal, Piutang Dibayar)
- **Kas Keluar** (Contoh: Belanja Barang, Bayar Utang, Listrik, Gaji, Transport, Biaya Operasional)

##### C. Modul Utang
Mencatat pembelian yang belum lunas.
- *Contoh*: Belanja Rp200.000, Bayar Rp180.000, Sisa Utang Rp20.000.
- *Fitur*: Data Supplier, Riwayat Pembayaran, Jatuh Tempo, Status (Belum Lunas / Lunas).

##### D. Modul Piutang
Mencatat penjualan kredit.
- *Contoh*: Harga Rp350.000, DP Rp100.000, Sisa Rp250.000.
- *Fitur*: Data Pelanggan, Riwayat Cicilan, Jatuh Tempo, Status (Belum Lunas / Lunas).

##### E. Modul Barang
- **Master Barang**: Kode Barang, Nama, Kategori, Satuan, Harga Modal, Harga Jual, Minimal Stok, Status Aktif.
- **Stok Masuk**: Pembelian, Retur Masuk, Penyesuaian.
- **Stok Keluar**: Penjualan, Rusak, Basi, Expired, Hilang, Dipakai Sendiri, Produksi, Sampel, Donasi.

##### F. Modul Produksi
Untuk usaha kuliner.
- *Misal*: Hari ini membuat 100 porsi bakso, menggunakan 5 kg tepung, 10 kg daging, 2 kg bawang. Semua stok otomatis berkurang.

##### G. Supplier
- Nama, Alamat, Telepon, Total Utang, Riwayat.

##### H. Pelanggan
- Nama, Telepon, Alamat, Total Piutang, Riwayat Cicilan.

##### I. Laporan
- **Kas**: Kas Masuk, Kas Keluar, Arus Kas.
- **Utang**: Total Utang, Jatuh Tempo, Supplier.
- **Piutang**: Total Piutang, Jatuh Tempo, Pelanggan.
- **Persediaan**: Stok, Barang Hampir Habis, Barang Expired, Barang Rusak.
- **Laporan Laba Rugi Sederhana**: Pendapatan, Harga Pokok, Biaya Operasional, Estimasi Laba.

##### J. Pencarian
Cari transaksi, pelanggan, supplier, barang.

##### K. Backup
Google Drive, Export Excel, Import Excel, PDF.

##### L. Hak Akses
- **Owner**: Semua akses.
- **Kasir**: Kas, Penjualan, Stok.
- **Admin**: Master Data, Laporan.

##### M. Notifikasi
Piutang jatuh tempo, Utang jatuh tempo, Stok menipis, Barang expired, Backup belum dilakukan.

---

#### 6. Teknologi
- **Frontend**: React + TypeScript
- **Backend**: Firebase (Firestore, Authentication, Firebase Auth)
- **Hosting**: Vercel
- **Storage**: Firebase Storage
- **Backup**: Google Drive

---

#### 7. Roadmap
- **v1.0** (Saat ini): Dashboard, Kas, Utang, Piutang, Barang, Supplier, Pelanggan, Laporan.
- **v1.1**: Produksi, Multi Gudang, QR Code Barang, Import Excel.
- **v1.2**: POS, Cetak Struk Bluetooth, Scan Barcode, Printer Thermal.
- **v2.0**: Multi Cabang, Multi User, Approval Transaksi, Laporan Lengkap, API.

---

#### 8. Keunggulan Kompetitif
SIKU dirancang sebagai buku usaha digital terpadu untuk UMKM, bukan sekadar aplikasi kasir. Aplikasi ini menggabungkan pencatatan kas, utang-piutang, persediaan, dan aktivitas operasional seperti pemakaian bahan baku serta barang rusak dalam satu sistem yang sederhana. Pendekatan ini membuatnya relevan untuk berbagai jenis usaha, mulai dari toko kelontong dan toko baju kredit hingga pedagang kuliner, sehingga membantu pemilik usaha memperoleh gambaran kondisi keuangan dan stok secara menyeluruh tanpa harus memahami akuntansi yang rumit.
