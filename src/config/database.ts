import mysql, { Connection, RowDataPacket } from 'mysql2/promise';

export const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'betting_platform'
};

export async function createConnection(): Promise<Connection> {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Database connected successfully');
        return connection;
    } catch (error) {
        console.error('Error connecting to database:', error);
        throw error;
    }
}

// Função auxiliar para executar queries
export async function executeQuery<T extends RowDataPacket[]>(
    query: string, 
    params: any[] = []
): Promise<T> {
    const connection = await createConnection();
    try {
        const [rows] = await connection.execute<T>(query, params);
        return rows;
    } finally {
        await connection.end();
    }
} 