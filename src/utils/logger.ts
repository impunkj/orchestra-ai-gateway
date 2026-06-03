import winston from 'winston';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
};

winston.addColors(colors);

// Clean text format for local terminal debugging
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info) => `[${info.timestamp}] [${info.level.toUpperCase()}]: ${info.message}`)
);

export const logger = winston.createLogger({
  levels,
  transports: [
    new winston.transports.Console({
      //  If we are in production, dump raw JSON to stdout. Otherwise, use pretty colors.
      format: process.env.NODE_ENV === 'production' 
        ? winston.format.combine(winston.format.timestamp(), winston.format.json())
        : winston.format.combine(winston.format.colorize({ all: true }), devFormat),
    }),
  ],
});