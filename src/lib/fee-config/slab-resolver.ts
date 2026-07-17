import type { FeeSlabRow, FeeType, ResolvedSlabFee } from './types';

function parseBaseAmount(value: string): number | null {
	const trimmed = value.trim();
	if (!trimmed) return null;
	const numeric = Number(trimmed);
	return Number.isFinite(numeric) && numeric >= 0 ? numeric : NaN;
}

export function getOpenEndedSlab(slabs: FeeSlabRow[]): FeeSlabRow | undefined {
	const emptyBaseRows = slabs.filter((slab) => slab.baseAmount.trim() === '');
	return emptyBaseRows[emptyBaseRows.length - 1];
}

export function isOpenEndedSlab(slab: FeeSlabRow, slabs: FeeSlabRow[]): boolean {
	return getOpenEndedSlab(slabs)?.id === slab.id;
}

export function sortSlabs(slabs: FeeSlabRow[]): FeeSlabRow[] {
	const openEnded = getOpenEndedSlab(slabs);
	const bounded = slabs.filter((slab) => slab.id !== openEnded?.id);
	bounded.sort((a, b) => {
		const aVal = parseBaseAmount(a.baseAmount) ?? 0;
		const bVal = parseBaseAmount(b.baseAmount) ?? 0;
		return aVal - bVal;
	});
	return openEnded ? [...bounded, openEnded] : bounded;
}

export function resolveSlabForAmount(slabs: FeeSlabRow[], grossAmount: number): FeeSlabRow | null {
	if (slabs.length === 0 || grossAmount <= 0) return null;
	const sorted = sortSlabs(slabs);
	for (const slab of sorted) {
		if (isOpenEndedSlab(slab, slabs)) continue;
		const threshold = parseBaseAmount(slab.baseAmount);
		if (threshold !== null && !Number.isNaN(threshold) && grossAmount <= threshold) {
			return slab;
		}
	}
	return getOpenEndedSlab(slabs) ?? sorted[sorted.length - 1] ?? null;
}

export function computeFeeAmount(grossAmount: number, feeType: FeeType, feeRate: number): number {
	if (feeRate <= 0 || grossAmount <= 0) return 0;
	if (feeType === 'percentage') {
		return (grossAmount * feeRate) / 100;
	}
	return feeRate;
}

export function formatRateLabel(feeType: FeeType, feeRate: number): string {
	if (feeType === 'percentage') return `${feeRate.toFixed(2)}%`;
	return `₹${feeRate.toFixed(2)} flat`;
}

export function resolveSlabFee(grossAmount: number, slabs: FeeSlabRow[]): ResolvedSlabFee | null {
	const slab = resolveSlabForAmount(slabs, grossAmount);
	if (!slab) return null;
	const feeRate = Number(slab.feeRate);
	if (!slab.feeRate.trim() || Number.isNaN(feeRate)) return null;
	const amount = computeFeeAmount(grossAmount, slab.feeType, feeRate);
	return {
		amount,
		rateLabel: formatRateLabel(slab.feeType, feeRate),
		slab
	};
}

export function slabRangeLabel(slabs: FeeSlabRow[], index: number): string {
	const sorted = sortSlabs(slabs);
	const current = sorted[index];
	if (!current) return '—';
	if (isOpenEndedSlab(current, slabs)) {
		const prev = sorted[index - 1];
		const prevAmount = prev ? parseBaseAmount(prev.baseAmount) : null;
		if (prevAmount !== null && !Number.isNaN(prevAmount)) {
			return `${prevAmount.toLocaleString('en-IN')}+`;
		}
		return '∞ open-ended';
	}
	const currentAmount = parseBaseAmount(current.baseAmount);
	if (currentAmount === null || Number.isNaN(currentAmount)) return '—';
	const next = sorted.slice(index + 1).find((slab) => !isOpenEndedSlab(slab, slabs));
	if (!next) return `up to ${currentAmount.toLocaleString('en-IN')}`;
	const nextAmount = parseBaseAmount(next.baseAmount);
	if (nextAmount === null || Number.isNaN(nextAmount)) return '—';
	const prev = sorted[index - 1];
	const prevAmount =
		prev && !isOpenEndedSlab(prev, slabs) ? parseBaseAmount(prev.baseAmount) : null;
	const lower =
		prevAmount !== null && !Number.isNaN(prevAmount)
			? (prevAmount + 1).toLocaleString('en-IN')
			: '0';
	return `${lower} – ${currentAmount.toLocaleString('en-IN')}`;
}
