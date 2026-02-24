import { fastifyCors } from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import "dotenv/config";
import Fastify from "fastify";
import {
  ZodTypeProvider,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

import fastifyApiReference from "@scalar/fastify-api-reference";
import { authRoutes } from "./routes/auth.js";
import { helloRoutes } from "./routes/hello.js";

const PORT = Number(process.env.PORT) || 3333;

// Instância do Fastify
const app = Fastify({ logger: true });

// Compilers do Zod
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// CORS
await app.register(fastifyCors, {
  origin: ["http://localhost:3000"], // Frontend permitido
  credentials: true,
});

// Swagger / OpenAPI
await app.register(fastifySwagger, {
  openapi: {
    info: {
      title: "Bootcamp Treinos API",
      description: "API do bootcamp FSC",
      version: "1.0.0",
    },
    servers: [{ url: `http://localhost:${PORT}`, description: "Localhost" }],
  },
  transform: jsonSchemaTransform,
});

// ... depois de registrar Swagger e CORS
await app.register(fastifyApiReference, {
  routePrefix: "/docs", // rota que será usada para abrir a documentação
  configuration: {
    sources: [
      {
        title: "Bootcamp Treinos API",
        slug: "bootcamp-treinos-api",
        url: "/swagger.json", // referenciando o swagger gerado
      },
      {
        title: "Auth API",
        slug: "auth-api",
        url: "/api/auth/open-api/generate-schema", // se você tiver outro swagger de auth
      },
    ],
  },
});

// Rotas base
await helloRoutes(app);
await authRoutes(app);

// Swagger JSON route
app.withTypeProvider<ZodTypeProvider>().route({
  method: "GET",
  url: "/swagger.json",
  schema: { hide: true },
  handler: async () => app.swagger(),
});

// Start server
try {
  await app.listen({ port: PORT });
  app.log.info(`Server running at http://localhost:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
