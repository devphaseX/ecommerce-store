import { TypeOf, object, string } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = object({
  DATABASE_URL: string().min(1),
  STRIPE_API_KEY: string().min(1),
  STRIPE_WEBHOOK_SECRET: string().min(1),
});

type ParsedEnv = TypeOf<typeof envSchema>;

const parsedEnv = envSchema.parse(process.env);

export { type ParsedEnv, parsedEnv };
