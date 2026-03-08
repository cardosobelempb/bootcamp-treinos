import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import {
  NotFoundError,
  SessionAlreadyStartedError,
  UnauthorizedError,
  WorkoutPlanNotActiveError,
} from "../../erros/index.js";
import { auth } from "../../lib/auth.js";
import { fastifyToFetch } from "../../lib/fastifyFetch.js";
import { ErroSchema } from "../../schemas/erros.schema.js";
import { StartWorkoutSessionUseCase } from "../../useCases/workout-plan/StartWorkoutSessionUseCase.js";
import { UpdateWorkoutSessionUseCase } from "../../useCases/workout-plan/UpdateWorkoutSessionUseCase.js";

export function registerSessionsRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: ["POST"],
    url: "/:id/days/:dayId/sessions",
    schema: {
      tags: ["Workout Plans"],
      summary: "Inicia uma sessão de treino para um dia específico do plano",
      params: z.object({ id: z.string().uuid(), dayId: z.string().uuid() }),
      response: {
        201: z.object({ userWorkoutSessionId: z.string() }),
        400: ErroSchema,
        401: ErroSchema,
        403: ErroSchema,
        404: ErroSchema,
        409: ErroSchema,
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

        const startUseCase = new StartWorkoutSessionUseCase();

        const result = await startUseCase.execute({
          userId: session.user.id,
          workoutPlanId: request.params.id,
          workoutDayId: request.params.dayId,
        });

        return reply.status(201).send(result);
      } catch (error) {
        app.log.error({ error }, "Start workout session error");

        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: "Invalid request data",
            code: "INVALID_REQUEST_DATA",
          });
        } else if (error instanceof NotFoundError) {
          return reply
            .status(404)
            .send({ error: error.message, code: "NOT_FOUND" });
        } else if (error instanceof UnauthorizedError) {
          return reply
            .status(403)
            .send({ error: error.message, code: "FORBIDDEN" });
        } else if (error instanceof WorkoutPlanNotActiveError) {
          return reply
            .status(409)
            .send({ error: error.message, code: "WORKOUT_PLAN_NOT_ACTIVE" });
        } else if (error instanceof SessionAlreadyStartedError) {
          return reply
            .status(409)
            .send({ error: error.message, code: "SESSION_ALREADY_STARTED" });
        }

        return reply.status(500).send({
          error: "Failed to start session",
          code: "START_SESSION_FAILED",
        });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: ["PATCH"],
    url: "/:id/days/:dayId/sessions/:sessionId",
    schema: {
      tags: ["Workout Plans"],
      summary:
        "Atualiza uma sessão de treino específica (por ex. marcar completedAt)",
      params: z.object({
        id: z.string().uuid(),
        dayId: z.string().uuid(),
        sessionId: z.string().uuid(),
      }),
      body: z.object({ completedAt: z.string().optional() }),
      response: {
        200: z.object({
          id: z.string(),
          startedAt: z.string().nullable(),
          completedAt: z.string().nullable(),
        }),
        400: ErroSchema,
        401: ErroSchema,
        403: ErroSchema,
        404: ErroSchema,
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

        const updateUseCase = new UpdateWorkoutSessionUseCase();

        const result = await updateUseCase.execute({
          userId: session.user.id,
          workoutPlanId: request.params.id,
          workoutDayId: request.params.dayId,
          sessionId: request.params.sessionId,
          completedAt: request.body.completedAt ?? null,
        });

        return reply.status(200).send({
          id: result.id,
          startedAt: result.startedAt ? result.startedAt.toISOString() : null,
          completedAt: result.completedAt
            ? result.completedAt.toISOString()
            : null,
        });
      } catch (error) {
        app.log.error({ error }, "Update workout session error");

        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: "Invalid request data",
            code: "INVALID_REQUEST_DATA",
          });
        } else if (error instanceof NotFoundError) {
          return reply
            .status(404)
            .send({ error: error.message, code: "NOT_FOUND" });
        } else if (error instanceof UnauthorizedError) {
          return reply
            .status(403)
            .send({ error: error.message, code: "FORBIDDEN" });
        }

        return reply.status(500).send({
          error: "Failed to update session",
          code: "UPDATE_SESSION_FAILED",
        });
      }
    },
  });
}
