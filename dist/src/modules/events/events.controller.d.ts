import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
export declare class EventsController {
    private readonly eventsService;
    constructor(eventsService: EventsService);
    create(createEventDto: CreateEventDto): Promise<import("./entities/event.entity").Event | null>;
    findAll(): Promise<import("./entities/event.entity").Event[]>;
    findOne(id: string): Promise<import("./entities/event.entity").Event>;
    update(id: string, updateEventDto: UpdateEventDto): Promise<import("./entities/event.entity").Event>;
    remove(id: string): Promise<void>;
    findConflicts(userId: string): Promise<import("./entities/event.entity").Event[]>;
}
