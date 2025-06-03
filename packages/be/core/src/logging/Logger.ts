import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import winston from "winston";
import winstonDaily from "winston-daily-rotate-file";

export interface LoggingConfig {
  level?: string;
  dir?: string;
  format?: "json" | "simple";
  httpLogging?: boolean;
  maxFiles?: number;
  correlationId?: boolean;
}

export class Logger {
  private winston: winston.Logger;
  private config: LoggingConfig;

  constructor(config: LoggingConfig) {
    this.config = {
      level: "info",
      dir: "./logs",
      format: "simple",
      httpLogging: true,
      maxFiles: 30,
      correlationId: true,
      ...config,
    };

    this.winston = this.createLogger();
  }

  static create(config: LoggingConfig): Logger {
    return new Logger(config);
  }

  info(message: string, meta?: object): void {
    this.winston.info(message, this.addCorrelation(meta));
  }

  error(error: Error | string, context?: object): void {
    if (error instanceof Error) {
      this.winston.error(
        error.message,
        this.addCorrelation({
          ...context,
          stack: error.stack,
          name: error.name,
        }),
      );
    } else {
      this.winston.error(error, this.addCorrelation(context));
    }
  }

  warn(message: string, meta?: object): void {
    this.winston.warn(message, this.addCorrelation(meta));
  }

  debug(message: string, meta?: object): void {
    this.winston.debug(message, this.addCorrelation(meta));
  }

  private createLogger(): winston.Logger {
    // Ensure log directory exists
    const logDir = this.config.dir || "./logs";
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }

    const format =
      this.config.format === "json"
        ? winston.format.combine(
            winston.format.timestamp({
              format: "YYYY-MM-DD HH:mm:ss",
            }),
            winston.format.errors({ stack: true }),
            winston.format.json(),
          )
        : winston.format.combine(
            winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
            winston.format.errors({ stack: true }),
            winston.format.printf(({ timestamp, level, message }) => {
              return `${timestamp} ${level}: ${message}`;
            }),
          );

    // Console format for development (timestamp first, then colorized)
    const consoleFormat = winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.errors({ stack: true }),
      winston.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} ${level}: ${message}`;
      }),
      winston.format.colorize({ all: true }),
    );

    const transports: winston.transport[] = [
      // Console transport for development
      new winston.transports.Console({
        level: process.env.NODE_ENV === "production" ? "info" : "debug",
        format: consoleFormat,
      }),

      // File transport for all logs
      new winstonDaily({
        level: this.config.level,
        datePattern: "YYYY-MM-DD",
        dirname: join(logDir, "combined"),
        filename: "%DATE%.log",
        maxFiles: this.config.maxFiles,
        zippedArchive: true,
        format,
      }),

      // Error-only file transport
      new winstonDaily({
        level: "error",
        datePattern: "YYYY-MM-DD",
        dirname: join(logDir, "error"),
        filename: "%DATE%.log",
        maxFiles: this.config.maxFiles,
        zippedArchive: true,
        format,
      }),
    ];

    return winston.createLogger({
      level: this.config.level,
      format,
      transports,
      exitOnError: false,
    });
  }

  private addCorrelation(meta?: object): object {
    if (!this.config.correlationId) {
      return meta || {};
    }

    // In a real implementation, you'd get this from async local storage
    // or from the request context
    return {
      ...meta,
      correlationId: this.generateCorrelationId(),
    };
  }

  private generateCorrelationId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}

// Default logger instance for convenience
export const defaultLogger = new Logger({
  level: "info",
  dir: "./logs",
  format: "simple",
});

// Convenience function to create a logger with custom config
export function createLogger(config: LoggingConfig): Logger {
  return new Logger(config);
}

// Type alias for better ergonomics
export type LoggerConfig = LoggingConfig;
