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
    walletBalance: number | null;
    createdAt?: Date;
}

export interface UserCreationDTO {
    name: string;
    email: string;
    password: string;
    birthDate: Date;
    role?: UserRole;
}

export interface UserLoginDTO {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: Omit<User, 'password'>;
}

export interface EventFilters {
    status?: string;
    startDate?: Date;
    endDate?: Date;
}

export interface Event {
    id: number;
    title: string;
    description: string;
    bettingStartDate: Date;
    bettingEndDate: Date;
    eventDate: Date;
    creatorId: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DELETED';
    createdAt?: Date;
}

export interface EventCreationDTO {
    title: string;
    description: string;
    bettingStartDate: Date;
    bettingEndDate: Date;
    eventDate: Date;
}

export interface Bet {
    id: number;
    eventId: number;
    userId: number;
    amount: number;
    betChoice: boolean;
    createdAt?: Date;
}

export interface WalletTransaction {
    id: number;
    userId: number;
    amount: number;
    type: 'DEPOSIT' | 'WITHDRAW' | 'BET' | 'WINNING';
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    createdAt?: Date;
}

export interface FundsDTO {
    amount: number;
    cardNumber?: string;  // Para depósitos
    bankAccount?: string; // Para saques
}

export interface BetDTO {
    eventId: number;
    amount: number;
    choice: boolean;
}

export interface FinishEventDTO {
    eventId: number;
    result: boolean;
}