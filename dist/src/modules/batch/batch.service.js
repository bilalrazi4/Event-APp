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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const event_entity_1 = require("../events/entities/event.entity");
let BatchService = class BatchService {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async batchInsert(eventsDto) {
        if (eventsDto.length > 500) {
            throw new common_1.BadRequestException('Batch size exceeds 500 events');
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const events = eventsDto.map((dto) => {
                const event = new event_entity_1.Event();
                event.title = dto.title;
                event.description = dto.description;
                event.status = dto.status ?? event_entity_1.EventStatus.TODO;
                event.startTime = new Date(dto.startTime);
                event.endTime = new Date(dto.endTime);
                event.organizer = { id: dto.organizerId };
                return event;
            });
            await queryRunner.manager.insert(event_entity_1.Event, events);
            await queryRunner.commitTransaction();
            return { count: events.length };
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
};
exports.BatchService = BatchService;
exports.BatchService = BatchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], BatchService);
//# sourceMappingURL=batch.service.js.map