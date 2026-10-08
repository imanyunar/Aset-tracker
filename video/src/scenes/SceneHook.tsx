import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BackgroundGlow } from "../components/BackgroundGlow";

export const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  const cardsOpacity = interpolate(frame, [25, 45], [0, 1], {
    extrapolateRight: "clamp",
  });

  const cardsY = interpolate(frame, [25, 55], [60, 0], {
    extrapolateRight: "clamp",
  });

  const subtitleOpacity = interpolate(frame, [70, 95], [0, 1], {
    extrapolateRight: "clamp",
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

      {/* Top Category Tag */}
      <div
        style={{
          transform: `scale(${titleSpring})`,
          opacity: titleSpring,
          backgroundColor: "rgba(239, 68, 68, 0.15)",
          border: "1px solid rgba(239, 68, 68, 0.4)",
          padding: "10px 24px",
          borderRadius: "48px",
          color: "#f87171",
          fontSize: "22px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "2px",
          marginBottom: "28px",
          zIndex: 1,
        }}
      >
        ⚠️ Masalah Keuangan Klasik
      </div>

      {/* Main Catchy Hook Headline */}
      <h1
        style={{
          fontSize: "64px",
          fontWeight: 800,
          textAlign: "center",
          color: "#ffffff",
          lineHeight: 1.25,
          margin: "0 0 40px",
          transform: `scale(${titleSpring})`,
          opacity: titleSpring,
          zIndex: 1,
          maxWidth: "880px",
        }}
      >
        Masih Catat Pengeluaran{" "}
        <span
          style={{
            background: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Manual & Lupa Terus?
        </span>
      </h1>

      {/* Pain Point Floating Cards */}
      <div
        style={{
          opacity: cardsOpacity,
          transform: `translateY(${cardsY}px)`,
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          width: "100%",
          maxWidth: "760px",
          zIndex: 1,
        }}
      >
        {[
          { emoji: "📊", text: "Excel rumit & kuitansi berserakan di mana-mana" },
          { emoji: "🤷", text: "Gaji cepat habis tanpa tahu ke mana alirannya" },
          { emoji: "⏱️", text: "Malas buka aplikasi cuma buat input 1 transaksi" },
        ].map((item, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(16px)",
              padding: "24px 32px",
              borderRadius: "24px",
              display: "flex",
              alignItems: "center",
              gap: "20px",
              color: "#e2e8f0",
              fontSize: "26px",
              fontWeight: 600,
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
            }}
          >
            <span style={{ fontSize: "36px" }}>{item.emoji}</span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>

      {/* Bottom Transition Prompt */}
      <div
        style={{
          marginTop: "60px",
          opacity: subtitleOpacity,
          zIndex: 1,
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontSize: "28px",
            color: "#38bdf8",
            fontWeight: 700,
            letterSpacing: "1px",
          }}
        >
          Saatnya biarkan Autonomous AI yang mengurus semuanya ⚡
        </span>
      </div>
    </div>
  );
};
