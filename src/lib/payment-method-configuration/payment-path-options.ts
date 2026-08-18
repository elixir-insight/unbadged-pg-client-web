import type { PaymentMethodConfigItem, PaymentPathApiSelection } from './types';

export function mapPaymentMethodConfigurations(
	records: Array<{
		id: string | number;
		pipelineCode: string;
		serviceType: string;
		instrument: string;
		paymentRail: string;
		description?: string;
	}>
): PaymentMethodConfigItem[] {
	return records.map((record) => ({
		id: String(record.id),
		pipelineCode: record.pipelineCode,
		serviceType: record.serviceType,
		instrument: record.instrument,
		paymentRail: record.paymentRail,
		description: record.description?.trim() ?? ''
	}));
}

export function formatPaymentPathLabel(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.split('_')
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
}

function uniqueOptions(values: string[]): { value: string; label: string }[] {
	const seen = new Set<string>();
	const options: { value: string; label: string }[] = [];

	for (const value of values) {
		const trimmed = value.trim();
		if (!trimmed || seen.has(trimmed)) continue;
		seen.add(trimmed);
		options.push({ value: trimmed, label: formatPaymentPathLabel(trimmed) });
	}

	return options;
}

export function getServiceTypeOptions(configs: PaymentMethodConfigItem[]) {
	return uniqueOptions(configs.map((config) => config.serviceType));
}

export function getInstrumentOptions(configs: PaymentMethodConfigItem[], serviceType: string) {
	if (!serviceType.trim()) return [];
	return uniqueOptions(
		configs
			.filter((config) => config.serviceType === serviceType)
			.map((config) => config.instrument)
	);
}

export function getPaymentRailOptions(
	configs: PaymentMethodConfigItem[],
	serviceType: string,
	instrument: string
) {
	if (!serviceType.trim() || !instrument.trim()) return [];
	return uniqueOptions(
		configs
			.filter((config) => config.serviceType === serviceType && config.instrument === instrument)
			.map((config) => config.paymentRail)
	);
}

export function findPaymentMethodConfiguration(
	configs: PaymentMethodConfigItem[],
	selection: Pick<PaymentPathApiSelection, 'method' | 'instrument' | 'paymentRails'>
): PaymentMethodConfigItem | null {
	if (!selection.method || !selection.instrument || !selection.paymentRails) {
		return null;
	}

	return (
		configs.find(
			(config) =>
				config.serviceType === selection.method &&
				config.instrument === selection.instrument &&
				config.paymentRail === selection.paymentRails
		) ?? null
	);
}

export function resolveMethodConfigIdFromConfigs(
	configs: PaymentMethodConfigItem[],
	selection: Pick<PaymentPathApiSelection, 'method' | 'instrument' | 'paymentRails'>
): string | null {
	return findPaymentMethodConfiguration(configs, selection)?.id ?? null;
}

export function formatApiLivePreviewPath(selection: PaymentPathApiSelection): string {
	const pipeline = selection.pipeline.trim().toLowerCase() || '—';
	if (!selection.method) return pipeline;

	return [
		pipeline,
		selection.method.toLowerCase(),
		formatPaymentPathLabel(selection.instrument),
		formatPaymentPathLabel(selection.paymentRails)
	].join(' · ');
}
