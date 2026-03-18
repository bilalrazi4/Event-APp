import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Event, EventStatus } from '../events/entities/event.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { EventsService } from '../events/events.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class MergeService {
  private readonly logger = new Logger(MergeService.name);

  constructor(
    private dataSource: DataSource,
    private eventsService: EventsService,
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
    private aiService: AiService,
  ) {}

  async mergeAllForUser(userId: string): Promise<Event | null> {
    // 1. Detect conflicts
    const conflicts = await this.eventsService.findConflicts(userId);
    if (conflicts.length < 2) {
      return null; // Nothing to merge
    }

    // Sort by startTime to determine the overall range
    conflicts.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    // 2. Determine merge details
    // Titles: Concatenate unique titles
    const titles = [...new Set(conflicts.map((e) => e.title))];
    const newTitle = titles.join(' + ');

    // Status: Keep latest (most advanced) status? 
    // Usually defined by a precedence. Let's say: CANCELED < TODO < IN_PROGRESS < COMPLETED
    const statusPrecedence = [
      EventStatus.CANCELED,
      EventStatus.TODO,
      EventStatus.IN_PROGRESS,
      EventStatus.COMPLETED,
    ];
    let latestStatus = EventStatus.TODO;
    let maxPrecedence = -1;
    conflicts.forEach((e) => {
      const p = statusPrecedence.indexOf(e.status);
      if (p > maxPrecedence) {
        maxPrecedence = p;
        latestStatus = e.status;
      }
    });

    // Time: Union of the range
    const startTime = conflicts[0].startTime;
    const endTime = new Date(Math.max(...conflicts.map((e) => e.endTime.getTime())));

    // Participants: Union of invitees
    const inviteeMap = new Map();
    conflicts.forEach(e => {
        e.invitees?.forEach(u => inviteeMap.set(u.id, u));
    });
    const invitees = Array.from(inviteeMap.values());
    const organizer = conflicts[0].organizer;

    // IDs for mergedFrom and AuditLog
    const oldEventIds = conflicts.map((e) => e.id);

    // 3. Execute Merge in a Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create New Event
      const newEvent = this.eventsRepository.create({
        title: newTitle,
        status: latestStatus,
        startTime,
        endTime,
        organizer,
        invitees,
        mergedFrom: oldEventIds,
      });
      const savedEvent = await queryRunner.manager.save(newEvent);

      // Create Audit Log
      const auditLog = this.auditRepository.create({
        oldEventIds,
        newEventId: savedEvent.id,
      });
      await queryRunner.manager.save(auditLog);

      // Delete Old Events
      await queryRunner.manager.delete(Event, { id: In(oldEventIds) });

      await queryRunner.commitTransaction();

      // 4. Generate AI Summary synchronously (since Queue is removed)
      const summary = await this.aiService.generateSummary(titles);
      
      // Update event description with AI summary
      await this.eventsRepository.update(savedEvent.id, {
        description: summary,
      });

      // Reload event to return the updated description
      const updatedEvent = await this.eventsRepository.findOneBy({ id: savedEvent.id });
      return updatedEvent;
    } catch (err) {
      this.logger.error('Merge failed', err);
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
