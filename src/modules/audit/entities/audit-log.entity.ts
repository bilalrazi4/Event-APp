import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'jsonb' })
  oldEventIds: string[];

  @Column()
  newEventId: string;

  @CreateDateColumn()
  timestamp: Date;
}
