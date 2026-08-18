import type { FeeType } from '$lib/fee-config/types';

const PERCENTAGE_SCALE = 100;

export function coerceRateValue(value: string | number | null | undefined): string {
	if (value === null || value === undefined) return '';
	return String(value).trim();
}

function parseRate(value: string): number | null {
	const trimmed = value.trim();
	if (!trimmed) return null;
	const numeric = Number(trimmed);
	return Number.isFinite(numeric) ? numeric : null;
}

function formatRate(value: number): string {
	const rounded = Math.round(value * 10_000) / 10_000;
	return String(rounded);
}

export function isPercentageChargeType(chargeType: string): boolean {
	return chargeType.trim().toLowerCase() !== 'flat';
}

export function normalizeChargeRateFromApi(
	chargeRate: string | number,
	chargeType: string
): string {
	const raw = coerceRateValue(chargeRate);
	if (!isPercentageChargeType(chargeType)) {
		return raw;
	}

	const numeric = parseRate(raw);
	if (numeric === null) return raw;

	// Already a decimal display value from UI or prior normalization (1.8, 2.5).
	if (raw.includes('.')) {
		return formatRate(numeric);
	}

	// Upstream percentage values are scaled integers (180 → 1.8, 250 → 2.5).
	if (Number.isInteger(numeric)) {
		return formatRate(numeric / PERCENTAGE_SCALE);
	}

	return formatRate(numeric);
}

export function denormalizeChargeRateToApi(feeRate: string, feeType: FeeType): string {
	if (feeType === 'flat') {
		return feeRate.trim();
	}

	const raw = feeRate.trim();
	const numeric = parseRate(raw);
	if (numeric === null) return raw;

	// UI decimal → upstream integer.
	if (raw.includes('.')) {
		return formatRate(numeric * PERCENTAGE_SCALE);
	}

	// Already scaled or whole-percent integer from a legacy row.
	if (numeric >= PERCENTAGE_SCALE) {
		return formatRate(numeric);
	}

	return formatRate(numeric * PERCENTAGE_SCALE);
}

export function chargeRatesMatch(uiRate: string, storedRate: string, chargeType: string): boolean {
	const uiNormalized = normalizeChargeRateFromApi(uiRate, chargeType);
	const storedNormalized = normalizeChargeRateFromApi(storedRate, chargeType);
	return uiNormalized === storedNormalized;
}
