import { Injectable } from '@nestjs/common';
import type { ModelMessage } from 'ai';

interface SessionState {
  messages: ModelMessage[];
  updatedAt: number;
}

const MAX_MESSAGES = 20;
const TTL_MS = 1000 * 60 * 60; // 1 hour

/**
 * Per-session conversation memory so refinements keep earlier constraints.
 * In-memory for Phase 1; swaps to Redis in Phase 3+ without changing the interface.
 */
@Injectable()
export class SessionService {
  private readonly sessions = new Map<string, SessionState>();

  getMessages(sessionId: string): ModelMessage[] {
    this.evictStale();
    return this.sessions.get(sessionId)?.messages ?? [];
  }

  append(sessionId: string, ...messages: ModelMessage[]): void {
    const state = this.sessions.get(sessionId) ?? { messages: [], updatedAt: Date.now() };
    state.messages.push(...messages);
    if (state.messages.length > MAX_MESSAGES) {
      state.messages = state.messages.slice(-MAX_MESSAGES);
    }
    state.updatedAt = Date.now();
    this.sessions.set(sessionId, state);
  }

  private evictStale(): void {
    const now = Date.now();
    for (const [id, state] of this.sessions) {
      if (now - state.updatedAt > TTL_MS) this.sessions.delete(id);
    }
  }
}
