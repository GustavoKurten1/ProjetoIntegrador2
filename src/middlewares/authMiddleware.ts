import { IncomingMessage, ServerResponse } from 'http';
import jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends IncomingMessage {
    user?: {
        id: number;
        role: string;
    };
}

export const authMiddleware = (req: AuthenticatedRequest, res: ServerResponse, next: () => void) => {
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
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        console.log('Decoded token:', decoded);
        req.user = decoded as { id: number; role: string };
        next();
    } catch (error) {
        console.log('Token error:', error);
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Token invalid' }));
    }
}; 