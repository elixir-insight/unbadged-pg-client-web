/**
 * The backend answers a failed document upload with a generic "One or more documents failed to
 * upload" and, sometimes, the per-file reasons beside it. Collect those reasons (from `errors`,
 * `error`, or `data[].error|message|reason`) so the user sees why, not just that it failed.
 */
export function uploadErrorDetails(body: unknown): string[] {
	if (!body || typeof body !== 'object') return [];
	const record = body as Record<string, unknown>;
	const details: string[] = [];

	const add = (value: unknown) => {
		if (typeof value === 'string' && value.trim()) details.push(value.trim());
		else if (Array.isArray(value)) value.forEach(add);
		else if (value && typeof value === 'object') {
			const item = value as Record<string, unknown>;
			add(item.error ?? item.reason ?? item.message);
		}
	};

	add(record.errors);
	add(record.error);
	if (Array.isArray(record.data)) record.data.forEach(add);

	const message = typeof record.message === 'string' ? record.message.trim() : '';
	return [...new Set(details)].filter((detail) => detail !== message);
}
