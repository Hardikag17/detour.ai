import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { YogaDriver, YogaDriverConfig } from '@graphql-yoga/nestjs';
import { join } from 'node:path';
import { AgentModule } from './agent/agent.module';
import { GoogleModule } from './google/google.module';
import { MemoryModule } from './memory/memory.module';
import { PlacesResolver } from './graphql/places.resolver';
import { PlanResolver } from './graphql/plan.resolver';

@Module({
  imports: [
    GraphQLModule.forRoot<YogaDriverConfig>({
      driver: YogaDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      graphiql: true,
    }),
    AgentModule,
    GoogleModule,
    MemoryModule,
  ],
  providers: [PlanResolver, PlacesResolver],
})
export class AppModule {}
