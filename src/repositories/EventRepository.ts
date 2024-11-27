import { createConnection } from '../config/database';
import { Event, EventCreationDTO, EventFilters } from '../types';

export class EventRepository {
    private tableName = 'events';

    private formatDate(date: Date): string {
        const offset = date.getTimezoneOffset();
        const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
        return adjustedDate.toISOString().slice(0, 19).replace('T', ' ');
    }

    async create(event: EventCreationDTO, creatorId: number): Promise<number> {
        const connection = await createConnection();
        try {
            console.log('Creating event with creator ID:', creatorId);
            const [result] = await connection.execute(
                `INSERT INTO ${this.tableName} 
                (title, description, betting_start_date, betting_end_date, event_date, creator_id, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    event.title,
                    event.description,
                    this.formatDate(new Date(event.bettingStartDate)),
                    this.formatDate(new Date(event.bettingEndDate)),
                    this.formatDate(new Date(event.eventDate)),
                    creatorId,
                    'PENDING'
                ]
            );
            return (result as any).insertId;
        } catch (error) {
            console.error('Error in EventRepository.create:', error);
            throw error;
        } finally {
            await connection.end();
        }
    }

    async findByFilters(filters: EventFilters): Promise<Event[]> {
        const connection = await createConnection();
        try {
            let query = `SELECT * FROM ${this.tableName} WHERE 1=1`;
            const params: any[] = [];

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

            const [rows] = await connection.execute(query, params);
            return rows as Event[];
        } finally {
            await connection.end();
        }
    }

    async findById(id: number): Promise<Event | null> {
        const connection = await createConnection();
        try {
            console.log('Finding event with ID:', id);
            const [rows] = await connection.execute(
                `SELECT 
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
                WHERE id = ?`,
                [id]
            );
            const events = rows as Event[];
            console.log('Found event:', events[0]);
            return events[0] || null;
        } finally {
            await connection.end();
        }
    }

    async updateStatus(id: number, status: string): Promise<void> {
        const connection = await createConnection();
        try {
            await connection.execute(
                `UPDATE ${this.tableName} SET status = ? WHERE id = ?`,
                [status, id]
            );
        } finally {
            await connection.end();
        }
    }

    async searchByKeyword(keyword: string): Promise<Event[]> {
        const connection = await createConnection();
        try {
            const [rows] = await connection.execute(
                `SELECT * FROM ${this.tableName} 
                WHERE (title LIKE ? OR description LIKE ?) 
                AND status = 'APPROVED'`,
                [`%${keyword}%`, `%${keyword}%`]
            );
            return rows as Event[];
        } finally {
            await connection.end();
        }
    }

    async deleteEvent(eventId: number): Promise<void> {
        const connection = await createConnection();
        try {
            // Primeiro, deletar todas as apostas associadas ao evento
            await connection.execute(
                `DELETE FROM bets WHERE event_id = ?`,
                [eventId]
            );

            // Depois, deletar o evento
            await connection.execute(
                `DELETE FROM ${this.tableName} WHERE id = ?`,
                [eventId]
            );
        } finally {
            await connection.end();
        }
    }
} 