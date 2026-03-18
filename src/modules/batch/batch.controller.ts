import { Controller, Post, Body } from '@nestjs/common';
import { BatchService } from './batch.service';
import { CreateEventDto } from '../events/dto/event.dto';

@Controller('events')
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Post('batch')
  async batchInsert(@Body() events: CreateEventDto[]) {
    return this.batchService.batchInsert(events);
  }
}
