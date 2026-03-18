import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Event, EventStatus } from '../events/entities/event.entity';
import { CreateEventDto } from '../events/dto/event.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class BatchService {
  constructor(private dataSource: DataSource) { }

  async batchInsert(eventsDto: CreateEventDto[]): Promise<{ count: number }> {
    if (eventsDto.length > 500) {
      throw new BadRequestException('Batch size exceeds 500 events');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const events = eventsDto.map((dto) => {
        const event = new Event();
        event.title = dto.title;
        event.description = dto.description;
        event.status = dto.status ?? EventStatus.TODO;
        event.startTime = new Date(dto.startTime);
        event.endTime = new Date(dto.endTime);
        // Mapping organizer manually for bulk insert efficiency if needed
        // But here we use repository for simplicity first, then check speed.
        // For true bulk, we'd use insert() with array of objects.
        event.organizer = { id: dto.organizerId } as User;
        return event;
      });

      // Using manager.insert for high performance bulk insert
      await queryRunner.manager.insert(Event, events);

      await queryRunner.commitTransaction();
      return { count: events.length };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
