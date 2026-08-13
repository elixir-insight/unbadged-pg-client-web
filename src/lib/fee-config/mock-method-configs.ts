import { PAYMENT_PATH_MATRIX } from './payment-path-matrix';
import type {
	PaymentInstrument,
	PaymentMethod,
	PaymentMethodConfiguration,
	PaymentPathSelection,
	PaymentRails
} from './types';

const FIXED_PIPELINE = 'omiware';

function configKey(
	pipeline: string,
	method: PaymentMethod,
	instrument: PaymentInstrument,
	paymentRails: PaymentRails
): string {
	return `${pipeline}|${method}|${instrument}|${paymentRails}`;
}

export const MOCK_METHOD_CONFIGS: PaymentMethodConfiguration[] = PAYMENT_PATH_MATRIX.map(
	(combo, index) => ({
		id: `mc-${String(index + 1).padStart(3, '0')}`,
		pipelineId: FIXED_PIPELINE,
		method: combo.method,
		instrument: combo.instrument,
		paymentRails: combo.paymentRails,
		effectiveFrom: '2026-01-01',
		effectiveTo: null
	})
);

const configByKey = new Map(
	MOCK_METHOD_CONFIGS.map((config) => [
		configKey(config.pipelineId, config.method, config.instrument, config.paymentRails),
		config
	])
);

export function resolveMethodConfigId(selection: PaymentPathSelection): string | null {
	if (!selection.method || !selection.instrument || !selection.paymentRails) return null;

	const pipeline = selection.pipeline || FIXED_PIPELINE;
	const exactKey = configKey(
		pipeline,
		selection.method,
		selection.instrument,
		selection.paymentRails
	);
	const exactMatch = configByKey.get(exactKey);
	if (exactMatch) return exactMatch.id;

	// Mock configs are pipeline-scoped to omiware until upstream method-config API exists.
	return (
		MOCK_METHOD_CONFIGS.find(
			(config) =>
				config.method === selection.method &&
				config.instrument === selection.instrument &&
				config.paymentRails === selection.paymentRails
		)?.id ?? null
	);
}

export function getMethodConfigById(id: string): PaymentMethodConfiguration | undefined {
	return MOCK_METHOD_CONFIGS.find((config) => config.id === id);
}

export function defaultPaymentPathSelection(): PaymentPathSelection {
	return {
		pipeline: '',
		method: '',
		instrument: '',
		paymentRails: ''
	};
}

export { FIXED_PIPELINE };
