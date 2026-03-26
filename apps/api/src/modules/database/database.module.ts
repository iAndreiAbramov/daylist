import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { seedConfig } from '../../lib/config/seed.config';
import {
  Category,
  FinanceEntry,
  Note,
  Task,
  User,
} from '../../typeorm/entities';
import { SeedService } from './services/seed.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [__dirname + '/../../typeorm/entities/*.entity{.ts,.js}'],
        migrations: [__dirname + '/../../typeorm/migrations/*{.ts,.js}'],
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, Category, Task, Note, FinanceEntry]),
    ConfigModule.forFeature(seedConfig),
  ],
  providers: [SeedService],
})
export class DatabaseModule {}
