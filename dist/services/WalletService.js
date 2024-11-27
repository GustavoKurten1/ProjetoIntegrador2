"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const WalletRepository_1 = require("../repositories/WalletRepository");
class WalletService {
    constructor() {
        this.walletRepository = new WalletRepository_1.WalletRepository();
    }
    calculateWithdrawalFee(amount) {
        if (amount <= 100) {
            return amount * 0.04; // 4%
        }
        else if (amount <= 1000) {
            return amount * 0.03; // 3%
        }
        else if (amount <= 5000) {
            return amount * 0.02; // 2%
        }
        else if (amount <= 100000) {
            return amount * 0.01; // 1%
        }
        else {
            return 0; // Isento
        }
    }
    addFunds(userId, fundsData) {
        return __awaiter(this, void 0, void 0, function* () {
            // Simulação de validação de cartão de crédito
            if (!fundsData.cardNumber || fundsData.cardNumber.length !== 16) {
                throw new Error('Invalid card number');
            }
            yield this.walletRepository.createTransaction({
                userId,
                amount: fundsData.amount,
                type: 'DEPOSIT',
                status: 'COMPLETED'
            });
            yield this.walletRepository.updateUserBalance(userId, fundsData.amount);
        });
    }
    withdrawFunds(userId, fundsData) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentBalance = yield this.walletRepository.getUserBalance(userId);
            const withdrawalFee = this.calculateWithdrawalFee(fundsData.amount);
            const totalAmount = fundsData.amount + withdrawalFee;
            if (currentBalance < totalAmount) {
                throw new Error('Insufficient funds (including withdrawal fee)');
            }
            if (!fundsData.bankAccount) {
                throw new Error('Bank account information is required');
            }
            // Registra a transação do saque
            yield this.walletRepository.createTransaction({
                userId,
                amount: -fundsData.amount,
                type: 'WITHDRAW',
                status: 'COMPLETED'
            });
            // Registra a transação da taxa
            if (withdrawalFee > 0) {
                yield this.walletRepository.createTransaction({
                    userId,
                    amount: -withdrawalFee,
                    type: 'WITHDRAW',
                    status: 'COMPLETED'
                });
            }
            // Atualiza o saldo com o valor total (saque + taxa)
            yield this.walletRepository.updateUserBalance(userId, -totalAmount);
        });
    }
}
exports.WalletService = WalletService;