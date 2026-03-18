import { BatchService } from './batch.service';
import { CreateEventDto } from '../events/dto/event.dto';
export declare class BatchController {
    private readonly batchService;
    constructor(batchService: BatchService);
    batchInsert(events: CreateEventDto[]): Promise<{
        count: number;
    }>;
}
