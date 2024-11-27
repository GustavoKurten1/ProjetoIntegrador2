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
exports.BetService = void 0;
const BetRepository_1 = require("../repositories/BetRepository");
const EventRepository_1 = require("../repositories/EventRepository");
const WalletRepository_1 = require("../repositories/WalletRepository");
class BetService {
    constructor() {
        this.betRepository = new BetRepository_1.BetRepository();
        this.eventRepository = new EventRepository_1.EventRepository();
        this.walletRepository = new WalletRepository_1.WalletRepository();
    }
    placeBet(userId, betData) {
        return __awaiter(this, void 0, void 0, function* () {
            const event = yield this.eventRepository.findById(betData.eventId);
            if (!event) {
                throw new Error('Event not found');
            }
            if (event.status !== 'APPROVED') {
                throw new Error('Event not available for betting. Event must be APPROVED');
            }
            const currentDate = new Date();
            const bettingEndDate = new Date(event.bettingEndDate);
            if (currentDate > bettingEndDate) {
                throw new Error('Betting period has ended for this event');
            }
            const userBalance = yield this.walletRepository.getUserBalance(userId);
            if (userBalance < betData.amount) {
                throw new Error('Insufficient funds');
            }
            yield this.walletRepository.updateUserBalance(userId, -betData.amount);
            yield this.betRepository.create(betData, userId);
        });
    }
    finishEvent(eventId, result) {
        return __awaiter(this, void 0, void 0, function* () {
            const event = yield this.eventRepository.findById(eventId);
            if (!event) {
                throw new Error('Event not found');
            }
            if (event.status !== 'APPROVED') {
                throw new Error('Only APPROVED events can be finished');
            }
            const bets = yield this.betRepository.findByEventId(eventId);
            if (bets.length > 0) {
                const winningBets = bets.filter(bet => {
                    return bet.bet_choice === result ||
                        bet.betChoice === result ||
                        bet.choice === result;
                });
                const totalBetAmount = bets.reduce((sum, bet) => sum + Number(bet.amount), 0);
                if (winningBets.length > 0) {
                    const totalWinningAmount = winningBets.reduce((sum, bet) => sum + Number(bet.amount), 0);
                    const winningRatio = totalBetAmount / totalWinningAmount;
                    for (const bet of winningBets) {
                        const winnings = Number(bet.amount) * winningRatio;
                        const userId = bet.user_id || bet.userId;
                        yield this.walletRepository.updateUserBalance(userId, winnings);
                        yield this.walletRepository.createTransaction({
                            userId: userId,
                            amount: winnings,
                            type: 'WINNING',
                            status: 'COMPLETED'
                        });
                    }
                }
            }
            yield this.eventRepository.updateStatus(eventId, 'FINISHED');
        });
    }
}
exports.BetService = BetService;
