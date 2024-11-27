import { createConnection } from '../config/database';

export class BaseRepository {
    protected tableName: string;

    constructor(tableName: string) {
        this.tableName = tableName;
    }

    protected async execute(query: string, params: any[] = []) {
        const connection = await createConnection();
        try {
            const [results] = await connection.execute(query, params);
            return results;
        } finally {
            await connection.end();
        }
    }
} 