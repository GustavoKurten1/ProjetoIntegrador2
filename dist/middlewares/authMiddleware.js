"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    console.log('=== Auth Middleware ===');
    console.log('Headers:', req.headers);
    const authHeader = req.headers['authorization'];
    console.log('Auth Header:', authHeader);
    if (!authHeader) {
        console.log('No auth header found');
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No token provided' }));
        return;
    }
    const [, token] = authHeader.split(' ');
    console.log('Token:', token);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        console.log('Decoded token:', decoded);
        req.user = decoded;
        next();
    }
    catch (error) {
        console.log('Token error:', error);
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Token invalid' }));
    }
};
exports.authMiddleware = authMiddleware;
