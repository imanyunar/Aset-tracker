import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/whatsapp/qr - Live QR Scanner Page for Fonnte Device Pairing
export async function GET() {
  const token = process.env.FONNTE_TOKEN;
  if (!token) {
    return new Response("FONNTE_TOKEN belum dikonfigurasi di environment variables.", { status: 500 });
  }

  try {
    const res = await fetch("https://api.fonnte.com/qr", {
      method: "POST",
      headers: { Authorization: token },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));

    if (data.url) {
      const html = `<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8">
    <title>Tautkan Bot WhatsApp — NexaFinance</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="refresh" content="18">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(135deg, #001224 0%, #002244 50%, #003366 100%);
        color: white;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 24px;
        text-align: center;
      }
      .badge {
        background: rgba(56, 189, 248, 0.15);
        border: 1px solid rgba(56, 189, 248, 0.4);
        color: #38bdf8;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.5px;
        padding: 6px 16px;
        border-radius: 48px;
        margin-bottom: 16px;
        text-transform: uppercase;
      }
      h1 { font-size: 26px; font-weight: 800; margin-bottom: 8px; }
      p { color: #94a3b8; font-size: 14px; max-width: 440px; margin-bottom: 24px; line-height: 1.6; }
      .qr-card {
        background: white;
        padding: 20px;
        border-radius: 24px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 50px rgba(56, 189, 248, 0.2);
        display: inline-block;
      }
      img { width: 280px; height: 280px; display: block; border-radius: 12px; }
      .instructions {
        margin-top: 24px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 16px;
        padding: 16px 20px;
        max-width: 440px;
        text-align: left;
        font-size: 13.5px;
        color: #e2e8f0;
      }
      .instructions ol { padding-left: 20px; line-height: 1.8; }
      .note { margin-top: 16px; font-size: 12px; color: #64748b; }
    </style>
  </head>
  <body>
    <div class="badge">NexaFinance WhatsApp Gateway</div>
    <h1>Pindai Kode QR Bot</h1>
    <p>Tautkan nomor WhatsApp baru yang ingin dijadikan asisten bot transaksi NexaFinance Anda.</p>
    
    <div class="qr-card">
      <img src="data:image/png;base64,${data.url}" alt="WhatsApp QR Code" />
    </div>

    <div class="instructions">
      <ol>
        <li>Buka aplikasi <b>WhatsApp</b> di ponsel nomor baru Anda.</li>
        <li>Buka menu <b>Titik Tiga / Pengaturan</b> &gt; <b>Perangkat Tertaut</b>.</li>
        <li>Ketuk <b>Tautkan Perangkat</b> lalu arahkan kamera ke kode QR di atas.</li>
      </ol>
    </div>

    <div class="note">🔄 Halaman ini otomatis memuat ulang kode QR setiap 18 detik agar tetap aktif.</div>
  </body>
</html>`;
      return new Response(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }

    // Already connected or status is connected
    return new Response(`<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8">
    <title>Status WhatsApp Bot — NexaFinance</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #001428;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 24px;
        text-align: center;
      }
      .card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(56, 189, 248, 0.3);
        padding: 40px 32px;
        border-radius: 24px;
        max-width: 440px;
      }
      .icon { font-size: 48px; margin-bottom: 16px; }
      h2 { color: #38bdf8; margin-bottom: 12px; }
      p { color: #94a3b8; font-size: 14.5px; line-height: 1.6; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="icon">✅</div>
      <h2>Bot WhatsApp Sudah Terhubung!</h2>
      <p>${data.reason || "Perangkat WhatsApp bot Anda sudah aktif dan terhubung. Bot siap memproses pencatatan transaksi secara real-time."}</p>
    </div>
  </body>
</html>`, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err: any) {
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
}
