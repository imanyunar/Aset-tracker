import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BackgroundGlow } from "../components/BackgroundGlow";

export const SceneMemory: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const containerSpring = spring({ frame, fps, config: { damping: 14 } });

  // Progress Bar Animation (0% to 75%)
  const progressPercent = interpolate(frame, [20, 80], [0, 75], {
    extrapolateRight: "clamp",
  });

  const currentSaved = Math.round(
    interpolate(frame, [20, 80], [0, 15000000], { extrapolateRight: "clamp" })
  );

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
          backgroundColor: "rgba(168, 85, 247, 0.15)",
          border: "1px solid rgba(168, 85, 247, 0.4)",
          padding: "8px 24px",
          borderRadius: "48px",
          color: "#c084fc",
          fontSize: "22px",
          fontWeight: 700,
          marginBottom: "20px",
          zIndex: 1,
        }}
      >
        🧠 Continuous Learning & Memory Synthesis
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
        AI yang Mengingat Target &{" "}
        <span style={{ color: "#c084fc" }}>Evaluasi Kas Otomatis</span>
      </h2>

      {/* Main Glassmorphic Card */}
      <div
        style={{
          transform: `scale(${containerSpring})`,
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
        {/* Memory Item 1: Goal Tracker */}
        <div
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "20px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "28px" }}>🎯</span>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#0f172a" }}>
                  Target: Dana Darurat Mandiri & BCA
                </div>
                <div style={{ fontSize: "14px", color: "#64748b" }}>
                  Mengingat instruksi: &quot;Target saya kumpulin 20 juta&quot;
                </div>
              </div>
            </div>
            <span
              style={{
                backgroundColor: "#e8f2fa",
                color: "#005caa",
                padding: "6px 14px",
                borderRadius: "48px",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              {Math.round(progressPercent)}% On Track
            </span>
          </div>

          {/* Progress Bar Container */}
          <div
            style={{
              height: "16px",
              backgroundColor: "#e2e8f0",
              borderRadius: "48px",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPercent}%`,
                background: "linear-gradient(90deg, #005caa 0%, #38bdf8 100%)",
                borderRadius: "48px",
                transition: "width 0.1s ease",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px" }}>
            <span style={{ color: "#64748b", fontWeight: 600 }}>Terkumpul:</span>
            <span style={{ fontWeight: 800, color: "#005caa" }}>
              Rp {currentSaved.toLocaleString("id-ID")} / Rp 20.000.000
            </span>
          </div>
        </div>

        {/* Memory Item 2: Financial Rule */}
        <div
          style={{
            backgroundColor: "#faf5ff",
            border: "1px solid #e9d5ff",
            borderRadius: "20px",
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "26px" }}>⚡</span>
            <div>
              <div style={{ fontSize: "17px", fontWeight: 700, color: "#6b21a8" }}>
                Aturan Finansial Aktif
              </div>
              <div style={{ fontSize: "13.5px", color: "#7e22ce" }}>
                Peringatkan jika pengeluaran tersier &gt; 30% dari pemasukan
              </div>
            </div>
          </div>
          <span
            style={{
              backgroundColor: "#f3e8ff",
              color: "#7e22ce",
              padding: "4px 12px",
              borderRadius: "48px",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            Sentinel Active
          </span>
        </div>

        {/* Total Liquidity Snapshot */}
        <div
          style={{
            borderTop: "1px solid #f1f5f9",
            paddingTop: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "14px", color: "#64748b", fontWeight: 600 }}>
            Total Likuiditas Terpantau (Neon Cloud):
          </span>
          <span style={{ fontSize: "22px", fontWeight: 800, color: "#005caa" }}>
            Rp 45.850.000
          </span>
        </div>
      </div>
    </div>
  );
};
