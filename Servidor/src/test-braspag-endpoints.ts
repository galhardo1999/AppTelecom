
import axios from 'axios';

const CIELO_MERCHANT_ID = process.env.CIELO_MERCHANT_ID || '';
const CIELO_MERCHANT_KEY = process.env.CIELO_MERCHANT_KEY || '';
const BASE_URL = 'https://api.braspag.com.br';

const headers = {
    'Content-Type': 'application/json',
    'MerchantId': CIELO_MERCHANT_ID,
    'MerchantKey': CIELO_MERCHANT_KEY,
    'RequestId': 'test-discovery-' + Date.now()
};

const payload = {
    "CustomerName": "Comprador Teste",
    "CardNumber": "4551870000000181",
    "Holder": "Comprador T Cielo",
    "ExpirationDate": "12/2030",
    "Brand": "Visa"
};

const endpoints = [
    '/1/card/',
    '/v1/card/',
    '/v2/card/',
    '/v2/cards/',
    '/1/cards/',
    '/v2/sales/' // Just to check if this exists, even if 400
];

async function discover() {
    console.log(`Testing Braspag endpoints on ${BASE_URL}...\n`);

    for (const endpoint of endpoints) {
        try {
            console.log(`Trying POST ${endpoint}...`);
            const response = await axios.post(`${BASE_URL}${endpoint}`, payload, { headers });
            console.log(`✅ SUCCESS [${endpoint}]: Status ${response.status}`);
            console.log(response.data);
        } catch (error: any) {
            if (error.response) {
                console.log(`❌ FAILED [${endpoint}]: Status ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            } else {
                console.log(`❌ ERROR [${endpoint}]: ${error.message}`);
            }
        }
        console.log('---');
    }
}

discover();
