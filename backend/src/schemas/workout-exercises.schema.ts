import z from "zod";

export const WorkoutExerciseSchema = z.array(
  z.object({
    name: z.string().min(1).max(100),
    order: z.number().int().min(0),
    sets: z.number().int().min(0),
    reps: z.number().int().min(0),
    restTimeInSeconds: z.number().int().min(0),
  }),
);
