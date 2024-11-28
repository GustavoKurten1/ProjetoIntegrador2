import { User, UserRole } from '../types';
import { createConnection } from '../config/database';

export class UserRepository {
    private tableName = 'users';
    private viewName = 'users_view';

    async create(user: Omit<User, 'id' | 'createdAt'>): Promise<number> {
        const connection = await createConnection();
        try {
            const walletBalance = user.role === UserRole.MODERATOR ? null : 0;

            const [result] = await connection.execute(
                `INSERT INTO ${this.tableName} 
                (name, email, password, birth_date, role, wallet_balance) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    user.name,
                    user.email,
                    user.password,
                    user.birthDate,
                    user.role,
                    walletBalance
                ]
            );
            return (result as any).insertId;
        } finally {
            await connection.end();
        }
    }

    async findByEmailForAuth(email: string): Promise<User | null> {
        const connection = await createConnection();
        try {
            const [rows] = await connection.execute(
                `SELECT * FROM ${this.tableName} WHERE email = ?`,
                [email]
            );
            const users = rows as User[];
            return users[0] || null;
        } finally {
            await connection.end();
        }
    }

    async findByEmail(email: string): Promise<Omit<User, 'password'> | null> {
        const connection = await createConnection();
        try {
            const [rows] = await connection.execute(
                `SELECT * FROM ${this.viewName} WHERE email = ?`,
                [email]
            );
            const users = rows as Omit<User, 'password'>[];
            return users[0] || null;
        } finally {
            await connection.end();
        }
    }

    async findAll(): Promise<Omit<User, 'password'>[]> {
        const connection = await createConnection();
        try {
            const [rows] = await connection.execute(`SELECT * FROM ${this.viewName}`);
            return rows as Omit<User, 'password'>[];
        } finally {
            await connection.end();
        }
    }

    async findById(id: number): Promise<User> {
        const connection = await createConnection();
        try {
            const [rows] = await connection.execute(
                `SELECT * FROM ${this.tableName} WHERE id = ?`,
                [id]
            ) as [any[], any];  // Type assertion here

            if (!rows || rows.length === 0) {
                throw new Error('User not found');
            }

            return rows[0] as User;
        } finally {
            await connection.end();
        }
    }
} 