import { Injectable, Logger } from '@nestjs/common';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { stepCountIs, streamText, type LanguageModel, type ModelMessage } from 'ai';
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

  /**
   * Provider auto-selection: Claude when ANTHROPIC_API_KEY is set, else Gemini
   * (GOOGLE_GENERATIVE_AI_API_KEY, falling back to the Maps key — same Google
   * Cloud project can serve both), else the scripted demo agent.
   */
  private resolveModel(): { model: LanguageModel; label: string } | null {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      const anthropic = createAnthropic({ apiKey: anthropicKey });
      return { model: anthropic('claude-sonnet-4-5'), label: 'Claude (claude-sonnet-4-5)' };
    }
    const googleKey =
      process.env.GEMINI_API_KEY ??
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
      process.env.GOOGLE_MAPS_API_KEY;
    if (googleKey) {
      const google = createGoogleGenerativeAI({ apiKey: googleKey });
      return { model: google('gemini-3.6-flash'), label: 'Gemini (gemini-3.6-flash)' };
    }
    return null;
  }

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

    const resolved = this.resolveModel();
    if (!resolved) {
      this.logger.log('No LLM key set — running mock agent (demo mode)');
      yield* runMockAgent(input.prompt, ctx, services, planId);
      return;
    }
    this.logger.log(`Agent LLM: ${resolved.label}`);

    const history = this.sessions.getMessages(sessionId);
    const isRefinement = Boolean(input.planId) && history.length > 0;

    const userMessage: ModelMessage = {
      role: 'user',
      content: isRefinement
        ? `Refinement request (keep all previous constraints in force, re-run only what changes): ${input.prompt}`
        : `Trip brief: ${input.prompt}\nDetour tolerance: ${input.detourKm} km (stretch picks allowed up to ${input.detourKm * 2} km).`,
    };

    const result = streamText({
      model: resolved.model,
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
