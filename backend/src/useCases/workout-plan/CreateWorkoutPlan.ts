import { WeekDay } from "@prisma/client";
import { NotFoundError } from "../../erros/index.js";
import { prisma } from "../../lib/database.js";

export interface CreateWorkoutPlanInputDTO {
  userId: string;
  name: string;
  workoutDays: {
    name: string;
    weekDay: WeekDay;
    isRest: boolean;
    estimatedDurationInSeconds: number;
    exercises: {
      order: number;
      name: string;
      sets: number;
      reps: number;
      restTimeInSeconds: number;
    }[];
  }[];
}

export interface CreateWorkoutPlanOutputDTO {
  id: string;
  name: string;
  workoutDays: {
    name: string;
    weekDay: WeekDay;
    isRest: boolean;
    estimatedDurationInSeconds: number;
    exercises: {
      order: number;
      name: string;
      sets: number;
      reps: number;
      restTimeInSeconds: number;
    }[];
  }[];
}

export class CreateWorkoutPlan {
  constructor() {}

  async execute(
    dto: CreateWorkoutPlanInputDTO,
  ): Promise<CreateWorkoutPlanOutputDTO> {
    return await prisma.$transaction(async (tx) => {
      const existingActivePlan = await tx.workoutPlan.findFirst({
        where: {
          userId: dto.userId,
          isActive: true,
        },
      });
      if (existingActivePlan) {
        await tx.workoutPlan.update({
          where: { id: existingActivePlan.id },
          data: { isActive: false },
        });
      }
      const workoutPlan = await tx.workoutPlan.create({
        data: {
          userId: dto.userId,
          name: dto.name,
          isActive: true,
          workoutDays: {
            create: dto.workoutDays.map((workout) => ({
              name: workout.name,
              weekDay: workout.weekDay,
              isRest: workout.isRest,
              estimatedDurationInSeconds: workout.estimatedDurationInSeconds,
              exercises: {
                create: workout.exercises.map((exercise) => ({
                  order: exercise.order,
                  name: exercise.name,
                  sets: exercise.sets,
                  reps: exercise.reps,
                  restTimeInSeconds: exercise.restTimeInSeconds,
                })),
              },
            })),
          },
        },
      });

      const result = await tx.workoutPlan.findUnique({
        where: { id: workoutPlan.id },
        include: {
          workoutDays: {
            include: {
              workoutExercises: true,
            },
          },
        },
      });

      if (!result) {
        throw new NotFoundError("Failed to create workout plan");
      }

      return {
        id: result.id,
        name: result.name,
        workoutDays: result.workoutDays.map((day) => ({
          name: day.name,
          weekDay: day.weekDay,
          isRest: day.isRest,
          estimatedDurationInSeconds: day.estimatedDurationInSeconds,
          exercises: day.workoutExercises.map((exercise) => ({
            order: exercise.order,
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            restTimeInSeconds: exercise.restTimeInSeconds,
          })),
        })),
      };
    });
  }
}
