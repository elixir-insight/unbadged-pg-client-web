import { API_BASE_URL, INVOICE_API_BASE_URL } from '$env/static/private';

if (!API_BASE_URL) {
	throw new Error('API_BASE_URL is not set — check your .env file');
}

if (!INVOICE_API_BASE_URL) {
	throw new Error('INVOICE_API_BASE_URL is not set — check your .env file');
}

export { API_BASE_URL, INVOICE_API_BASE_URL };
