import { BACKEND_API_URL } from './env';

export function buildUrl(
	path: string,
	query?: Record<string, string | number | boolean | string[] | undefined>
): string {
	const url = new URL(path, BACKEND_API_URL);
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
