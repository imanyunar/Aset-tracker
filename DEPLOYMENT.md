# 🚀 Panduan Deployment NexaFinance (Vercel Hobby + Neon PostgreSQL)

Dokumen ini memandu langkah-demi-langkah penerapan (**deployment**) NexaFinance ke **Vercel Hobby Tier** dan **Neon.tech Serverless PostgreSQL** secara **100% GRATIS tanpa kartu kredit**.

---

## 🏛️ Arsitektur Stack Cloud (Free Tier)

| Layanan | Peran | Kuota Gratis (Tanpa Kartu Kredit) |
| :--- | :--- | :--- |
| **Vercel Hobby** | Hosting Next.js 15 App Router | Bandwidth 100GB/bulan, Serverless Functions, Edge Network global |
| **Neon.tech** | Database Serverless PostgreSQL 16 | Storage 0.5 GB, Auto-suspend hemat resource, SSL terenkripsi |
| **Groq Cloud** | AI Natural Language Parser (Llama 3.3) | Kuota gratis hingga 30 request/menit |
| **Google AI Studio** | AI Vision OCR Struk & Financial Advisor | Kuota gratis Gemini 2.0 Flash (15 RPM / 1 juta token per menit) |
| **Fonnte / Wablas** | Bot Notifikasi WhatsApp Otomatis | Free trial / testing token |

---

## 📋 Langkah 1: Buat Database PostgreSQL Gratis di Neon.tech

1. Buka [https://neon.tech](https://neon.tech) dan klik **"Sign up"**.
2. Masuk menggunakan akun **GitHub** atau **Google** (tidak memerlukan kartu kredit).
3. Klik **"Create a Project"**:
   - **Project name**: `nexafinance-db`
   - **Postgres version**: `16` (rekomendasi)
   - **Region**: Pilih **Singapore (ap-southeast-1)** untuk latensi terendah dari Indonesia.
4. Di halaman **Dashboard Neon**, salin string koneksi database (**Connection Details**).
   Pilih opsi **Connection string** (pilih tab *Prisma* atau *Pooled connection*), contoh:
   ```text
   postgresql://neondb_owner:npg_AbCdEf123456@ep-cool-frost-123456-pooler.ap-southeast-1.neon.tech/neondb?sslmode=require
   ```

---

## 📦 Langkah 2: Sinkronisasi Schema & Seed Data Demo ke Neon

Sebelum menghubungkan ke Vercel, inisialisasi tabel dan akun demo ke database Neon Anda dari komputer lokal:

1. Buka file `.env` di komputer Anda, ubah `DATABASE_URL` sementara menggunakan string Neon yang disalin dari Langkah 1:
   ```env
   DATABASE_URL="postgresql://neondb_owner:npg_AbCdEf123456@ep-cool-frost-123456-pooler.ap-southeast-1.neon.tech/neondb?sslmode=require"
   ```

2. Jalankan perintah sinkronisasi schema database:
   ```bash
   npm run db:push
   ```
   *Prisma akan membuat seluruh tabel: users, auth_accounts, workspaces, workspace_members, accounts, categories, transactions, dan budgets di database Neon.*

3. Jalankan pengisian data awal (*seeder*) untuk akun demo Alex Pratama:
   ```bash
   npm run db:seed
   ```
   *Akun demo `demo@nexafinance.com` (password: `password123`) beserta data transaksi, rekening BCA, dompet kas, dan kategori akan terisi.*

---

## 🐙 Langkah 3: Unggah Kode ke GitHub

1. Pastikan seluruh perubahan kode telah di-commit ke Git lokal:
   ```bash
   git add .
   git commit -m "feat: complete overhaul NexaFinance to Next.js 15, Prisma & Better Auth"
   ```
2. Buat repository baru di [GitHub](https://github.com/new) (contoh: `NexaFinance`).
3. Hubungkan remote dan push ke GitHub:
   ```bash
   git remote add origin https://github.com/username-anda/NexaFinance.git
   git branch -M main
   git push -u origin main
   ```

---

## ⚡ Langkah 4: Deploy Projek di Vercel Dashboard

1. Buka [https://vercel.com](https://vercel.com) dan login dengan akun GitHub Anda.
2. Di dashboard Vercel, klik tombol **"Add New..."** lalu pilih **"Project"**.
3. Cari dan pilih repository **NexaFinance** yang baru Anda push, lalu klik **"Import"**.
4. Di halaman konfigurasi projek:
   - **Framework Preset**: Biarkan otomatis **Next.js**.
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` (otomatis menjalankan `prisma generate && next build`).
   - **Output Directory**: `.next`

5. Buka bagian **"Environment Variables"** dan tambahkan variabel-variabel berikut:

| Nama Variabel | Nilai / Deskripsi | Contoh Nilai |
| :--- | :--- | :--- |
| `DATABASE_URL` | String koneksi dari Neon.tech (Langkah 1) | `postgresql://user:pass@ep-xyz.ap-southeast-1.neon.tech/neondb?sslmode=require` |
| `BETTER_AUTH_SECRET` | Kunci acak minimal 32 karakter | `nexafinance_prod_secret_998877665544332211aabbcc` |
| `BETTER_AUTH_URL` | Domain Vercel Anda | `https://nexafinance.vercel.app` |
| `WHATSAPP_DRIVER` | Driver WhatsApp (`fonnte`, `wablas`, atau `mock`) | `fonnte` |
| `FONNTE_TOKEN` | Token dari dashboard Fonnte.com | `YOUR_FONNTE_API_TOKEN` |
| `GROQ_API_KEY` | API Key dari console.groq.com | `gsk_YOUR_GROQ_API_KEY` |
| `GEMINI_API_KEY` | API Key dari aistudio.google.com | `AIzaSy_YOUR_GEMINI_API_KEY` |

> 💡 *Catatan mengenai `BETTER_AUTH_URL`: Jika Anda belum tahu domain Vercel yang akan didapat, isi sementara `https://nexafinance.vercel.app`. Setelah deploy selesai dan domain final muncul, Anda dapat memperbarui variabel ini di menu **Settings > Environment Variables** lalu lakukan Redeploy.*

6. Klik tombol **"Deploy"**. Vercel akan mengompilasi aplikasi, menghasilkan Prisma Client, dan mempublikasikan aplikasi dalam waktu ~1 menit!

---

## 🧪 Langkah 5: Checklist Verifikasi Pasca-Deploy

Setelah tautan domain Vercel aktif (contoh: `https://nexafinance.vercel.app`), lakukan pengujian berikut:

1. **Halaman Beranda (`/`)**:
   - Pastikan visual Morgan Stanley tampil rapi.
   - Klik tombol **"Coba Akun Demo Alex (1-Klik)"** untuk masuk langsung ke `/dashboard`.
2. **Dasbor Finansial (`/dashboard`)**:
   - Periksa 4 kartu metrik KPI (Total Saldo, Pemasukan, Pengeluaran, Rasio Tabungan).
   - Pastikan diagram Recharts (Bar chart arus kas 6 bulan dan Donut chart kategori) terender dengan presisi.
3. **Multi-Workspace Switcher**:
   - Di bilah navigasi atas, klik dropdown workspace.
   - Alihkan antara **"Keuangan Pribadi"** dan **"Nexa Creative Studio"**. Pastikan saldo dan data terisolasi.
4. **Pencatatan Transaksi & Saldo Atomik (`/transactions`)**:
   - Catat transaksi pengeluaran baru. Pastikan saldo rekening langsung berkurang secara atomik.
   - Hapus transaksi tersebut dan pastikan saldo langsung kembali ke nominal awal (*zero drift*).
5. **Pagu Anggaran & Bot WhatsApp 2-Arah (`/budgets`)**:
   - Buka menu **Pagu Anggaran & WA**.
   - Klik **"Tes WhatsApp"** untuk membuka *WhatsApp Integration Hub*.
   - Tab **"Simulator Bot 2-Way"**: Coba kirim pesan seperti *"Makan siang soto 35rb bayar bca"*, *"saldo"*, *"ringkasan"*, atau *"anggaran"* untuk melihat balasan bot dan mutasi saldo seketika.
   - Tab **"Uji Kirim Keluar"**: Uji kirim pesan notifikasi langsung ke nomor HP Anda.

---

## 🤖 Langkah 6: Mengaktifkan Bot WhatsApp 2-Arah (Inbound Webhook)

Agar bot dapat menerima pesan langsung dari WhatsApp di HP Anda dan mencatat transaksi otomatis:

1. **Buka Dashboard Penyedia WhatsApp**:
   - **Fonnte**: Buka menu **Device / Perangkat** > klik ikon gear/pengaturan pada perangkat aktif Anda > temukan kolom **Webhook URL**.
   - **Wablas**: Buka menu **Device** > **Webhook & Autoreply** > aktifkan Webhook.
2. **Masukkan Webhook URL**:
   ```text
   https://domain-anda.vercel.app/api/whatsapp/webhook
   ```
3. **Pastikan Nomor Anda Terdaftar**:
   - Nomor WhatsApp HP Anda harus didaftarkan di kolom `whatsappNumber` pada tabel `users` (format `628xxxxxxxx`).
4. **Coba Chat dari HP Anda**:
   - Ketik: *"Makan siang padang 35rb bayar bca"* -> Bot membalas tanda terima dan saldo BCA Anda otomatis berkurang!
   - Ketik: *"saldo"* -> Bot membalas rincian seluruh rekening Anda.
   - Ketik: *"ringkasan"* -> Bot membalas arus kas bulan ini.

---

## 🔒 Pemeliharaan & Tips Keamanan
- **Auto-suspend Neon**: Neon akan menonaktifkan komputasi secara otomatis jika tidak ada kueri selama 5 menit untuk menghemat jam pakai gratis. Kueri berikutnya akan membangunkan database dalam 500ms secara transparan.
- **Rotasi Kunci**: Anda dapat mengubah `BETTER_AUTH_SECRET` kapan saja melalui Vercel Dashboard tanpa perlu mengubah kode sumber.
- **Ekstensi WhatsApp**: Jika ingin beralih dari Fonnte ke Wablas, cukup ubah `WHATSAPP_DRIVER="wablas"` dan tambahkan `WABLAS_TOKEN` di Vercel Dashboard.
