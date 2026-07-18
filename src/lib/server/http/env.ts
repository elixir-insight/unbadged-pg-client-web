import { env } from '$env/dynamic/private';

if (!env.API_BASE_URL) {
	throw new Error('API_BASE_URL is not set — check your .env file');
}

export const API_BASE_URL = env.API_BASE_URL;
