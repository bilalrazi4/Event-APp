import { Test, TestingModule } from '@nestjs/testing';
import { MergeService } from './merge.service';
import { EventsService } from '../events/events.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Event, EventStatus } from '../events/entities/event.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { DataSource } from 'typeorm';
import { AiService } from '../ai/ai.service';

describe('MergeService', () => {
  let service: MergeService;
  let eventsService: EventsService;

  const mockEventsRepository = {
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockImplementation(entity => Promise.resolve({ id: 'new-id', ...entity })),
    findOneBy: jest.fn(),
    update: jest.fn(),
  };

  const mockAuditRepository = {
    create: jest.fn().mockImplementation(dto => dto),
  };

  const mockEventsService = {
    findConflicts: jest.fn(),
  };

  const mockAiService = {
    generateSummary: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn().mockImplementation(entity => Promise.resolve({ id: 'new-id', ...entity })),
        delete: jest.fn(),
      },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MergeService,
        { provide: EventsService, useValue: mockEventsService },
        { provide: getRepositoryToken(Event), useValue: mockEventsRepository },
        { provide: getRepositoryToken(AuditLog), useValue: mockAuditRepository },
        { provide: DataSource, useValue: mockDataSource },
        { provide: AiService, useValue: mockAiService },
      ],
    }).compile();

    service = module.get<MergeService>(MergeService);
    eventsService = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should merge overlapping events correctly', async () => {
    const userId = 'user-1';
    const mockUser = { id: userId, name: 'Test' } as any;
    const conflicts = [
      {
        id: 'e1',
        title: 'Meeting A',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T11:00:00Z'),
        status: EventStatus.TODO,
        organizer: mockUser,
        invitees: [],
      },
      {
        id: 'e2',
        title: 'Meeting B',
        startTime: new Date('2024-01-01T10:30:00Z'),
        endTime: new Date('2024-01-01T11:30:00Z'),
        status: EventStatus.IN_PROGRESS,
        organizer: mockUser,
        invitees: [],
      },
    ] as unknown as Event[];

    mockEventsService.findConflicts.mockResolvedValue(conflicts);
    mockAiService.generateSummary.mockResolvedValue('Mocked AI Summary');
    mockEventsRepository.findOneBy = jest.fn().mockResolvedValue({ 
        title: 'Meeting A + Meeting B', 
        status: EventStatus.IN_PROGRESS, 
        mergedFrom: ['e1', 'e2'], 
        description: 'Mocked AI Summary' 
    });

    const result = await service.mergeAllForUser(userId);

    expect(result).toBeDefined();
    expect(result?.title).toBe('Meeting A + Meeting B');
    expect(result?.status).toBe(EventStatus.IN_PROGRESS);
    expect(result?.mergedFrom).toContain('e1');
    expect(result?.mergedFrom).toContain('e2');
    expect(mockAiService.generateSummary).toHaveBeenCalled();
  });

  it('should return null if no conflicts', async () => {
    mockEventsService.findConflicts.mockResolvedValue([]);
    const result = await service.mergeAllForUser('user-1');
    expect(result).toBeNull();
  });
});
