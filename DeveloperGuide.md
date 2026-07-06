# PANDUAN PENGEMBANG (DEVELOPER GUIDE)
## Pengelolaan & Penggunaan Developer Console SIKU

Dokumen ini ditujukan khusus bagi **Developer / Tim Pengembang SIKU** untuk memahami, mengelola, dan memperluas **Developer Console (Konsol Pengembang)** yang terintegrasi di dalam aplikasi SIKU.

Developer Console adalah pusat kendali internal, diagnostik, dan *remote configuration* yang berjalan di atas full-stack runtime (Express backend + Vite React frontend).

---

## 🔒 1. ARSITEKTUR KEAMANAN & OTORISASI

Konsol ini dilindungi oleh otorisasi berbasis peran (*role-based authorization*) yang ketat, baik di tingkat antarmuka maupun di tingkat rute API server backend.

### A. Proteksi di Backend (`server.ts`)
Setiap request ke endpoint pengembang dilindungi oleh middleware `authorizeDeveloper`. Middleware ini memverifikasi peran user yang dikirim melalui request header `x-user-role`:

```typescript
function authorizeDeveloper(req: express.Request, res: express.Response, next: express.NextFunction) {
  const userRole = req.headers["x-user-role"];
  if (userRole === "developer") {
    next();
  } else {
    addLog(`[SECURITY_WARN] Unauthorized developer API access attempt by role: ${userRole}`);
    res.status(403).json({ error: "Akses ditolak. Anda tidak memiliki izin Developer." });
  }
}
```

### B. Endpoint API Developer Console
Berikut adalah daftar rute API backend yang tersedia di `server.ts`:
*   **`GET /api/developer/config`**: Mengambil status sistem lengkap (informasi OS/build, lisensi, fitur flag, status layanan cloud, dan log audit).
*   **`POST /api/developer/feature-flags`**: Memperbarui status flag fitur secara dinamis di server.
*   **`POST /api/developer/license`**: Memperbarui tingkat dan masa berlaku lisensi produk di server.
*   **`POST /api/developer/debug/:action`**: Mengeksekusi perintah diagnostik (`reload-config`, `clear-cache`, `refresh-data`, `test-notification`, `test-ai`).

---

## 💻 2. FITUR UTAMA DEVELOPER CONSOLE (9 SEKTOR UTAMA)

Antarmuka Developer Console diatur dalam grid interaktif yang menyajikan 9 bagian utama:

### 1. System Information
Menampilkan ringkasan kompilasi sistem saat ini:
*   `APP NAME`: Nama resmi aplikasi.
*   `VERSION`: Versi rilis aplikasi (contoh: `v1.0.0`).
*   `ENVIRONMENT`: Mode eksekusi runtime (`development` atau `production`).
*   `BUILD VERSION`: ID build unik internal (stempel tanggal).
*   `LAST BUILD TIMESTAMP`: Waktu terakhir kali server memproses inisialisasi build.

### 2. Feature Flags (Remote Config)
Memungkinkan pengaktifan/penonaktifan fitur secara dinamis secara real-time tanpa memerlukan redeploy kode:
*   `aiAssistant`: Mengontrol tombol chat asisten AI.
*   `premiumFeatures`: Mengontrol modul berlangganan.
*   `dashboardAnalytics`: Mengaktifkan visualisasi grafik dan bento-grid analitik.
*   `inventory`: Mengaktifkan modul manajemen stok master barang.
*   `pdfReport` & `backupCloud`: Kontrol atas pengeksporan laporan dan backup eksternal.
*   *Cara Mengelola:* Klik tombol toggle di samping kanan nama fitur. Backend akan merespons dengan memperbarui nilai global variable di memori server.

### 3. User Role Tester (Simulation)
Untuk mempermudah pengujian hak akses (Owner, Kasir, Admin, Developer) secara langsung di frontend:
*   Bapak/Ibu dapat mengklik tombol peran: `DEVELOPER`, `OWNER`, `ADMIN`, atau `KASIR`.
*   *Penting:* Jika peran diubah dari `DEVELOPER` ke peran lain, panel Developer Console akan langsung disembunyikan secara otomatis sesuai dengan pembatasan hak akses pengguna biasa demi keamanan simulasi.

### 4. License Manager
Mengelola status komersial aplikasi:
*   Pilihan tingkat lisensi: `FREE`, `TRIAL`, `PREMIUM`, dan `ENTERPRISE`.
*   Mengubah status lisensi di sini akan langsung mensimulasikan masa aktif lisensi pada respons payload API di backend.

### 5 & 6. Diagnostics & Database Tools
Aksi instan untuk melakukan debugging langsung:
*   **Reload Config**: Mengembalikan semua nilai Feature Flags dan lisensi ke pengaturan awal pabrik (default).
*   **Clear Cache**: Mengosongkan metadata cache server-side.
*   **Refresh Data**: Memaksa sinkronisasi ulang data store lokal dengan cloud.
*   **Test Notification**: Memasukkan notifikasi uji coba ke dalam antrean sistem.
*   **Test AI Connection (SDK)**: Melakukan ping jabat tangan (*handshake*) resmi ke Google Gen AI SDK menggunakan `GEMINI_API_KEY` aktif di lingkungan untuk memastikan konektivitas AI tidak terblokir.
*   **Database Operations**: Tombol simulasi penanganan database Firestore (Backup, Restore, Export, dan Import JSON skema).

### 7. AI Configuration (Gemini API SDK)
Informasi diagnostik mengenai integrasi kecerdasan buatan:
*   `AI PROVIDER`: Engine AI yang digunakan (Google Gen AI SDK).
*   `SDK CONNECTION`: Status konektivitas (`Online` jika `GEMINI_API_KEY` terkonfigurasi, `Offline` jika kunci hilang).
*   `ACTIVE MODEL`: Versi model yang digunakan (saat ini menggunakan `gemini-3.5-flash`).
*   `TOKEN METRIC`: Estimasi konsumsi token saat ini.

### 8. System Service Status
Indikator kesehatan layanan eksternal (*health check*) yang mencakup Firebase Auth, Firestore Database, Firebase Storage, dan konektivitas jaringan umum.

### 9. About Applet
Berisi informasi hak cipta, nama tim pengembang, dan nomor identitas rilis aplikasi.

---

## 📝 3. SERVER AUDIT TRAIL & SECURITY LOGS

Di bagian bawah konsol terdapat **Terminal Log Keamanan**. Terminal ini menampilkan log audit server secara real-time:
*   Peringatan keamanan (`[SECURITY_WARN]`) akan otomatis disorot dengan warna **merah menyala** untuk menarik perhatian tim pengembang.
*   Pembaruan konfigurasi (`[DEV_CONFIG]`) akan tampil dengan warna **oranye**.
*   Aktivitas AI Gemini (`[AI]`) akan tampil dengan warna **ungu**.

---

## 🚀 4. CARA MENAMBAHKAN FITUR ATAU FLAG BARU

Jika di kemudian hari Bapak/Ibu ingin menambahkan menu atau fitur kontrol baru:

1.  **Tambahkan Flag baru di `server.ts`**:
    Cari objek `devFeatureFlags` dan tambahkan kunci baru Anda:
    ```typescript
    let devFeatureFlags = {
      // ... flag yang sudah ada
      myNewAwesomeFeature: false, // Tambahkan ini
    };
    ```

2.  **Tambahkan Aksi Diagnostik di `server.ts`**:
    Di dalam handler `app.post("/api/developer/debug/:action")`, tambahkan logika baru:
    ```typescript
    if (action === "my-new-action") {
      addLog(`[DEBUG_TOOL] Executed my new action`);
      return res.json({ success: true, message: "Aksi kustom berhasil dieksekusi!" });
    }
    ```

3.  **Daftarkan di Frontend (`DeveloperConsoleModule.tsx`)**:
    Komponen React akan secara otomatis membaca flag baru dari rute `/api/developer/config` dan menampilkannya di grid Feature Flags secara dinamis tanpa perlu modifikasi UI tambahan. Namun, jika ingin menambahkan tombol perintah baru, Bapak/Ibu dapat menambahkannya di bagian **Diagnostics** dengan memanggil fungsi:
    ```typescript
    <button onClick={() => handleDebugAction('my-new-action')}>
      Aksi Kustom Baru
    </button>
    ```

---
*SIKU Developer Console — Solusi Kontrol Mutu & Keamanan Tingkat Tinggi SIKU v1.0*
