import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event } from './entities/event.entity';
import { User } from '../users/entities/user.entity';
import { MergeModule } from '../merge/merge.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, User]),
    forwardRef(() => MergeModule),
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule { }