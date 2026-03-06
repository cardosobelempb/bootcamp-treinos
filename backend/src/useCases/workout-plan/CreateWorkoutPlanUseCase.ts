import { WeekDay } from "@prisma/client";
import { NotFoundError } from "../../erros/index.js";
import { prisma } from "../../lib/database.js";

/**
 * DTO de entrada
 */
export interface CreateWorkoutPlanInputDTO {
  userId: string;
  name: string;
  workoutDays: WorkoutDayInput[];
}

/**
 * DTO de saída
 */
export interface CreateWorkoutPlanOutputDTO {
  id: string;
  name: string;
  workoutDays: WorkoutDayOutput[];
}

/**
 * Tipos auxiliares para evitar repetição
 */
interface WorkoutDayInput {
  name: string;
  weekDay: WeekDay;
  isRest: boolean;
  estimatedDurationInSeconds: number;
  exercises: ExerciseInput[];
}

interface ExerciseInput {
  order: number;
  name: string;
  sets: number;
  reps: number;
  restTimeInSeconds: number;
}

interface WorkoutDayOutput extends WorkoutDayInput {}
interface ExerciseOutput extends ExerciseInput {}

export class CreateWorkoutPlanUseCase {
  /**
   * Método principal de execução
   */
  async execute(
    dto: CreateWorkoutPlanInputDTO,
  ): Promise<CreateWorkoutPlanOutputDTO> {
    return prisma.$transaction(async (tx) => {
      // 1️⃣ Garantir que só exista um plano ativo
      await this.deactivateExistingPlan(tx, dto.userId);

      // 2️⃣ Criar novo plano já retornando relações
      const createdPlan = await tx.workoutPlan.create({
        data: this.mapToPersistence(dto),
        include: {
          workoutDays: {
            include: {
              exercises: true,
            },
          },
        },
      });

      if (!createdPlan) {
        throw new NotFoundError("Failed to create workout plan");
      }

      // 3️⃣ Mapear para DTO de saída
      return this.mapToOutput(createdPlan);
    });
  }

  /**
   * Regra de negócio:
   * Um usuário só pode ter um plano ativo.
   */
  private async deactivateExistingPlan(tx: any, userId: string) {
    const existingActivePlan = await tx.workoutPlan.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

    if (existingActivePlan) {
      await tx.workoutPlan.update({
        where: { id: existingActivePlan.id },
        data: { isActive: false },
      });
    }
  }

  /**
   * Mapeia DTO de entrada para formato do Prisma
   */
  private mapToPersistence(dto: CreateWorkoutPlanInputDTO) {
    return {
      id: crypto.randomUUID(),
      userId: dto.userId,
      name: dto.name,
      isActive: true,
      workoutDays: {
        create: dto.workoutDays.map((day) => ({
          name: day.name,
          weekDay: day.weekDay,
          isRest: day.isRest,
          estimatedDurationInSeconds: day.estimatedDurationInSeconds,
          exercises: {
            create: day.exercises.map((exercise) => ({
              order: exercise.order,
              name: exercise.name,
              sets: exercise.sets,
              reps: exercise.reps,
              restTimeInSeconds: exercise.restTimeInSeconds,
            })),
          },
        })),
      },
    };
  }

  /**
   * Mapeia entidade do banco para DTO de saída
   */
  private mapToOutput(plan: any): CreateWorkoutPlanOutputDTO {
    return {
      id: plan.id,
      name: plan.name,
      workoutDays: (plan.workoutDays ?? []).map((day: any) => ({
        name: day.name,
        weekDay: day.weekDay,
        isRest: day.isRest,
        estimatedDurationInSeconds: day.estimatedDurationInSeconds,
        exercises: (day.workoutExercises ?? []).map((exercise: any) => ({
          order: exercise.order,
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          restTimeInSeconds: exercise.restTimeInSeconds,
        })),
      })),
    };
  }
}
