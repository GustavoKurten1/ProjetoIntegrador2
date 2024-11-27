import { User, UserRole, UserCreationDTO, UserLoginDTO, AuthResponse } from '../types';
import { UserRepository } from '../repositories/UserRepository';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

export class AuthService {
    private userRepository: UserRepository;
    private readonly JWT_SECRET = 'your-secret-key';

    constructor() {
        this.userRepository = new UserRepository();
    }

    private validateAge(birthDate: Date): boolean {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        return age >= 18;
    }

    async signUp(userData: UserCreationDTO): Promise<void> {
        if (!this.validateAge(userData.birthDate)) {
            throw new Error('User must be at least 18 years old');
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        await this.userRepository.create({
            ...userData,
            password: hashedPassword,
            role: userData.role || UserRole.USER,
            walletBalance: 0
        });
    }

    async login(credentials: UserLoginDTO): Promise<string> {
        const user = await this.userRepository.findByEmailForAuth(credentials.email);
        
        if (!user) {
            throw new Error('User not found');
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);
        
        if (!isValidPassword) {
            throw new Error('Invalid password');
        }

        return this.generateToken(user);
    }

    private generateToken(user: User): string {
        return jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '1d' }
        );
    }
} 
