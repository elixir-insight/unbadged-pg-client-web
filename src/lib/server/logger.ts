import pino from 'pino';
import { dev } from '$app/environment';

export const logger = pino({
	level: dev ? 'debug' : 'info',
	transport: dev
		? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
		: undefined,
	redact: {
		paths: [
			'*.password',
			'*.headers.authorization',
			'*.headers["x-gateway-token"]',
			'*.headers["x-refresh-token"]',
			'*.accessToken',
			'*.idToken',
			'*.gatewayToken',
			'*.refreshToken'
		],
		censor: '[REDACTED]'
	}
});
