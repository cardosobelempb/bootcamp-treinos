// Import the framework and instantiate it
import "dotenv/config";
import Fastify from "fastify";

const fastify = Fastify({
  logger: true,
});

const PORT = Number(process.env.PORT || 3333);

// Declare a route
fastify.get("/", async function handler(request, reply) {
  return { hello: "world" };
});

// Run the server!
try {
  await fastify.listen({ port: PORT });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
