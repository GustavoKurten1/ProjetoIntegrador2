import { createConnection } from '../config/database';
import { Bet, BetDTO } from '../types';

export class BetRepository {
    private tableName = 'bets';

    async create(bet: BetDTO, userId: number): Promise<number> {
        const connection = await createConnection();
        try {
            const [result] = await connection.execute(
                `INSERT INTO ${this.tableName} 
                (event_id, user_id, amount, bet_choice) 
                VALUES (?, ?, ?, ?)`,
                [bet.eventId, userId, bet.amount, bet.choice]
            );
            return (result as any).insertId;
        } finally {
            await connection.end();
        }
    }

    async findByEventId(eventId: number): Promise<Bet[]> {
        const connection = await createConnection();
        try {
            const [rows] = await connection.execute(
                `SELECT * FROM ${this.tableName} WHERE event_id = ?`,
                [eventId]
            );
            return rows as Bet[];
        } finally {
            await connection.end();
        }
    }
} 