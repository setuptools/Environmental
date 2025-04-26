const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');


const transport = new DailyRotateFile({
    filename: path.join(__dirname, '../logs', "/log-%DATE%.log"),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: false,
    maxSize: '40m',
    maxFiles: '14d',
});


const logger = createLogger({
    level:"debug",
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.printf(({ timestamp, level, message }) => {
            return `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports:[
        transport,
        new transports.Console()
    ]
});

logger.on('error', (err) => {
    console.error("Logging error:", err);
});

module.exports = logger;