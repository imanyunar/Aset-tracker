import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BackgroundGlow } from "../components/BackgroundGlow";

export const SceneCrawler: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardSpring = spring({ frame, fps, config: { damping: 14 } });

  const tickerValue = Math.round(
    interpolate(frame, [15, 60], [16140, 17901.96], { extrapolateRight: "clamp" })
  );

  const sourcesOpacity = interpolate(frame, [40, 70], [0, 1], {
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

      {/* Header Badge */}
      <div
        style={{
          backgroundColor: "rgba(14, 165, 233, 0.15)",
          border: "1px solid rgba(14, 165, 233, 0.4)",
          padding: "8px 24px",
          borderRadius: "48px",
          color: "#38bdf8",
          fontSize: "22px",
          fontWeight: 700,
          marginBottom: "20px",
          zIndex: 1,
        }}
      >
        🌐 Live Multi-Source Economic Crawler
      </div>

      <h2
        style={{
          fontSize: "52px",
          fontWeight: 800,
          color: "#ffffff",
          textAlign: "center",
          margin: "0 0 36px",
          lineHeight: 1.25,
          zIndex: 1,
          maxWidth: "800px",
        }}
      >
        Riset Pasar & Kurs Real-Time{" "}
        <span style={{ color: "#38bdf8" }}>Dari Banyak Sumber Internet</span>
      </h2>

      {/* Real-Time Live Ticker Card */}
      <div
        style={{
          transform: `scale(${cardSpring})`,
          width: "100%",
          maxWidth: "760px",
          backgroundColor: "#ffffff",
          borderRadius: "32px",
          padding: "36px",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.4)",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          zIndex: 1,
        }}
      >
        {/* Spot FX Rate Live Display */}
        <div
          style={{
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "20px",
            padding: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>
              ● Live Spot Interbank Rate
            </div>
            <div style={{ fontSize: "40px", fontWeight: 800, color: "#14532d", margin: "4px 0" }}>
              1 USD = Rp {tickerValue.toLocaleString("id-ID")}
            </div>
            <div style={{ fontSize: "13px", color: "#15803d" }}>
              BCA e-Rate: Beli Rp 17.830 • Jual Rp 17.920
            </div>
          </div>
          <div
            style={{
              backgroundColor: "#22c55e",
              color: "#ffffff",
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: 800,
            }}
          >
            ↗
          </div>
        </div>

        {/* Multi-Source Crawling Badges */}
        <div style={{ opacity: sourcesOpacity }}>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#64748b", marginBottom: "12px" }}>
            📌 Sumber Rujukan Terverifikasi (Google Grounding & Web RSS):
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {[
              { name: "Kompas.id", icon: "📰" },
              { name: "BBC News", icon: "🌍" },
              { name: "CNBC Indonesia", icon: "📈" },
              { name: "Bank Indonesia (BI)", icon: "🏛️" },
              { name: "BCA e-Rate", icon: "💳" },
              { name: "Investing.com", icon: "📊" },
            ].map((src, i) => (
              <span
                key={i}
                style={{
                  backgroundColor: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  padding: "8px 16px",
                  borderRadius: "48px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>{src.icon}</span>
                <span>{src.name}</span>
              </span>
            ))}
          </div>
        </div>

        <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "14px", fontSize: "13.5px", color: "#64748b" }}>
          ⚡ <em>AI menyintesis fakta dan rujukan lintas media secara objektif dan akurat.</em>
        </div>
      </div>
    </div>
  );
};
