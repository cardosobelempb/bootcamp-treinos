import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { NotFoundError, UnauthorizedError } from "../../erros/index.js";
import { auth } from "../../lib/auth.js";
import { prisma } from "../../lib/database.js";
import { fastifyToFetch } from "../../lib/fastifyFetch.js";
import { ErroSchema } from "../../schemas/erros.schema.js";
import { WorkoutPlanSchema } from "../../schemas/workout-plan.schema.js";
import { CreateWorkoutPlanUseCase } from "../../useCases/workout-plan/CreateWorkoutPlanUseCase.js";

export function registerPlansRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: ["POST"],
    url: "/",
    schema: {
      tags: ["Workout Plans"],
      summary: "Cria um novo plano de treino para o usuário autenticado",
      body: WorkoutPlanSchema.omit({ id: true }),
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
        const fetchRequest = fastifyToFetch(request);
        const session = await auth.api.getSession({
          headers: fetchRequest.headers,
        });

        if (!session?.user) {
          return reply
            .status(401)
            .send({ error: "Unauthorized", code: "UNAUTHORIZED" });
        }

        const createWorkoutPlan = new CreateWorkoutPlanUseCase();

        const result = await createWorkoutPlan.execute({
          userId: session.user.id,
          name: request.body.name,
          workoutDays: request.body.workoutDays,
          coverImageUrl: request.body.coverImageUrl,
        });

        return reply.status(201).send(result);
      } catch (error) {
        app.log.error({ error }, "Workout plan creation error");

        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: "Invalid request data",
            code: "INVALID_REQUEST_DATA",
          });
        } else if (error instanceof NotFoundError) {
          return reply
            .status(404)
            .send({ error: error.message, code: "WORKOUT_PLAN_NOT_FOUND" });
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

  // GET /workout-plans/:id
  app.withTypeProvider<ZodTypeProvider>().route({
    method: ["GET"],
    url: "/:id",
    schema: {
      tags: ["Workout Plans"],
      summary:
        "Retorna um plano de treino com os dias (somente exercisesCount)",
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({
          id: z.string(),
          name: z.string(),
          workoutDays: z.array(
            z.object({
              id: z.string(),
              weekDay: z.string(),
              name: z.string(),
              isRest: z.boolean(),
              coverImageUrl: z.string().nullable(),
              estimatedDurationInSeconds: z.number().int(),
              exercisesCount: z.number().int(),
            }),
          ),
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

        const plan = await prisma.workoutPlan.findUnique({
          where: { id: request.params.id },
          include: {
            workoutDays: {
              include: { _count: { select: { exercises: true } } },
            },
          },
        });

        if (!plan) {
          return reply
            .status(404)
            .send({ error: "Workout plan not found", code: "NOT_FOUND" });
        }

        if (plan.userId !== session.user.id) {
          throw new UnauthorizedError(
            "User is not the owner of the workout plan",
          );
        }

        const result = {
          id: plan.id,
          name: plan.name,
          workoutDays: plan.workoutDays.map((d) => ({
            id: d.id,
            weekDay: String(d.weekDay),
            name: d.name,
            isRest: d.isRest,
            coverImageUrl: d.coverImageUrl ?? null,
            estimatedDurationInSeconds: d.estimatedDurationInSeconds,
            exercisesCount: d._count?.exercises ?? 0,
          })),
        };

        return reply.status(200).send(result);
      } catch (error) {
        app.log.error({ error }, "Get workout plan error");

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
          error: "Failed to fetch workout plan",
          code: "FETCH_WORKOUT_PLAN_FAILED",
        });
      }
    },
  });
}
