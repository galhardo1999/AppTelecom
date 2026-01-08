/**
 * Utility functions for formatting values
 */

/**
 * Format a numeric value as Brazilian currency (BRL)
 */
export const formatCurrency = (val: string | number): string => {
    if (!val && val !== 0) return 'R$ 0,00';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
};

/**
 * Format a date string (YYYY-MM-DD) to Brazilian format (DD/MM)
 */
export const formatDateShort = (dateString: string): string => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}`;
};

/**
 * Format a date string (YYYY-MM-DD) to full Brazilian format (DD/MM/YYYY)
 */
export const formatDateFull = (dateString: string): string => {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};

/**
 * Get the month name in Portuguese from a date string
 */
export const getMonthName = (dateString: string): string => {
    if (!dateString) return '';
    const [year, month] = dateString.split('-');
    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[parseInt(month) - 1] || '';
};

/**
 * Get month name and year from a date string (e.g., "Janeiro/2024")
 */
export const getMonthYear = (dateString: string): string => {
    if (!dateString) return '';
    const [year] = dateString.split('-');
    const monthName = getMonthName(dateString);
    return `${monthName}/${year}`;
};

/**
 * Format bytes to human readable format
 */
export const formatBytes = (bytes: string | number): string => {
    if (!bytes) return '0 B';
    const b = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
    if (isNaN(b) || b === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Extract first name from a full name string
 */
export const getFirstName = (fullName: string | undefined | null): string => {
    if (!fullName) return 'Cliente';
    return fullName.split(' ')[0];
};
