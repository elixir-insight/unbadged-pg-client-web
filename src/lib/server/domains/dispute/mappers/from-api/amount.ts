export function formatDisputeAmount(value: string, currency: string): string {
	const normalized = value.replace(/,/g, '').trim();
	if (!normalized) return '—';

	const amount = Number(normalized);
	if (!Number.isFinite(amount)) return currency.trim() ? `${value} ${currency.trim()}` : value;

	const formatted = new Intl.NumberFormat('en-IN', {
		minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
		maximumFractionDigits: 2
	}).format(amount);
	const code = currency.trim().toUpperCase();
	return code ? `${formatted} ${code}` : formatted;
}
