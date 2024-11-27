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
exports.UserRepository = void 0;
const types_1 = require("../types");
const database_1 = require("../config/database");
class UserRepository {
    constructor() {
        this.tableName = 'users';
        this.viewName = 'users_view';
    }
    create(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield (0, database_1.createConnection)();
            try {
                const walletBalance = user.role === types_1.UserRole.MODERATOR ? null : 0;
                const [result] = yield connection.execute(`INSERT INTO ${this.tableName} 
                (name, email, password, birth_date, role, wallet_balance) 
                VALUES (?, ?, ?, ?, ?, ?)`, [
                    user.name,
                    user.email,
                    user.password,
                    user.birthDate,
                    user.role,
                    walletBalance
                ]);
                return result.insertId;
            }
            finally {
                yield connection.end();
            }
        });
    }
    findByEmailForAuth(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield (0, database_1.createConnection)();
            try {
                const [rows] = yield connection.execute(`SELECT * FROM ${this.tableName} WHERE email = ?`, [email]);
                const users = rows;
                return users[0] || null;
            }
            finally {
                yield connection.end();
            }
        });
    }
    findByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield (0, database_1.createConnection)();
            try {
                const [rows] = yield connection.execute(`SELECT * FROM ${this.viewName} WHERE email = ?`, [email]);
                const users = rows;
                return users[0] || null;
            }
            finally {
                yield connection.end();
            }
        });
    }
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield (0, database_1.createConnection)();
            try {
                const [rows] = yield connection.execute(`SELECT * FROM ${this.viewName}`);
                return rows;
            }
            finally {
                yield connection.end();
            }
        });
    }
}
exports.UserRepository = UserRepository;
