import { Controller, Post, Param } from '@nestjs/common';
import { MergeService } from './merge.service';

@Controller('events')
export class MergeController {
  constructor(private readonly mergeService: MergeService) { }

  // @Post('merge-all/:userId')
  // async mergeAll(@Param('userId') userId: string) {
  //   const mergedEvent = await this.mergeService.mergeAllForUser(userId);
  //   return {
  //     message: mergedEvent ? 'Events merged successfully' : 'No conflicts found to merge',
  //     event: mergedEvent,
  //   };
  // }
}
