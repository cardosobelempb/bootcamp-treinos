// routes/auth.ts
import { FastifyInstance } from "fastify";
import { auth } from "../lib/auth.js";
import { fastifyToFetch, fetchToFastifyReply } from "../lib/fastifyFetch.js";

export async function authRoutes(app: FastifyInstance) {
  app.route({
    method: ["GET", "POST"],
    url: "/api/auth/*",
    async handler(request, reply) {
      try {
        const fetchRequest = fastifyToFetch(request);
        const response = await auth.handler(fetchRequest);
        await fetchToFastifyReply(reply, response);
      } catch (error) {
        app.log.error({ error }, "Authentication error");
        reply.status(500).send({
          error: "Internal authentication error",
          code: "AUTH_FAILURE",
        });
      }
    },
  });
}
