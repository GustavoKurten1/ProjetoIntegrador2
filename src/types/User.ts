export enum UserRole {
    USER = 'USER',
    MODERATOR = 'MODERATOR'
}

export interface User {
    id: number;
    name: string;
    email: string;
    password: string;
    birthDate: Date;
    role: UserRole;
    walletBalance: number;
    createdAt?: Date;
}

export interface Event {
    id: number;
    title: string;
    description: string;
    quotaValue: number;
    bettingStartDate: Date;
    bettingEndDate: Date;
    eventDate: Date;
    creatorId: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DELETED';
    createdAt?: Date;
}

export interface Bet {
    id: number;
    eventId: number;
    userId: number;
    amount: number;
    betChoice: boolean;
    createdAt?: Date;
} 