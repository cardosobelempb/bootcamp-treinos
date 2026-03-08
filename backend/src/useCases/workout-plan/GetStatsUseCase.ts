import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import { WeekDay } from "../../generated/prisma/enums.js";
import { prisma } from "../../lib/database.js";

dayjs.extend(utc);

export interface GetStatsInputDTO {
  userId: string;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}

export interface GetStatsOutputDTO {
  workoutStreak: number;
  consistencyByDay: Record<
    string,
    { workoutDayCompleted: boolean; workoutDayStarted: boolean }
  >;
  completedWorkoutsCount: number;
  conclusionRate: number;
  totalTimeInSeconds: number;
}

export class GetStats {
  async execute(dto: GetStatsInputDTO): Promise<GetStatsOutputDTO> {
    const from = dayjs.utc(dto.from, "YYYY-MM-DD").startOf("day");
    const to = dayjs.utc(dto.to, "YYYY-MM-DD").endOf("day");

    if (!from.isValid() || !to.isValid() || from.isAfter(to)) {
      throw new Error("Invalid date range");
    }

    // sessions in range
    const sessions = await prisma.workoutSession.findMany({
      where: {
        startedAt: { gte: from.toDate(), lte: to.toDate() },
        workoutDay: { workoutPlan: { userId: dto.userId } },
      },
      include: { workoutDay: true },
    });

    const totalSessions = sessions.length;
    const completedWorkoutsCount = sessions.filter(
      (s) => s.completedAt != null,
    ).length;

    // group by date (UTC)
    const consistencyByDay: Record<
      string,
      { workoutDayCompleted: boolean; workoutDayStarted: boolean }
    > = {};
    for (const s of sessions) {
      const key = dayjs.utc(s.startedAt).format("YYYY-MM-DD");
      if (!consistencyByDay[key]) {
        consistencyByDay[key] = {
          workoutDayCompleted: false,
          workoutDayStarted: false,
        };
      }

      if (s.completedAt) {
        consistencyByDay[key].workoutDayCompleted = true;
        consistencyByDay[key].workoutDayStarted = true;
      } else {
        consistencyByDay[key].workoutDayStarted = true;
      }
    }

    // total time in seconds for completed sessions
    let totalTimeInSeconds = 0;
    for (const s of sessions) {
      if (s.completedAt && s.startedAt) {
        const diff = Math.max(
          0,
          Math.round((s.completedAt.getTime() - s.startedAt.getTime()) / 1000),
        );
        totalTimeInSeconds += diff;
      }
    }

    const conclusionRate =
      totalSessions > 0 ? completedWorkoutsCount / totalSessions : 0;

    // workoutStreak: need active plan days
    const activePlan = await prisma.workoutPlan.findFirst({
      where: { userId: dto.userId, isActive: true },
      include: { workoutDays: true },
    });
    let streak = 0;
    if (activePlan) {
      // create set of weekdays in plan
      const WEEKDAYS: WeekDay[] = [
        "SUNDAY",
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
      ] as WeekDay[];
      const planWeekdays = new Set(
        activePlan.workoutDays.map((wd) => wd.weekDay),
      );

      // start from 'to' date and go backwards counting consecutive completed days according to plan
      let cursor = dayjs.utc(dto.to, "YYYY-MM-DD");
      while (true) {
        const key = cursor.format("YYYY-MM-DD");
        const weekday = WEEKDAYS[cursor.day()];

        // if plan doesn't include this weekday, break
        if (!planWeekdays.has(weekday as WeekDay)) break;

        const completed = !!consistencyByDay[key]?.workoutDayCompleted;
        if (completed) {
          streak += 1;
          cursor = cursor.subtract(1, "day");
          continue;
        }

        break;
      }
    }

    return {
      workoutStreak: streak,
      consistencyByDay,
      completedWorkoutsCount,
      conclusionRate,
      totalTimeInSeconds,
    };
  }
}
