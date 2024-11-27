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
const http_1 = require("http");
const url_1 = require("url");
const AuthService_1 = require("./services_old/AuthService");
const EventService_1 = require("./services_old/EventService");
const WalletService_1 = require("./services/WalletService");
const BetService_1 = require("./services/BetService");
const authMiddleware_1 = require("./middlewares/authMiddleware");
const authService = new AuthService_1.AuthService();
const eventService = new EventService_1.EventService();
const walletService = new WalletService_1.WalletService();
const betService = new BetService_1.BetService();
const server = (0, http_1.createServer)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Configuração CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    const parsedUrl = (0, url_1.parse)(req.url || '', true);
    const path = parsedUrl.pathname;
    try {
        // Coletar dados do body
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        yield new Promise((resolve) => {
            req.on('end', resolve);
        });
        // Rotas públicas
        if (path === '/signup' && req.method === 'POST') {
            try {
                const userData = JSON.parse(body);
                yield authService.signUp(userData);
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    message: 'Conta criada!'
                }));
            }
            catch (error) {
                handleError(res, error);
            }
            return;
        }
        if (path === '/login' && req.method === 'POST') {
            try {
                const credentials = JSON.parse(body);
                const token = yield authService.login(credentials);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    message: 'Login realizado com sucesso!',
                    token: token
                }));
            }
            catch (error) {
                handleError(res, error);
            }
            return;
        }
        // Middleware de autenticação para todas as outras rotas
        (0, authMiddleware_1.authMiddleware)(req, res, () => __awaiter(void 0, void 0, void 0, function* () {
            if (path === '/addNewEvent' && req.method === 'POST') {
                try {
                    const eventData = JSON.parse(body);
                    const userId = req.user.id; // Pegando o ID do usuário do token
                    const eventId = yield eventService.addNewEvent(eventData, userId);
                    res.writeHead(201, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Evento adicionado à lista de espera', eventId }));
                }
                catch (error) {
                    console.error('Error in /addNewEvent:', error); // Log do erro
                    handleError(res, error);
                }
                return;
            }
            if (path === '/getEvents' && req.method === 'GET') {
                try {
                    const filters = {};
                    if (typeof parsedUrl.query.status === 'string') {
                        filters.status = parsedUrl.query.status;
                    }
                    if (typeof parsedUrl.query.startDate === 'string') {
                        filters.startDate = new Date(parsedUrl.query.startDate);
                    }
                    if (typeof parsedUrl.query.endDate === 'string') {
                        filters.endDate = new Date(parsedUrl.query.endDate);
                    }
                    const events = yield eventService.getEvents(filters);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(events));
                }
                catch (error) {
                    handleError(res, error);
                }
                return;
            }
            if (path === '/deleteEvent' && req.method === 'POST') {
                try {
                    const { eventId } = JSON.parse(body);
                    const userId = req.user.id;
                    console.log('Delete Event Request:', {
                        eventId,
                        userId,
                        userObject: req.user
                    });
                    yield eventService.deleteEvent(eventId, userId);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Evento removido com sucesso' }));
                }
                catch (error) {
                    console.error('Delete Event Error:', error);
                    handleError(res, error);
                }
                return;
            }
            if (path === '/evaluateNewEvent' && req.method === 'POST') {
                try {
                    const { eventId, approved } = JSON.parse(body);
                    yield eventService.evaluateNewEvent(eventId, approved);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Evento avaliado com sucesso' }));
                }
                catch (error) {
                    handleError(res, error);
                }
                return;
            }
            if (path === '/addFunds' && req.method === 'POST') {
                try {
                    const fundsData = JSON.parse(body);
                    const userId = req.user.id;
                    yield walletService.addFunds(userId, fundsData);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Funds added successfully' }));
                }
                catch (error) {
                    handleError(res, error);
                }
                return;
            }
            if (path === '/withdrawFunds' && req.method === 'POST') {
                try {
                    const fundsData = JSON.parse(body);
                    const userId = req.user.id;
                    yield walletService.withdrawFunds(userId, fundsData);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Withdrawal successful' }));
                }
                catch (error) {
                    handleError(res, error);
                }
                return;
            }
            if (path === '/betOnEvent' && req.method === 'POST') {
                try {
                    const betData = JSON.parse(body);
                    const userId = req.user.id;
                    yield betService.placeBet(userId, betData);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Bet placed successfully' }));
                }
                catch (error) {
                    handleError(res, error);
                }
                return;
            }
            if (path === '/finishEvent' && req.method === 'POST') {
                try {
                    const { eventId, result } = JSON.parse(body);
                    if (req.user.role !== 'MODERATOR') {
                        throw new Error('Only moderators can finish events');
                    }
                    yield betService.finishEvent(eventId, result);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Event finished successfully' }));
                }
                catch (error) {
                    handleError(res, error);
                }
                return;
            }
            if (path === '/searchEvent' && req.method === 'GET') {
                try {
                    const keyword = parsedUrl.query.keyword;
                    const events = yield eventService.searchEvents(keyword);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(events));
                }
                catch (error) {
                    handleError(res, error);
                }
                return;
            }
            // Rota não encontrada
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Route not found' }));
        }));
    }
    catch (error) {
        handleError(res, error);
    }
}));
// Função para tratamento de erros
function handleError(res, error) {
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
