import z from "zod";

export const ErroSchema = z.object({
  error: z.string(),
  code: z.string(),
});
