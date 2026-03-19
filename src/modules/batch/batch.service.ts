import { Injectable, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';

import { DataSource, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Event, EventStatus } from '../events/entities/event.entity';
import { CreateEventDto } from '../events/dto/event.dto';
import { User } from '../users/entities/user.entity';
import { MergeService } from '../merge/merge.service';
import { AiService } from '../ai/ai.service';
export interface BatchInsertResult {
  summary: {
    total: number;
    inserted: number;
    merged: number;
  };
  created: Event[];
  merged: Event[];
}

@Injectable()
export class BatchService {
  private readonly logger = new Logger(BatchService.name);

  constructor(
    private dataSource: DataSource,
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
    @Inject(forwardRef(() => MergeService))
    private mergeService: MergeService,
    private aiService: AiService,
  ) { }

  async batchInsert(eventsDto: CreateEventDto[]): Promise<BatchInsertResult> {

    if (eventsDto.length > 500) {
      throw new BadRequestException('Batch size exceeds 500 events');
    }



    // creating events array for inserting all coming events and their invitiees with organizer as organizer is also an invitee
    const eventsObj: Event[] = eventsDto.map((dto) =>
      this.eventsRepository.create({
        title: dto.title,
        description: dto.description,
        status: dto.status,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        organizer: { id: dto.organizerId } as User,
        invitees: [
          ...(dto.inviteeIds ?? []),
          dto.organizerId,
        ].map((id) => ({ id }) as User),
      }),
    );



    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      // saving upcoming events in db
      const savedEvents = await queryRunner.manager.save(Event, eventsObj);
      const savedEventIds = savedEvents.map((e) => e.id);

      // querying against the saved events to fetch the complete user details for further audit logging prupose
      const reloadedEvents = await queryRunner.manager
        .createQueryBuilder(Event, 'event')
        .leftJoinAndSelect('event.organizer', 'organizer')
        .leftJoinAndSelect('event.invitees', 'invitees')
        .where('event.id IN (:...ids)', { ids: savedEventIds })
        .orderBy('event.startTime', 'ASC')
        .getMany();

      // grouping events by organizer id
      const eventsByOrganizer = new Map<string, Event[]>();
      for (const event of reloadedEvents) {
        const organizerId = event.organizer?.id;
        if (!organizerId) continue;
        if (!eventsByOrganizer.has(organizerId)) {
          eventsByOrganizer.set(organizerId, []);
        }
        eventsByOrganizer.get(organizerId)!.push(event);
      }


      // finding conflicts and non conflict events, each index in allconflictedgroups arr represents array of conflicted events
      const allConflictGroups: Event[][] = [];
      const nonConflictEvents: Event[] = [];

      for (const [_, orgEvents] of eventsByOrganizer) {
        const groups = this.findConflictGroups(orgEvents);
        for (const group of groups) {
          if (group.length > 1) {
            allConflictGroups.push(group);
          } else {
            nonConflictEvents.push(group[0]);
          }
        }
      }



      const mergedEvents: Event[] = [];
      const aiQueue: { id: string; titles: string[] }[] = [];

      for (const conflictGroup of allConflictGroups) {

        // merging each conflicted group that has conflicted events arr on each index
        const mergedEvent = await this.mergeService.mergeEvent(
          conflictGroup,
          queryRunner,
          true,
        );

        // for each merged group of events saving their titles to fetch summary from AI  
        if (mergedEvent) {
          mergedEvents.push(mergedEvent);
          aiQueue.push({
            id: mergedEvent.id,
            titles: conflictGroup.map((e) => e.title),
          });
        }
      }

      // commiting the transaction saving all events and related data in DB
      await queryRunner.commitTransaction();

      // after data is comitted into database now generating request to fetch and update description for each event after its description is generated 
      // from AI
      for (const { id, titles } of aiQueue) {

        let summary: string;

        try {
          summary = await this.aiService.generateSummary(titles);
        }
        catch (aiErr) {
          summary = `Merged event: ${titles.join(' + ')}`;
        }
        await this.eventsRepository.update(id, { description: summary });

      }

      // ── Reload merged events with final descriptions ───────────────
      const finalMergedEvents = mergedEvents.length > 0
        ? await this.eventsRepository.find({
          where: { id: In(mergedEvents.map((e) => e.id)) },
          relations: ['organizer', 'invitees'],
        })
        : [];


      return {
        summary: {
          total: eventsDto.length,
          inserted: nonConflictEvents.length,
          merged: finalMergedEvents.length,
        },
        created: nonConflictEvents,
        merged: finalMergedEvents,
      };

    }
    catch (err) {
      this.logger.error('Batch insert failed', err);
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw err;
    }
    finally {
      if (!queryRunner.isReleased) {
        await queryRunner.release();
      }
    }
  }


  private findConflictGroups(events: Event[]): Event[][] {
    if (events.length === 0) return [];
    if (events.length === 1) return [[events[0]]];

    // this groups array will be populated by conflicted events as an indivisual group for a particular organizer and it will also include non conflicted event 
    // as group
    const groups: Event[][] = [];

    // for starting initializing currentGroup as first sorted event by earliest start time for a particualr user/organizer
    let currentGroup: Event[] = [events[0]];

    // initalizing maxEndTime as endTime of first sorted event by earliest start time for a particualr user/organizer
    let maxEndTime = events[0].endTime.getTime();

    // comparing with other events of that particualr user to find conflicting events and then make them into groups
    for (let i = 1; i < events.length; i++) {
      const event = events[i];
      const eventStart = event.startTime.getTime();

      if (eventStart <= maxEndTime) {
        currentGroup.push(event);
        maxEndTime = Math.max(maxEndTime, event.endTime.getTime());
      } else {
        groups.push(currentGroup);
        currentGroup = [event];
        maxEndTime = event.endTime.getTime();
      }
    }

    // last remainign event is pushed into the groups arr
    groups.push(currentGroup);
    return groups;
  }
}