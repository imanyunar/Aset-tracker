import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BackgroundGlow } from "../components/BackgroundGlow";
import { BrandLogo } from "../components/BrandLogo";

export const SceneCta: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoSpring = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });

  const btnScale = interpolate(
    Math.sin(frame * 0.1),
    [-1, 1],
    [0.98, 1.04]
  );

  const contentOpacity = interpolate(frame, [15, 35], [0, 1], {
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

      {/* Hero Brand Icon */}
      <div
        style={{
          transform: `scale(${logoSpring})`,
          marginBottom: "28px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <BrandLogo size={130} />
      </div>

      <div
        style={{
          opacity: contentOpacity,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
          zIndex: 1,
        }}
      >
        <h1
          style={{
            fontSize: "64px",
            fontWeight: 800,
            color: "#ffffff",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          Mulai Kelola Keuangan
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, #38bdf8 0%, #60a5fa 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Secara Otonom Hari Ini
          </span>
        </h1>

        <p
          style={{
            fontSize: "24px",
            color: "#94a3b8",
            maxWidth: "680px",
            margin: "0 0 16px",
            lineHeight: 1.5,
          }}
        >
          Nikmati kemudahan pencatatan otomatis via WhatsApp, continuous learning, dan evaluasi target riil.
        </p>

        {/* 48px CTA Pill Button */}
        <div
          style={{
            transform: `scale(${btnScale})`,
            backgroundColor: "#005caa",
            color: "#ffffff",
            padding: "22px 64px",
            borderRadius: "48px",
            fontSize: "28px",
            fontWeight: 800,
            boxShadow: "0 10px 40px rgba(0, 92, 170, 0.6)",
            border: "2px solid rgba(255, 255, 255, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span>🚀 Coba Sekarang Gratis</span>
        </div>

        {/* Web Domain Badge */}
        <div
          style={{
            marginTop: "12px",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            padding: "10px 24px",
            borderRadius: "48px",
            fontSize: "18px",
            color: "#38bdf8",
            fontWeight: 600,
          }}
        >
          🌐 nexafinance-client.vercel.app
        </div>

        {/* Trust Badges */}
        <div
          style={{
            marginTop: "20px",
            display: "flex",
            gap: "20px",
            fontSize: "15px",
            color: "#64748b",
            fontWeight: 600,
          }}
        >
          <span>🔒 Bank-Grade Security</span>
          <span>•</span>
          <span>⚡ Neon Cloud Serverless</span>
          <span>•</span>
          <span>💬 WhatsApp AI Sync</span>
        </div>
      </div>
    </div>
  );
};
