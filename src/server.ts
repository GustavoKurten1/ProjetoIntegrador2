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
import { readFile } from 'fs/promises';
import { join } from 'path';
import { EventRepository } from './repositories/EventRepository';
import { UserRepository } from './repositories/UserRepository';

interface CustomError extends Error {
    status?: number;
}

const authService = new AuthService();
const eventService = new EventService();
const walletService = new WalletService();
const betService = new BetService();
const eventRepository = new EventRepository();
const userRepository = new UserRepository();

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
    const path = parsedUrl.pathname || '/';

    // Tratamento para arquivos estáticos
    if (path.endsWith('.html') || path.endsWith('.js') || path.endsWith('.css')) {
        try {
            const filePath = join(__dirname, '../frontend', path);
            console.log('Trying to serve file:', filePath); // Debug log
            
            const content = await readFile(filePath);
            const contentType = path.endsWith('.html') ? 'text/html' :
                              path.endsWith('.js') ? 'text/javascript' :
                              'text/css';
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
            return;
        } catch (error) {
            console.error('Error serving file:', error);
            res.writeHead(404);
            res.end('File not found');
            return;
        }
    }

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
                    token
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

            if (path.startsWith('/deleteEvent/') && req.method === 'PUT') {
                try {
                    const eventId = parseInt(path.split('/')[2]);
                    const userId = (req as any).user.id;
                    
                    // Verificar se o usuário é o criador do evento
                    const creatorId = await eventRepository.getEventCreator(eventId);
                    if (creatorId !== userId) {
                        res.writeHead(403, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Apenas o criador pode deletar o evento' }));
                        return;
                    }

                    await eventRepository.softDeleteEvent(eventId);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Evento deletado com sucesso' }));
                } catch (error) {
                    handleError(res, error);
                }
                return;
            }

            if (path === '/evaluateNewEvent' && req.method === 'POST') {
                try {
                    const { eventId, approved } = JSON.parse(body);
                    const userId = (req as any).user.id;
                    await eventService.evaluateNewEvent(eventId, approved);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Evento avaliado com sucesso' }));
                } catch (error) {
                    handleError(res, error);
                }
                return;
            }

            if (path === '/withdraw' && req.method === 'POST') {
                try {
                    const fundsData: FundsDTO = JSON.parse(body);
                    const userId = (req as any).user.id;
                    
                    if (!fundsData.amount || fundsData.amount <= 0) {
                        throw new Error('Valor inválido para saque');
                    }

                    await walletService.withdrawFunds(userId, fundsData);
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        message: 'Saque realizado com sucesso',
                        success: true
                    }));
                } catch (error) {
                    console.error('Erro no saque:', error);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        error: error instanceof Error ? error.message : 'Erro ao processar saque',
                        success: false
                    }));
                }
                return;
            }

            if (path === '/deposit' && req.method === 'POST') {
                try {
                    const fundsData: FundsDTO = JSON.parse(body);
                    const userId = (req as any).user.id;
                    
                    if (!fundsData.amount || fundsData.amount <= 0) {
                        throw new Error('Valor inválido para depósito');
                    }

                    await walletService.addFunds(userId, fundsData);
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        message: 'Depósito realizado com sucesso',
                        success: true
                    }));
                } catch (error) {
                    console.error('Erro no depósito:', error);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        error: error instanceof Error ? error.message : 'Erro ao processar depósito',
                        success: false
                    }));
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

            if (path === '/getMyEvents' && req.method === 'GET') {
                try {
                    const userId = (req as any).user.id;
                    const events = await eventRepository.getEventsByUser(userId);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(events));
                } catch (error) {
                    handleError(res, error);
                }
                return;
            }

            if (path === '/getWalletBalance' && req.method === 'GET') {
                try {
                    const userId = (req as any).user.id;
                    const balance = await walletService.getBalance(userId);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ balance: balance || 0 }));
                } catch (error) {
                    handleError(res, error);
                }
                return;
            }

            if (path === '/checkRole' && req.method === 'GET') {
                try {
                    const userId = (req as any).user.id;
                    const user = await userRepository.findById(userId);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ role: user.role }));
                } catch (error) {
                    handleError(res, error);
                }
                return;
            }

            if (path === '/getPendingEvents' && req.method === 'GET') {
                try {
                    const userId = (req as any).user.id;
                    const user = await userRepository.findById(userId);
                    
                    if (user.role !== 'MODERATOR') {
                        res.writeHead(403, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Acesso não autorizado' }));
                        return;
                    }

                    const events = await eventRepository.getPendingEvents();
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