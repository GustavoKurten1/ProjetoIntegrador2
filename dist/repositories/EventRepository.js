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
exports.EventRepository = void 0;
const database_1 = require("../config/database");
class EventRepository {
    constructor() {
        this.tableName = 'events';
    }
    formatDate(date) {
        const offset = date.getTimezoneOffset();
        const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
        return adjustedDate.toISOString().slice(0, 19).replace('T', ' ');
    }
    create(event, creatorId) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield (0, database_1.createConnection)();
            try {
                console.log('Creating event with creator ID:', creatorId);
                const [result] = yield connection.execute(`INSERT INTO ${this.tableName} 
                (title, description, betting_start_date, betting_end_date, event_date, creator_id, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`, [
                    event.title,
                    event.description,
                    this.formatDate(new Date(event.bettingStartDate)),
                    this.formatDate(new Date(event.bettingEndDate)),
                    this.formatDate(new Date(event.eventDate)),
                    creatorId,
                    'PENDING'
                ]);
                return result.insertId;
            }
            catch (error) {
                console.error('Error in EventRepository.create:', error);
                throw error;
            }
            finally {
                yield connection.end();
            }
        });
    }
    findByFilters(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield (0, database_1.createConnection)();
            try {
                let query = `SELECT * FROM ${this.tableName} WHERE 1=1`;
                const params = [];
                if (filters.status) {
                    query += ' AND status = ?';
                    params.push(filters.status);
                }
                if (filters.startDate) {
                    query += ' AND betting_start_date >= ?';
                    params.push(filters.startDate);
                }
                if (filters.endDate) {
                    query += ' AND betting_end_date <= ?';
                    params.push(filters.endDate);
                }
                const [rows] = yield connection.execute(query, params);
                return rows;
            }
            finally {
                yield connection.end();
            }
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield (0, database_1.createConnection)();
            try {
                console.log('Finding event with ID:', id);
                const [rows] = yield connection.execute(`SELECT 
                    id,
                    title,
                    description,
                    betting_start_date as bettingStartDate,
                    betting_end_date as bettingEndDate,
                    event_date as eventDate,
                    creator_id as creatorId,
                    status,
                    created_at as createdAt
                FROM ${this.tableName} 
                WHERE id = ?`, [id]);
                const events = rows;
                console.log('Found event:', events[0]);
                return events[0] || null;
            }
            finally {
                yield connection.end();
            }
        });
    }
    updateStatus(id, status) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield (0, database_1.createConnection)();
            try {
                yield connection.execute(`UPDATE ${this.tableName} SET status = ? WHERE id = ?`, [status, id]);
            }
            finally {
                yield connection.end();
            }
        });
    }
    searchByKeyword(keyword) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield (0, database_1.createConnection)();
            try {
                const [rows] = yield connection.execute(`SELECT * FROM ${this.tableName} 
                WHERE (title LIKE ? OR description LIKE ?) 
                AND status = 'APPROVED'`, [`%${keyword}%`, `%${keyword}%`]);
                return rows;
            }
            finally {
                yield connection.end();
            }
        });
    }
    deleteEvent(eventId) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield (0, database_1.createConnection)();
            try {
                // Primeiro, deletar todas as apostas associadas ao evento
                yield connection.execute(`DELETE FROM bets WHERE event_id = ?`, [eventId]);
                // Depois, deletar o evento
                yield connection.execute(`DELETE FROM ${this.tableName} WHERE id = ?`, [eventId]);
            }
            finally {
                yield connection.end();
            }
        });
    }
}
exports.EventRepository = EventRepository;
