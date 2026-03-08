import { FastifyInstance } from "fastify";
import z from "zod";
import { auth } from "../lib/auth.js";
import { fastifyToFetch } from "../lib/fastifyFetch.js";
import { ErroSchema } from "../schemas/erros.schema.js";
import { GetUserTrainDataUseCase } from "../useCases/user/GetUserTrainDataUseCase.js";

export async function registerUserTrainRoutes(app: FastifyInstance) {
  const ResponseSchema = z.object({
    userId: z.string(),
    userName: z.string(),
    weightInGrams: z.number().int(),
    heightInCentimeters: z.number().int(),
    age: z.number().int(),
    bodyFatPercentage: z.number(),
  });

  app.withTypeProvider<any>().route({
    method: "GET",
    url: "/me",
    schema: {
      tags: ["User"],
      summary: "Retorna os dados de treino do usuário autenticado (ou null)",
      response: {
        200: z.nullable(ResponseSchema),
        401: ErroSchema,
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

        const useCase = new GetUserTrainDataUseCase();
        const result = await useCase.execute(session.user.id);

        return reply.status(200).send(result);
      } catch (error) {
        app.log.error({ error }, "Get user train data error");
        return reply.status(500).send({
          error: "Failed to get user train data",
          code: "GET_USER_TRAIN_DATA_FAILED",
        });
      }
    },
  });
}

export default registerUserTrainRoutes;
