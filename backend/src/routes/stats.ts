import { FastifyInstance } from "fastify";
import z from "zod";
import { auth } from "../lib/auth.js";
import { fastifyToFetch } from "../lib/fastifyFetch.js";
import { ErroSchema } from "../schemas/erros.schema.js";
import { GetStats } from "../useCases/workout-plan/GetStatsUseCase.js";

export async function registerStatsRoutes(app: FastifyInstance) {
  const QuerySchema = z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  });

  app.withTypeProvider<any>().route({
    method: ["GET"],
    url: "/",
    schema: {
      tags: ["Stats"],
      summary: "Retorna estatísticas do usuário entre from e to",
      querystring: QuerySchema,
      response: {
        200: z.object({
          workoutStreak: z.number().int(),
          consistencyByDay: z.record(
            z.string(),
            z.object({
              workoutDayCompleted: z.boolean(),
              workoutDayStarted: z.boolean(),
            }),
          ),
          completedWorkoutsCount: z.number().int(),
          conclusionRate: z.number(),
          totalTimeInSeconds: z.number().int(),
        }),
        400: ErroSchema,
        401: ErroSchema,
        500: ErroSchema,
      },
    },
    async handler(request, reply) {
      try {
        const fetchRequest = fastifyToFetch(request);
        const session = await auth.api.getSession({
          headers: fetchRequest.headers,
        });

        if (!session?.user) {
          return reply
            .status(401)
            .send({ error: "Unauthorized", code: "UNAUTHORIZED" });
        }

        const dto = QuerySchema.parse(request.query);

        const useCase = new GetStats();
        const result = await useCase.execute({
          userId: session.user.id,
          from: dto.from,
          to: dto.to,
        });

        return reply.status(200).send(result);
      } catch (error) {
        app.log.error({ error }, "Get stats error");
        return reply
          .status(500)
          .send({ error: "Failed to get stats", code: "GET_STATS_FAILED" });
      }
    },
  });
}

export default registerStatsRoutes;
