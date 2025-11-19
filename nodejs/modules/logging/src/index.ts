import * as winston from 'winston';

const format = winston.format((info) => {
  // Hide empty messages.
  if (typeof info.message !== 'string' || !info.message) {
    return false;
  }

  // Hide NATS information error.
  if (info.message.includes && info.message.includes('consumers framework is beta functionality')) {
    return false;
  }

  // Hide websocket disconnection error.
  if (info.message.includes && info.message.includes('Error: read ECONNRESET')) {
    return false;
  }

  return info;
});

const transport = new winston.transports.Console();
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.json(),
    format(),
  ),
  transports: [transport],
});

console.log = (...args: unknown[]) => logger.info.call(logger, ...args);
console.info = (...args: unknown[]) => logger.info.call(logger, ...args);
console.warn = (...args: unknown[]) => logger.warn.call(logger, ...args);
console.error = (...args: unknown[]) => logger.error.call(logger, ...args);
console.debug = (...args: unknown[]) => logger.debug.call(logger, ...args);
