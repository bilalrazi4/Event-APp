import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

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


@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;


  @Column({ type: 'jsonb' })
  oldEvents: OldEventSnapshot[];

  @Column()
  newEventId: string;

  @CreateDateColumn()
  timestamp: Date;
}