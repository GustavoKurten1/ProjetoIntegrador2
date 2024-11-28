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
const promises_1 = require("fs/promises");
const path_1 = require("path");
const EventRepository_1 = require("./repositories/EventRepository");
const UserRepository_1 = require("./repositories/UserRepository");
const authService = new AuthService_1.AuthService();
const eventService = new EventService_1.EventService();
const walletService = new WalletService_1.WalletService();
const betService = new BetService_1.BetService();
const eventRepository = new EventRepository_1.EventRepository();
const userRepository = new UserRepository_1.UserRepository();
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
    const path = parsedUrl.pathname || '/';
    try {
        // Tratamento para arquivos estáticos (deve vir antes do middleware de autenticação)
        if (path.endsWith('.html') || path.endsWith('.js') || path.endsWith('.css')) {
            try {
                // Se o path for '/', carregue index.html
                const actualPath = path === '/' ? '/index.html' : path;
                const filePath = (0, path_1.join)(__dirname, '../frontend', actualPath);
                const content = yield (0, promises_1.readFile)(filePath);
                const contentType = actualPath.endsWith('.html') ? 'text/html' :
                    actualPath.endsWith('.js') ? 'text/javascript' :
                        'text/css';
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content);
                return;
            }
            catch (error) {
                res.writeHead(404);
                res.end('File not found');
                return;
            }
        }
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
                    token
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
            if (path.startsWith('/deleteEvent/') && req.method === 'PUT') {
                try {
                    const eventId = parseInt(path.split('/')[2]);
                    const userId = req.user.id;
                    // Verificar se o usuário é o criador do evento
                    const creatorId = yield eventRepository.getEventCreator(eventId);
                    if (creatorId !== userId) {
                        res.writeHead(403, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Apenas o criador pode deletar o evento' }));
                        return;
                    }
                    yield eventRepository.softDeleteEvent(eventId);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Evento deletado com sucesso' }));
                }
                catch (error) {
                    handleError(res, error);
                }
                return;
            }
            if (path === '/evaluateNewEvent' && req.method === 'POST') {
                try {
                    const { eventId, approved } = JSON.parse(body);
                    const userId = req.user.id;
                    yield eventService.evaluateNewEvent(eventId, approved);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Evento avaliado com sucesso' }));
                }
                catch (error) {
                    handleError(res, error);
                }
                return;
            }
            if (path === '/withdraw' && req.method === 'POST') {
                try {
                    const fundsData = JSON.parse(body);
                    const userId = req.user.id;
                    if (!fundsData.amount || fundsData.amount <= 0) {
                        throw new Error('Valor inválido para saque');
                    }
                    yield walletService.withdrawFunds(userId, fundsData);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        message: 'Saque realizado com sucesso',
                        success: true
                    }));
                }
                catch (error) {
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
                    const fundsData = JSON.parse(body);
                    const userId = req.user.id;
                    if (!fundsData.amount || fundsData.amount <= 0) {
                        throw new Error('Valor inválido para depósito');
                    }
                    yield walletService.addFunds(userId, fundsData);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        message: 'Depósito realizado com sucesso',
                        success: true
                    }));
                }
                catch (error) {
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
            if (path === '/getMyEvents' && req.method === 'GET') {
                try {
                    const userId = req.user.id;
                    const events = yield eventRepository.getEventsByUser(userId);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(events));
                }
                catch (error) {
                    handleError(res, error);
                }
                return;
            }
            if (path === '/getWalletBalance' && req.method === 'GET') {
                try {
                    const userId = req.user.id;
                    const balance = yield walletService.getBalance(userId);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ balance: balance || 0 }));
                }
                catch (error) {
                    handleError(res, error);
                }
                return;
            }
            if (path === '/checkRole' && req.method === 'GET') {
                try {
                    const userId = req.user.id;
                    const user = yield userRepository.findById(userId);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ role: user.role }));
                }
                catch (error) {
                    handleError(res, error);
                }
                return;
            }
            if (path === '/getPendingEvents' && req.method === 'GET') {
                try {
                    const userId = req.user.id;
                    const user = yield userRepository.findById(userId);
                    if (user.role !== 'MODERATOR') {
                        res.writeHead(403, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Acesso não autorizado' }));
                        return;
                    }
                    const events = yield eventRepository.getPendingEvents();
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
