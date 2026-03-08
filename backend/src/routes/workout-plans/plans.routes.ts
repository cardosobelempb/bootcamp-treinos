import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { NotFoundError, UnauthorizedError } from "../../erros/index.js";
import { WeekDay } from "../../generated/prisma/enums.js";
import { auth } from "../../lib/auth.js";
import { prisma } from "../../lib/database.js";
import { fastifyToFetch } from "../../lib/fastifyFetch.js";
import { ErroSchema } from "../../schemas/erros.schema.js";
import { WorkoutPlanSchema } from "../../schemas/workout-plan.schema.js";
import { CreateWorkoutPlanUseCase } from "../../useCases/workout-plan/CreateWorkoutPlanUseCase.js";
type WeekDayType = (typeof WeekDay)[keyof typeof WeekDay];

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

  // GET /workout-plans/:id/days/:dayId
  app.withTypeProvider<ZodTypeProvider>().route({
    method: ["GET"],
    url: "/:id/days/:dayId",
    schema: {
      tags: ["Workout Plans"],
      summary: "Retorna um dia de treino com exercícios e sessões",
      params: z.object({ id: z.string().uuid(), dayId: z.string().uuid() }),
      response: {
        200: z.object({
          id: z.string(),
          name: z.string(),
          isRest: z.boolean(),
          coverImageUrl: z.string().nullable(),
          estimatedDurationInSeconds: z.number().int(),
          exercises: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              order: z.number().int(),
              sets: z.number().int(),
              reps: z.number().int(),
              restTimeInSeconds: z.number().int(),
              workoutDayId: z.string(),
            }),
          ),
          weekDay: z.enum(WeekDay),
          sessions: z.array(
            z.object({
              id: z.string(),
              workoutDayId: z.string(),
              startedAt: z.string().nullable(),
              completedAt: z.string().nullable(),
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

        const day = await prisma.workoutDay.findUnique({
          where: { id: request.params.dayId },
          include: { workoutPlan: true, exercises: true, sessions: true },
        });

        if (!day) {
          return reply
            .status(404)
            .send({ error: "Workout day not found", code: "NOT_FOUND" });
        }

        if (day.workoutPlan.id !== request.params.id) {
          return reply.status(404).send({
            error: "Workout plan or day not found",
            code: "NOT_FOUND",
          });
        }

        if (day.workoutPlan.userId !== session.user.id) {
          return reply
            .status(403)
            .send({ error: "Forbidden", code: "FORBIDDEN" });
        }

        const result = {
          id: day.id,
          name: day.name,
          isRest: day.isRest,
          coverImageUrl: day.coverImageUrl ?? null,
          estimatedDurationInSeconds: day.estimatedDurationInSeconds,
          exercises: day.exercises.map((e) => ({
            id: e.id,
            name: e.name,
            order: e.order,
            sets: e.sets,
            reps: e.reps,
            restTimeInSeconds: e.restTimeInSeconds,
            workoutDayId: e.workoutDayId,
          })),
          weekDay: day.weekDay as WeekDayType,
          sessions: day.sessions.map((s) => ({
            id: s.id,
            workoutDayId: s.workoutDayId,
            startedAt: s.startedAt ? s.startedAt.toISOString() : null,
            completedAt: s.completedAt ? s.completedAt.toISOString() : null,
          })),
        };

        return reply.status(200).send(result);
      } catch (error) {
        app.log.error({ error }, "Get workout day error");
        return reply.status(500).send({
          error: "Failed to fetch workout day",
          code: "FETCH_WORKOUT_DAY_FAILED",
        });
      }
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
              weekDay: z.enum(WeekDay),
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
            weekDay: d.weekDay as WeekDayType,
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
