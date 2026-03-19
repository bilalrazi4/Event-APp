"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BatchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const event_entity_1 = require("../events/entities/event.entity");
const merge_service_1 = require("../merge/merge.service");
const ai_service_1 = require("../ai/ai.service");
let BatchService = BatchService_1 = class BatchService {
    dataSource;
    eventsRepository;
    mergeService;
    aiService;
    logger = new common_1.Logger(BatchService_1.name);
    constructor(dataSource, eventsRepository, mergeService, aiService) {
        this.dataSource = dataSource;
        this.eventsRepository = eventsRepository;
        this.mergeService = mergeService;
        this.aiService = aiService;
    }
    async batchInsert(eventsDto) {
        if (eventsDto.length > 500) {
            throw new common_1.BadRequestException('Batch size exceeds 500 events');
        }
        const eventsObj = eventsDto.map((dto) => this.eventsRepository.create({
            title: dto.title,
            description: dto.description,
            status: dto.status,
            startTime: new Date(dto.startTime),
            endTime: new Date(dto.endTime),
            organizer: { id: dto.organizerId },
            invitees: [
                ...(dto.inviteeIds ?? []),
                dto.organizerId,
            ].map((id) => ({ id })),
        }));
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const savedEvents = await queryRunner.manager.save(event_entity_1.Event, eventsObj);
            const savedEventIds = savedEvents.map((e) => e.id);
            const reloadedEvents = await queryRunner.manager
                .createQueryBuilder(event_entity_1.Event, 'event')
                .leftJoinAndSelect('event.organizer', 'organizer')
                .leftJoinAndSelect('event.invitees', 'invitees')
                .where('event.id IN (:...ids)', { ids: savedEventIds })
                .orderBy('event.startTime', 'ASC')
                .getMany();
            const eventsByOrganizer = new Map();
            for (const event of reloadedEvents) {
                const organizerId = event.organizer?.id;
                if (!organizerId)
                    continue;
                if (!eventsByOrganizer.has(organizerId)) {
                    eventsByOrganizer.set(organizerId, []);
                }
                eventsByOrganizer.get(organizerId).push(event);
            }
            const allConflictGroups = [];
            const nonConflictEvents = [];
            for (const [_, orgEvents] of eventsByOrganizer) {
                const groups = this.findConflictGroups(orgEvents);
                for (const group of groups) {
                    if (group.length > 1) {
                        allConflictGroups.push(group);
                    }
                    else {
                        nonConflictEvents.push(group[0]);
                    }
                }
            }
            const mergedEvents = [];
            const aiQueue = [];
            for (const conflictGroup of allConflictGroups) {
                const mergedEvent = await this.mergeService.mergeEvent(conflictGroup, queryRunner, true);
                if (mergedEvent) {
                    mergedEvents.push(mergedEvent);
                    aiQueue.push({
                        id: mergedEvent.id,
                        titles: conflictGroup.map((e) => e.title),
                    });
                }
            }
            await queryRunner.commitTransaction();
            for (const { id, titles } of aiQueue) {
                let summary;
                try {
                    summary = await this.aiService.generateSummary(titles);
                }
                catch (aiErr) {
                    summary = `Merged event: ${titles.join(' + ')}`;
                }
                await this.eventsRepository.update(id, { description: summary });
            }
            const finalMergedEvents = mergedEvents.length > 0
                ? await this.eventsRepository.find({
                    where: { id: (0, typeorm_1.In)(mergedEvents.map((e) => e.id)) },
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
    findConflictGroups(events) {
        if (events.length === 0)
            return [];
        if (events.length === 1)
            return [[events[0]]];
        const groups = [];
        let currentGroup = [events[0]];
        let maxEndTime = events[0].endTime.getTime();
        for (let i = 1; i < events.length; i++) {
            const event = events[i];
            const eventStart = event.startTime.getTime();
            if (eventStart <= maxEndTime) {
                currentGroup.push(event);
                maxEndTime = Math.max(maxEndTime, event.endTime.getTime());
            }
            else {
                groups.push(currentGroup);
                currentGroup = [event];
                maxEndTime = event.endTime.getTime();
            }
        }
        groups.push(currentGroup);
        return groups;
    }
};
exports.BatchService = BatchService;
exports.BatchService = BatchService = BatchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_2.InjectRepository)(event_entity_1.Event)),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => merge_service_1.MergeService))),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        typeorm_1.Repository,
        merge_service_1.MergeService,
        ai_service_1.AiService])
], BatchService);
//# sourceMappingURL=batch.service.js.map