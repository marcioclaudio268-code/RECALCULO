import "dotenv/config";
import { z } from "zod";
import { buildApp } from "./app.js";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001)
});

const env = envSchema.parse(process.env);
const app = buildApp();

try {
  await app.listen({
    host: "0.0.0.0",
    port: env.PORT
  });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
