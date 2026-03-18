import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { User } from '../users/entities/user.entity';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
export declare class EventsService {
    private eventsRepository;
    private usersRepository;
    constructor(eventsRepository: Repository<Event>, usersRepository: Repository<User>);
    create(createEventDto: CreateEventDto): Promise<Event>;
    findAll(): Promise<Event[]>;
    findOne(id: string): Promise<Event>;
    update(id: string, updateEventDto: UpdateEventDto): Promise<Event>;
    remove(id: string): Promise<void>;
    findConflicts(userId: string): Promise<Event[]>;
}
