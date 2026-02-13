/**
 * Utilitários para mascaramento de dados sensíveis (LGPD)
 */

/**
 * Mascara CPF no formato ***.***.***-**
 * Mostra apenas os 3 dígitos centrais
 * Ex: 123.456.789-00 -> ***.456.***-**
 */
export function maskCPF(cpf: string): string {
    if (!cpf) return '';

    // Remove caracteres não numéricos
    const digits = cpf.replace(/\D/g, '');

    if (digits.length !== 11) return cpf; // Retorna original se inválido

    // Formato: ***.XXX.***-**
    return `***.${digits.slice(3, 6)}.***-**`;
}

/**
 * Mascara email mostrando apenas primeiros 2 caracteres
 * Ex: joao.silva@email.com -> jo***@email.com
 */
export function maskEmail(email: string): string {
    if (!email || !email.includes('@')) return '';

    const [user, domain] = email.split('@');

    if (user.length <= 2) {
        return `${user[0]}***@${domain}`;
    }

    return `${user.slice(0, 2)}***@${domain}`;
}

/**
 * Mascara telefone mostrando apenas últimos 4 dígitos
 * Ex: (11) 98765-4321 -> (11) *****-4321
 */
export function maskPhone(phone: string): string {
    if (!phone) return '';

    // Remove caracteres não numéricos
    const digits = phone.replace(/\D/g, '');

    if (digits.length < 10) return phone;

    // Pega DDD e últimos 4 dígitos
    const ddd = digits.slice(0, 2);
    const lastFour = digits.slice(-4);

    return `(${ddd}) *****-${lastFour}`;
}

/**
 * Mascara endereço mostrando apenas número e bairro
 * Ex: Rua das Flores, 123 - Centro -> R*** ***, 123 - Centro
 */
export function maskAddress(address: string): string {
    if (!address) return '';

    // Tenta encontrar número na rua
    const numberMatch = address.match(/,?\s*(\d+)/);

    if (numberMatch) {
        const number = numberMatch[1];
        // Encontra o que vem depois do número (bairro, etc)
        const afterNumber = address.substring(address.indexOf(number) + number.length);
        return `Rua ***, ${number}${afterNumber}`;
    }

    // Se não encontrar número, mascara primeiras palavras
    const parts = address.split(' ');
    if (parts.length > 2) {
        return `${parts[0][0]}*** ${parts.slice(-2).join(' ')}`;
    }

    return address;
}

/**
 * Mascara CNPJ
 * Ex: 12.345.678/0001-90 → oculta todos os dígitos
 */
export function maskCNPJ(cnpj: string): string {
    if (!cnpj) return '';

    const digits = cnpj.replace(/\D/g, '');

    if (digits.length !== 14) return cnpj;

    // Mostra apenas os dígitos da filial (0001)
    return `**.***.***/****-**`;
}

/**
 * Mascara RG
 */
export function maskRG(rg: string): string {
    if (!rg) return '';

    const digits = rg.replace(/\D/g, '');

    if (digits.length < 6) return rg;

    // Mostra apenas últimos 3 dígitos
    return `***${digits.slice(-3)}`;
}

/**
 * Mascara nome completo mostrando apenas primeiro e último nome
 * Ex: João Carlos da Silva -> João ****** Silva
 */
export function maskFullName(name: string): string {
    if (!name) return '';

    const parts = name.trim().split(' ').filter(p => p.length > 0);

    if (parts.length <= 2) return name;

    const firstName = parts[0];
    const lastName = parts[parts.length - 1];

    return `${firstName} ${'*'.repeat(6)} ${lastName}`;
}

/**
 * Mascara número de contrato/ID
 * Mostra apenas últimos 4 dígitos
 */
export function maskContractId(id: string): string {
    if (!id) return '';

    if (id.length <= 4) return id;

    return `****${id.slice(-4)}`;
}

/**
 * Mascara data de nascimento mostrando apenas ano
 * Ex: 15/03/1990 → oculta dia e mês
 */
export function maskBirthDate(date: string): string {
    if (!date) return '';

    // Tenta extrair ano (assume formato DD/MM/YYYY ou YYYY-MM-DD)
    const yearMatch = date.match(/\d{4}/);

    if (yearMatch) {
        return `**/**/${yearMatch[0]}`;
    }

    return '**/**/****';
}
