/**
 * Rotas de Autenticação
 */

import { Hono } from 'hono';
import { loginEmailRateLimitConfig, loginRateLimiter, verificarLimiteManual } from '../middleware/rateLimiter.js';
import { generateToken } from '../middleware/auth.js';
import { ixcService } from '../services/ixc/index.js';
import { cached } from '../services/cache.js';
import { loginSchema, validateBody } from '../middleware/validators.js';
import { descreverErroSeguro } from '../utils/sanitizar.js';
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
        const limiteEmail = verificarLimiteManual(`login-email:${email.toLowerCase()}`, loginEmailRateLimitConfig);
        if (!limiteEmail.permitido) {
            c.header('Retry-After', limiteEmail.retryAfter.toString());
            return c.json({
                error: 'Muitas tentativas de login. Tente novamente mais tarde.',
                retryAfter: limiteEmail.retryAfter
            }, 429);
        }

        // Buscar clientes no IXC. E-mail duplicado precisa ser resolvido pela senha.
        const clientes = await ixcService.findClientsByEmail(email);

        if (clientes.length === 0) {
            return c.json({ error: 'Email ou senha inválidos' }, 401);
        }

        const clientesComSenhaValida = clientes.filter((cliente) =>
            cliente.senha && ixcService.validatePassword(password, cliente.senha)
        );

        if (clientesComSenhaValida.length === 0) {
            return c.json({ error: 'Email ou senha inválidos' }, 401);
        }

        if (clientesComSenhaValida.length > 1) {
            return c.json({
                error: 'Encontramos mais de um cadastro com este e-mail. Entre em contato com o suporte para atualizar seus dados.'
            }, 409);
        }

        const client = clientesComSenhaValida[0];

        // Verificar se cliente está ativo somente após validar a senha
        if (client.ativo === 'N') {
            return c.json({
                error: 'Não foi possível acessar sua conta. Entre em contato com o suporte no número 0800 871 0606'
            }, 403);
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
        console.error('[AUTH] Login error:', descreverErroSeguro(error));
        return c.json({ error: 'Erro interno no servidor' }, 500);
    }
});

export { authRoutes };
