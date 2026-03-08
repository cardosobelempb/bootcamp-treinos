import type { FastifyInstance } from "fastify";
import { registerHomeRoutes } from "./home.routes.js";
import { registerPlansRoutes } from "./plans.routes.js";
import { registerSessionsRoutes } from "./sessions.routes.js";

export async function workoutPlansRoutes(app: FastifyInstance) {
  registerPlansRoutes(app);
  registerSessionsRoutes(app);
  registerHomeRoutes(app);
}

export default workoutPlansRoutes;
