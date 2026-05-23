/**
 * Production-ready logging utility
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isProduction = process.env.NODE_ENV === 'production';

const log = (level: LogLevel, message: string, data?: any) => {
    if (isProduction && level === 'debug') return;

    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (level === 'error') {
        console.error(formattedMessage, data || '');
        // In a real production app, send to Sentry/LogRocket here
        // Sentry.captureException(data || new Error(message));
    } else if (level === 'warn') {
        console.warn(formattedMessage, data || '');
    } else if (level === 'info') {
        console.info(formattedMessage, data || '');
    } else if (!isProduction) {
        console.log(formattedMessage, data || '');
    }
};

export const logger = {
    debug: (message: string, data?: any) => log('debug', message, data),
    info: (message: string, data?: any) => log('info', message, data),
    warn: (message: string, data?: any) => log('warn', message, data),
    error: (message: string, data?: any) => log('error', message, data),
};
