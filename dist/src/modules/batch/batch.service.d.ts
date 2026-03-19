import { DataSource, Repository } from 'typeorm';
import { Event } from '../events/entities/event.entity';
import { CreateEventDto } from '../events/dto/event.dto';
import { MergeService } from '../merge/merge.service';
import { AiService } from '../ai/ai.service';
export interface BatchInsertResult {
    summary: {
        total: number;
        inserted: number;
        merged: number;
    };
    created: Event[];
    merged: Event[];
}
export declare class BatchService {
    private dataSource;
    private eventsRepository;
    private mergeService;
    private aiService;
    private readonly logger;
    constructor(dataSource: DataSource, eventsRepository: Repository<Event>, mergeService: MergeService, aiService: AiService);
    batchInsert(eventsDto: CreateEventDto[]): Promise<BatchInsertResult>;
    private findConflictGroups;
}
