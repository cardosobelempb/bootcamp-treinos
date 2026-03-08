import { prisma } from "../../lib/database.js";

export interface UpsertUserTrainDataInputDTO {
  userId: string;
  weightInGrams: number;
  heightInCentimeters: number;
  age: number;
  bodyFatPercentage: number; // 1 represents 100%
}

export interface UpsertUserTrainDataOutputDTO {
  userId: string;
  weightInGrams: number;
  heightInCentimeters: number;
  age: number;
  bodyFatPercentage: number;
}

export class UpsertUserTrainDataUseCase {
  async execute(
    dto: UpsertUserTrainDataInputDTO,
  ): Promise<UpsertUserTrainDataOutputDTO> {
    const saved = await prisma.userTrainData.upsert({
      where: { userId: dto.userId },
      create: {
        userId: dto.userId,
        weightInGrams: dto.weightInGrams,
        heightInCentimeters: dto.heightInCentimeters,
        age: dto.age,
        bodyFatPercentage: dto.bodyFatPercentage,
      },
      update: {
        weightInGrams: dto.weightInGrams,
        heightInCentimeters: dto.heightInCentimeters,
        age: dto.age,
        bodyFatPercentage: dto.bodyFatPercentage,
      },
    });

    return {
      userId: saved.userId,
      weightInGrams: saved.weightInGrams,
      heightInCentimeters: saved.heightInCentimeters,
      age: saved.age,
      bodyFatPercentage: saved.bodyFatPercentage,
    };
  }
}
