import { Args, Query, Resolver, Subscription } from '@nestjs/graphql';
import { AgentService } from '../agent/agent.service';
import { PlanEvent, PlanTripInput } from './types/plan.types';

@Resolver()
export class PlanResolver {
  constructor(private readonly agent: AgentService) {}

  @Query(() => String, { description: 'Health check' })
  health(): string {
    return 'ok';
  }

  @Subscription(() => PlanEvent, {
    description: 'Streams the agent planning a trip: steps, route, stops, summary.',
    resolve: (payload: unknown) => payload,
  })
  planTrip(@Args('input') input: PlanTripInput): AsyncGenerator<unknown> {
    return this.agent.runTripAgent(input);
  }
}
