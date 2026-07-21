import { Injectable, Logger } from '@nestjs/common';
import { createAnthropic } from '@ai-sdk/anthropic';
import { stepCountIs, streamText, type ModelMessage } from 'ai';
import { randomUUID } from 'node:crypto';
import { DirectionsService } from '../google/directions.service';
import { GeocodingService } from '../google/geocoding.service';
import { PlacesService } from '../google/places.service';
import { PlanEventPayload, PlanTripInput } from '../graphql/types/plan.types';
import { SessionService } from '../memory/session.service';
import { runMockAgent } from './mock-agent';
import { SYSTEM_PROMPT } from './prompt';
import { bridgeStream } from './stream-bridge';
import { RunContext } from './run-context';
import { buildTools } from './tools';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly apiKey = process.env.ANTHROPIC_API_KEY;

  constructor(
    private readonly directions: DirectionsService,
    private readonly geocoding: GeocodingService,
    private readonly places: PlacesService,
    private readonly sessions: SessionService,
  ) {}

  async *runTripAgent(input: PlanTripInput): AsyncGenerator<PlanEventPayload> {
    const planId = input.planId ?? randomUUID();
    const sessionId = input.sessionId ?? planId;
    const ctx = new RunContext(input.detourKm);
    const services = {
      directions: this.directions,
      geocoding: this.geocoding,
      places: this.places,
    };

    if (!this.apiKey) {
      this.logger.log('ANTHROPIC_API_KEY not set — running mock agent (demo mode)');
      yield* runMockAgent(input.prompt, ctx, services, planId);
      return;
    }

    const anthropic = createAnthropic({ apiKey: this.apiKey });
    const history = this.sessions.getMessages(sessionId);
    const isRefinement = Boolean(input.planId) && history.length > 0;

    const userMessage: ModelMessage = {
      role: 'user',
      content: isRefinement
        ? `Refinement request (keep all previous constraints in force, re-run only what changes): ${input.prompt}`
        : `Trip brief: ${input.prompt}\nDetour tolerance: ${input.detourKm} km (stretch picks allowed up to ${input.detourKm * 2} km).`,
    };

    const result = streamText({
      model: anthropic('claude-sonnet-4-5'),
      system: SYSTEM_PROMPT,
      messages: [...history, userMessage],
      tools: buildTools(services, ctx),
      stopWhen: stepCountIs(14),
      onError: ({ error }) => this.logger.error(`Agent stream error: ${String(error)}`),
    });

    let summaryText = '';
    for await (const event of bridgeStream(result.fullStream, ctx, planId)) {
      if ('summary' in event) summaryText = event.summary;
      yield event;
    }

    this.sessions.append(sessionId, userMessage, {
      role: 'assistant',
      content: summaryText || 'Plan generated.',
    });
  }
}
