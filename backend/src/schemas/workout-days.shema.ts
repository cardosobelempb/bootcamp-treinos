import z from "zod";
import { WeekDay } from "../generated/prisma/enums.js";
import { WorkoutExerciseSchema } from "./workout-exercises.schema.js";

export const WorkoutDaySchema = z.array(
  z.object({
    name: z.string().min(1).max(100),
    weekDay: z.enum(WeekDay),
    coverImageUrl: z.string().url().optional(),
    isRest: z.boolean(),
    estimatedDurationInSeconds: z.number().int().positive().max(86400),
    exercises: WorkoutExerciseSchema,
  }),
);
