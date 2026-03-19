import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource, QueryRunner } from 'typeorm';
import { Event } from './entities/event.entity';
import { User } from '../users/entities/user.entity';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
import { MergeService } from '../merge/merge.service';

@Injectable()
export class EventsService {
  constructor(
    private dataSource: DataSource,
    @Inject(forwardRef(() => MergeService))
    private mergeService: MergeService,
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  async create(createEventDto: CreateEventDto): Promise<Event | null> {

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { organizerId, inviteeIds, ...eventData } = createEventDto;

      const organizer = await this.usersRepository.findOneBy({ id: organizerId });

      if (!organizer) {
        throw new NotFoundException(`User with ID ${organizerId} not found`);
      }

      // adding this because an organizer can be an attendee as well
      inviteeIds?.push(organizerId);
      const invitees = inviteeIds?.length
        ? await this.usersRepository.findBy({ id: In(inviteeIds) })
        : [];

      const event = this.eventsRepository.create({
        ...eventData,
        organizer,
        invitees,
        startTime: new Date(createEventDto.startTime),
        endTime: new Date(createEventDto.endTime),
      });

      const savedEvent = await queryRunner.manager.save(event);

      const conflicts = await this.checkOrganizerConflicts(organizerId, savedEvent.startTime, savedEvent.endTime, queryRunner);

      if (conflicts.length > 1) {
        const mergedEvent = await this.mergeService.mergeEvent(conflicts, queryRunner);
        return mergedEvent;
      }

      await queryRunner.commitTransaction();
      return savedEvent;
    }

    catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    }

    finally {

      if (!queryRunner.isReleased) {
        await queryRunner.release();
      }
    }

  }


  private async checkOrganizerConflicts(organizerId: string, startTime: Date, endTime: Date, queryRunner: QueryRunner): Promise<Event[]> {
    return queryRunner.manager
      .createQueryBuilder(Event, 'event')
      .leftJoinAndSelect('event.organizer', 'organizer')
      .leftJoinAndSelect('event.invitees', 'invitees')
      .where('organizer.id = :organizerId', { organizerId })
      .andWhere('event.startTime <= :endTime', { endTime })
      .andWhere('event.endTime >= :startTime', { startTime })
      .getMany();
  }

  async findAll(): Promise<Event[]> {
    return this.eventsRepository.find({ relations: ['organizer', 'invitees'] });
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventsRepository.findOne({
      where: { id },
      relations: ['organizer', 'invitees'],
    });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id);
    const updated = Object.assign(event, {
      ...updateEventDto,
      startTime: updateEventDto.startTime ? new Date(updateEventDto.startTime) : event.startTime,
      endTime: updateEventDto.endTime ? new Date(updateEventDto.endTime) : event.endTime,
    });
    return this.eventsRepository.save(updated);
  }

  async remove(id: string): Promise<void> {
    const result = await this.eventsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
  }


}
