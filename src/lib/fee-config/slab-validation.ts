import type { FeeSlabRow, SlabValidationResult } from './types';
import { sortSlabs } from './slab-resolver';

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

	for (const slab of slabs) {
		const rowMessages: string[] = [];

		if (!slab.feeRate.trim()) {
			rowMessages.push('Rate is required.');
		} else if (Number.isNaN(Number(slab.feeRate)) || Number(slab.feeRate) < 0) {
			rowMessages.push('Rate must be a non-negative number.');
		}

		const baseAmount = parseBaseAmount(slab.baseAmount);
		if (baseAmount === null || Number.isNaN(baseAmount)) {
			rowMessages.push('Base amount is required.');
		}

		if (rowMessages.length > 0) rowErrors[slab.id] = rowMessages;
	}

	const valid = errors.length === 0 && Object.keys(rowErrors).length === 0;
	return { valid, errors: [...new Set(errors)], rowErrors };
}

export function suggestNextSlabBaseAmount(slabs: FeeSlabRow[]): string {
	const sorted = sortSlabs(slabs);
	const last = sorted[sorted.length - 1];
	const lastAmount = Number(last?.baseAmount.trim());
	if (Number.isFinite(lastAmount) && lastAmount > 0) {
		return String(lastAmount * 10);
	}
	return '10000';
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
		}
	];
}

export function createEmptySlabRow(index: number, baseAmount = ''): FeeSlabRow {
	return {
		id: `slab-${Date.now()}-${index}`,
		baseAmount,
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
			id: `comm-${seed}-2`,
			baseAmount: '100000',
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
			id: `partner-${seed}-2`,
			baseAmount: '100000',
			feeType: 'percentage',
			feeRate: '0.10',
			gstExclusive: false
		}
	];
}
