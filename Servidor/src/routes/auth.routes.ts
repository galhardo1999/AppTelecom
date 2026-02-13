/**
 * Rotas de Autenticação
 */

import { Hono } from 'hono';
import { loginRateLimiter } from '../middleware/rateLimiter.js';
import { generateToken } from '../middleware/auth.js';
import { ixcService } from '../services/ixc/index.js';
import { cached } from '../services/cache.js';
import { loginSchema, validateBody } from '../middleware/validators.js';
import type { JWTPayload, LoginResponse } from '../types/index.js';

const authRoutes = new Hono();

/**
 * POST /auth/login
 * Autenticação do usuário com email e senha
 */
authRoutes.post('/login', loginRateLimiter, async (c) => {
    try {
        // Validar input com Zod
        const validation = await validateBody(c, loginSchema);
        if (!validation.success) {
            return validation.response;
        }

        const { email, password } = validation.data;

        // Buscar cliente no IXC
        const client = await ixcService.findClientByEmail(email);

        if (!client) {
            return c.json({ error: 'Email não encontrado' }, 401);
        }

        // Verificar se cliente está ativo
        if (client.ativo === 'N') {
            return c.json({
                error: 'Não foi possível acessar sua conta. Entre em contato com o suporte no número 0800 871 0606'
            }, 403);
        }

        // Validar senha
        if (!client.senha) {
            return c.json({ error: 'Cadastro sem senha. Contate o suporte.' }, 401);
        }

        const isValidPassword = ixcService.validatePassword(password, client.senha);

        if (!isValidPassword) {
            return c.json({ error: 'Senha incorreta' }, 401);
        }

        // Gerar JWT
        const tokenPayload: JWTPayload = {
            userId: client.id,
            email: client.hotsite_email,
            name: client.razao
        };

        const token = await generateToken(tokenPayload);

        // Buscar nome da cidade (com cache de 1 dia)
        let cidadeNome = '';
        if (client.cidade) {
            cidadeNome = await cached(
                `city:${client.cidade}`,
                () => ixcService.getCityName(client.cidade!),
                86400
            );
        }

        // Retornar dados do usuário (sem campos sensíveis)
        const userData = { ...client, cidadeNome };
        delete userData.senha;

        const response: LoginResponse = {
            token,
            user: userData
        };

        return c.json(response);

    } catch (error: any) {
        console.error('[AUTH] Login error:', error.message);
        return c.json({ error: 'Erro interno no servidor' }, 500);
    }
});

export { authRoutes };
