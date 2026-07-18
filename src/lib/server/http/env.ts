import { API_BASE_URL } from '$env/static/private';

console.log(API_BASE_URL);
if (!API_BASE_URL) {
	throw new Error('API_BASE_URL is not set — check your .env file');
}

export { API_BASE_URL };
