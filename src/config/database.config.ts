import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  username: process.env.DB_USERNAME || 'kevin',
  password: process.env.DB_PASSWORD || 'mcallister2024',
  database: process.env.DB_NAME || 'itinerary_plus',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  migrationsRun: false,
  migrationsTableName: 'typeorm_migrations',
};

// Export for TypeORM CLI
export const dataSourceOptions: DataSourceOptions = {
  ...databaseConfig,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
} as DataSourceOptions;

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
