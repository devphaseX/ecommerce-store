import { object, string, nonOptional, type Output } from 'valibot';

const envSchema = object({ DATABASE_URL: nonOptional(string([])) });
envSchema.parse(process.env);

type ParsedEnv = Output<typeof envSchema>;

export { type ParsedEnv };
