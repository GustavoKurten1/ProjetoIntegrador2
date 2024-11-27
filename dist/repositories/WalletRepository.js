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
exports.WalletRepository = void 0;
const database_1 = require("../config/database");
class WalletRepository {
    constructor() {
        this.tableName = 'wallet_transactions';
    }
    createTransaction(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield (0, database_1.createConnection)();
            try {
                const [result] = yield connection.execute(`INSERT INTO ${this.tableName} 
                (user_id, amount, type, status) 
                VALUES (?, ?, ?, ?)`, [
                    transaction.userId,
                    transaction.amount,
                    transaction.type,
                    transaction.status
                ]);
                return result.insertId;
            }
            finally {
                yield connection.end();
            }
        });
    }
    updateUserBalance(userId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield (0, database_1.createConnection)();
            try {
                yield connection.execute('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?', [amount, userId]);
            }
            finally {
                yield connection.end();
            }
        });
    }
    getUserBalance(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const connection = yield (0, database_1.createConnection)();
            try {
                const [rows] = yield connection.execute('SELECT wallet_balance FROM users WHERE id = ?', [userId]);
                return ((_a = rows[0]) === null || _a === void 0 ? void 0 : _a.wallet_balance) || 0;
            }
            finally {
                yield connection.end();
            }
        });
    }
}
exports.WalletRepository = WalletRepository;
