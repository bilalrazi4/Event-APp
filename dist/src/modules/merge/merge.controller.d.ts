import { MergeService } from './merge.service';
export declare class MergeController {
    private readonly mergeService;
    constructor(mergeService: MergeService);
    mergeAll(userId: string): Promise<{
        message: string;
        event: import("../events/entities/event.entity").Event | null;
    }>;
}
