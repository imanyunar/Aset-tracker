import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BackgroundGlow } from "../components/BackgroundGlow";
import { BrandLogo } from "../components/BrandLogo";

export const SceneIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 120 },
  });

  const titleOpacity = interpolate(frame, [15, 35], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(frame, [15, 35], [40, 0], {
    extrapolateRight: "clamp",
  });

  const pillsOpacity = interpolate(frame, [40, 65], [0, 1], {
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

      {/* Hero Brand Icon with animated glow */}
      <div
        style={{
          transform: `scale(${logoSpring})`,
          marginBottom: "36px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "180px",
            height: "180px",
            left: "-18px",
            top: "-18px",
            borderRadius: "50%",
            background: "radial-gradient(circle, #005caa 0%, rgba(0,92,170,0) 70%)",
            filter: "blur(20px)",
            opacity: 0.8,
          }}
        />
        <BrandLogo size={144} />
      </div>

      {/* Main Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          textAlign: "center",
          zIndex: 1,
        }}
      >
        <h1
          style={{
            fontSize: "76px",
            fontWeight: 800,
            margin: "0 0 16px",
            color: "#ffffff",
            letterSpacing: "-1px",
          }}
        >
          NexaFinance
        </h1>
        <p
          style={{
            fontSize: "30px",
            fontWeight: 600,
            margin: "0 0 36px",
            color: "#38bdf8",
            letterSpacing: "0.5px",
          }}
        >
          The Autonomous AI Financial OS
        </p>
      </div>

      {/* Feature Badges in 48px BCA pill styles */}
      <div
        style={{
          opacity: pillsOpacity,
          display: "flex",
          flexWrap: "wrap",
          gap: "14px",
          justifyContent: "center",
          maxWidth: "760px",
          zIndex: 1,
        }}
      >
        {[
          { icon: "🤖", text: "Autonomous Agent" },
          { icon: "⚡", text: "WhatsApp Interactive Bot" },
          { icon: "🧠", text: "Continuous Learning" },
          { icon: "🌐", text: "Multi-Source Web Crawler" },
          { icon: "🏦", text: "Multi-Rekening BCA & Kas" },
        ].map((pill, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(12px)",
              padding: "14px 28px",
              borderRadius: "48px",
              color: "#ffffff",
              fontSize: "22px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
            }}
          >
            <span>{pill.icon}</span>
            <span>{pill.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
