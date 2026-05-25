const CHAVES_SENSIVEIS = [
    'authorization',
    'merchantkey',
    'password',
    'senha',
    'token',
    'cardtoken',
    'cardnumber',
    'securitycode',
    'cvv',
    'cvc',
    'credit_card',
    'numero_cartao',
    'validade_cartao',
];

export function mascararCartao(valor: string): string {
    const digitos = valor.replace(/\D/g, '');
    if (digitos.length < 4) {
        return '';
    }
    return `************${digitos.slice(-4)}`;
}

export function mascararToken(valor: string): string {
    if (!valor) {
        return '[REDACTED]';
    }

    if (valor.length <= 8) {
        return '[REDACTED]';
    }

    return `${valor.slice(0, 4)}...${valor.slice(-4)}`;
}

export function sanitizarDadosSensiveis(valor: unknown): unknown {
    if (valor === null || valor === undefined) {
        return valor;
    }

    if (typeof valor !== 'object') {
        return valor;
    }

    if (Array.isArray(valor)) {
        return valor.map((item) => sanitizarDadosSensiveis(item));
    }

    const objeto = valor as Record<string, unknown>;
    const sanitizado: Record<string, unknown> = {};

    for (const [chave, dado] of Object.entries(objeto)) {
        const chaveNormalizada = chave.toLowerCase();
        const sensivel = CHAVES_SENSIVEIS.some((item) => chaveNormalizada.includes(item));

        if (sensivel) {
            if (typeof dado === 'string' && chaveNormalizada.includes('numero_cartao')) {
                sanitizado[chave] = mascararCartao(dado);
            } else if (typeof dado === 'string' && chaveNormalizada.includes('token')) {
                sanitizado[chave] = mascararToken(dado);
            } else {
                sanitizado[chave] = '[REDACTED]';
            }
            continue;
        }

        sanitizado[chave] = sanitizarDadosSensiveis(dado);
    }

    return sanitizado;
}

export function descreverErroSeguro(erro: unknown): string {
    if (erro instanceof Error) {
        return erro.message;
    }

    if (typeof erro === 'string') {
        return erro;
    }

    try {
        return JSON.stringify(sanitizarDadosSensiveis(erro));
    } catch {
        return 'Erro desconhecido';
    }
}
