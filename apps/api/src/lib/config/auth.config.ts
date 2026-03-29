import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const schema = z.object({
  accessSecret: z.string().min(1, {
    message: 'JWT_ACCESS_SECRET must not be empty',
  }),
  refreshSecret: z.string().min(1, {
    message: 'JWT_REFRESH_SECRET must not be empty',
  }),
  accessExpiresIn: z.string().default('15m'),
  refreshExpiresIn: z.string().default('30d'),
});

export type AuthConfig = z.infer<typeof schema>;

export const authConfig = registerAs('auth', (): AuthConfig => {
  const result = schema.safeParse({
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });

  if (!result.success) {
    const messages = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${messages}`);
  }

  return result.data;
});
