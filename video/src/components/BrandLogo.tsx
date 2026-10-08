import React from "react";

export const BrandLogo: React.FC<{ size?: number; color?: string }> = ({
  size = 64,
  color = "#ffffff",
}) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.35,
        backgroundColor: "#005caa",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 10px 30px rgba(0, 92, 170, 0.4)",
      }}
    >
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    </div>
  );
};
