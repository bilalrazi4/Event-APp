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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_entity_1 = require("./entities/event.entity");
const user_entity_1 = require("../users/entities/user.entity");
const merge_service_1 = require("../merge/merge.service");
let EventsService = class EventsService {
    dataSource;
    mergeService;
    eventsRepository;
    usersRepository;
    constructor(dataSource, mergeService, eventsRepository, usersRepository) {
        this.dataSource = dataSource;
        this.mergeService = mergeService;
        this.eventsRepository = eventsRepository;
        this.usersRepository = usersRepository;
    }
    async create(createEventDto) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const { organizerId, inviteeIds, ...eventData } = createEventDto;
            const organizer = await this.usersRepository.findOneBy({ id: organizerId });
            if (!organizer) {
                throw new common_1.NotFoundException(`User with ID ${organizerId} not found`);
            }
            inviteeIds?.push(organizerId);
            const invitees = inviteeIds?.length
                ? await this.usersRepository.findBy({ id: (0, typeorm_2.In)(inviteeIds) })
                : [];
            const event = this.eventsRepository.create({
                ...eventData,
                organizer,
                invitees,
                startTime: new Date(createEventDto.startTime),
                endTime: new Date(createEventDto.endTime),
            });
            const savedEvent = await queryRunner.manager.save(event);
            const conflicts = await this.checkOrganizerConflicts(organizerId, savedEvent.startTime, savedEvent.endTime, queryRunner);
            if (conflicts.length > 1) {
                const mergedEvent = await this.mergeService.mergeEvent(conflicts, queryRunner);
                return mergedEvent;
            }
            await queryRunner.commitTransaction();
            return savedEvent;
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            if (!queryRunner.isReleased) {
                await queryRunner.release();
            }
        }
    }
    async checkOrganizerConflicts(organizerId, startTime, endTime, queryRunner) {
        return queryRunner.manager
            .createQueryBuilder(event_entity_1.Event, 'event')
            .leftJoinAndSelect('event.organizer', 'organizer')
            .leftJoinAndSelect('event.invitees', 'invitees')
            .where('organizer.id = :organizerId', { organizerId })
            .andWhere('event.startTime <= :endTime', { endTime })
            .andWhere('event.endTime >= :startTime', { startTime })
            .getMany();
    }
    async findAll() {
        return this.eventsRepository.find({ relations: ['organizer', 'invitees'] });
    }
    async findOne(id) {
        const event = await this.eventsRepository.findOne({
            where: { id },
            relations: ['organizer', 'invitees'],
        });
        if (!event) {
            throw new common_1.NotFoundException(`Event with ID ${id} not found`);
        }
        return event;
    }
    async update(id, updateEventDto) {
        const event = await this.findOne(id);
        const updated = Object.assign(event, {
            ...updateEventDto,
            startTime: updateEventDto.startTime ? new Date(updateEventDto.startTime) : event.startTime,
            endTime: updateEventDto.endTime ? new Date(updateEventDto.endTime) : event.endTime,
        });
        return this.eventsRepository.save(updated);
    }
    async remove(id) {
        const result = await this.eventsRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`Event with ID ${id} not found`);
        }
    }
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => merge_service_1.MergeService))),
    __param(2, (0, typeorm_1.InjectRepository)(event_entity_1.Event)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        merge_service_1.MergeService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], EventsService);
//# sourceMappingURL=events.service.js.map