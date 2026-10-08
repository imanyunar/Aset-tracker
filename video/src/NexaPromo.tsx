import React from "react";
import { Series } from "remotion";
import { SceneHook } from "./scenes/SceneHook";
import { SceneIntro } from "./scenes/SceneIntro";
import { SceneAiAgent } from "./scenes/SceneAiAgent";
import { SceneMemory } from "./scenes/SceneMemory";
import { SceneCrawler } from "./scenes/SceneCrawler";
import { SceneCta } from "./scenes/SceneCta";

export const NexaPromo: React.FC = () => {
  return (
    <div
      style={{
        flex: 1,
        width: "100%",
        height: "100%",
        backgroundColor: "#031738",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Series>
        {/* Scene 1: Problem / Hook (0s - 5s / 150 frames) */}
        <Series.Sequence durationInFrames={150}>
          <SceneHook />
        </Series.Sequence>

        {/* Scene 2: Product Reveal & Tagline (5s - 10s / 150 frames) */}
        <Series.Sequence durationInFrames={150}>
          <SceneIntro />
        </Series.Sequence>

        {/* Scene 3: WhatsApp & Web AI Chat Auto-Recorder (10s - 16s / 180 frames) */}
        <Series.Sequence durationInFrames={180}>
          <SceneAiAgent />
        </Series.Sequence>

        {/* Scene 4: Continuous Learning & Target Tracking (16s - 21s / 150 frames) */}
        <Series.Sequence durationInFrames={150}>
          <SceneMemory />
        </Series.Sequence>

        {/* Scene 5: Multi-Source Internet Economic Crawler (21s - 26s / 150 frames) */}
        <Series.Sequence durationInFrames={150}>
          <SceneCrawler />
        </Series.Sequence>

        {/* Scene 6: Call To Action & Final Branding (26s - 30s / 120 frames) */}
        <Series.Sequence durationInFrames={120}>
          <SceneCta />
        </Series.Sequence>
      </Series>
    </div>
  );
};
