# 🎬 NexaFinance Promotional Video (Powered by Remotion)

Video promosi dinamis untuk aplikasi **NexaFinance**, dibuat secara terprogram menggunakan **React, TypeScript, CSS, dan Remotion**.

---

## 📐 Spesifikasi Video

| Properti | Detail |
| :--- | :--- |
| **Format Utama** | Vertikal 9:16 (`1080 x 1920`) — *Ideal untuk Instagram Reels, TikTok, YouTube Shorts, dan WhatsApp Status* |
| **Format Sekunder** | Horizontal 16:9 (`1920 x 1080`) — *Untuk YouTube, Presentasi, dan Landing Page* |
| **Durasi** | 30 Detik (900 Frame @ 30 FPS) |
| **Desain** | BCA-Inspired Palette (`#005caa`, `#38bdf8`, Glassmorphism, 48px Pills, Smooth Spring Animations) |

---

## 🎞️ Struktur Storyboard (6 Adegan / 30 Detik)

1. **Scene 1: Hook & Masalah Klasik (0s – 5s / Frame 0–150)**
   - *Pesan*: Masih catat pengeluaran manual di Excel & kuitansi berserakan?
   - *Visual*: Notifikasi masalah & transisi ke era baru.

2. **Scene 2: Reveal NexaFinance (5s – 10s / Frame 150–300)**
   - *Pesan*: NexaFinance - The Autonomous AI Financial OS.
   - *Visual*: Logo megah bercahaya, badge fitur unggulan berputar halus.

3. **Scene 3: Autonomous AI & WhatsApp Chat Sync (10s – 16s / Frame 300–480)**
   - *Pesan*: Catat transaksi semudah kirim chat WhatsApp.
   - *Visual*: Mockup smartphone dengan gelembung chat interaktif *"Catat makan siang 35rb dari BCA"* dan struk konfirmasi otomatis warna emerald.

4. **Scene 4: Continuous Learning & Target Tracking (16s – 21s / Frame 480–630)**
   - *Pesan*: AI yang belajar, mengingat target, dan mengevaluasi arus kas riil.
   - *Visual*: Progress bar target dinamis dari 0% ke 75% (*Rp 15.000.000 / Rp 20.000.000*).

5. **Scene 5: Multi-Source Internet Economic Crawler (21s – 26s / Frame 630–780)**
   - *Pesan*: Riset pasar real-time & live spot FX dari banyak sumber internet.
   - *Visual*: Ticker live rate spot USD/IDR, e-Rate BCA, dan badge media terverifikasi (Kompas, BBC, CNBC, BI).

6. **Scene 6: Call To Action & Grand Finale (26s – 30s / Frame 780–900)**
   - *Pesan*: Mulai kelola keuangan secara otonom hari ini.
   - *Visual*: Tombol CTA bersinar *"Coba Sekarang Gratis"*, domain `nexafinance-app.vercel.app`, dan trust badges.

---

## 🚀 Cara Menjalankan

### 1. Buka Remotion Studio (Preview Interaktif di Browser)
Dari root proyek:
```bash
npm run video:dev
```
Atau dari dalam folder `video/`:
```bash
cd video
npm run dev
```
Buka browser di `http://localhost:3000`. Anda bisa memutar video, menggeser timeline frame-by-frame, dan melihat perubahan secara *real-time (hot-reload)*.

### 2. Render Menjadi File Video MP4

**Format Vertikal 9:16 (Reels/TikTok/Shorts):**
```bash
npm run video:render
```
*Hasil video akan tersimpan di:* `video/out/nexa-promo.mp4`

**Format Horizontal 16:9 (YouTube/Web):**
```bash
npm run video:render:landscape
```
*Hasil video akan tersimpan di:* `video/out/nexa-promo-landscape.mp4`
