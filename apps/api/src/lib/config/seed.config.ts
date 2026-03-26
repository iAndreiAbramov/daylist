import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const schema = z.object({
  enabled: z
    .enum(['true', 'false'], {
      message: 'SEED_ENABLED must be "true" or "false"',
    })
    .transform((v) => v === 'true'),
});

export type SeedConfig = z.infer<typeof schema>;

export const seedConfig = registerAs('seed', (): SeedConfig => {
  const result = schema.safeParse({ enabled: process.env.SEED_ENABLED });

  if (!result.success) {
    const messages = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${messages}`);
  }

  return result.data;
});
