// routes/auth.ts
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import {
  NotFoundError,
  SessionAlreadyStartedError,
  UnauthorizedError,
  WorkoutPlanNotActiveError,
} from "../erros/index.js";
import { auth } from "../lib/auth.js";
import { fastifyToFetch } from "../lib/fastifyFetch.js";
import { ErroSchema } from "../schemas/erros.schema.js";
import { WorkoutPlanSchema } from "../schemas/workout-plan.schema.js";
import { CreateWorkoutPlanUseCase } from "../useCases/workout-plan/CreateWorkoutPlanUseCase.js";
import { StartWorkoutSessionUseCase } from "../useCases/workout-plan/StartWorkoutSessionUseCase.js";

export async function workoutPlansRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: ["POST"],
    url: "/",
    schema: {
      tags: ["Workout Plans"],
      summary: "Cria um novo plano de treino para o usuário autenticado",
      body: WorkoutPlanSchema.omit({ id: true }), // Permite omitir o ID no corpo da requisição
      response: {
        201: WorkoutPlanSchema,
        400: ErroSchema,
        401: ErroSchema,
        404: ErroSchema,
        500: ErroSchema,
      },
    },

    async handler(request, reply) {
      try {
        // 🔥 Converte Fastify → Fetch (mesmo padrão do authRoutes)
        const fetchRequest = fastifyToFetch(request);

        // 🔥 Usa headers do Fetch diretamente
        const session = await auth.api.getSession({
          headers: fetchRequest.headers,
        });

        if (!session?.user) {
          return reply.status(401).send({
            error: "Unauthorized",
            code: "UNAUTHORIZED",
          });
        }

        const createWorkoutPlan = new CreateWorkoutPlanUseCase();

        const result = await createWorkoutPlan.execute({
          userId: session.user.id,
          name: request.body.name,
          workoutDays: request.body.workoutDays,
          coverImageUrl: request.body.coverImageUrl,
        });

        // Retorna o DTO de saída diretamente
        return reply.status(201).send(result);
      } catch (error) {
        app.log.error({ error }, "Workout plan creation error");

        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: "Invalid request data",
            code: "INVALID_REQUEST_DATA",
          });
        } else if (error instanceof NotFoundError) {
          return reply.status(404).send({
            error: error.message,
            code: "WORKOUT_PLAN_NOT_FOUND",
          });
        }

        return reply.status(500).send({
          error: "Failed to create workout plan",
          code: "WORKOUT_PLAN_CREATION_FAILED",
        });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: ["GET"],
    url: "/",
    schema: {
      tags: ["Workout Plans"],
      summary: "Lista os planos de treino do usuário autenticado",
      response: {
        200: z.array(WorkoutPlanSchema),
        401: ErroSchema,
        500: ErroSchema,
      },
    },
    async handler(request, reply) {
      // Implementation for fetching workout plans
    },
  });

  // POST /workout-plans/:id/days/:dayId/sessions
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
}
