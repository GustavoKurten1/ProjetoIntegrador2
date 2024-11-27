import { BetRepository } from '../repositories/BetRepository';
import { EventRepository } from '../repositories/EventRepository';
import { WalletRepository } from '../repositories/WalletRepository';
import { BetDTO, FinishEventDTO } from '../types';

export class BetService {
    private betRepository: BetRepository;
    private eventRepository: EventRepository;
    private walletRepository: WalletRepository;

    constructor() {
        this.betRepository = new BetRepository();
        this.eventRepository = new EventRepository();
        this.walletRepository = new WalletRepository();
    }

    async placeBet(userId: number, betData: BetDTO): Promise<void> {
        const event = await this.eventRepository.findById(betData.eventId);
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

        const userBalance = await this.walletRepository.getUserBalance(userId);
        if (userBalance < betData.amount) {
            throw new Error('Insufficient funds');
        }

        await this.walletRepository.updateUserBalance(userId, -betData.amount);
        await this.betRepository.create(betData, userId);
    }

    async finishEvent(eventId: number, result: boolean): Promise<void> {
        const event = await this.eventRepository.findById(eventId);
        if (!event) {
            throw new Error('Event not found');
        }
        
        if (event.status !== 'APPROVED') {
            throw new Error('Only APPROVED events can be finished');
        }

        const bets = await this.betRepository.findByEventId(eventId);
        
        if (bets.length > 0) {
            const winningBets = bets.filter(bet => {
                return (bet as any).bet_choice === result || 
                       (bet as any).betChoice === result || 
                       (bet as any).choice === result;
            });
            
            const totalBetAmount = bets.reduce((sum, bet) => sum + Number(bet.amount), 0);
            
            if (winningBets.length > 0) {
                const totalWinningAmount = winningBets.reduce((sum, bet) => sum + Number(bet.amount), 0);
                const winningRatio = totalBetAmount / totalWinningAmount;
                
                for (const bet of winningBets) {
                    const winnings = Number(bet.amount) * winningRatio;
                    const userId = (bet as any).user_id || (bet as any).userId;
                    
                    await this.walletRepository.updateUserBalance(userId, winnings);
                    await this.walletRepository.createTransaction({
                        userId: userId,
                        amount: winnings,
                        type: 'WINNING',
                        status: 'COMPLETED'
                    });
                }
            }
        }

        await this.eventRepository.updateStatus(eventId, 'FINISHED');
    }
}