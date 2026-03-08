import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { auth } from "../../lib/auth.js";
import { fastifyToFetch } from "../../lib/fastifyFetch.js";
import { ErroSchema } from "../../schemas/erros.schema.js";
import { GetHomeDataUseCase } from "../../useCases/workout-plan/GetHomeDataUseCase.js";

export function registerHomeRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: ["GET"],
    url: "/home/:date",
    schema: {
      tags: ["Workout Plans"],
      summary: "Dados para a página inicial do usuário",
      params: z.object({ date: z.string() }),
      response: {
        200: z.object({
          activeWorkoutPlanId: z.string().nullable(),
          todayWorkoutDay: z
            .object({
              workoutPlanId: z.string(),
              id: z.string(),
              name: z.string(),
              isRest: z.boolean(),
              weekDay: z.string(),
              estimatedDurationInSeconds: z.number().int(),
              coverImageUrl: z.string().nullable(),
              exercisesCount: z.number().int(),
            })
            .nullable(),
          workoutStreak: z.number().int(),
          consistencyByDay: z.record(
            z.string(),
            z.object({
              workoutDayCompleted: z.boolean(),
              workoutDayStarted: z.boolean(),
            }),
          ),
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

        const useCase = new GetHomeDataUseCase();
        const result = await useCase.execute({
          userId: session.user.id,
          date: request.params.date,
        });

        return reply.status(200).send(result);
      } catch (error) {
        app.log.error({ error }, "Get home data error");
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: "Invalid request data",
            code: "INVALID_REQUEST_DATA",
          });
        }

        return reply
          .status(500)
          .send({ error: "Failed to get home data", code: "GET_HOME_FAILED" });
      }
    },
  });
}
