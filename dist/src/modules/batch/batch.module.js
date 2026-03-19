"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const batch_service_1 = require("./batch.service");
const batch_controller_1 = require("./batch.controller");
const event_entity_1 = require("../events/entities/event.entity");
const user_entity_1 = require("../users/entities/user.entity");
const merge_module_1 = require("../merge/merge.module");
const ai_module_1 = require("../ai/ai.module");
let BatchModule = class BatchModule {
};
exports.BatchModule = BatchModule;
exports.BatchModule = BatchModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([event_entity_1.Event, user_entity_1.User]),
            (0, common_1.forwardRef)(() => merge_module_1.MergeModule),
            ai_module_1.AiModule,
        ],
        providers: [batch_service_1.BatchService],
        controllers: [batch_controller_1.BatchController],
        exports: [batch_service_1.BatchService],
    })
], BatchModule);
//# sourceMappingURL=batch.module.js.map