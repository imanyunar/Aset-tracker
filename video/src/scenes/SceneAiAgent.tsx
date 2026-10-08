import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BackgroundGlow } from "../components/BackgroundGlow";

export const SceneAiAgent: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animations
  const phoneScale = spring({ frame, fps, config: { damping: 14 } });

  const userBubbleOpacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateRight: "clamp",
  });
  const userBubbleY = interpolate(frame, [15, 30], [30, 0], {
    extrapolateRight: "clamp",
  });

  const agentBubbleOpacity = interpolate(frame, [45, 60], [0, 1], {
    extrapolateRight: "clamp",
  });
  const agentBubbleY = interpolate(frame, [45, 60], [30, 0], {
    extrapolateRight: "clamp",
  });

  const successCardScale = spring({
    frame: frame - 80,
    fps,
    config: { damping: 12 },
  });

  return (
    <div
      style={{
        flex: 1,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 48px",
        fontFamily: "'Open Sans', -apple-system, sans-serif",
      }}
    >
      <BackgroundGlow theme="navy" />

      {/* Header Tag */}
      <div
        style={{
          backgroundColor: "#e8f2fa",
          border: "1px solid #90cdf4",
          padding: "8px 24px",
          borderRadius: "48px",
          color: "#005caa",
          fontSize: "22px",
          fontWeight: 700,
          marginBottom: "20px",
          zIndex: 1,
        }}
      >
        💬 Autonomous Natural Language Agent
      </div>

      <h2
        style={{
          fontSize: "52px",
          fontWeight: 800,
          color: "#ffffff",
          textAlign: "center",
          margin: "0 0 40px",
          lineHeight: 1.25,
          zIndex: 1,
          maxWidth: "800px",
        }}
      >
        Catat Transaksi Semudah{" "}
        <span style={{ color: "#38bdf8" }}>Kirim Chat WhatsApp</span>
      </h2>

      {/* Smartphone Chat Card Mockup */}
      <div
        style={{
          transform: `scale(${phoneScale})`,
          width: "100%",
          maxWidth: "760px",
          backgroundColor: "#ffffff",
          borderRadius: "32px",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.4)",
          border: "2px solid #e2e8f0",
          padding: "36px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          zIndex: 1,
        }}
      >
        {/* Top App Bar inside Card */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #f1f5f9",
            paddingBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                backgroundColor: "#005caa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: "20px",
              }}
            >
              🤖
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "20px", color: "#0f172a" }}>
                Nexa AI Assistant
              </div>
              <div style={{ fontSize: "14px", color: "#16a34a", fontWeight: 600 }}>
                ● Online via WhatsApp & Web
              </div>
            </div>
          </div>
          <span
            style={{
              backgroundColor: "#dcfce7",
              color: "#166534",
              padding: "4px 14px",
              borderRadius: "48px",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            Auto Sync
          </span>
        </div>

        {/* User Message Bubble */}
        <div
          style={{
            alignSelf: "flex-end",
            opacity: userBubbleOpacity,
            transform: `translateY(${userBubbleY}px)`,
            backgroundColor: "#005caa",
            color: "#ffffff",
            padding: "18px 24px",
            borderRadius: "24px 24px 4px 24px",
            fontSize: "22px",
            fontWeight: 600,
            maxWidth: "80%",
            boxShadow: "0 4px 15px rgba(0, 92, 170, 0.25)",
          }}
        >
          Catat makan siang 35rb dari BCA
        </div>

        {/* AI Agent Response Bubble */}
        <div
          style={{
            alignSelf: "flex-start",
            opacity: agentBubbleOpacity,
            transform: `translateY(${agentBubbleY}px)`,
            backgroundColor: "#f8fafc",
            color: "#0f172a",
            border: "1px solid #e2e8f0",
            padding: "20px 24px",
            borderRadius: "24px 24px 24px 4px",
            fontSize: "20px",
            lineHeight: 1.5,
            maxWidth: "90%",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#e8f2fa",
              color: "#005caa",
              padding: "4px 12px",
              borderRadius: "48px",
              fontSize: "13px",
              fontWeight: 700,
              width: "fit-content",
            }}
          >
            ⚡ Autonomous Transaction Recorder
          </div>
          <div>
            ⚡ <strong>Aksi Berhasil Dieksekusi!</strong>
            <br />
            Pengeluaran <strong>Rp 35.000</strong> untuk <em>&quot;makan siang&quot;</em> telah
            tercatat di rekening <strong>BCA</strong>. Saldo diperbarui secara real-time.
          </div>
        </div>

        {/* Success Transaction Receipt Card */}
        {frame >= 70 && (
          <div
            style={{
              transform: `scale(${Math.max(0, successCardScale)})`,
              backgroundColor: "#ffffff",
              border: "2px solid #10b981",
              borderRadius: "18px",
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 8px 20px rgba(16, 185, 129, 0.15)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  backgroundColor: "#dcfce7",
                  color: "#166534",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  fontWeight: 800,
                }}
              >
                ✓
              </div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                  Makan Siang (Makan & Minum)
                </div>
                <div style={{ fontSize: "13px", color: "#64748b" }}>
                  Rekening: BCA • Buku Kas Sinkron
                </div>
              </div>
            </div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#ef4444" }}>
              -Rp 35.000
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
