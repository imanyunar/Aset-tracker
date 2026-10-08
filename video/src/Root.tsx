import React from "react";
import { Composition } from "remotion";
import { NexaPromo } from "./NexaPromo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Primary: 9:16 Vertical Reel / TikTok / Shorts (1080x1920, 30s) */}
      <Composition
        id="NexaPromoVertical"
        component={NexaPromo}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* Secondary: 16:9 Landscape YouTube / Web Promo (1920x1080, 30s) */}
      <Composition
        id="NexaPromoLandscape"
        component={NexaPromo}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
