import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config();

const databaseUrl = process.env['DATABASE_URL'];

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL environment variable is not set. Please configure it before running TypeORM migrations.',
  );
}

export default new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: [__dirname + '/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
