import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists at project root
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'steeze-backend' },
  transports: [
    // Write all errors to error.log
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
});

// Add console transport in non-production environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length > 1 ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} ${level}: ${message}${metaStr}`;
        })
      ),
    })
  );
}

// Helper functions
export function logInfo(message, meta = {}) {
  logger.info(message, meta);
}

export function logError(message, error, meta = {}) {
  const errorObj = error instanceof Error
    ? { error: error.message, stack: error.stack, ...meta }
    : { error: String(error), ...meta };
  logger.error(message, errorObj);
}

export function logWarn(message, meta = {}) {
  logger.warn(message, meta);
}

export function logDebug(message, meta = {}) {
  logger.debug(message, meta);
}

// HTTP request logger
export function logRequest(req, meta = {}) {
  logger.http(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userId: req.user?.id,
    userAgent: req.get('user-agent'),
    ...meta,
  });
}

// Audit log (admin actions, sensitive operations)
export function logAudit(action, actor, target, details = {}) {
  logger.info(`AUDIT: ${action}`, {
    type: 'audit',
    action,
    actor: typeof actor === 'object' ? { id: actor.id, username: actor.username, role: actor.role } : actor,
    target,
    ...details,
  });
}

// Security event log
export function logSecurity(event, details = {}) {
  logger.warn(`SECURITY: ${event}`, {
    type: 'security',
    event,
    ...details,
  });
}

export default logger;