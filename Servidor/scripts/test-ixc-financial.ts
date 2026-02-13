
import axios from 'axios';
import { Buffer } from 'buffer';
import * as readline from 'readline';

// Configuração do IXC (assumindo que as variáveis de ambiente já estão carregadas ou definidas aqui para teste)
// Em um ambiente real, você usaria dotenv.config()
const IXC_HOST = process.env.IXC_HOST || 'https://ixc.apollotelecom.com.br/webservice/v1';
const IXC_TOKEN = process.env.IXC_TOKEN || ''; // Preencha ou garanta que esteja no env

if (!IXC_TOKEN) {
    console.warn('AVISO: IXC_TOKEN não definido nas variáveis de ambiente.');
}

const authHeader = `Basic ${Buffer.from(IXC_TOKEN).toString('base64')}`;

const ixcClient = axios.create({
    baseURL: IXC_HOST,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ixcsoft': 'listar',
    },
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query: string): Promise<string> => {
    return new Promise((resolve) => rl.question(query, resolve));
};

async function getContracts(clientId: string) {
    try {
        console.log(`Buscando contratos para o cliente ID: ${clientId}...`);
        const response = await ixcClient.post('/cliente_contrato', {
            qtype: 'cliente_contrato.id_cliente',
            query: clientId,
            oper: '=',
            page: '1',
            rp: '20', // Buscar até 20 contratos
            sortname: 'cliente_contrato.id',
            sortorder: 'desc'
        });

        return response.data?.registros || [];
    } catch (error: any) {
        console.error('Erro ao buscar contratos:', error.response?.data || error.message);
        return [];
    }
}

async function getInvoices(contractId: string) {
    try {
        console.log(`Buscando financeiro (fn_areceber) para o contrato ID: ${contractId}...`);
        const response = await ixcClient.post('/fn_areceber', {
            qtype: 'fn_areceber.id_contrato',
            query: contractId,
            oper: '=',
            page: '1',
            rp: '50', // Buscar até 50 faturas
            sortname: 'fn_areceber.data_vencimento',
            sortorder: 'desc'
        });

        return response.data?.registros || [];
    } catch (error: any) {
        console.error('Erro ao buscar financeiro:', error.response?.data || error.message);
        return [];
    }
}

async function main() {
    try {
        const clientId = await askQuestion('Digite o ID do cliente: ');

        if (!clientId) {
            console.log('ID do cliente inválido.');
            rl.close();
            return;
        }

        const contracts = await getContracts(clientId);

        if (contracts.length === 0) {
            console.log('Nenhum contrato encontrado para este cliente.');
            rl.close();
            return;
        }

        console.log('\nContratos encontrados:');
        contracts.forEach((c: any) => {
            console.log(`[${c.id}] Contrato ID: ${c.id} - Plano: ${c.contrato || 'N/A'} - Status: ${c.status || 'N/A'}`);
        });

        const contractId = await askQuestion('\nDigite o ID do contrato desejado: ');

        // Validar se o contrato pertence ao cliente listado (opcional, mas bom pra UX)
        const selectedContract = contracts.find((c: any) => c.id === contractId);
        if (!selectedContract) {
            console.log('Contrato selecionado não está na lista ou inválido.');
        } else {
            console.log(`\nSelecionado: Contrato ${selectedContract.id} - ${selectedContract.contrato}`);
        }

        const invoices = await getInvoices(contractId);

        if (invoices.length === 0) {
            console.log('Nenhum registro financeiro encontrado para este contrato.');
        } else {
            console.log('\nFinanceiro (Contas a Receber):');
            console.table(invoices.map((inv: any) => ({
                ID: inv.id,
                Vencimento: inv.data_vencimento,
                Valor: `R$ ${inv.valor}`,
                Status: inv.status === 'A' ? 'Aberto' : (inv.status === 'P' ? 'Pago' : inv.status),
                Descrição: inv.descricao || ''
            })));
        }

    } catch (error) {
        console.error('Ocorreu um erro:', error);
    } finally {
        rl.close();
    }
}

main();
