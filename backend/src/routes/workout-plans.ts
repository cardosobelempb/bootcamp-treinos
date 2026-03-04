// routes/auth.ts
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { NotFoundError } from "../erros/index.js";
import { WeekDay } from "../generated/prisma/enums.js";
import { auth } from "../lib/auth.js";
import { fastifyToFetch } from "../lib/fastifyFetch.js";
import { CreateWorkoutPlan } from "../useCases/workout-plan/CreateWorkoutPlan.js";

export async function workoutPlansRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: ["POST"],
    url: "/api/workout-plans",
    schema: {
      body: z.object({
        name: z.string().min(1).max(100),
        workoutDays: z.array(
          z.object({
            name: z.string().min(1).max(100),
            weekDay: z.enum(WeekDay),
            isRest: z.boolean().default(false),
            estimatedDurationInSeconds: z.number().int().positive().max(1440),
            exercises: z.array(
              z.object({
                name: z.string().min(1).max(100),
                order: z.number().int().min(0),
                sets: z.number().int().min(0),
                reps: z.number().int().min(0),
                restTimeInSeconds: z.number().int().min(0),
              }),
            ),
          }),
        ),
      }),
      response: {
        201: z.object({
          id: z.string().uuid(),
          name: z.string(),
          workoutDays: z.array(z.any()),
        }),
        400: z.object({
          error: z.string(),
          code: z.string(),
        }),
        401: z.object({
          error: z.string(),
          code: z.string(),
        }),
        404: z.object({
          error: z.string(),
          code: z.string(),
        }),
        500: z.object({
          error: z.string(),
          code: z.string(),
        }),
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

        const createWorkoutPlan = new CreateWorkoutPlan();

        const result = await createWorkoutPlan.execute({
          userId: session.user.id,
          name: request.body.name,
          workoutDays: request.body.workoutDays,
        });

        return reply.status(201).send({
          id: result.id,
          name: result.name,
          workoutDays: result.workoutDays,
        });
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
}
