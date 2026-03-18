import { DataSource } from 'typeorm';
import { CreateEventDto } from '../events/dto/event.dto';
export declare class BatchService {
    private dataSource;
    constructor(dataSource: DataSource);
    batchInsert(eventsDto: CreateEventDto[]): Promise<{
        count: number;
    }>;
}
