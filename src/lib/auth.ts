import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { initializeUserDefaultWorkspace } from "@/lib/workspace-init";
import { bearer } from "better-auth/plugins";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  plugins: [bearer()],
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  trustedOrigins: [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://nexafinance-alpha.vercel.app",
    "https://nexafinance-client.vercel.app",
    "https://frontend-nine-ruby-17.vercel.app",
    "https://*.vercel.app",
  ],
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
    },
  },
  user: {
    additionalFields: {
      whatsappNumber: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await initializeUserDefaultWorkspace(user.id);
          } catch (err) {
            console.error("Failed to initialize default workspace for user:", user.id, err);
          }
        },
      },
    },
  },
});
