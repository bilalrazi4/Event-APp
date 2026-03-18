import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MergeService } from './merge.service';
import { MergeController } from './merge.controller';
import { Event } from '../events/entities/event.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { EventsModule } from '../events/events.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, AuditLog]),
    EventsModule,
    AiModule,
  ],
  controllers: [MergeController],
  providers: [MergeService],
})
export class MergeModule {}
