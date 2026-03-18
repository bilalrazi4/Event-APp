import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('AiService', () => {
  let service: AiService;
  let cacheManager: any;

  beforeEach(async () => {
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: CACHE_MANAGER, useValue: cacheManager },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should generate a summary and cache it', async () => {
    const titles = ['Meeting A', 'Meeting B'];
    cacheManager.get.mockResolvedValue(null);

    const result = await service.generateSummary(titles);

    expect(result).toContain('Meeting A + Meeting B');
    expect(cacheManager.set).toHaveBeenCalled();
  });

  it('should return cached summary if available', async () => {
    const titles = ['Meeting A'];
    cacheManager.get.mockResolvedValue('cached-summary');

    const result = await service.generateSummary(titles);

    expect(result).toBe('cached-summary');
    expect(cacheManager.set).not.toHaveBeenCalled();
  });
});
