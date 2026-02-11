
import axios from 'axios';
import { Buffer } from 'buffer';

const IXC_HOST = process.env.IXC_HOST || '';
const IXC_TOKEN = process.env.IXC_TOKEN || '';

const authHeader = `Basic ${Buffer.from(IXC_TOKEN).toString('base64')}`;

const ixcClient = axios.create({
    baseURL: IXC_HOST,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ixcsoft': 'listar',
    },
});

async function testWallet() {
    try {
        console.log('Testing IXC Wallet (carteira de cobranca) fetch...');
        // Tentar tabela fn_carteira_cobranca, filtrar pelo ID 3
        const response = await ixcClient.post('/fn_carteira_cobranca', {
            qtype: 'fn_carteira_cobranca.id',
            query: '3',
            oper: '=',
            page: '1',
            rp: '1'
        });

        console.log('IXC Response:');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error: any) {
        console.error('Error fetching wallet:', error.response?.data || error.message);
    }
}

testWallet();
