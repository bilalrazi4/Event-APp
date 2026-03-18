"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const pg_promise_1 = __importDefault(require("pg-promise"));
dotenv.config();
const pgp = (0, pg_promise_1.default)();
async function bootstrapDatabase() {
    const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
    const db = pgp({
        host: DB_HOST,
        port: parseInt(DB_PORT || '5432', 10),
        user: DB_USER,
        password: DB_PASSWORD,
        database: 'postgres',
    });
    try {
        const result = await db.any('SELECT datname FROM pg_database WHERE datname = $1', [DB_NAME]);
        if (result.length === 0) {
            console.log(`🚀 Database "${DB_NAME}" does not exist. Creating it now...`);
            await db.none(`CREATE DATABASE "${DB_NAME}"`);
            console.log(`✅ Database "${DB_NAME}" created successfully.`);
        }
        else {
            console.log(`✅ Database "${DB_NAME}" already exists.`);
        }
    }
    catch (error) {
        console.error('❌ Error checking/creating database:', error);
        process.exit(1);
    }
    finally {
        pgp.end();
    }
}
bootstrapDatabase();
//# sourceMappingURL=create-db.js.map