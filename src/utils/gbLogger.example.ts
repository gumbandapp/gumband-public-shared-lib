
// This file is an example of how to use the Logger provided by gumband-public-shared-lib.
// It builds on winston (https://github.com/winstonjs/winston) and provides a simple
// yet extensible way to log messages to the console and/or a file.
import winston from 'winston';
import { GbLogger } from './gbLogger';

// A Simple logger takes no args and uses all our defaults
GbLogger.error('this is a simple error message');
GbLogger.warn('this is a simple warn message');
GbLogger.info('this is a simple info message');
GbLogger.debug('this is a simple debug message');
// You won't see this last one because the default log level is 'info' and above
// see: https://github.com/winstonjs/winston?tab=readme-ov-file#logging-levels

// This logger has a few more options set.
// 'silly' is the most chatty log level, so we should see all the logs
// 'TEST Harness' is the name of the logger, it will be printed with each log message
// 'America/New_York' is the timezone we want to use for the timestamps
// 'hideUtc' is a flag that tells the logger to hide the UTC time in the log messages (since we have our local time)
GbLogger.configureLogger({
    level: 'silly',
    name: 'MyTestLogger',
    tz: 'America/New_York',
    hideUtc: true,
});

// These logs will ONLY go to stdout, the default transport bundled with GBLogger
GbLogger.error('This is an error message');
GbLogger.warn('This is a warn message');
GbLogger.info('This is an info message');
GbLogger.http('This is an http message');
GbLogger.verbose('This is a verbose message');
GbLogger.debug('This is a debug message');
GbLogger.silly('This is a silly message');


// We can also create winston transports and add them post-creation to a logger instance.
// In this example we want only error logs to go to a file.
const fileTransport = new winston.transports.File({
    filename: 'err.log',
    level: 'error',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [customLogger] ${level}: ${message}`;
        },
        )),
});
// Take our new transport and add it to the existing logger
GbLogger.addTransport(fileTransport);

// Some more logs, but only the errors will go to the file
// as the .error calls will use the file transport
GbLogger.error('This is an error message that will go to file as well');
GbLogger.warn('This is a warn message that will go to file as well');
GbLogger.info('This is an info message that will go to file as well');
GbLogger.http('This is an http message that will go to file as well');
GbLogger.verbose('This is a verbose message that will go to file as well');
GbLogger.debug('This is a debug message that will go to file as well');
GbLogger.silly('This is a silly message that will go to file as well');
GbLogger.error('And this is the last error message that will go to file as well');


// Final Thoughts:
// Notice that in this file we have using two DIFFERENT loggers, simpleLogger and logger.
// This is to show that you can have multiple loggers in your application, each with their own settings.
// You may find this useful to create diffferent loggers for different parts of your application, using the "name" option to help you identify where the logs are coming from.
// You can also add transports to each logger to send logs to different places (files, cloud logging services, etc).
