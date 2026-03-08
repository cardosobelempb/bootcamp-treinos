import {
  NotFoundError,
  SessionAlreadyStartedError,
  UnauthorizedError,
  WorkoutPlanNotActiveError,
} from "../../erros/index.js";
import { prisma } from "../../lib/database.js";

export interface StartWorkoutSessionInputDTO {
  userId: string;
  workoutPlanId: string;
  workoutDayId: string;
}

export interface StartWorkoutSessionOutputDTO {
  userWorkoutSessionId: string;
}

export class StartWorkoutSessionUseCase {
  async execute(
    dto: StartWorkoutSessionInputDTO,
  ): Promise<StartWorkoutSessionOutputDTO> {
    return prisma.$transaction(async (tx) => {
      // 1. Buscar o dia com o plano relacionado
      const day = await tx.workoutDay.findUnique({
        where: { id: dto.workoutDayId },
        include: { workoutPlan: true },
      });

      if (!day) {
        throw new NotFoundError("WorkoutDay not found");
      }

      // 2. Verificar que o dia pertence ao plano informado
      if (day.workoutPlan.id !== dto.workoutPlanId) {
        throw new NotFoundError("WorkoutPlan or WorkoutDay not found");
      }

      // 3. Verificar se o usuário é o dono do plano
      if (day.workoutPlan.userId !== dto.userId) {
        throw new UnauthorizedError(
          "User is not the owner of the workout plan",
        );
      }

      // 4. Verificar se o plano está ativo
      if (!day.workoutPlan.isActive) {
        throw new WorkoutPlanNotActiveError("Workout plan is not active");
      }

      // 5. Verificar se já existe uma sessão iniciada para este dia (startedAt presente and not completed)
      const existingSession = await tx.workoutSession.findFirst({
        where: {
          workoutDayId: dto.workoutDayId,
          completedAt: null,
        },
      });

      if (existingSession) {
        throw new SessionAlreadyStartedError(
          "Workout session already started for this day",
        );
      }

      // 6. Criar a sessão
      const created = await tx.workoutSession.create({
        data: {
          workoutDayId: dto.workoutDayId,
          startedAt: new Date(),
          durationInSeconds: 0,
        },
      });

      return { userWorkoutSessionId: created.id };
    });
  }
}
