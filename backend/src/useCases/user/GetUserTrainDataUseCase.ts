import { prisma } from "../../lib/database.js";

export interface GetUserTrainDataOutputDTO {
  userId: string;
  userName: string;
  weightInGrams: number;
  heightInCentimeters: number;
  age: number;
  bodyFatPercentage: number; // 1 represents 100%
}

export class GetUserTrainDataUseCase {
  async execute(userId: string): Promise<GetUserTrainDataOutputDTO | null> {
    const record = await prisma.userTrainData.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!record) return null;

    return {
      userId: record.userId,
      userName: record.user.name,
      weightInGrams: record.weightInGrams,
      heightInCentimeters: record.heightInCentimeters,
      age: record.age,
      bodyFatPercentage: record.bodyFatPercentage,
    };
  }
}
