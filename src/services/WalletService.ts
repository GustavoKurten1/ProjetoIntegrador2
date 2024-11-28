import { WalletRepository } from '../repositories/WalletRepository';
import { FundsDTO } from '../types';

export class WalletService {
    private walletRepository: WalletRepository;

    constructor() {
        this.walletRepository = new WalletRepository();
    }

    private calculateWithdrawalFee(amount: number): number {
        if (amount <= 100) {
            return amount * 0.04; // 4%
        } else if (amount <= 1000) {
            return amount * 0.03; // 3%
        } else if (amount <= 5000) {
            return amount * 0.02; // 2%
        } else if (amount <= 100000) {
            return amount * 0.01; // 1%
        } else {
            return 0; // Isento
        }
    }

    async addFunds(userId: number, fundsData: FundsDTO): Promise<void> {
        if (fundsData.amount <= 0) {
            throw new Error('O valor do depósito deve ser maior que zero');
        }

        await this.walletRepository.createTransaction({
            userId,
            amount: fundsData.amount,
            type: 'DEPOSIT',
            status: 'COMPLETED'
        });

        await this.walletRepository.updateUserBalance(userId, fundsData.amount);
    }

    async withdrawFunds(userId: number, fundsData: FundsDTO): Promise<void> {
        if (fundsData.amount <= 0) {
            throw new Error('O valor do saque deve ser maior que zero');
        }

        const currentBalance = await this.walletRepository.getUserBalance(userId);
        const withdrawalFee = this.calculateWithdrawalFee(fundsData.amount);
        const totalAmount = fundsData.amount + withdrawalFee;
        
        if (currentBalance < totalAmount) {
            throw new Error('Saldo insuficiente (incluindo taxa de saque)');
        }

        await this.walletRepository.createTransaction({
            userId,
            amount: -totalAmount,
            type: 'WITHDRAW',
            status: 'COMPLETED'
        });

        await this.walletRepository.updateUserBalance(userId, -totalAmount);
    }

    async getBalance(userId: number): Promise<number> {
        try {
            const balance = await this.walletRepository.getUserBalance(userId);
            return balance || 0;
        } catch (error) {
            console.error('Error getting balance:', error);
            return 0;
        }
    }
} 