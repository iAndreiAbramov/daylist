import { registerAs } from '@nestjs/config';
import type { StringValue } from 'ms';
import { z } from 'zod';

const stringValue = z.custom<StringValue>(
  (val) => typeof val === 'string' && val.length > 0,
);

const schema = z.object({
  jwtSecret: z.string().min(1, {
    message: 'JWT_SECRET must not be empty',
  }),
  accessExpiresIn: stringValue.default('15m'),
  refreshExpiresIn: stringValue.default('30d'),
});

export type AuthConfig = z.infer<typeof schema>;

export const authConfig = registerAs('auth', (): AuthConfig => {
  const result = schema.safeParse({
    jwtSecret: process.env.JWT_SECRET,
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
