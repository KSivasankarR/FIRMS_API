const path = require('path');
const appRoot = require('app-root-path');
const winston = require("winston");
const fs = require("fs");
const moment = require("moment");

const customFormat = winston.format.combine(
	winston.format.timestamp(),
	winston.format.printf((info: any) => `${info.timestamp} ${info.level}: ${info.message}`),

);
const currentDate = new Date().toISOString().slice(0, 10);

const options = {
	file: {
		level: "info",
		filename: `${process.env.FIRMS_LOG_FILE_PATH}/logs/FIRM_${currentDate}.log`,
		datePattern: 'YYYY-MM-DD-HH',
		handleExceptions: true,
		json: true,
		maxSize: '20m',
		maxFiles: '1',
		colorize: true,
		format: customFormat

	},
	console: {
		level: "debug",
		handleExceptions: true,
		json: false,
		colorize: true,
		format: customFormat
	}
};

export const logger = winston.createLogger({
	transports: [
		new winston.transports.File(options.file),
		new winston.transports.Console(options.console),

	],
	// exceptionHandlers: [
	// 	new winston.transports.File({
	// 		filename: `${appRoot}/logs/exceptions.log`,
	// 		timestamp: true,
	// 		maxFiles:'1d'
	// 	}),
	// ],
	exitOnError: false,

});

function deletePreviousDayLogFiles(directory:any) {
	const today = moment();
	const yesterday = today.clone().subtract(1, 'days');
	fs.readdir(directory, (err:any, files:any) => {
		if (err) {
			console.error('Error reading log directory:', err);
			return;

		}
		files.forEach((file:any) => {
			if (file.startsWith('app_') && file.endsWith('.log')) {
				const fileDate = moment(file.substring(4, 14), 'YYYY-MM-DD');
				if (fileDate.isSame(yesterday, 'day')) {
					const filePath = path.join(directory, file);
					fs.unlink(filePath, (err:any) => {
						if (err) {
							console.error('Error deleting log file:', err);
						} else {
							console.log('Log file deleted:', filePath);

						}
					});
				}
			}
		});
	});
}
const logDirectory = path.join(appRoot.toString(), 'logs');

deletePreviousDayLogFiles(logDirectory);
