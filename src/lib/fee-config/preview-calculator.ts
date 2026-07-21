import { resolveSlabFee } from './slab-resolver';
import type { FeePreviewBreakdown, FeeSlabRow } from './types';

export function calculateFeePreview(
	grossAmount: number,
	chargesSlabs: FeeSlabRow[],
	commissionSlabs: FeeSlabRow[],
	partnerSlabs: FeeSlabRow[]
): FeePreviewBreakdown {
	const gatewayFee = resolveSlabFee(grossAmount, chargesSlabs);
	const commissionFee = resolveSlabFee(grossAmount, commissionSlabs);
	const partnerFee = resolveSlabFee(grossAmount, partnerSlabs);

	const totalDeductions =
		(gatewayFee?.amount ?? 0) + (commissionFee?.amount ?? 0) + (partnerFee?.amount ?? 0);
	const netAmount = Math.max(0, grossAmount - totalDeductions);
	const retainedPercent = grossAmount > 0 ? (netAmount / grossAmount) * 100 : 0;

	return {
		grossAmount,
		gatewayFee,
		commissionFee,
		partnerFee,
		netAmount,
		retainedPercent
	};
}

export function formatCurrency(amount: number): string {
	return amount.toLocaleString('en-IN', {
		style: 'currency',
		currency: 'INR',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});
}
