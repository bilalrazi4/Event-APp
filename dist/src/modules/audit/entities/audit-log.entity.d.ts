interface OldEventSnapshot {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    startTime: Date;
    endTime: Date;
    organizerId: string | null;
    organizerName: string | null;
    invitees: {
        id: string;
        name: string;
        email: string;
    }[];
    mergedFrom: string[];
}
export declare class AuditLog {
    id: string;
    oldEvents: OldEventSnapshot[];
    newEventId: string;
    timestamp: Date;
}
export {};
