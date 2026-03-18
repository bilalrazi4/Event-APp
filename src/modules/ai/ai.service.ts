import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class AiService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async generateSummary(titles: string[]): Promise<string> {
    const cacheKey = `summary:${titles.sort().join(':')}`;
    const cached = await this.cacheManager.get<string>(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Mocking LLM call
    // Logic: "Merged [titles.join(' + ')] from overlapping events."
    const summary = `Merged team sync from overlapping events: ${titles.join(' + ')}.`;
    
    // Cache for 1 hour
    await this.cacheManager.set(cacheKey, summary, 3600000);
    
    return summary;
  }
}
