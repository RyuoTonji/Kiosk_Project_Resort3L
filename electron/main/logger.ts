import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export class Logger {
  private static logFilePath: string = '';

  private static getLogPath(): string {
    if (!this.logFilePath) {
      const dir = app ? app.getPath('userData') : process.cwd();
      this.logFilePath = path.join(dir, 'kiosk_audit.log');
    }
    return this.logFilePath;
  }

  private static formatMessage(level: LogLevel, context: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    let entry = `[${timestamp}] [${level}] [${context}] ${message}`;

    if (meta) {
      if (meta instanceof Error) {
        entry += ` | Stack: ${meta.stack}`;
      } else {
        // Sanitize any sensitive details before stringifying
        const safeMeta = { ...meta };
        delete safeMeta.cardNumber;
        delete safeMeta.cvv;
        delete safeMeta.apiKey;
        delete safeMeta.secret;
        entry += ` | Data: ${JSON.stringify(safeMeta)}`;
      }
    }

    return entry;
  }

  static log(level: LogLevel, context: string, message: string, meta?: any): void {
    const entry = this.formatMessage(level, context, message, meta);

    // Console output for development
    if (level === 'ERROR') {
      console.error(entry);
    } else if (level === 'WARN') {
      console.warn(entry);
    } else {
      console.log(entry);
    }

    // Append to local audit file
    try {
      fs.appendFileSync(this.getLogPath(), entry + '\n', 'utf8');
    } catch (err) {
      console.error('[Logger] Failed to write to audit log file:', err);
    }
  }

  static info(context: string, message: string, meta?: any): void {
    this.log('INFO', context, message, meta);
  }

  static warn(context: string, message: string, meta?: any): void {
    this.log('WARN', context, message, meta);
  }

  static error(context: string, message: string, meta?: any): void {
    this.log('ERROR', context, message, meta);
  }

  static debug(context: string, message: string, meta?: any): void {
    this.log('DEBUG', context, message, meta);
  }
}
