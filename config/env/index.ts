import {
  object,
  string,
  nonOptional,
  type Output,
  minLength,
  url,
} from 'valibot';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = object({
  DATABASE_URL: nonOptional(string([])),
  STRIPE_API_KEY: string([minLength(1)]),
  FRONTEND_STORE_URL: string([url()]),
  STRIPE_WEBHOOK_SECRET: string([minLength(1)]),
});

type ParsedEnv = Output<typeof envSchema>;

const parsedEnv = envSchema.parse(process.env);

export { type ParsedEnv, parsedEnv };
