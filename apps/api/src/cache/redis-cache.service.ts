import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * JSON cache over Redis. Degrades to a no-op when REDIS_URL is unset or the
 * connection fails, so the app runs fine without local infra.
 */
@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private client: Redis | null = null;
  private healthy = false;

  constructor() {
    const url = process.env.REDIS_URL;
    if (!url) {
      this.logger.log('REDIS_URL not set — caching disabled');
      return;
    }
    this.client = new Redis(url, {
      lazyConnect: false,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 500, 2000)),
    });
    this.client.on('ready', () => {
      this.healthy = true;
      this.logger.log('Redis cache connected');
    });
    this.client.on('error', (err) => {
      if (this.healthy) this.logger.warn(`Redis error: ${err.message}`);
      this.healthy = false;
    });
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.healthy) return null;
    try {
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.client || !this.healthy) return;
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      /* cache write failures are non-fatal */
    }
  }

  /** Cache-aside helper: return cached value or compute, store, and return it. */
  async wrap<T>(key: string, ttlSeconds: number, compute: () => Promise<T>): Promise<T> {
    const hit = await this.get<T>(key);
    if (hit !== null) return hit;
    const value = await compute();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  onModuleDestroy() {
    this.client?.disconnect();
  }
}
