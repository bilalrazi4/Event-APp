import { Repository, DataSource } from 'typeorm';
import { Event } from '../events/entities/event.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { EventsService } from '../events/events.service';
import { AiService } from '../ai/ai.service';
export declare class MergeService {
    private dataSource;
    private eventsService;
    private eventsRepository;
    private auditRepository;
    private aiService;
    private readonly logger;
    constructor(dataSource: DataSource, eventsService: EventsService, eventsRepository: Repository<Event>, auditRepository: Repository<AuditLog>, aiService: AiService);
    mergeAllForUser(userId: string): Promise<Event | null>;
}
