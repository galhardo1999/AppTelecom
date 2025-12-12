import axios from 'axios';
import { Buffer } from 'buffer';

const API_URL = process.env.EXPO_PUBLIC_IXC_HOST;
const API_TOKEN = process.env.EXPO_PUBLIC_IXC_TOKEN;

if (!API_URL || !API_TOKEN) {
    console.warn('Missing API configuration. Please check .env file.');
}

// Create Basic Auth Header
// IXC Token is often used as the username in Basic Auth, with empty password, or as specified.
// The documentation says: Authorization: 'Basic ' + new Buffer.from(token).toString('base64')
// This implies the token is the "username:password" string or just the string to be base64 encoded.
// In the doc: let token = 'process.env.TOKEN'; ... Buffer.from(token).toString('base64')
// So we just base64 encode the token directly.
const authHeader = `Basic ${Buffer.from(API_TOKEN || '').toString('base64')}`;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'ixcsoft': 'listar', // Default for listing, often required for search
    },
});

export const ixcApi = {
    // Find client by hotsite_email
    findClientByEmail: async (email: string) => {
        try {
            // IXC listing usually requires POST with specific body to filter
            // Based on docs:
            /*
            {
              qtype: 'cliente.hotsite_email',
              query: email,
              oper: '=',
              page: '1',
              rp: '1',
              sortname: 'cliente.id',
              sortorder: 'desc'
            }
            */
            const response = await api.post('/cliente', {
                qtype: 'cliente.hotsite_email',
                query: email,
                oper: '=',
                page: '1',
                rp: '1',
                sortname: 'cliente.id',
                sortorder: 'desc'
            });

            // IXC response format: { total: number, registros: [...] }
            if (response.data && response.data.registros && response.data.registros.length > 0) {
                return response.data.registros[0];
            }
            return null;
        } catch (error) {
            console.error('Error fetching client:', error);
            throw error;
        }
    }
};

export default api;
