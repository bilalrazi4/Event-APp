import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Event, EventStatus } from '../events/entities/event.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { EventsService } from '../events/events.service';
import { AiService } from '../ai/ai.service';
import { QueryRunner } from 'typeorm/browser';

@Injectable()
export class MergeService {
  private readonly logger = new Logger(MergeService.name);

  constructor(
    private dataSource: DataSource,
    @Inject(forwardRef(() => EventsService))
    private eventsService: EventsService,
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
    private aiService: AiService,
  ) { }

  async mergeEvent(conflicts: Event[], queryRunner: QueryRunner, isExternalTransaction: boolean = false,): Promise<Event | null> {

    if (conflicts.length < 2) {
      await queryRunner.commitTransaction();
      return null;
    }
    // this sorts the conflicted events by eariest start time of an event
    conflicts.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());



    //keeping track for auditlog
    const oldEventsSnapshot = conflicts.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description ?? null,
      status: e.status,
      startTime: e.startTime,
      endTime: e.endTime,
      organizerId: e.organizer?.id ?? null,
      organizerName: e.organizer?.name ?? null,
      invitees: e.invitees?.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
      })) ?? [],
      mergedFrom: e.mergedFrom ?? [],
    }));

    // concatinating the tites of the conficted evnets
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

    // combining the start and endtime by taking the starttime of the top sorted event that was done aboive and taking the max endtime of an event
    const startTime = conflicts[0].startTime;
    const endTime = new Date(Math.max(...conflicts.map((e) => e.endTime.getTime())));

    // taking union of all the invitees
    const inviteeMap = new Map();
    conflicts.forEach(e => {
      e.invitees?.forEach(u => inviteeMap.set(u.id, u));
    });
    const invitees = Array.from(inviteeMap.values());
    const organizer = conflicts[0].organizer;


    // getting id's for mergedFrom
    const oldEventIds = conflicts.map((e) => e.id);


    try {
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
        oldEvents: oldEventsSnapshot,
        newEventId: savedEvent.id,
      });
      await queryRunner.manager.save(auditLog);

      // Delete Old Events
      await queryRunner.manager.delete(Event, { id: In(oldEventIds) });

      if (!isExternalTransaction) {
        // this will run if this mergeEvent funbction is not called by BatchService
        await queryRunner.commitTransaction();

        let summary: string;
        try {
          summary = await this.aiService.generateSummary(titles);
        } catch {
          summary = `Merged event: ${newTitle}`;
        }
        await this.eventsRepository.update(savedEvent.id, { description: summary });

        return this.eventsRepository.findOne({
          where: { id: savedEvent.id },
          relations: ['organizer', 'invitees'],
        });
      }
      else {
        // else this will run if mergeEvent function is called by BatchService and will perform the AI summary description updation in BatchService
        return savedEvent;
      }

    }
    catch (err) {
      this.logger.error('Merge failed', err);
      if (!isExternalTransaction) {
        await queryRunner.rollbackTransaction();
      }
      throw err;
    }
    finally {
      if (!isExternalTransaction && !queryRunner.isReleased) {
        await queryRunner.release();
      }
    }
  }

}
