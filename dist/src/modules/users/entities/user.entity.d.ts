import { Event } from '../../events/entities/event.entity';
export declare class User {
    id: string;
    name: string;
    email: string;
    events: Event[];
}
