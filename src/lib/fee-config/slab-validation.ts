import { isOpenEndedSlab, sortSlabs } from './slab-resolver';
import type { FeeSlabRow, SlabValidationResult } from './types';

function parseBaseAmount(value: string): number | null {
	const trimmed = value.trim();
	if (!trimmed) return null;
	const numeric = Number(trimmed);
	return Number.isFinite(numeric) && numeric >= 0 ? numeric : NaN;
}

export function validateSlabs(slabs: FeeSlabRow[]): SlabValidationResult {
	const errors: string[] = [];
	const rowErrors: Record<string, string[]> = {};

	if (slabs.length === 0) {
		errors.push('At least one slab row is required.');
		return { valid: false, errors, rowErrors };
	}

	const openEndedRows = slabs.filter((slab) => isOpenEndedSlab(slab, slabs));
	if (openEndedRows.length === 0) {
		errors.push('Exactly one open-ended row is required as the last slab.');
	}
	if (openEndedRows.length > 1) {
		errors.push('Only one open-ended row is allowed.');
	}

	const sorted = sortSlabs(slabs);
	const lastSlab = sorted[sorted.length - 1];
	if (lastSlab && !isOpenEndedSlab(lastSlab, slabs)) {
		errors.push('The open-ended row must be the last slab.');
	}

	const bounded = sorted.filter((slab) => !isOpenEndedSlab(slab, slabs));
	if (bounded.length === 0) {
		errors.push('At least one bounded slab row is required before the open-ended row.');
	}

	const seenThresholds = new Set<number>();
	let previousThreshold: number | null = null;

	for (const slab of sorted) {
		const rowMessages: string[] = [];

		if (!slab.feeRate.trim()) {
			rowMessages.push('Rate is required.');
		} else if (Number.isNaN(Number(slab.feeRate)) || Number(slab.feeRate) < 0) {
			rowMessages.push('Rate must be a non-negative number.');
		}

		if (isOpenEndedSlab(slab, slabs)) {
			if (rowMessages.length > 0) rowErrors[slab.id] = rowMessages;
			continue;
		}

		const threshold = parseBaseAmount(slab.baseAmount);
		if (threshold === null || Number.isNaN(threshold)) {
			rowMessages.push('Base amount is required.');
		} else {
			if (seenThresholds.has(threshold)) {
				rowMessages.push('Duplicate base amount threshold.');
				errors.push('Slab thresholds must not overlap.');
			}
			seenThresholds.add(threshold);

			if (previousThreshold !== null && threshold <= previousThreshold) {
				rowMessages.push('Base amounts must be strictly ascending.');
				errors.push('Slab thresholds must be sorted ascending with no overlaps.');
			}
			previousThreshold = threshold;
		}

		if (rowMessages.length > 0) rowErrors[slab.id] = rowMessages;
	}

	const valid = errors.length === 0 && Object.keys(rowErrors).length === 0;
	return { valid, errors: [...new Set(errors)], rowErrors };
}

export function createDefaultSlabRows(seed = 1): FeeSlabRow[] {
	return [
		{
			id: `slab-${seed}-1`,
			baseAmount: '10000',
			feeType: 'percentage',
			feeRate: '1.80',
			gstExclusive: false
		},
		{
			id: `slab-${seed}-2`,
			baseAmount: '100000',
			feeType: 'percentage',
			feeRate: '1.50',
			gstExclusive: false
		},
		{
			id: `slab-${seed}-open`,
			baseAmount: '',
			feeType: 'percentage',
			feeRate: '1.20',
			gstExclusive: false
		}
	];
}

export function createEmptySlabRow(index: number): FeeSlabRow {
	return {
		id: `slab-${Date.now()}-${index}`,
		baseAmount: '',
		feeType: 'percentage',
		feeRate: '',
		gstExclusive: false
	};
}

export function createCommissionDefaultSlabs(seed = 1): FeeSlabRow[] {
	return [
		{
			id: `comm-${seed}-1`,
			baseAmount: '10000',
			feeType: 'percentage',
			feeRate: '0.30',
			gstExclusive: false
		},
		{
			id: `comm-${seed}-open`,
			baseAmount: '',
			feeType: 'percentage',
			feeRate: '0.25',
			gstExclusive: false
		}
	];
}

export function createPartnerDefaultSlabs(seed = 1): FeeSlabRow[] {
	return [
		{
			id: `partner-${seed}-1`,
			baseAmount: '10000',
			feeType: 'percentage',
			feeRate: '0.12',
			gstExclusive: false
		},
		{
			id: `partner-${seed}-open`,
			baseAmount: '',
			feeType: 'percentage',
			feeRate: '0.10',
			gstExclusive: false
		}
	];
}
