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
var MergeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MergeService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_entity_1 = require("../events/entities/event.entity");
const audit_log_entity_1 = require("../audit/entities/audit-log.entity");
const events_service_1 = require("../events/events.service");
const ai_service_1 = require("../ai/ai.service");
let MergeService = MergeService_1 = class MergeService {
    dataSource;
    eventsService;
    eventsRepository;
    auditRepository;
    aiService;
    logger = new common_1.Logger(MergeService_1.name);
    constructor(dataSource, eventsService, eventsRepository, auditRepository, aiService) {
        this.dataSource = dataSource;
        this.eventsService = eventsService;
        this.eventsRepository = eventsRepository;
        this.auditRepository = auditRepository;
        this.aiService = aiService;
    }
    async mergeAllForUser(userId) {
        const conflicts = await this.eventsService.findConflicts(userId);
        if (conflicts.length < 2) {
            return null;
        }
        conflicts.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        const titles = [...new Set(conflicts.map((e) => e.title))];
        const newTitle = titles.join(' + ');
        const statusPrecedence = [
            event_entity_1.EventStatus.CANCELED,
            event_entity_1.EventStatus.TODO,
            event_entity_1.EventStatus.IN_PROGRESS,
            event_entity_1.EventStatus.COMPLETED,
        ];
        let latestStatus = event_entity_1.EventStatus.TODO;
        let maxPrecedence = -1;
        conflicts.forEach((e) => {
            const p = statusPrecedence.indexOf(e.status);
            if (p > maxPrecedence) {
                maxPrecedence = p;
                latestStatus = e.status;
            }
        });
        const startTime = conflicts[0].startTime;
        const endTime = new Date(Math.max(...conflicts.map((e) => e.endTime.getTime())));
        const inviteeMap = new Map();
        conflicts.forEach(e => {
            e.invitees?.forEach(u => inviteeMap.set(u.id, u));
        });
        const invitees = Array.from(inviteeMap.values());
        const organizer = conflicts[0].organizer;
        const oldEventIds = conflicts.map((e) => e.id);
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const newEvent = this.eventsRepository.create({
                title: newTitle,
                status: latestStatus,
                startTime,
                endTime,
                organizer,
                invitees,
                mergedFrom: oldEventIds,
            });
            const savedEvent = await queryRunner.manager.save(newEvent);
            const auditLog = this.auditRepository.create({
                newEventId: savedEvent.id,
            });
            await queryRunner.manager.save(auditLog);
            await queryRunner.manager.delete(event_entity_1.Event, { id: (0, typeorm_2.In)(oldEventIds) });
            await queryRunner.commitTransaction();
            const summary = await this.aiService.generateSummary(titles);
            await this.eventsRepository.update(savedEvent.id, {
                description: summary,
            });
            const updatedEvent = await this.eventsRepository.findOneBy({ id: savedEvent.id });
            return updatedEvent;
        }
        catch (err) {
            this.logger.error('Merge failed', err);
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
    async mergeEvent(conflicts, queryRunner) {
        if (conflicts.length < 2) {
            await queryRunner.commitTransaction();
            return null;
        }
        conflicts.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        const oldEventsSnapshot = conflicts.map((e) => ({
            id: e.id,
            title: e.title,
            description: e.description ?? null,
            status: e.status,
            startTime: e.startTime,
            endTime: e.endTime,
            organizerId: e.organizer?.id ?? null,
            organizerName: e.organizer?.name ?? null,
            invitees: e.invitees?.map((u) => ({
                id: u.id,
                name: u.name,
                email: u.email,
            })) ?? [],
            mergedFrom: e.mergedFrom ?? [],
        }));
        const titles = [...new Set(conflicts.map((e) => e.title))];
        const newTitle = titles.join(' + ');
        const statusPrecedence = [
            event_entity_1.EventStatus.CANCELED,
            event_entity_1.EventStatus.TODO,
            event_entity_1.EventStatus.IN_PROGRESS,
            event_entity_1.EventStatus.COMPLETED,
        ];
        let latestStatus = event_entity_1.EventStatus.TODO;
        let maxPrecedence = -1;
        conflicts.forEach((e) => {
            const p = statusPrecedence.indexOf(e.status);
            if (p > maxPrecedence) {
                maxPrecedence = p;
                latestStatus = e.status;
            }
        });
        const startTime = conflicts[0].startTime;
        const endTime = new Date(Math.max(...conflicts.map((e) => e.endTime.getTime())));
        const inviteeMap = new Map();
        conflicts.forEach(e => {
            e.invitees?.forEach(u => inviteeMap.set(u.id, u));
        });
        const invitees = Array.from(inviteeMap.values());
        const organizer = conflicts[0].organizer;
        const oldEventIds = conflicts.map((e) => e.id);
        try {
            const newEvent = this.eventsRepository.create({
                title: newTitle,
                status: latestStatus,
                startTime,
                endTime,
                organizer,
                invitees,
                mergedFrom: oldEventIds,
            });
            const savedEvent = await queryRunner.manager.save(newEvent);
            const auditLog = this.auditRepository.create({
                oldEvents: oldEventsSnapshot,
                newEventId: savedEvent.id,
            });
            await queryRunner.manager.save(auditLog);
            await queryRunner.manager.delete(event_entity_1.Event, { id: (0, typeorm_2.In)(oldEventIds) });
            await queryRunner.commitTransaction();
            const summary = await this.aiService.generateSummary(titles);
            await this.eventsRepository.update(savedEvent.id, {
                description: summary,
            });
            const updatedEvent = await this.eventsRepository.findOneBy({ id: savedEvent.id });
            return updatedEvent;
        }
        catch (err) {
            this.logger.error('Merge failed', err);
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
};
exports.MergeService = MergeService;
exports.MergeService = MergeService = MergeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => events_service_1.EventsService))),
    __param(2, (0, typeorm_1.InjectRepository)(event_entity_1.Event)),
    __param(3, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        events_service_1.EventsService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        ai_service_1.AiService])
], MergeService);
//# sourceMappingURL=merge.service.js.map