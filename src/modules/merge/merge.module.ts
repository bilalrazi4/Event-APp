import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MergeService } from './merge.service';
import { MergeController } from './merge.controller';
import { Event } from '../events/entities/event.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { EventsModule } from '../events/events.module';
import { AiModule } from '../ai/ai.module';
import { BatchModule } from '../batch/batch.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, AuditLog]),
    forwardRef(() => EventsModule),
    forwardRef(() => BatchModule),
    AiModule,
  ],
  providers: [MergeService],
  controllers: [MergeController],
  exports: [MergeService],
})
export class MergeModule { }