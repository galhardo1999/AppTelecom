import axios from 'axios';

const MERCHANT_ID = process.env.CIELO_MERCHANT_ID?.trim();
const MERCHANT_KEY = process.env.CIELO_MERCHANT_KEY?.trim();

if (!MERCHANT_ID || !MERCHANT_KEY) {
    console.error("Credenciais não encontradas no .env");
    process.exit(1);
}

console.log('--- DIAGNÓSTICO DE CREDENCIAIS (Enhanced) ---');
console.log(`MerchantID: [${MERCHANT_ID}]`);
console.log(`MerchantKey: [${MERCHANT_KEY.substring(0, 5)}...${MERCHANT_KEY.substring(MERCHANT_KEY.length - 5)}]`);

const endpoints = [
    { name: 'Cielo Produção', url: 'https://api.cieloecommerce.cielo.com.br' },
    { name: 'Cielo Sandbox', url: 'https://apisandbox.cieloecommerce.cielo.com.br' },
    { name: 'Braspag Produção', url: 'https://api.braspag.com.br' },
    { name: 'Braspag Sandbox', url: 'https://apisandbox.braspag.com.br' }
];

async function testEndpoint(endpoint: { name: string, url: string }) {
    // Determine path
    let path = '/1/sales/';
    if (endpoint.url.includes('braspag')) {
        path = '/v2/sales/';
    }

    console.log(`\nTestando: ${endpoint.name}`);
    console.log(`URL: ${endpoint.url}${path}`);

    // Configuração do cliente
    const client = axios.create({
        baseURL: endpoint.url,
        headers: {
            'Content-Type': 'application/json',
            'MerchantId': MERCHANT_ID,
            'MerchantKey': MERCHANT_KEY,
        },
        validateStatus: () => true
    });

    try {
        const response = await client.post(path, {
            "MerchantOrderId": "2014111703",
            "Customer": { "Name": "Comprador Teste" },
            "Payment": {
                "Type": "CreditCard",
                "Amount": 100,
                "Installments": 1,
                "CreditCard": {
                    "CardNumber": "4551870000000181",
                    "Holder": "Teste Holder",
                    "ExpirationDate": "12/2030",
                    "Brand": "Visa"
                }
            }
        });

        const status = response.status;
        const data = response.data;
        const dataStr = JSON.stringify(data);

        console.log(`Status: ${status}`);

        if (status === 200 || status === 201) {
            console.log(`✅ SUCESSO! Credenciais aceitas.`);
            return true;
        }

        // Analisar erro
        if (status === 401 || status === 403) {
            console.log(`❌ AUTH FAILED: 401/403 Unauthorized`);
        } else if (dataStr.includes('MerchantKey is invalid') || dataStr.includes('Invalid MerchantId')) {
            console.log(`❌ AUTH FAILED: ${dataStr}`);
        } else {
            // Se deu erro de negócio (ex: 400 Bad Request mas com msg de validação de cartão), Auth passou!
            console.log(`⚠️  POSSÍVEL SUCESSO DE AUTH (Erro de Negócio/Validação)`);
            console.log(`   Resposta: ${dataStr}`);
            return true;
        }

    } catch (error: any) {
        console.log(`❌ ERRO TÉCNICO: ${error.message}`);
    }
    return false;
}

async function run() {
    let successCount = 0;
    for (const ep of endpoints) {
        if (await testEndpoint(ep)) {
            successCount++;
            console.log(`✅ >>> AMBIENTE PROVÁVEL: ${ep.name}`);
        }
    }

    if (successCount === 0) {
        console.log('\n❌ DIAGNÓSTICO FINAL: Credenciais rejeitadas em TODOS os ambientes testados.');
        console.log('Verifique: 1. Validade da chave 2. Se a conta está ativa 3. Se é uma chave de outro produto (ex: Lio, API 1.5)');
    }
}

run();
