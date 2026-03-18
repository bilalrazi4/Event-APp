import type { Cache } from 'cache-manager';
export declare class AiService {
    private cacheManager;
    constructor(cacheManager: Cache);
    generateSummary(titles: string[]): Promise<string>;
}
