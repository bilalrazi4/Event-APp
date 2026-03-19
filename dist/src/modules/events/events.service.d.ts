import { Repository, DataSource } from 'typeorm';
import { Event } from './entities/event.entity';
import { User } from '../users/entities/user.entity';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
import { MergeService } from '../merge/merge.service';
export declare class EventsService {
    private dataSource;
    private mergeService;
    private eventsRepository;
    private usersRepository;
    constructor(dataSource: DataSource, mergeService: MergeService, eventsRepository: Repository<Event>, usersRepository: Repository<User>);
    create(createEventDto: CreateEventDto): Promise<Event | null>;
    private checkOrganizerConflicts;
    findAll(): Promise<Event[]>;
    findOne(id: string): Promise<Event>;
    update(id: string, updateEventDto: UpdateEventDto): Promise<Event>;
    remove(id: string): Promise<void>;
}
