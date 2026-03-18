import { EventStatus } from '../entities/event.entity';
export declare class CreateEventDto {
    title: string;
    description?: string;
    status?: EventStatus;
    startTime: string;
    endTime: string;
    organizerId: string;
    inviteeIds?: string;
}
export declare class UpdateEventDto {
    title?: string;
    description?: string;
    status?: EventStatus;
    startTime?: string;
    endTime?: string;
}
