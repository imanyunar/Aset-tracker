import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

export const BackgroundGlow: React.FC<{ theme?: "dark" | "light" | "navy" }> = ({
  theme = "navy",
}) => {
  const frame = useCurrentFrame();

  const orb1X = interpolate(Math.sin(frame * 0.03), [-1, 1], [15, 85]);
  const orb1Y = interpolate(Math.cos(frame * 0.02), [-1, 1], [20, 80]);

  const orb2X = interpolate(Math.cos(frame * 0.025), [-1, 1], [80, 20]);
  const orb2Y = interpolate(Math.sin(frame * 0.035), [-1, 1], [70, 30]);

  const bgColor =
    theme === "navy"
      ? "#031738"
      : theme === "dark"
      ? "#0a0f1d"
      : "#f8fafc";

  const glowColor1 = theme === "light" ? "rgba(0, 92, 170, 0.15)" : "rgba(0, 92, 170, 0.45)";
  const glowColor2 = theme === "light" ? "rgba(24, 122, 186, 0.12)" : "rgba(56, 189, 248, 0.35)";

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: bgColor,
        overflow: "hidden",
        zIndex: 0,
      }}
    >
      {/* Orb 1 */}
      <div
        style={{
          position: "absolute",
          left: `${orb1X}%`,
          top: `${orb1Y}%`,
          width: 800,
          height: 800,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${glowColor1} 0%, rgba(0,0,0,0) 70%)`,
          filter: "blur(60px)",
        }}
      />

      {/* Orb 2 */}
      <div
        style={{
          position: "absolute",
          left: `${orb2X}%`,
          top: `${orb2Y}%`,
          width: 700,
          height: 700,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${glowColor2} 0%, rgba(0,0,0,0) 70%)`,
          filter: "blur(60px)",
        }}
      />

      {/* Subtle modern grid overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            theme === "light"
              ? "radial-gradient(#cbd5e1 1px, transparent 1px)"
              : "radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.6,
        }}
      />
    </div>
  );
};
