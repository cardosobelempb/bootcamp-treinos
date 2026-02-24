// auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { openAPI } from "better-auth/plugins";

import { env } from "../utils/env.js";
import { prisma } from "./database.js";

/**
 * Configuração central de autenticação.
 * Responsável apenas por configurar o provider.
 */
export const auth = betterAuth({
  // Origens confiáveis para cookies e segurança
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:5173", // Vite (corrige seu erro de cookie)
  ],

  emailAndPassword: {
    enabled: true,
  },

  // Segurança
  secret: env.BETTER_AUTH_SECRET,
  url: env.BETTER_AUTH_URL,

  // Integração com banco via Prisma
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  plugins: [openAPI()],
});
