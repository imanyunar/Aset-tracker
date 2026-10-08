# PRODUCT REQUIREMENT DOCUMENT (PRD) & PROJECT BRIEF
## NexaFinance — Next-Gen SME Treasury & Autonomous Financial Platform

---

### 1. Executive Summary & Ringkasan Eksekutif
* **Nama Produk**: NexaFinance
* **Pengembang Resmi (Developer)**: Nexa Digital Agency
* **Target Pengguna**: Usaha Kecil & Menengah (UKM/SME), Agensi Kreatif & Digital, Startup, Bisnis Retail & F&B Multi-Outlet di Indonesia.
* **Tujuan Produk**: Menyediakan platform otomasi treasury, pemantauan arus kas real-time, kontrol pagu anggaran (*budget guardrail*), dan asisten finansial otonom AI dengan integrasi input multi-kanal (Web & WhatsApp Bot 2-arah).
* **Fondasi Nilai**: Menyelesaikan masalah pencatatan keuangan manual yang rentan terlambat atau bocor melalui pencatatan instan bahasa alami, OCR struk belanja, dan mitigasi *overbudgeting* proaktif.

---

### 2. Problem Statement & Peluang Solusi
1. **Pencatatan Keuangan Konvensional Terlalu Lambat**: Pemilik bisnis dan tim operasional enggan membuka software akuntansi rumit (ERP) hanya untuk mencatat pengeluaran petty cash atau biaya langganan software.
2. **Keterbatasan Integrasi & Rekonsiliasi**: Dana sering tersebar di pos-pos internal, rekening bank operasional, e-wallet (GoPay, OVO), QRIS merchant, dan kas laci fisik tanpa visibilitas agregat terpusat.
3. **Kebocoran Pagu Anggaran (Budget Overrun)**: Pengeluaran sering baru disadari melonjak saat penutupan buku akhir bulan tanpa adanya mekanisme peringatan dini (*early warning guardrails*).
4. **Solusi NexaFinance**:
   * Dashboard terpusat dengan 4 metrik KPI inti likuiditas real-time.
   * Input mutasi instan via percakapan WhatsApp Bot 2-arah berbasis AI (Groq & LLaMA/Gemini) dan OCR invoice.
   * Guardrail Pagu Anggaran adaptif dengan status Aman (<70%), Waspada (70–80%), dan Kritis (>90%).
   * AI Financial Agent otonom dengan fitur *Continuous Memory* dan *Economic Web Crawler*.

---

### 3. Arsitektur Informasi & Peta Halaman (Sitemap)

| No | Modul / Halaman | URL Path | Fungsi & Komponen Kunci |
| :--- | :--- | :--- | :--- |
| 1 | **Landing Page Publik** | `/` | Showcase fitur, partner ecosystem (QRIS, Midtrans, WhatsApp), kalkulator ROI, CTA konversi. |
| 2 | **Login & Autentikasi** | `/login` | Dual-column layout, form email/password, keamanan enkripsi SSL/TLS 256-bit, akun demo 1-klik (`iman@gmail.com`). |
| 3 | **Dashboard Utama Treasury** | `/dashboard` | 4 kartu KPI (Likuiditas Bersih, Pemasukan, Pengeluaran, Net Cash Flow), tren grafik mingguan, pos kas mini, widget WhatsApp Bot, dan mutasi terkini. |
| 4 | **Buku Transaksi** | `/transactions` | Ledger real-time, filter pill (Semua, Keluar, Masuk, Transfer), pencarian instan, filter bulan, badge verifikasi kanal (*WhatsApp Bot*, *OCR*, *Web*), opsi hapus mutasi auto-rollback saldo. |
| 5 | **Rekening & Dompet Kas** | `/accounts` | Manajemen pos kas multi-kategori (Bank Komersil, E-Wallet/QRIS, Petty Cash Fisik), kartu saldo per akun, fitur tambah/edit rekening, dan riwayat arsip. |
| 6 | **Pagu Anggaran (Budgets)** | `/budgets` | Pemilih periode kalender, burn rate tracker, progress bar adaptif per divisi (Operasional, SaaS, Konsumsi, Marketing, Logistik), dan guardrail webhook alert. |
| 7 | **AI Financial Agent** | `/ai` (atau `/agent`) | Chat stream interaktif, parsing transaksi NLP instan, Action Cards konfirmasi, panel Continuous Memory (aturan bisnis otomatis), dan radar berita makro ekonomi. |

---

### 4. Fitur Utama & Kebutuhan Fungsional (Functional Requirements)

#### 4.1. Manajemen Multi-Pos Kas & Likuiditas
* Agregasi seluruh pos kas internal tanpa dependensi API perbankan pihak ketiga yang kaku.
* Perhitungan otomatis *Total Net Liquidity* dan rasio kas likuid (*ready cash* vs *cadangan escrow*).
* Dukungan transaksi transfer internal antar-kas (misal: penarikan kas operasional ke petty cash laci kantor).

#### 4.2. Buku Transaksi & Verifikasi Kanal Ganda
* Pencatatan transaksi dengan metadata lengkap: ID Transaksi, tanggal & jam, kategori, pos akun asal/tujuan, nominal, dan badge verifikasi kanal sumber.
* Mekanisme pencatatan *Double-Entry ledger* aman. Penghapusan mutasi transaksi secara otomatis mengembalikan (*rollback*) saldo pos rekening terkait.

#### 4.3. Pagu Anggaran Dinamis & Kebijakan Guardrail
* Alokasi batas maksimal pengeluaran per pos kategori per bulan kalender.
* Visual progress bar 3-fase:
  * **Hijau (<70%)**: Alokasi belanja aman.
  * **Kuning (70% - 90%)**: Waspada mendekati batas.
  * **Merah (>90% / Overlimit)**: Alert darurat terpicu, notifikasi otomatis dikirim ke owner via WhatsApp Bot.

#### 4.4. AI Financial Agent & Natural Language Processing
* Chat stream latensi rendah (<150ms pemrosesan) berbasis Groq LLM.
* Parsing otomatis transaksi via chat: *"Beli lisensi Figma 1.850.000 dari BCA Operasional"* langsung memunculkan kartu draft mutasi siap rekonsiliasi.
* **Continuous Memory**: Menyimpan preferensi operasional (contoh: batas approval petty cash Rp 500.000, alokasi pajak 10% setiap invoice masuk).
* **Economic Web Crawler**: Pemantauan indikator makroekonomi (BI-Rate, Kurs USD/IDR, regulasi CoreTax & PPh Final UMKM).

#### 4.5. Akses Modal Global
* **Modal "+ Catat Transaksi Instan"**: Tersedia di topbar global untuk input cepat dari layar mana saja.
* **User Profile & Workspace Switcher**: Menampilkan identitas entitas aktif (*Nexa Digital Agency*), owner (*Iman Azizi*), dan status sinkronisasi database (*Neon PostgreSQL*).

---

### 5. Kebutuhan Non-Fungsional (Non-Functional Requirements)

1. **Keamanan & Kepatuhan**:
   * Enkripsi data transit & at-rest TLS 1.3 / AES-256 bit.
   * Isolasi multi-tenant data per-workspace.
   * Audit trail terenkripsi pada setiap interaksi bot dan transaksi.
2. **Performa & Responsivitas**:
   * Layout responsif desktop modern berstandar grid 12-kolom.
   * Rendering UI 60 FPS, komponen visual ringkas tanpa tumpang tindih elemen (*no overflow clutter*).
3. **Standar Desain (Design System)**:
   * Menggunakan Design System **Treasury Precision** (font Plus Jakarta Sans, palet Emerald/Teal `#059669`, permukaan clean light `#faf8ff` / `#ffffff`, border radius `ROUND_EIGHT`).

---

### 6. Roadmap Pengembangan & Milestone

* **Fase 1 (Selesai)**: Perancangan Design System, Landing Page, Halaman Login, Arsitektur Database, dan Screen Mockups Lengkap (Dashboard, Mutasi, Pagu, Rekening, AI Agent).
* **Fase 2 (Berikutnya)**: Integrasi backend API live (Neon PostgreSQL & Drizzle/Prisma ORM), implementasi Webhook Gateway WhatsApp Cloud API.
* **Fase 3**: OCR Engine integration untuk pemindaian struk foto kamera langsung, deployment modul Continuous Memory AI.
* **Fase 4**: Fitur ekspor laporan keuangan terstandarisasi (Format Excel / PDF SAK EMKM) dan multi-role permission (Owner, Finance Admin, Kasir Toko).

---

*Dokumen disusun oleh: Nexa Digital Agency — Tim Pengembangan Produk & Desain Sistem NexaFinance.*
