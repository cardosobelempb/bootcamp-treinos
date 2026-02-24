// Import the framework and instantiate it
import "dotenv/config";
import Fastify from "fastify";

import { z } from "zod/v4";

import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";

const app = Fastify({
  logger: true,
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

const PORT = Number(process.env.PORT || 3333);

app.withTypeProvider<ZodTypeProvider>().route({
  method: "GET",
  url: "/",
  schema: {
    description: "Returns a greeting message",
    tags: ["greeting"],
    response: {
      200: z.object({
        message: z.string(),
      }),
    },
  },
  handler: async (request, reply) => {
    return { message: "Hello, world!" };
  },
});

// Run the server!
try {
  await app.listen({ port: PORT });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
