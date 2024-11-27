import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse as parseUrl } from 'url';
import { AuthService } from './services_old/AuthService';
import { EventService } from './services_old/EventService';
import { WalletService } from './services/WalletService';
import { BetService } from './services/BetService';
import { authMiddleware } from './middlewares/authMiddleware';
import { 
    UserLoginDTO, 
    UserCreationDTO, 
    EventCreationDTO, 
    EventFilters, 
    BetDTO, 
    FinishEventDTO,
    FundsDTO 
} from './types';

interface CustomError extends Error {
    status?: number;
}

const authService = new AuthService();
const eventService = new EventService();
const walletService = new WalletService();
const betService = new BetService();

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    // Configuração CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = parseUrl(req.url || '', true);
    const path = parsedUrl.pathname;

    try {
        // Coletar dados do body
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        await new Promise<void>((resolve) => {
            req.on('end', resolve);
        });

        // Rotas públicas
        if (path === '/signup' && req.method === 'POST') {
            try {
                const userData: UserCreationDTO = JSON.parse(body);
                await authService.signUp(userData);
                
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    message: 'Conta criada!' 
                }));
            } catch (error) {
                handleError(res, error);
            }
            return;
        }

        if (path === '/login' && req.method === 'POST') {
            try {
                const credentials: UserLoginDTO = JSON.parse(body);
                const token = await authService.login(credentials);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    message: 'Login realizado com sucesso!',
                    token: token 
                }));
            } catch (error) {
                handleError(res, error);
            }
            return;
        }

        // Middleware de autenticação para todas as outras rotas
        authMiddleware(req as any, res, async () => {
            if (path === '/addNewEvent' && req.method === 'POST') {
                try {
                    const eventData: EventCreationDTO = JSON.parse(body);
                    const userId = (req as any).user.id; // Pegando o ID do usuário do token
                    const eventId = await eventService.addNewEvent(eventData, userId);
                    res.writeHead(201, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Evento adicionado à lista de espera', eventId }));
                } catch (error) {
                    console.error('Error in /addNewEvent:', error); // Log do erro
                    handleError(res, error);
                }
                return;
            }

            if (path === '/getEvents' && req.method === 'GET') {
                try {
                    const filters: EventFilters = {};
                    
                    if (typeof parsedUrl.query.status === 'string') {
                        filters.status = parsedUrl.query.status;
                    }
                    
                    if (typeof parsedUrl.query.startDate === 'string') {
                        filters.startDate = new Date(parsedUrl.query.startDate);
                    }
                    
                    if (typeof parsedUrl.query.endDate === 'string') {
                        filters.endDate = new Date(parsedUrl.query.endDate);
                    }

                    const events = await eventService.getEvents(filters);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(events));
                } catch (error) {
                    handleError(res, error);
                }
                return;
            }

            if (path === '/deleteEvent' && req.method === 'POST') {
                try {
                    const { eventId } = JSON.parse(body);
                    const userId = (req as any).user.id;
                    console.log('Delete Event Request:', {
                        eventId,
                        userId,
                        userObject: (req as any).user
                    });
                    
                    await eventService.deleteEvent(eventId, userId);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Evento removido com sucesso' }));
                } catch (error) {
                    console.error('Delete Event Error:', error);
                    handleError(res, error);
                }
                return;
            }

            if (path === '/evaluateNewEvent' && req.method === 'POST') {
                try {
                    const { eventId, approved } = JSON.parse(body);
                    await eventService.evaluateNewEvent(eventId, approved);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Evento avaliado com sucesso' }));
                } catch (error) {
                    handleError(res, error);
                }
                return;
            }

            if (path === '/addFunds' && req.method === 'POST') {
                try {
                    const fundsData: FundsDTO = JSON.parse(body);
                    const userId = (req as any).user.id;
                    await walletService.addFunds(userId, fundsData);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Funds added successfully' }));
                } catch (error) {
                    handleError(res, error);
                }
                return;
            }

            if (path === '/withdrawFunds' && req.method === 'POST') {
                try {
                    const fundsData: FundsDTO = JSON.parse(body);
                    const userId = (req as any).user.id;
                    await walletService.withdrawFunds(userId, fundsData);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Withdrawal successful' }));
                } catch (error) {
                    handleError(res, error);
                }
                return;
            }

            if (path === '/betOnEvent' && req.method === 'POST') {
                try {
                    const betData: BetDTO = JSON.parse(body);
                    const userId = (req as any).user.id;
                    await betService.placeBet(userId, betData);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Bet placed successfully' }));
                } catch (error) {
                    handleError(res, error);
                }
                return;
            }

            if (path === '/finishEvent' && req.method === 'POST') {
                try {
                    const { eventId, result } = JSON.parse(body);
                    if ((req as any).user.role !== 'MODERATOR') {
                        throw new Error('Only moderators can finish events');
                    }
                    await betService.finishEvent(eventId, result);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Event finished successfully' }));
                } catch (error) {
                    handleError(res, error);
                }
                return;
            }

            if (path === '/searchEvent' && req.method === 'GET') {
                try {
                    const keyword = parsedUrl.query.keyword as string;
                    const events = await eventService.searchEvents(keyword);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(events));
                } catch (error) {
                    handleError(res, error);
                }
                return;
            }

            // Rota não encontrada
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Route not found' }));
        });

    } catch (error) {
        handleError(res, error);
    }
});

// Função para tratamento de erros
function handleError(res: ServerResponse, error: unknown) {
    console.error('Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
}

// Inicialização do servidor
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
}); 