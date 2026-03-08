import z from "zod";
import { WorkoutDaySchema } from "./workout-days.shema.js";

export const WorkoutPlanSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(100),
  coverImageUrl: z.url().optional(),
  workoutDays: WorkoutDaySchema,
});
