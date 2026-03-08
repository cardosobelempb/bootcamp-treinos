// routes/auth.ts
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { NotFoundError } from "../erros/index.js";
import { auth } from "../lib/auth.js";
import { fastifyToFetch } from "../lib/fastifyFetch.js";
import { ErroSchema } from "../schemas/erros.schema.js";
import { WorkoutPlanSchema } from "../schemas/workout-plan.schema.js";
import { CreateWorkoutPlanUseCase } from "../useCases/workout-plan/CreateWorkoutPlanUseCase.js";

export async function workoutPlansRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: ["POST"],
    url: "/",
    schema: {
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
}
