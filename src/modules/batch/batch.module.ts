import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatchService } from './batch.service';
import { BatchController } from './batch.controller';
import { Event } from '../events/entities/event.entity';
import { User } from '../users/entities/user.entity';
import { MergeModule } from '../merge/merge.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, User]),
    forwardRef(() => MergeModule),
    AiModule,
  ],
  providers: [BatchService],
  controllers: [BatchController],
  exports: [BatchService],
})
export class BatchModule { }