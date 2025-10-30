/**
 * Logger utility for consistent logging across the application
 * Respects environment settings and provides different log levels
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

class Logger {
  private level: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.level = this.getLogLevel();
  }

  private getLogLevel(): LogLevel {
    // Check environment variable for log level
    const envLevel = import.meta.env.VITE_LOG_LEVEL?.toLowerCase();
    if (envLevel && this.isValidLogLevel(envLevel)) {
      return envLevel as LogLevel;
    }

    // Default: debug in dev, error in production
    return this.isDevelopment ? 'debug' : 'error';
  }

  private isValidLogLevel(level: string): boolean {
    return ['debug', 'info', 'warn', 'error', 'none'].includes(level);
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.level === 'none') return false;

    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.level);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, module: string, message: string): string {
    const emoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      none: ''
    }[level];

    return `${emoji} [${module}] ${message}`;
  }

  debug(module: string, message: string, ...args: any[]) {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', module, message), ...args);
    }
  }

  info(module: string, message: string, ...args: any[]) {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', module, message), ...args);
    }
  }

  warn(module: string, message: string, ...args: any[]) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', module, message), ...args);
    }
  }

  error(module: string, message: string, ...args: any[]) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', module, message), ...args);
    }
  }

  // Performance timing utilities
  time(label: string) {
    if (this.shouldLog('debug')) {
      console.time(label);
    }
  }

  timeEnd(label: string) {
    if (this.shouldLog('debug')) {
      console.timeEnd(label);
    }
  }

  // Group utilities for related logs
  group(label: string) {
    if (this.shouldLog('debug')) {
      console.group(label);
    }
  }

  groupEnd() {
    if (this.shouldLog('debug')) {
      console.groupEnd();
    }
  }

  // Set log level dynamically (useful for debugging)
  setLevel(level: LogLevel) {
    if (this.isValidLogLevel(level)) {
      this.level = level;
      this.info('Logger', `Log level changed to: ${level}`);
    }
  }

  // Get current log level
  getLevel(): LogLevel {
    return this.level;
  }
}

// Export singleton instance
export const logger = new Logger();

// Also export type for convenience
export type { LogLevel };
