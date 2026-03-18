import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, In } from 'typeorm';
import { Event } from './entities/event.entity';
import { User } from '../users/entities/user.entity';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  async create(createEventDto: CreateEventDto): Promise<Event> {
    const { organizerId, inviteeIds, ...eventData } = createEventDto;

    const organizer = await this.usersRepository.findOneBy({ id: organizerId });
    if (!organizer) {
      throw new NotFoundException(`User with ID ${organizerId} not found`);
    }

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



    return this.eventsRepository.save(event);
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

  async findConflicts(userId: string): Promise<Event[]> {
    // Find all events where the user is either organizer or invitee
    const userEvents = await this.eventsRepository
      .createQueryBuilder('event')
      .leftJoin('event.organizer', 'organizer')
      .leftJoin('event.invitees', 'invitee')
      .where('organizer.id = :userId OR invitee.id = :userId', { userId })
      .getMany();

    const conflicts: Event[] = [];

    // Simple O(N^2) conflict detection for a single user's schedule
    // In production, this can be optimized with interval trees if N is large.
    for (let i = 0; i < userEvents.length; i++) {
      for (let j = i + 1; j < userEvents.length; j++) {
        const e1 = userEvents[i];
        const e2 = userEvents[j];

        // Overlap condition: (StartA < EndB) and (EndA > StartB)
        if (e1.startTime < e2.endTime && e1.endTime > e2.startTime) {
          if (!conflicts.includes(e1)) conflicts.push(e1);
          if (!conflicts.includes(e2)) conflicts.push(e2);
        }
      }
    }

    return conflicts;
  }
}
