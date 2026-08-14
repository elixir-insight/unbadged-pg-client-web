const AMOUNT_SCALE = 100;

/** Legacy upstream values for open-ended rows — normalized to empty UI base amounts on read. */
export const OPEN_ENDED_CHARGE_BASE_AMOUNT = '-1';

export function coerceBaseAmountValue(value: string | number | null | undefined): string {
	if (value === null || value === undefined) return '';
	return String(value).trim();
}

function parseAmount(value: string): number | null {
	const trimmed = value.trim();
	if (!trimmed) return null;
	const numeric = Number(trimmed);
	return Number.isFinite(numeric) ? numeric : null;
}

function formatAmount(value: number): string {
	const rounded = Math.round(value * 100) / 100;
	return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export function isOpenEndedChargeBaseAmount(baseAmount: string): boolean {
	const trimmed = baseAmount.trim();
	return trimmed === '' || trimmed === OPEN_ENDED_CHARGE_BASE_AMOUNT;
}

export function normalizeChargeBaseAmountFromApi(baseAmount: string | number): string {
	const raw = coerceBaseAmountValue(baseAmount);
	if (isOpenEndedChargeBaseAmount(raw)) return '';

	const numeric = parseAmount(raw);
	if (numeric === null) return raw;

	// Upstream sends scaled whole amounts (5000 → 50). Treat decimal strings like 5000.00 as scaled too.
	const isScaledInteger = Number.isInteger(numeric) || /^-?\d+\.0+$/.test(raw);
	if (isScaledInteger) {
		return formatAmount(numeric / AMOUNT_SCALE);
	}

	return formatAmount(numeric);
}

/** Idempotent formatter for slab inputs — raw API (2000) and display (20) both resolve correctly. */
export function toChargeBaseAmountDisplay(baseAmount: string | number): string {
	const raw = coerceBaseAmountValue(baseAmount);
	if (isOpenEndedChargeBaseAmount(raw)) return '';

	const numeric = parseAmount(raw);
	if (numeric === null) return raw;

	const display = formatAmount(numeric);

	// Values below ₹1.00 in API form are already UI display amounts.
	if (numeric < AMOUNT_SCALE) {
		return display;
	}

	const fromApi = normalizeChargeBaseAmountFromApi(baseAmount);
	if (fromApi !== display && denormalizeChargeBaseAmountToApi(fromApi) === display) {
		return fromApi;
	}

	return display;
}

export function denormalizeChargeBaseAmountToApi(baseAmount: string): string {
	const raw = baseAmount.trim();
	if (!raw) return raw;

	const numeric = parseAmount(raw);
	if (numeric === null) return raw;

	return formatAmount(numeric * AMOUNT_SCALE);
}

export function chargeBaseAmountsMatch(a: string, b: string): boolean {
	const rawA = coerceBaseAmountValue(a);
	const rawB = coerceBaseAmountValue(b);
	if (rawA === rawB) return true;

	return (
		denormalizeChargeBaseAmountToApi(rawA) === rawB ||
		rawA === denormalizeChargeBaseAmountToApi(rawB) ||
		toChargeBaseAmountDisplay(rawA) === toChargeBaseAmountDisplay(rawB)
	);
}
