import { LogLevelEnum } from '@modules/logger/enums/log-level.enum';
import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const schema = z.object({
  logLevel: z
    .nativeEnum(LogLevelEnum, {
      message: 'LOG_LEVEL must be one of: DEBUG, INFO, WARNING, ERROR, FATAL',
    })
    .default(LogLevelEnum.INFO),
});

export type LoggerConfig = z.infer<typeof schema>;

export const loggerConfig = registerAs('logger', (): LoggerConfig => {
  const result = schema.safeParse({ logLevel: process.env.LOG_LEVEL });

  if (!result.success) {
    const messages = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${messages}`);
  }

  return result.data;
});
