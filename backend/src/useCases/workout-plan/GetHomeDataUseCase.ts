import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import { WeekDay } from "../../generated/prisma/enums.js";
import { prisma } from "../../lib/database.js";

dayjs.extend(utc);

export interface GetHomeDataInputDTO {
  userId: string;
  date: string; // YYYY-MM-DD
}

export interface GetHomeDataOutputDTO {
  activeWorkoutPlanId: string | null;
  todayWorkoutDay: {
    workoutPlanId: string;
    id: string;
    name: string;
    isRest: boolean;
    weekDay: string;
    estimatedDurationInSeconds: number;
    coverImageUrl: string | null;
    exercisesCount: number;
  } | null;
  workoutStreak: number;
  consistencyByDay: Record<
    string,
    { workoutDayCompleted: boolean; workoutDayStarted: boolean }
  >;
}

export class GetHomeDataUseCase {
  async execute(dto: GetHomeDataInputDTO): Promise<GetHomeDataOutputDTO> {
    const target = dayjs.utc(dto.date, "YYYY-MM-DD");
    if (!target.isValid()) {
      throw new Error("Invalid date");
    }

    const weekStart = target.subtract(target.day(), "day").startOf("day");
    const weekEnd = weekStart.add(6, "day").endOf("day");

    // 1. Buscar plano ativo do usuário
    const activePlan = await prisma.workoutPlan.findFirst({
      where: { userId: dto.userId, isActive: true },
      include: { workoutDays: true },
      orderBy: { createdAt: "desc" },
    });

    if (!activePlan) {
      // montar estrutura vazia
      const consistencyByDay: Record<
        string,
        { workoutDayCompleted: boolean; workoutDayStarted: boolean }
      > = {};
      for (let i = 0; i < 7; i++) {
        const d = weekStart.add(i, "day").format("YYYY-MM-DD");
        consistencyByDay[d] = {
          workoutDayCompleted: false,
          workoutDayStarted: false,
        };
      }

      return {
        activeWorkoutPlanId: null,
        todayWorkoutDay: null,
        workoutStreak: 0,
        consistencyByDay,
      };
    }

    // 2. Buscar sessões da semana
    const sessions = await prisma.workoutSession.findMany({
      where: {
        workoutDay: { workoutPlanId: activePlan.id },
        startedAt: { gte: weekStart.toDate(), lte: weekEnd.toDate() },
      },
      include: { workoutDay: true },
    });

    // 3. Montar consistencyByDay
    const consistencyByDay: Record<
      string,
      { workoutDayCompleted: boolean; workoutDayStarted: boolean }
    > = {};
    for (let i = 0; i < 7; i++) {
      const d = weekStart.add(i, "day").format("YYYY-MM-DD");
      consistencyByDay[d] = {
        workoutDayCompleted: false,
        workoutDayStarted: false,
      };
    }

    for (const s of sessions) {
      const key = dayjs.utc(s.startedAt).format("YYYY-MM-DD");
      if (!consistencyByDay[key]) {
        consistencyByDay[key] = {
          workoutDayCompleted: false,
          workoutDayStarted: false,
        };
      }

      if (s.completedAt) {
        consistencyByDay[key].workoutDayStarted = true;
        consistencyByDay[key].workoutDayCompleted = true;
      } else {
        consistencyByDay[key].workoutDayStarted = true;
      }
    }

    // 4. Encontrar o dia de treino do dia alvo dentro do plano ativo
    const weekDayIndex = target.day(); // 0..6 (Sunday..Saturday)
    const WEEKDAYS: WeekDay[] = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ] as WeekDay[];

    const weekDayEnum: WeekDay = WEEKDAYS[weekDayIndex];

    const todayWorkoutDayRaw = await prisma.workoutDay.findFirst({
      where: { workoutPlanId: activePlan.id, weekDay: weekDayEnum },
      include: { _count: { select: { exercises: true } } },
    });

    const todayWorkoutDay = todayWorkoutDayRaw
      ? {
          workoutPlanId: todayWorkoutDayRaw.workoutPlanId,
          id: todayWorkoutDayRaw.id,
          name: todayWorkoutDayRaw.name,
          isRest: todayWorkoutDayRaw.isRest,
          weekDay: String(todayWorkoutDayRaw.weekDay),
          estimatedDurationInSeconds:
            todayWorkoutDayRaw.estimatedDurationInSeconds,
          coverImageUrl: todayWorkoutDayRaw.coverImageUrl ?? null,
          exercisesCount: todayWorkoutDayRaw._count?.exercises ?? 0,
        }
      : null;

    // 5. Calcular workoutStreak: contar dias consecutivos até target (inclusive) dentro da semana
    let streak = 0;
    for (let offset = 0; offset < 7; offset++) {
      const d = target.subtract(offset, "day");
      const key = d.utc().format("YYYY-MM-DD");

      // Se o plan tem um day for that weekday
      const planDay = activePlan.workoutDays.find(
        (wd) => wd.weekDay === WEEKDAYS[d.day()],
      );

      if (!planDay) break;

      const completed = consistencyByDay[key]?.workoutDayCompleted ?? false;
      // If plan day is rest, count as completed automatically
      if (planDay.isRest || completed) {
        streak += 1;
        continue;
      }

      break;
    }

    return {
      activeWorkoutPlanId: activePlan.id,
      todayWorkoutDay,
      workoutStreak: streak,
      consistencyByDay,
    };
  }
}
