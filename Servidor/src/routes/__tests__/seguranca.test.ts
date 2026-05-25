import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'bun:test';
import type { app as AppType } from '../../index.js';
import type { generateToken as GenerateTokenType } from '../../middleware/auth.js';
import type { cieloService as CieloServiceType } from '../../services/cielo.js';
import type { ixcService as IXCServiceType } from '../../services/ixc/index.js';
import { loginSchema, recurringCardSchema } from '../../middleware/validators.js';
import { sanitizarDadosSensiveis } from '../../utils/sanitizar.js';
import type { JWTPayload } from '../../types/index.js';

process.env.NODE_ENV = 'test';
process.env.IXC_HOST = 'https://ixc.example.test/webservice/v1';
process.env.IXC_TOKEN = 'test-token';
process.env.JWT_SECRET = 'test-secret-with-at-least-32-characters';
process.env.JWT_EXPIRES_IN = '1h';
process.env.ALLOWED_ORIGINS = 'http://localhost:3001';
process.env.CIELO_MERCHANT_ID = 'merchant-test';
process.env.CIELO_MERCHANT_KEY = 'merchant-key-test';

let app: typeof AppType;
let generateToken: typeof GenerateTokenType;
let ixcService: typeof IXCServiceType;
let cieloService: typeof CieloServiceType;

type MetodoIXC = keyof typeof IXCServiceType;
type MetodoCielo = keyof typeof CieloServiceType;

const ixcOriginal = new Map<MetodoIXC, unknown>();
const cieloOriginal = new Map<MetodoCielo, unknown>();

function substituirIXC(nome: MetodoIXC, valor: unknown) {
    (ixcService as Record<string, unknown>)[nome] = valor;
}

function substituirCielo(nome: MetodoCielo, valor: unknown) {
    (cieloService as Record<string, unknown>)[nome] = valor;
}

async function tokenDoUsuario(payload: Partial<JWTPayload> = {}) {
    return generateToken({
        userId: payload.userId || 'cliente-1',
        email: payload.email || 'cliente@app.test',
        name: payload.name || 'Cliente Teste',
    });
}

async function requisicaoProtegida(
    path: string,
    options: {
        method?: string;
        userId?: string;
        body?: unknown;
        headers?: Record<string, string>;
    } = {}
) {
    const token = await tokenDoUsuario({ userId: options.userId });
    return app.request(path, {
        method: options.method || 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
}

async function respostaJson(response: Response) {
    return response.json() as Promise<Record<string, unknown>>;
}

beforeAll(async () => {
    const appModule = await import('../../index.js');
    const authModule = await import('../../middleware/auth.js');
    const ixcModule = await import('../../services/ixc/index.js');
    const cieloModule = await import('../../services/cielo.js');

    app = appModule.app;
    generateToken = authModule.generateToken;
    ixcService = ixcModule.ixcService;
    cieloService = cieloModule.cieloService;

    for (const nome of Object.keys(ixcService) as MetodoIXC[]) {
        ixcOriginal.set(nome, ixcService[nome]);
    }
    for (const nome of Object.keys(cieloService) as MetodoCielo[]) {
        cieloOriginal.set(nome, cieloService[nome]);
    }
});

beforeEach(() => {
    for (const [nome, valor] of ixcOriginal.entries()) {
        substituirIXC(nome, valor);
    }
    for (const [nome, valor] of cieloOriginal.entries()) {
        substituirCielo(nome, valor);
    }

    substituirIXC('getCityName', async () => 'Cidade Teste');
});

afterAll(() => {
    for (const [nome, valor] of ixcOriginal.entries()) {
        substituirIXC(nome, valor);
    }
    for (const [nome, valor] of cieloOriginal.entries()) {
        substituirCielo(nome, valor);
    }
});

describe('seguranca das rotas protegidas', () => {
    test('bloqueia PIX de fatura pertencente a outro cliente', async () => {
        let chamadasPix = 0;
        substituirIXC('getInvoiceById', async () => ({ id: '101', id_cliente: 'cliente-2' }));
        substituirIXC('getPixCode', async () => {
            chamadasPix++;
            return 'pix-copia-cola';
        });

        const response = await requisicaoProtegida('/api/invoices/pix/101', { method: 'POST' });
        const body = await respostaJson(response);

        expect(response.status).toBe(403);
        expect(body.error).toBe('Acesso negado: fatura não pertence ao usuário');
        expect(chamadasPix).toBe(0);
    });

    test('retorna PIX de fatura pertencente ao usuario autenticado', async () => {
        substituirIXC('getInvoiceById', async () => ({ id: '102', id_cliente: 'cliente-1' }));
        substituirIXC('getPixCode', async () => 'pix-copia-cola');

        const response = await requisicaoProtegida('/api/invoices/pix/102', { method: 'POST' });
        const body = await respostaJson(response);

        expect(response.status).toBe(200);
        expect(body.pixCode).toBe('pix-copia-cola');
    });

    test('bloqueia boleto de fatura pertencente a outro cliente', async () => {
        let chamadasBoleto = 0;
        substituirIXC('getInvoiceById', async () => ({ id: '103', id_cliente: 'cliente-2' }));
        substituirIXC('getBoleto', async () => {
            chamadasBoleto++;
            return 'JVBERi0xLjQ=';
        });

        const response = await requisicaoProtegida('/api/invoices/boleto/103', { method: 'POST' });

        expect(response.status).toBe(403);
        expect(chamadasBoleto).toBe(0);
    });

    test('bloqueia PDF de contrato pertencente a outro cliente', async () => {
        let chamadasPdf = 0;
        substituirIXC('getContractById', async () => ({ id: '201', id_cliente: 'cliente-2' }));
        substituirIXC('getContractPdf', async () => {
            chamadasPdf++;
            return 'JVBERi0xLjQ=';
        });

        const response = await requisicaoProtegida('/api/contracts/201', { method: 'POST' });

        expect(response.status).toBe(403);
        expect(chamadasPdf).toBe(0);
    });

    test('aceite usa contrato do usuario e ignora timestamp vindo do cliente', async () => {
        const chamadas: Array<{ contractId: string; dados: Record<string, string> }> = [];
        substituirIXC('getContractById', async () => ({ id: '202', id_cliente: 'cliente-1' }));
        substituirIXC('acceptContract', async (contractId: string, dados: Record<string, string>) => {
            chamadas.push({ contractId, dados });
            return { success: true };
        });

        const response = await requisicaoProtegida('/api/contracts/202/accept', {
            method: 'POST',
            headers: { 'user-agent': 'Teste Automatizado' },
            body: {
                timestamp: '2000-01-01T00:00:00.000Z',
                userAgent: 'App Cliente',
            },
        });
        const body = await respostaJson(response);

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(chamadas).toHaveLength(1);
        expect(chamadas[0].contractId).toBe('202');
        expect(chamadas[0].dados.userAgent).toBe('App Cliente');
        expect(chamadas[0].dados.timestamp).not.toBe('2000-01-01T00:00:00.000Z');
    });

    test('cartao recorrente invalido nao chama Cielo nem IXC', async () => {
        let chamadasTokenizacao = 0;
        let chamadasAtualizacao = 0;
        substituirIXC('getContractById', async () => ({ id: '203', id_cliente: 'cliente-1' }));
        substituirCielo('tokenizeCardWithRetry', async () => {
            chamadasTokenizacao++;
            return 'card-token';
        });
        substituirIXC('updateContractRecurringCard', async () => {
            chamadasAtualizacao++;
            return { type: 'success' };
        });

        const response = await requisicaoProtegida('/api/contracts/203/recurring-card', {
            method: 'PUT',
            body: {
                cardNumber: '4111111111111112',
                holder: 'Cliente Teste',
                expirationDate: '12/2099',
                securityCode: '123',
                brand: 'visa',
                customerName: 'Cliente Teste',
            },
        });

        expect(response.status).toBe(400);
        expect(chamadasTokenizacao).toBe(0);
        expect(chamadasAtualizacao).toBe(0);
    });
});

describe('login e validacao de entrada', () => {
    test('login retorna erro generico para email inexistente e senha incorreta', async () => {
        substituirIXC('findClientsByEmail', async () => []);

        const inexistente = await app.request('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-forwarded-for': '192.0.2.10',
            },
            body: JSON.stringify({ email: 'naoexiste@app.test', password: 'senha' }),
        });
        expect(inexistente.status).toBe(401);
        expect((await respostaJson(inexistente)).error).toBe('Email ou senha inválidos');

        substituirIXC('findClientsByEmail', async () => [{
            id: 'cliente-1',
            razao: 'Cliente Teste',
            hotsite_email: 'cliente@app.test',
            senha: 'senha-correta',
            ativo: 'S',
        }]);

        const senhaIncorreta = await app.request('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-forwarded-for': '192.0.2.11',
            },
            body: JSON.stringify({ email: 'cliente@app.test', password: 'senha-errada' }),
        });
        expect(senhaIncorreta.status).toBe(401);
        expect((await respostaJson(senhaIncorreta)).error).toBe('Email ou senha inválidos');
    });

    test('login bloqueia email duplicado quando mais de um cadastro aceita a mesma senha', async () => {
        const email = `duplicado-${Date.now()}@app.test`;
        substituirIXC('findClientsByEmail', async () => [
            {
                id: 'cliente-1',
                razao: 'Cliente Um',
                hotsite_email: email,
                senha: 'senha-compartilhada',
                ativo: 'S',
            },
            {
                id: 'cliente-2',
                razao: 'Cliente Dois',
                hotsite_email: email,
                senha: 'senha-compartilhada',
                ativo: 'S',
            },
        ]);

        const response = await app.request('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-forwarded-for': '192.0.2.13',
            },
            body: JSON.stringify({ email, password: 'senha-compartilhada' }),
        });
        const body = await respostaJson(response);

        expect(response.status).toBe(409);
        expect(body.error).toBe('Encontramos mais de um cadastro com este e-mail. Entre em contato com o suporte para atualizar seus dados.');
    });

    test('limita tentativas repetidas por email normalizado', async () => {
        let consultas = 0;
        substituirIXC('findClientsByEmail', async () => {
            consultas++;
            return [];
        });

        const email = `limite-${Date.now()}@app.test`;
        const respostas: number[] = [];

        for (let tentativa = 0; tentativa < 9; tentativa++) {
            const response = await app.request('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-forwarded-for': '192.0.2.12',
                },
                body: JSON.stringify({ email: ` ${email.toUpperCase()} `, password: 'senha' }),
            });
            respostas.push(response.status);
        }

        expect(respostas.slice(0, 8)).toEqual(Array(8).fill(401));
        expect(respostas[8]).toBe(429);
        expect(consultas).toBe(8);
    });

    test('schemas normalizam login e rejeitam cartao invalido ou expirado', () => {
        const login = loginSchema.parse({
            email: ' CLIENTE@APP.TEST ',
            password: 'senha',
        });

        expect(login.email).toBe('cliente@app.test');

        const cartaoValido = recurringCardSchema.safeParse({
            cardNumber: '4111 1111 1111 1111',
            holder: 'Cliente Teste',
            expirationDate: '12/2099',
            securityCode: '123',
            brand: 'VISA',
        });
        expect(cartaoValido.success).toBe(true);

        const cartaoInvalido = recurringCardSchema.safeParse({
            cardNumber: '4111111111111112',
            holder: 'Cliente Teste',
            expirationDate: '12/2099',
            securityCode: '123',
            brand: 'visa',
        });
        expect(cartaoInvalido.success).toBe(false);

        const cartaoExpirado = recurringCardSchema.safeParse({
            cardNumber: '4111111111111111',
            holder: 'Cliente Teste',
            expirationDate: '01/2020',
            securityCode: '123',
            brand: 'visa',
        });
        expect(cartaoExpirado.success).toBe(false);
    });

    test('sanitizacao mascara tokens, cartoes e senhas em objetos aninhados', () => {
        const resultado = sanitizarDadosSensiveis({
            password: 'senha',
            cardToken: 'tok_1234567890',
            credit_card_recorrente_numero_cartao: '4111111111111111',
            nested: {
                securityCode: '123',
            },
        }) as Record<string, unknown>;

        expect(resultado.password).toBe('[REDACTED]');
        expect(resultado.cardToken).toBe('tok_...7890');
        expect(resultado.credit_card_recorrente_numero_cartao).toBe('************1111');
        expect((resultado.nested as Record<string, unknown>).securityCode).toBe('[REDACTED]');
    });
});
