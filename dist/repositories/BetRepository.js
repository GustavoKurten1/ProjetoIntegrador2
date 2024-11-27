"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BetRepository = void 0;
const database_1 = require("../config/database");
class BetRepository {
    constructor() {
        this.tableName = 'bets';
    }
    create(bet, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield (0, database_1.createConnection)();
            try {
                const [result] = yield connection.execute(`INSERT INTO ${this.tableName} 
                (event_id, user_id, amount, bet_choice) 
                VALUES (?, ?, ?, ?)`, [bet.eventId, userId, bet.amount, bet.choice]);
                return result.insertId;
            }
            finally {
                yield connection.end();
            }
        });
    }
    findByEventId(eventId) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield (0, database_1.createConnection)();
            try {
                const [rows] = yield connection.execute(`SELECT * FROM ${this.tableName} WHERE event_id = ?`, [eventId]);
                return rows;
            }
            finally {
                yield connection.end();
            }
        });
    }
}
exports.BetRepository = BetRepository;
