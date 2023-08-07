import { object, string, nonOptional, type Output } from 'valibot';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = object({ DATABASE_URL: nonOptional(string([])) });

type ParsedEnv = Output<typeof envSchema>;

const parsedEnv = envSchema.parse(process.env);

export { type ParsedEnv, parsedEnv };
