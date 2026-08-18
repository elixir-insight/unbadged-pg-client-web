import type { FeeSlabRow, FeeType } from '$lib/fee-config/types';
import {
	coerceBaseAmountValue,
	isOpenEndedChargeBaseAmount,
	toChargeBaseAmountDisplay
} from './base-amount';
import { coerceRateValue, normalizeChargeRateFromApi } from './charge-rate';
import type { ChargeConfigurationItem, ChargeSlabSection } from './types';

export function mapChargeConfigurationRecords(
	records: Array<{
		id: string | number;
		methodConfigId: string | number;
		pipelineCode?: string | null;
		vaNumber?: string | null;
		baseAmount?: string | number | null;
		chargeRate?: string | number | null;
		chargeType?: string | null;
		gstExclusive?: boolean;
		gstPercentage?: string | null;
		effectiveFrom?: string | null;
		effectiveTo?: string | null;
	}>
): ChargeConfigurationItem[] {
	return records.map((record) => ({
		id: String(record.id),
		methodConfigId: String(record.methodConfigId),
		pipelineCode: record.pipelineCode?.trim() ?? '',
		vaNumber: record.vaNumber?.trim() ?? '',
		baseAmount: coerceBaseAmountValue(record.baseAmount),
		chargeRate: normalizeChargeRateFromApi(
			coerceRateValue(record.chargeRate),
			record.chargeType?.trim() ?? ''
		),
		chargeType: record.chargeType?.trim() ?? '',
		gstExclusive: record.gstExclusive ?? false,
		gstPercentage: record.gstPercentage?.trim() ?? '',
		effectiveFrom: record.effectiveFrom?.trim() ?? '',
		effectiveTo: record.effectiveTo?.trim() ?? ''
	}));
}

export function normalizeChargeType(chargeType: string): FeeType {
	const normalized = chargeType.trim().toLowerCase();
	if (normalized === 'flat') return 'flat';
	return 'percentage';
}

function parseBaseAmountSortValue(baseAmount: string): number {
	const trimmed = baseAmount.trim();
	if (!trimmed) return Number.POSITIVE_INFINITY;
	const numeric = Number(trimmed);
	return Number.isFinite(numeric) ? numeric : Number.POSITIVE_INFINITY;
}

function toDateInput(value: string): string {
	if (!value.trim()) return '';
	return value.includes('T') ? value.slice(0, 10) : value.slice(0, 10);
}

export function filterChargeConfigurationsForPath(
	configurations: ChargeConfigurationItem[],
	methodConfigId: string,
	vaNumber?: string
): ChargeConfigurationItem[] {
	const trimmedMethodConfigId = methodConfigId.trim();
	const trimmedVaNumber = vaNumber?.trim();

	return configurations.filter((config) => {
		if (config.methodConfigId !== trimmedMethodConfigId) return false;
		if (trimmedVaNumber && config.vaNumber && config.vaNumber !== trimmedVaNumber) return false;
		return true;
	});
}

export function mapChargeConfigurationsToSlabs(
	configurations: ChargeConfigurationItem[],
	methodConfigId: string,
	vaNumber?: string
): ChargeSlabSection {
	const rows = filterChargeConfigurationsForPath(configurations, methodConfigId, vaNumber)
		.filter((row) => !isOpenEndedChargeBaseAmount(row.baseAmount) && row.baseAmount.trim() !== '')
		.sort(
			(a, b) => parseBaseAmountSortValue(a.baseAmount) - parseBaseAmountSortValue(b.baseAmount)
		);

	if (rows.length === 0) {
		return {
			slabs: [],
			effectiveFrom: '',
			effectiveTo: '',
			hasConfigurations: false
		};
	}

	const slabs: FeeSlabRow[] = rows.map((row) => ({
		id: row.id,
		baseAmount: toChargeBaseAmountDisplay(row.baseAmount),
		feeType: normalizeChargeType(row.chargeType),
		feeRate: normalizeChargeRateFromApi(row.chargeRate, row.chargeType),
		gstExclusive: row.gstExclusive
	}));

	return {
		slabs,
		effectiveFrom: toDateInput(rows[0]?.effectiveFrom ?? ''),
		effectiveTo: toDateInput(rows[0]?.effectiveTo ?? ''),
		hasConfigurations: true
	};
}
