import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod/v4";

export async function helloRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/",
    schema: {
      description: "Hello World route",
      tags: ["Hello World"],
      response: { 200: z.object({ message: z.string() }) },
    },
    handler: () => ({ message: "Hello World" }),
  });
}
