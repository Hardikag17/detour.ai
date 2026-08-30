import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { YogaDriver, YogaDriverConfig } from '@graphql-yoga/nestjs';
import { join } from 'node:path';
import { API_PATH } from './config';
import { AgentModule } from './agent/agent.module';
import { CacheModule } from './cache/cache.module';
import { GoogleModule } from './google/google.module';
import { MemoryModule } from './memory/memory.module';
import { PlanResolver } from './graphql/plan.resolver';
import { StopEntity, TripEntity } from './trips/trip.entity';
import { TripsModule } from './trips/trips.module';

// Postgres persistence is optional: without DATABASE_URL the app runs
// stateless (no saved trips) and everything else works unchanged.
const dbImports = process.env.DATABASE_URL
  ? [
      TypeOrmModule.forRoot({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [TripEntity, StopEntity],
        synchronize: true, // dev convenience; swap for migrations in prod
      }),
      TripsModule,
    ]
  : [];

@Module({
  imports: [
    GraphQLModule.forRoot<YogaDriverConfig>({
      driver: YogaDriver,
      path: API_PATH,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      graphiql: true,
    }),
    CacheModule,
    AgentModule,
    GoogleModule,
    MemoryModule,
    ...dbImports,
  ],
  providers: [PlanResolver],
})
export class AppModule {}
