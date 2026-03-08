import { NotFoundError, UnauthorizedError } from "../../erros/index.js";
import { prisma } from "../../lib/database.js";

export interface UpdateWorkoutSessionInputDTO {
  userId: string;
  workoutPlanId: string;
  workoutDayId: string;
  sessionId: string;
  completedAt: string | null; // ISO string or null to clear
}

export interface UpdateWorkoutSessionOutputDTO {
  id: string;
  startedAt: Date | null;
  completedAt: Date | null;
}

export class UpdateWorkoutSessionUseCase {
  async execute(
    dto: UpdateWorkoutSessionInputDTO,
  ): Promise<UpdateWorkoutSessionOutputDTO> {
    return prisma.$transaction(async (tx) => {
      // 1. Buscar a sessão com o dia e o plano relacionados
      const session = await tx.workoutSession.findUnique({
        where: { id: dto.sessionId },
        include: { workoutDay: { include: { workoutPlan: true } } },
      });

      if (!session) {
        throw new NotFoundError("Workout session not found");
      }

      // 2. Verificar que o dia pertence ao plano informado
      if (session.workoutDay.id !== dto.workoutDayId) {
        throw new NotFoundError("WorkoutPlan or WorkoutDay not found");
      }

      if (session.workoutDay.workoutPlan.id !== dto.workoutPlanId) {
        throw new NotFoundError("WorkoutPlan or WorkoutDay not found");
      }

      // 3. Verificar se o usuário é o dono do plano
      if (session.workoutDay.workoutPlan.userId !== dto.userId) {
        throw new UnauthorizedError(
          "User is not the owner of the workout plan",
        );
      }

      // 4. Atualizar a sessão
      const completedDate = dto.completedAt ? new Date(dto.completedAt) : null;

      let durationInSeconds = session.durationInSeconds ?? 0;
      if (completedDate && session.startedAt) {
        const diff = Math.max(
          0,
          Math.round(
            (completedDate.getTime() - session.startedAt.getTime()) / 1000,
          ),
        );
        durationInSeconds = diff;
      }

      const updated = await tx.workoutSession.update({
        where: { id: dto.sessionId },
        data: {
          completedAt: completedDate,
          durationInSeconds,
        },
      });

      return {
        id: updated.id,
        startedAt: updated.startedAt,
        completedAt: updated.completedAt,
      };
    });
  }
}
