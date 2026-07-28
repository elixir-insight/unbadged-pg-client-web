/** Formats API enum-style labels: `CREDIT_CARD` → `Credit Card`. Leaves plain text alone. */
export function formatSnakeCaseLabel(value: string): string {
	const trimmed = value.trim();
	if (!trimmed || trimmed === '—') return '—';
	if (!trimmed.includes('_')) return trimmed;

	return trimmed
		.split(/_+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
		.join(' ');
}

/** Truncates long table values; full string should still be available via `title` where needed. */
export function truncateText(value: string, maxLength = 24): string {
	const trimmed = value.trim();
	if (!trimmed || trimmed === '—') return '—';
	if (trimmed.length <= maxLength) return trimmed;
	return `${trimmed.slice(0, Math.max(maxLength - 1, 1))}…`;
}
