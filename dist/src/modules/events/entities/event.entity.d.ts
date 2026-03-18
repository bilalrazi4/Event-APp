import { User } from '../../users/entities/user.entity';
export declare enum EventStatus {
    TODO = "TODO",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELED = "CANCELED"
}
export declare class Event {
    id: string;
    title: string;
    description?: string;
    status: EventStatus;
    startTime: Date;
    endTime: Date;
    organizer: User;
    invitees: User[];
    mergedFrom?: string[];
    createdAt: Date;
    updatedAt: Date;
}
