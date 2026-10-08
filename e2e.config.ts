import type { E2EConfig } from "e2e";
import { web } from "@e2e-dev/web";
import { google } from "@ai-sdk/google";

const targetUrl = process.env.APP_URL ?? "https://nexafinance-alpha.vercel.app";

export default {
  targets: [
    {
      name: "chromium",
      engine: web({
        browser: "chromium",
        viewport: { width: 1280, height: 800 },
      }),
      app: {
        url: targetUrl,
      },
    },
  ],
  credentials: {
    demo: {
      username: "demo@nexafinance.com",
      password: process.env.DEMO_PASSWORD ?? "password123",
    },
  },
  agents: process.env.GEMINI_API_KEY
    ? {
        default: {
          model: google("gemini-2.5-flash"),
          system:
            "You are an expert QA testing agent verifying NexaFinance financial treasury application. Focus on verifying balance integrity, UI responsiveness, and correct status indicators.",
        },
      }
    : undefined,
} satisfies E2EConfig;
