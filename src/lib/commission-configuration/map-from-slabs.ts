import type { FeeSlabRow } from '$lib/fee-config/types';
import { denormalizeChargeBaseAmountToApi } from '$lib/charge-configuration/base-amount';
import { denormalizeChargeRateToApi } from '$lib/charge-configuration/charge-rate';
import {
	denormalizeChargeType,
	type ChargeConfigurationWriteContext
} from '$lib/charge-configuration/map-from-slabs';

export type CommissionConfigurationWriteContext = ChargeConfigurationWriteContext;

export function mapSlabToCommissionCreateItem(
	slab: FeeSlabRow,
	_context: FeeSlabRow[],
	context: CommissionConfigurationWriteContext,
	gstPercentage = '0'
): {
	baseAmount: string;
	commissionType: string;
	feeRate: string;
	gstExclusive: boolean;
	gstPercentage: string;
	methodConfigId: string | number;
	pipelineCode: string;
	vaNumber: string;
} {
	const methodConfigId = Number(context.methodConfigId);
	const parsedMethodConfigId = Number.isFinite(methodConfigId)
		? methodConfigId
		: context.methodConfigId;

	return {
		baseAmount: denormalizeChargeBaseAmountToApi(slab.baseAmount),
		feeRate: denormalizeChargeRateToApi(slab.feeRate, slab.feeType),
		commissionType: denormalizeChargeType(slab.feeType),
		gstExclusive: slab.gstExclusive,
		gstPercentage,
		methodConfigId: parsedMethodConfigId,
		pipelineCode: context.pipelineCode.trim(),
		vaNumber: context.vaNumber.trim()
	};
}

export function mapSlabsToCommissionCreateItems(
	slabs: FeeSlabRow[],
	context: CommissionConfigurationWriteContext,
	gstPercentage = '0'
) {
	return slabs.map((slab) => mapSlabToCommissionCreateItem(slab, slabs, context, gstPercentage));
}
