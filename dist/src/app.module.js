"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const cache_manager_1 = require("@nestjs/cache-manager");
const cache_manager_redis_yet_1 = require("cache-manager-redis-yet");
const users_module_1 = require("./modules/users/users.module");
const events_module_1 = require("./modules/events/events.module");
const merge_module_1 = require("./modules/merge/merge.module");
const ai_module_1 = require("./modules/ai/ai.module");
const audit_module_1 = require("./modules/audit/audit.module");
const batch_module_1 = require("./modules/batch/batch.module");
const user_entity_1 = require("./modules/users/entities/user.entity");
const event_entity_1 = require("./modules/events/entities/event.entity");
const audit_log_entity_1 = require("./modules/audit/entities/audit-log.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    type: 'postgres',
                    host: configService.get('DB_HOST'),
                    port: configService.get('DB_PORT'),
                    username: configService.get('DB_USER'),
                    password: configService.get('DB_PASSWORD'),
                    database: configService.get('DB_NAME'),
                    entities: [user_entity_1.User, event_entity_1.Event, audit_log_entity_1.AuditLog],
                    synchronize: true,
                }),
            }),
            cache_manager_1.CacheModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: async (configService) => ({
                    store: await (0, cache_manager_redis_yet_1.redisStore)({
                        url: `redis://${configService.get('REDIS_HOST')}:${configService.get('REDIS_PORT')}`,
                    }),
                }),
                isGlobal: true,
            }),
            users_module_1.UsersModule,
            events_module_1.EventsModule,
            merge_module_1.MergeModule,
            ai_module_1.AiModule,
            audit_module_1.AuditModule,
            batch_module_1.BatchModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map