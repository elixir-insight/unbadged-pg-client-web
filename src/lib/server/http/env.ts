import { env } from '$env/dynamic/private';

if (!env.BACKEND_API_URL) {
	throw new Error('BACKEND_API_URL is not set — check your .env file');
}

export const BACKEND_API_URL = env.BACKEND_API_URL;
