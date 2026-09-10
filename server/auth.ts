import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const SECRET = process.env.SESSION_SECRET || 'washeng-gc-secret-key-super-secure';
const AUTH_USER = process.env.AUTH_USER || 'washeng';
const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'W@sheng11';

export interface UserSession {
  username: string;
  role: string;
  loginAt: number;
}

export function createToken(payload: UserSession): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

export function verifyToken(token: string): UserSession | null {
  try {
    const [data, signature] = token.split('.');
    if (!data || !signature) return null;

    const expectedSig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as UserSession;
    // Session valid for 7 days
    if (Date.now() - payload.loginAt > 7 * 24 * 60 * 60 * 1000) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function extractUser(req: FastifyRequest): UserSession | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return verifyToken(token);
  }
  const queryToken = (req.query as any)?.token;
  if (queryToken && typeof queryToken === 'string') {
    return verifyToken(queryToken);
  }
  return null;
}

export async function authRoutes(fastify: FastifyInstance) {
  // Login endpoint
  fastify.post('/api/auth/login', async (req: FastifyRequest<{ Body: { username?: string; password?: string } }>, reply: FastifyReply) => {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return reply.status(400).send({ ok: false, error: 'Username dan password wajib diisi.' });
    }

    if (username.trim() === AUTH_USER && password === AUTH_PASSWORD) {
      const session: UserSession = {
        username: AUTH_USER,
        role: 'super-admin',
        loginAt: Date.now(),
      };
      const token = createToken(session);
      return reply.send({
        ok: true,
        token,
        user: {
          username: session.username,
          role: session.role,
        },
      });
    }

    return reply.status(401).send({
      ok: false,
      error: 'Username atau password salah.',
    });
  });

  // Verify / Me endpoint
  fastify.get('/api/auth/me', async (req: FastifyRequest, reply: FastifyReply) => {
    const user = extractUser(req);
    if (!user) {
      return reply.status(401).send({ ok: false, error: 'Unauthorized' });
    }
    return reply.send({ ok: true, user });
  });
}
