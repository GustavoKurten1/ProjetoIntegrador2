import { IncomingMessage, ServerResponse } from 'http';
import * as jwt from 'jsonwebtoken';

interface AuthRequest extends IncomingMessage {
    user?: {
        userId: number;
        role: string;
    };
}

export function authMiddleware(req: AuthRequest, res: ServerResponse, next: () => void) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No token provided' }));
        return;
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Token error' }));
        return;
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Token malformatted' }));
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded as { userId: number; role: string };
        next();
    } catch (err) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid token' }));
    }
} 