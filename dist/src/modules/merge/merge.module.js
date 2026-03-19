"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MergeModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const merge_service_1 = require("./merge.service");
const merge_controller_1 = require("./merge.controller");
const event_entity_1 = require("../events/entities/event.entity");
const audit_log_entity_1 = require("../audit/entities/audit-log.entity");
const events_module_1 = require("../events/events.module");
const ai_module_1 = require("../ai/ai.module");
const batch_module_1 = require("../batch/batch.module");
let MergeModule = class MergeModule {
};
exports.MergeModule = MergeModule;
exports.MergeModule = MergeModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([event_entity_1.Event, audit_log_entity_1.AuditLog]),
            (0, common_1.forwardRef)(() => events_module_1.EventsModule),
            (0, common_1.forwardRef)(() => batch_module_1.BatchModule),
            ai_module_1.AiModule,
        ],
        providers: [merge_service_1.MergeService],
        controllers: [merge_controller_1.MergeController],
        exports: [merge_service_1.MergeService],
    })
], MergeModule);
//# sourceMappingURL=merge.module.js.map