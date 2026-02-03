export interface Plan {
    speed: string;
    price: string;
    wifi: string;
    features: string[];
    isPopular?: boolean;
}

export const CITY_PLANS: Record<string, Plan[]> = {
    'aracatuba': [
        {
            speed: '400 MEGA',
            price: '89,90',
            wifi: 'Wi-Fi 5 Dual Band',
            features: ['Instalação Grátis', 'Suporte Humanizado', 'Apps de Filmes'],
            isPopular: false,
        },
        {
            speed: '600 MEGA',
            price: '99,90',
            wifi: 'Wi-Fi 6 AX',
            features: ['Instalação Grátis', 'Suporte Prioritário', 'Paramount+'],
            isPopular: true,
        },
        {
            speed: '1 GIGA',
            price: '149,90',
            wifi: 'Wi-Fi 6 Mesh',
            features: ['Instalação Grátis', 'IP Fixo Opcional', 'Todos os Apps'],
            isPopular: false,
        }
    ],
    'birigui': [
        {
            speed: '400 MEGA',
            price: '89,90',
            wifi: 'Wi-Fi 5 Dual Band',
            features: ['Instalação Grátis', 'Suporte Humanizado'],
            isPopular: false,
        },
        {
            speed: '600 MEGA',
            price: '99,90',
            wifi: 'Wi-Fi 6 AX',
            features: ['Instalação Grátis', 'Suporte Prioritário'],
            isPopular: true,
        },
        {
            speed: '800 MEGA',
            price: '129,90',
            wifi: 'Wi-Fi 6 AX',
            features: ['Instalação Grátis', 'Gamer Optimized'],
            isPopular: false,
        }
    ],
    'guararapes': [
        {
            speed: '500 MEGA',
            price: '99,90',
            wifi: 'Wi-Fi 5 Dual Band',
            features: ['Instalação Grátis'],
            isPopular: true,
        }
    ],
    // Default fallback for other cities
    'default': [
        {
            speed: '400 MEGA',
            price: '99,90',
            wifi: 'Wi-Fi 5',
            features: ['Instalação Grátis'],
            isPopular: false,
        },
        {
            speed: '600 MEGA',
            price: '119,90',
            wifi: 'Wi-Fi 6',
            features: ['Instalação Grátis'],
            isPopular: true,
        },
    ]
};

export function getPlansForCity(city: string) {
    const normalizedCity = city.toLowerCase();
    return CITY_PLANS[normalizedCity] || CITY_PLANS['default'];
}

export function formatCityName(slug: string) {
    const cityMap: Record<string, string> = {
        'aracatuba': 'Araçatuba',
        'birigui': 'Birigui',
        'guararapes': 'Guararapes',
        'panorama': 'Panorama',
        'pauliceia': 'Paulicéia', // slug might be without accent
        'paulicéia': 'Paulicéia',
        'santa-mercedes': 'Santa Mercedes',
        'presidente-venceslau': 'Presidente Venceslau',
        'bento-de-abreu': 'Bento de Abreu',
    };
    return cityMap[slug] || slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
}
