import { createConnection } from '../config/database';
import { WalletTransaction } from '../types';

export class WalletRepository {
    private tableName = 'wallet_transactions';

    async createTransaction(transaction: Omit<WalletTransaction, 'id' | 'createdAt'>): Promise<number> {
        const connection = await createConnection();
        try {
            const [result] = await connection.execute(
                `INSERT INTO ${this.tableName} 
                (user_id, amount, type, status) 
                VALUES (?, ?, ?, ?)`,
                [
                    transaction.userId,
                    transaction.amount,
                    transaction.type,
                    transaction.status
                ]
            );
            return (result as any).insertId;
        } finally {
            await connection.end();
        }
    }

    async updateUserBalance(userId: number, amount: number): Promise<void> {
        const connection = await createConnection();
        try {
            await connection.execute(
                'UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?',
                [amount, userId]
            );
        } finally {
            await connection.end();
        }
    }

    async getUserBalance(userId: number): Promise<number> {
        const connection = await createConnection();
        try {
            const [rows] = await connection.execute(
                'SELECT wallet_balance FROM users WHERE id = ?',
                [userId]
            );
            return (rows as any)[0]?.wallet_balance || 0;
        } finally {
            await connection.end();
        }
    }
} 