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
        // Simulação de validação de cartão de crédito
        if (!fundsData.cardNumber || fundsData.cardNumber.length !== 16) {
            throw new Error('Invalid card number');
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
        const currentBalance = await this.walletRepository.getUserBalance(userId);
        const withdrawalFee = this.calculateWithdrawalFee(fundsData.amount);
        const totalAmount = fundsData.amount + withdrawalFee;
        
        if (currentBalance < totalAmount) {
            throw new Error('Insufficient funds (including withdrawal fee)');
        }

        if (!fundsData.bankAccount) {
            throw new Error('Bank account information is required');
        }

        // Registra a transação do saque
        await this.walletRepository.createTransaction({
            userId,
            amount: -fundsData.amount,
            type: 'WITHDRAW',
            status: 'COMPLETED'
        });

        // Registra a transação da taxa
        if (withdrawalFee > 0) {
            await this.walletRepository.createTransaction({
                userId,
                amount: -withdrawalFee,
                type: 'WITHDRAW',
                status: 'COMPLETED'
            });
        }

        // Atualiza o saldo com o valor total (saque + taxa)
        await this.walletRepository.updateUserBalance(userId, -totalAmount);
    }
} 