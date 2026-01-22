/**
 * Script de teste para API do IXC
 * Execute com: bun run test-ixc.ts
 */

import axios from 'axios';
import { Buffer } from 'buffer';

const IXC_HOST = 'https://ixc.apollotelecom.com.br/webservice/v1';
const IXC_TOKEN = '105:d403ff214a1690590664d0bbdcbb1a940febd9d8e5bea610067309050809f9da';

const authHeader = `Basic ${Buffer.from(IXC_TOKEN).toString('base64')}`;

const ixcClient = axios.create({
    baseURL: IXC_HOST,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ixcsoft': 'listar',
    },
});

// ID da fatura para testar (substitua pelo ID real de uma fatura)
const INVOICE_ID = '10000'; // <- ALTERE AQUI COM UM ID REAL

async function testGetPix() {
    console.log('\n=== TESTE 1: Endpoint /get_pix ===');
    try {
        const response = await ixcClient.post('/get_pix', {
            id_areceber: INVOICE_ID
        });
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error: any) {
        console.log('❌ Erro:', error.response?.status, error.response?.data || error.message);
    }
}

async function testGetInvoice() {
    console.log('\n=== TESTE 2: Buscar fatura direta (/fn_areceber) ===');
    try {
        const response = await ixcClient.post('/fn_areceber', {
            qtype: 'fn_areceber.id',
            query: INVOICE_ID,
            oper: '=',
            page: '1',
            rp: '1'
        });
        console.log('Status:', response.status);
        console.log('Total registros:', response.data?.total);
        if (response.data?.registros?.[0]) {
            const inv = response.data.registros[0];
            console.log('\nCampos da fatura:');
            console.log('- id:', inv.id);
            console.log('- valor:', inv.valor);
            console.log('- data_vencimento:', inv.data_vencimento);
            console.log('- status:', inv.status);
            console.log('- pix_copia_cola:', inv.pix_copia_cola || '(vazio)');
            console.log('- linha_digitavel:', inv.linha_digitavel || '(vazio)');
            console.log('- id_sip_account:', inv.id_sip_account || '(vazio)');
            console.log('\nTodos os campos disponíveis:');
            console.log(Object.keys(inv).join(', '));
        }
    } catch (error: any) {
        console.log('❌ Erro:', error.response?.status, error.response?.data || error.message);
    }
}

async function testListOpenInvoices() {
    console.log('\n=== TESTE 3: Listar faturas abertas (primeiras 5) ===');
    try {
        const response = await ixcClient.post('/fn_areceber', {
            qtype: 'fn_areceber.status',
            query: 'A',
            oper: '=',
            page: '1',
            rp: '5',
            sortname: 'fn_areceber.data_vencimento',
            sortorder: 'desc'
        });
        console.log('Status:', response.status);
        console.log('Total registros:', response.data?.total);
        if (response.data?.registros) {
            response.data.registros.forEach((inv: any, i: number) => {
                console.log(`\n[${i + 1}] ID: ${inv.id} | Valor: ${inv.valor} | Venc: ${inv.data_vencimento}`);
                console.log(`    PIX: ${inv.pix_copia_cola ? 'SIM' : 'NÃO'}`);
            });
        }
    } catch (error: any) {
        console.log('❌ Erro:', error.response?.status, error.response?.data || error.message);
    }
}

async function testPixEndpoints() {
    console.log('\n=== TESTE 4: Tentando outros endpoints de PIX ===');

    const endpoints = ['/get_pix', '/pix', '/gera_pix', '/fn_areceber_pix'];

    for (const endpoint of endpoints) {
        console.log(`\nTestando ${endpoint}...`);
        try {
            const response = await ixcClient.post(endpoint, {
                id_areceber: INVOICE_ID,
                id: INVOICE_ID
            });
            console.log('✅ Funcionou! Status:', response.status);
            console.log('Response:', JSON.stringify(response.data, null, 2));
        } catch (error: any) {
            console.log('❌', error.response?.status || 'Erro', '-', error.response?.data?.message || error.message);
        }
    }
}

// Executar testes
async function runTests() {
    console.log('🔍 Testando API do IXC...\n');
    console.log(`Host: ${IXC_HOST}`);
    console.log(`Invoice ID: ${INVOICE_ID}`);

    await testListOpenInvoices();
    await testGetInvoice();
    await testGetPix();
    await testPixEndpoints();

    console.log('\n✅ Testes finalizados!');
}

runTests();
