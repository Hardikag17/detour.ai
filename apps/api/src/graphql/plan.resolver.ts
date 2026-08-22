import { Optional } from '@nestjs/common';
import { Args, Query, Resolver, Subscription } from '@nestjs/graphql';
import { AgentService } from '../agent/agent.service';
import { TripsService } from '../trips/trips.service';
import {
  PlanEvent,
  PlanEventPayload,
  PlanSummaryEvent,
  PlanTripInput,
  RouteEvent,
  StopEvent,
  StopUpdatedEvent,
} from './types/plan.types';

@Resolver()
export class PlanResolver {
  constructor(
    private readonly agent: AgentService,
    @Optional() private readonly trips?: TripsService,
  ) {}

  @Query(() => String, { description: 'Health check' })
  health(): string {
    return 'ok';
  }

  @Subscription(() => PlanEvent, {
    description: 'Streams the agent planning a trip: steps, route, stops, summary.',
    resolve: (payload: unknown) => payload,
  })
  planTrip(@Args('input') input: PlanTripInput): AsyncGenerator<unknown> {
    return this.streamAndPersist(input);
  }

  /**
   * Pass events through unchanged while accumulating the final plan; persist it
   * once the stream completes (no-op without Postgres).
   */
  private async *streamAndPersist(input: PlanTripInput): AsyncGenerator<PlanEventPayload> {
    let route: RouteEvent | undefined;
    let summary: PlanSummaryEvent | undefined;
    const stops = new Map<string, StopEvent>();

    for await (const event of this.agent.runTripAgent(input)) {
      if (event instanceof RouteEvent) route = event;
      else if (event instanceof StopEvent) stops.set(event.id, event);
      else if (event instanceof StopUpdatedEvent) {
        if (event.change === 'removed') stops.delete(event.id);
        else if (event.stop) stops.set(event.stop.id, event.stop);
      } else if (event instanceof PlanSummaryEvent) summary = event;
      yield event;
    }

    if (this.trips && route && summary && stops.size > 0) {
      void this.trips.savePlan(summary.planId, input, route, [...stops.values()], summary);
    }
  }
}
