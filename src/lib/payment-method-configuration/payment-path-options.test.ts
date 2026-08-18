import { describe, expect, it } from 'vitest';
import {
	formatApiLivePreviewPath,
	formatPaymentPathLabel,
	getInstrumentOptions,
	getPaymentRailOptions,
	getServiceTypeOptions,
	resolveMethodConfigIdFromConfigs
} from './payment-path-options';
import type { PaymentMethodConfigItem } from './types';

const sampleConfigs: PaymentMethodConfigItem[] = [
	{
		id: '1',
		pipelineCode: 'TEST',
		serviceType: 'PAYIN',
		instrument: 'CREDIT_CARD',
		paymentRail: 'VISA',
		description: 'test'
	},
	{
		id: '2',
		pipelineCode: 'TEST',
		serviceType: 'PAYIN',
		instrument: 'CREDIT_CARD',
		paymentRail: 'MASTER',
		description: ''
	},
	{
		id: '3',
		pipelineCode: 'TEST',
		serviceType: 'PAYOUT',
		instrument: 'IMPS',
		paymentRail: 'DEFAULT',
		description: ''
	}
];

describe('payment-path-options', () => {
	it('builds cascading dropdown options from API configurations', () => {
		expect(getServiceTypeOptions(sampleConfigs)).toEqual([
			{ value: 'PAYIN', label: 'Payin' },
			{ value: 'PAYOUT', label: 'Payout' }
		]);
		expect(getInstrumentOptions(sampleConfigs, 'PAYIN')).toEqual([
			{ value: 'CREDIT_CARD', label: 'Credit Card' }
		]);
		expect(getPaymentRailOptions(sampleConfigs, 'PAYIN', 'CREDIT_CARD')).toEqual([
			{ value: 'VISA', label: 'Visa' },
			{ value: 'MASTER', label: 'Master' }
		]);
	});

	it('resolves method configuration id for a selected path', () => {
		expect(
			resolveMethodConfigIdFromConfigs(sampleConfigs, {
				method: 'PAYIN',
				instrument: 'CREDIT_CARD',
				paymentRails: 'VISA'
			})
		).toBe('1');
	});

	it('formats API live preview breadcrumb', () => {
		expect(
			formatApiLivePreviewPath({
				pipeline: 'TEST',
				method: 'PAYIN',
				instrument: 'CREDIT_CARD',
				paymentRails: 'VISA'
			})
		).toBe('test · payin · Credit Card · Visa');
	});

	it('formats labels from snake case', () => {
		expect(formatPaymentPathLabel('NET_BANKING')).toBe('Net Banking');
	});
});
