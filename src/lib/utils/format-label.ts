const PRESERVED_ACRONYMS = new Set(['UPI', 'IMPS', 'NEFT', 'RTGS', 'NB']);

/** Title-case labels from API enums (e.g. DEBIT_CARD → Debit Card, UPI → UPI). */
export function formatLabel(value: string): string {
	const trimmed = value.trim();
	if (!trimmed || trimmed === '—') return '—';

	const upper = trimmed.toUpperCase();
	if (PRESERVED_ACRONYMS.has(upper)) return upper;

	return trimmed
		.split(/[_\s-]+/)
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(' ');
}
