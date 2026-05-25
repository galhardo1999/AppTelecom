import { cieloService } from '../src/services/cielo.js';
import { mascararToken } from '../src/utils/sanitizar.js';

console.log('--- TESTE DE CREDENCIAIS CIELO ---');
console.log(`MerchantId: '${process.env.CIELO_MERCHANT_ID}' (Length: ${process.env.CIELO_MERCHANT_ID?.length})`);
// Mask key for log safety but show length
const key = process.env.CIELO_MERCHANT_KEY || '';
console.log(`MerchantKey: '${key.substring(0, 4)}...${key.substring(key.length - 4)}' (Length: ${key.length})`);

async function testCieloCredentials() {
    try {
        console.log('\nTentando tokenizar um cartão de teste...');

        // Dados fictícios para teste
        const token = await cieloService.tokenizeCardWithRetry({
            customerName: 'TESTE VALIDACAO',
            cardNumber: '0000000000000001', // Número inválido intencionalmente
            holder: 'TESTE VALIDACAO',
            expirationDate: '12/2030',
            brand: 'visa',
            securityCode: '123'
        });

        console.log('\n✅ Token Gerado:', mascararToken(token));

        console.log('\nValidando token...');
        const isValid = await cieloService.validateToken(token);
        console.log(`Token válido? ${isValid ? 'SIM ✅' : 'NÃO ❌'}`);

    } catch (error: any) {
        const errorMsg = error.message || '';

        if (errorMsg.includes('MerchantKey is invalid') || errorMsg.includes('Credenciais da Cielo inválidas') || errorMsg.includes('401')) {
            console.error('\n❌ ERRO DE AUTENTICAÇÃO:');
            console.error('Suas credenciais (MerchantId ou MerchantKey) estão incorretas ou inválidas na Cielo.');
            console.error('Verifique se copiou corretamente do painel da Cielo.');
            process.exit(1);
        } else if (errorMsg.includes('Erro Cielo')) {
            console.log('\n✅ CREDENCIAIS VÁLIDAS!');
            console.log('A Cielo respondeu com um erro de validação (esperado), o que significa que as credenciais foram aceitas.');
            console.log('Erro retornado (esperado):', errorMsg);
            process.exit(0);
        } else {
            console.error('\n⚠️ ERRO DESCONHECIDO:');
            console.error(error);
            process.exit(1);
        }
    }
}

testCieloCredentials();
