import type { FeeSlabRow, FeeType } from '$lib/fee-config/types';
import { denormalizeChargeBaseAmountToApi, chargeBaseAmountsMatch } from './base-amount';
import { denormalizeChargeRateToApi, chargeRatesMatch } from './charge-rate';
import type { ChargeConfigurationItem } from './types';
import { normalizeChargeType } from './map-to-slabs';

export type ChargeConfigurationWriteContext = {
	methodConfigId: string;
	pipelineCode: string;
	vaNumber: string;
	gstPercentage?: string;
};

export function denormalizeChargeType(feeType: FeeType): string {
	return feeType === 'flat' ? 'FLAT' : 'PERCENTAGE';
}

export function isPersistedChargeConfigurationId(id: string): boolean {
	return /^\d+$/.test(id.trim());
}

export function mapSlabToCreateItem(
	slab: FeeSlabRow,
	_context: FeeSlabRow[],
	context: ChargeConfigurationWriteContext,
	gstPercentage = '0'
): {
	baseAmount: string;
	chargeRate: string;
	chargeType: string;
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
		chargeRate: denormalizeChargeRateToApi(slab.feeRate, slab.feeType),
		chargeType: denormalizeChargeType(slab.feeType),
		gstExclusive: slab.gstExclusive,
		gstPercentage,
		methodConfigId: parsedMethodConfigId,
		pipelineCode: context.pipelineCode.trim(),
		vaNumber: context.vaNumber.trim()
	};
}

export function mapSlabsToCreateItems(
	slabs: FeeSlabRow[],
	context: ChargeConfigurationWriteContext,
	gstPercentage = '0'
) {
	return slabs.map((slab) => mapSlabToCreateItem(slab, slabs, context, gstPercentage));
}

export function mapSlabToUpdatePayload(
	slab: FeeSlabRow,
	_allSlabs: FeeSlabRow[],
	gstPercentage = '0'
) {
	return {
		baseAmount: denormalizeChargeBaseAmountToApi(slab.baseAmount),
		chargeRate: denormalizeChargeRateToApi(slab.feeRate, slab.feeType),
		chargeType: denormalizeChargeType(slab.feeType),
		gstExclusive: slab.gstExclusive,
		gstPercentage
	};
}

export function chargeSlabMatchesBaseline(
	slab: FeeSlabRow,
	_allSlabs: FeeSlabRow[],
	baseline: ChargeConfigurationItem
): boolean {
	const chargeTypeMatches =
		normalizeChargeType(baseline.chargeType) === slab.feeType ||
		denormalizeChargeType(slab.feeType) === baseline.chargeType.trim().toUpperCase();

	if (!chargeBaseAmountsMatch(slab.baseAmount, baseline.baseAmount)) return false;
	if (!chargeRatesMatch(slab.feeRate, baseline.chargeRate, baseline.chargeType)) return false;
	if (!chargeTypeMatches) return false;
	if (slab.gstExclusive !== baseline.gstExclusive) return false;
	return true;
}

export function resolveDefaultGstPercentage(baselineConfigs: ChargeConfigurationItem[]): string {
	return baselineConfigs.find((config) => config.gstPercentage.trim())?.gstPercentage.trim() ?? '0';
}

export function slabChangedFromBaseline(
	slab: FeeSlabRow,
	allSlabs: FeeSlabRow[],
	baseline: ChargeConfigurationItem
): boolean {
	return !chargeSlabMatchesBaseline(slab, allSlabs, baseline);
}

export function serializeFeeSlabsForComparison(slabs: FeeSlabRow[]): string {
	return slabs
		.map(
			(slab) => `${slab.id}|${slab.baseAmount}|${slab.feeType}|${slab.feeRate}|${slab.gstExclusive}`
		)
		.join(';;');
}

export function feeSlabsContentEqual(current: FeeSlabRow[], baseline: FeeSlabRow[]): boolean {
	return serializeFeeSlabsForComparison(current) === serializeFeeSlabsForComparison(baseline);
}

export function hasChargeConfigurationChanges(
	slabs: FeeSlabRow[],
	baselineConfigs: ChargeConfigurationItem[]
): boolean {
	if (baselineConfigs.length === 0) {
		return false;
	}

	const baselineIds = new Set(baselineConfigs.map((config) => config.id));
	const currentPersistedIds = new Set(
		slabs.filter((slab) => isPersistedChargeConfigurationId(slab.id)).map((slab) => slab.id)
	);

	for (const baseline of baselineConfigs) {
		if (!currentPersistedIds.has(baseline.id)) {
			return true;
		}
	}

	for (const persistedId of currentPersistedIds) {
		if (!baselineIds.has(persistedId)) {
			return true;
		}
	}

	if (slabs.some((row) => !isPersistedChargeConfigurationId(row.id))) {
		return true;
	}

	for (const slab of slabs.filter((row) => isPersistedChargeConfigurationId(row.id))) {
		const baseline = baselineConfigs.find((config) => config.id === slab.id);
		if (baseline && slabChangedFromBaseline(slab, slabs, baseline)) {
			return true;
		}
	}

	return false;
}

export function hasUnsavedFeeConfigurationChanges(
	slabs: FeeSlabRow[],
	baselineSlabs: FeeSlabRow[],
	baselineConfigs: ChargeConfigurationItem[],
	configured: boolean
): boolean {
	if (!configured) {
		return true;
	}

	if (baselineConfigs.length > 0) {
		return hasChargeConfigurationChanges(slabs, baselineConfigs);
	}

	return !feeSlabsContentEqual(slabs, baselineSlabs);
}

export { normalizeChargeType };
