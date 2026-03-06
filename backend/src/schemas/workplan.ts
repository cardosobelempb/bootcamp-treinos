import z from "zod";
import { WeekDay } from "../generated/prisma/enums.js";

export const WorkoutPlanSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(100),
  workoutDays: z.array(
    z.object({
      name: z.string().min(1).max(100),
      weekDay: z.enum(WeekDay),
      isRest: z.boolean(),
      estimatedDurationInSeconds: z.number().int().positive().max(86400),
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
});
