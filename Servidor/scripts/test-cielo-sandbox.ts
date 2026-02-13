import axios from 'axios';

const MERCHANT_ID = process.env.CIELO_MERCHANT_ID;
const MERCHANT_KEY = process.env.CIELO_MERCHANT_KEY;

console.log('--- TESTE SANDBOX CIELO ---');
console.log(`ID: ${MERCHANT_ID}`);
console.log(`Key: ${MERCHANT_KEY}`);

const sandboxClient = axios.create({
    baseURL: 'https://apisandbox.cieloecommerce.cielo.com.br',
    headers: {
        'Content-Type': 'application/json',
        'MerchantId': MERCHANT_ID,
        'MerchantKey': MERCHANT_KEY,
    }
});

async function testSandbox() {
    try {
        console.log('Tentando criar transação/token no Sandbox...');
        // Tentar tokenizar (operação simples)
        const response = await sandboxClient.post('/1/card/', {
            "CustomerName": "Comprador Teste Safe",
            "CardNumber": "4551870000000181",
            "Holder": "Comprador T Cielo",
            "ExpirationDate": "12/2030",
            "Brand": "Visa"
        });

        console.log('✅ SUCESSO NO SANDBOX!');
        console.log('Token:', response.data.CardToken);
    } catch (error: any) {
        console.error('❌ FALHA NO SANDBOX');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

testSandbox();
