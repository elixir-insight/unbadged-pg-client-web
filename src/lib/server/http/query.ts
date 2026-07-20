import { API_BASE_URL } from './env';

export function buildUrl(
	path: string,
	query?: Record<string, string | number | boolean | string[] | undefined>
): string {
	const base = API_BASE_URL.replace(/\/+$/, '');
	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	const url = new URL(`${base}${normalizedPath}`);
	if (query) {
		for (const [key, value] of Object.entries(query)) {
			if (value === undefined || value === null || value === '') continue;
			if (Array.isArray(value)) {
				for (const item of value) {
					if (item !== undefined && item !== null && item !== '') {
						url.searchParams.append(key, String(item));
					}
				}
			} else {
				url.searchParams.set(key, String(value));
			}
		}
	}
	return url.toString();
}
