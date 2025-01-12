import AsyncStorage from '@react-native-async-storage/async-storage';

export enum LogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error'
}

export interface LogEvent {
    level: LogLevel;
    category: string;
    message: string;
    timestamp: Date;
    data?: any;
    error?: Error;
}

const CRITICAL_LOGS_KEY = '@napstr/critical_logs';
const MAX_STORED_LOGS = 100;

class LoggingService {
    private static instance: LoggingService;
    private criticalLogs: LogEvent[] = [];

    private constructor() {
        this.loadStoredLogs();
    }

    static getInstance(): LoggingService {
        if (!LoggingService.instance) {
            LoggingService.instance = new LoggingService();
        }
        return LoggingService.instance;
    }

    private async loadStoredLogs() {
        try {
            const storedLogs = await AsyncStorage.getItem(CRITICAL_LOGS_KEY);
            if (storedLogs) {
                this.criticalLogs = JSON.parse(storedLogs);
            }
        } catch (error) {
            console.error('Failed to load stored logs:', error);
        }
    }

    private async storeCriticalLog(event: LogEvent) {
        try {
            // Add new log to the beginning
            this.criticalLogs.unshift(event);
            
            // Keep only the latest MAX_STORED_LOGS
            if (this.criticalLogs.length > MAX_STORED_LOGS) {
                this.criticalLogs = this.criticalLogs.slice(0, MAX_STORED_LOGS);
            }

            await AsyncStorage.setItem(CRITICAL_LOGS_KEY, JSON.stringify(this.criticalLogs));
        } catch (error) {
            console.error('Failed to store critical log:', error);
        }
    }

    private formatLogMessage(event: LogEvent): string {
        return `[${event.timestamp.toISOString()}] [${event.level.toUpperCase()}] [${event.category}] ${event.message}`;
    }

    private addLog(event: LogEvent) {
        // Format the log message
        const consoleMsg = this.formatLogMessage(event);

        // Console output based on level
        switch (event.level) {
            case LogLevel.ERROR:
                console.error(consoleMsg, event.data || '', event.error || '');
                break;
            case LogLevel.WARN:
                console.warn(consoleMsg, event.data || '');
                break;
            case LogLevel.INFO:
                console.info(consoleMsg, event.data || '');
                break;
            default:
                console.log(consoleMsg, event.data || '');
        }

        // Store critical logs (ERROR and WARN) locally
        if (event.level === LogLevel.ERROR || event.level === LogLevel.WARN) {
            this.storeCriticalLog(event);
        }
    }

    debug(category: string, message: string, data?: any) {
        // Only log debug in development
        if (__DEV__) {
            this.addLog({
                level: LogLevel.DEBUG,
                category,
                message,
                timestamp: new Date(),
                data
            });
        }
    }

    info(category: string, message: string, data?: any) {
        this.addLog({
            level: LogLevel.INFO,
            category,
            message,
            timestamp: new Date(),
            data
        });
    }

    warn(category: string, message: string, data?: any) {
        this.addLog({
            level: LogLevel.WARN,
            category,
            message,
            timestamp: new Date(),
            data
        });
    }

    error(category: string, message: string, error?: Error, data?: any) {
        this.addLog({
            level: LogLevel.ERROR,
            category,
            message,
            timestamp: new Date(),
            error,
            data
        });
    }

    // Get stored critical logs
    async getCriticalLogs(): Promise<LogEvent[]> {
        return this.criticalLogs;
    }

    // Clear stored critical logs
    async clearCriticalLogs(): Promise<void> {
        this.criticalLogs = [];
        await AsyncStorage.setItem(CRITICAL_LOGS_KEY, '[]');
    }

    dispose(): void {
        // Clear any critical logs from memory
        this.criticalLogs = [];
        // Any other cleanup needed can be added here
    }
}

export const logger = LoggingService.getInstance(); 