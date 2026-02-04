/**
 * Mapeamento de imagens promocionais por cidade
 * Imagens ficam no servidor para permitir atualizações dinâmicas
 */

const BFF_URL = process.env.EXPO_PUBLIC_BFF_URL || 'http://localhost:3000';

// Mapeamento de ID da cidade para pasta e arquivos
// Quando houver múltiplas imagens, adicione mais itens ao array
const CITY_IMAGES: Record<string, { folder: string; files: string[] }> = {
    '3297': { folder: 'Aracatuba', files: ['ARACATUBA.jpg'] },
    '3335': { folder: 'Bento de Abreu', files: ['BENTO-DE-ABREU.jpg'] },
    '3339': { folder: 'Birigui', files: ['BIRIGUI.jpg'] },
    '3472': { folder: 'Guararapes', files: ['GUARARAPES.jpg'] },
    '3664': { folder: 'Panorama', files: ['PANORAMA.jpg'] },
    '3675': { folder: 'Pauliceia', files: ['PAULICEIA.jpg'] },
    '5571': { folder: 'Pauliceia', files: ['PAULICEIA.jpg'] }, // Código alternativo
    '3731': { folder: 'Presidente Venceslau', files: ['PRESIDENTE-VENCESLAU.jpg'] },
    '3792': { folder: 'Santa Mercedes', files: ['SANTA-MERCEDES.jpg'] },
};

/**
 * Obtém as URLs das imagens promocionais baseadas no ID da cidade
 * @param cityId ID da cidade no IXC (ex: "3297" para Araçatuba)
 * @returns Array de URLs das imagens no servidor
 */
export const getCityImageUrls = (cityId: string | undefined): string[] => {
    if (!cityId) {
        console.log('[CITY_IMAGE] cityId é undefined/null, usando imagem padrão');
        return [`${BFF_URL}/public/cities/default.jpg`];
    }

    const cityInfo = CITY_IMAGES[cityId];

    if (cityInfo) {
        const urls = cityInfo.files.map(file =>
            `${BFF_URL}/public/cities/${encodeURIComponent(cityInfo.folder)}/${encodeURIComponent(file)}`
        );
        console.log(`[CITY_IMAGE] cityId: "${cityId}" -> ${cityInfo.folder} (${urls.length} imagens)`);
        return urls;
    }

    console.log(`[CITY_IMAGE] cityId: "${cityId}" não encontrado, usando imagem padrão`);
    return [`${BFF_URL}/public/cities/default.jpg`];
};

/**
 * Verifica se a cidade tem imagem específica
 */
export const hasCityImage = (cityId: string | undefined): boolean => {
    if (!cityId) return false;
    return cityId in CITY_IMAGES;
};

/**
 * URL da imagem padrão
 */
export const getDefaultImageUrl = (): string => {
    return `${BFF_URL}/public/cities/default.jpg`;
};
