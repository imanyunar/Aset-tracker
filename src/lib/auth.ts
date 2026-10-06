import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { initializeUserDefaultWorkspace } from "@/lib/workspace-init";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
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
