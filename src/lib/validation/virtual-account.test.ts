import { describe, expect, it } from 'vitest';
import {
	VA_PIPELINE_UNIQUE_ERROR,
	validateConfiguration,
	validateCreateVa,
	validateUpdateVa,
	type ConfigurationValidationInput,
	type VaFormValidationInput
} from './virtual-account';

const validMethodLimits = {
	NEFT: { min: '100', max: '1000', total: '10000' },
	IMPS: { min: '100', max: '1000', total: '10000' }
};

const validCreateVaInput: VaFormValidationInput = {
	bankingPipeline: 'SBI',
	transactionLimit: '1000000',
	dailyDepositLimit: '500000',
	minTxAmount: '100',
	maxTxAmount: '100000',
	transactionTypes: ['NEFT', 'IMPS'],
	methodLimits: validMethodLimits,
	commissionTiers: [
		{
			id: 'tier-1',
			baseAmount: '100',
			method: 'flatrate',
			gatewayFee: '2',
			partnerFee: '1',
			readonly: true
		}
	]
};

const validConfigurationInput: ConfigurationValidationInput = {
	bankPipeline: 'HDFC Bank',
	securityDeposit: '10000',
	transactionLimit: '1000000',
	dailyDepositLimit: '500000',
	minTxAmount: '100',
	maxTxAmount: '100000',
	transactionTypes: [
		{
			id: 'cards',
			label: 'Cards',
			checked: true,
			limits: { min: '100', max: '1000', total: '10000' }
		}
	],
	commissionRows: [
		{
			id: 'row-1',
			baseAmount: '1000',
			method: 'flat_fee',
			gatewayFee: '2.5',
			partnerFee: '1.5'
		}
	],
	requireCommission: true
};

describe('validateCreateVa', () => {
	it('returns no errors for valid create payload', () => {
		expect(validateCreateVa(validCreateVaInput, ['HDFC Bank', 'ICICI Bank'])).toEqual({});
	});

	it('blocks duplicate bank pipeline usage', () => {
		const errors = validateCreateVa(validCreateVaInput, ['SBI']);

		expect(errors.bankingPipeline).toBe(VA_PIPELINE_UNIQUE_ERROR);
	});

	it('requires transaction types for the selected pipeline', () => {
		const errors = validateCreateVa(
			{
				...validCreateVaInput,
				transactionTypes: ['CARD']
			},
			[]
		);

		expect(errors.transactionTypes).toBe(
			'Selected transaction types are not available for this bank pipeline'
		);
	});

	it('requires min transaction amount to be less than or equal to max', () => {
		const errors = validateCreateVa(
			{
				...validCreateVaInput,
				minTxAmount: '5000',
				maxTxAmount: '1000'
			},
			[]
		);

		expect(errors.maxTxAmount).toBe('Min transaction amount cannot exceed max transaction amount');
	});
});

describe('validateUpdateVa', () => {
	it('returns no errors for valid update payload', () => {
		const errors = validateUpdateVa(
			{
				...validCreateVaInput,
				vaStatus: 'ACTIVE',
				commissionEffectiveDate: 'tomorrow'
			},
			['HDFC Bank']
		);

		expect(errors).toEqual({});
	});

	it('allows keeping the same bank pipeline for the current VA', () => {
		const errors = validateUpdateVa(
			{
				...validCreateVaInput,
				vaStatus: 'ON_HOLD',
				commissionEffectiveDate: 'today'
			},
			[]
		);

		expect(errors).toEqual({});
	});

	it('blocks changing to a pipeline used by another VA', () => {
		const errors = validateUpdateVa(
			{
				...validCreateVaInput,
				bankingPipeline: 'HDFC Bank',
				vaStatus: 'ACTIVE',
				commissionEffectiveDate: 'tomorrow'
			},
			['HDFC Bank']
		);

		expect(errors.bankingPipeline).toBe(VA_PIPELINE_UNIQUE_ERROR);
	});
});

describe('validateConfiguration', () => {
	it('returns no errors for valid configuration payload', () => {
		expect(validateConfiguration(validConfigurationInput)).toEqual({});
	});

	it('requires bank pipeline selection', () => {
		const errors = validateConfiguration({
			...validConfigurationInput,
			bankPipeline: ''
		});

		expect(errors.bankPipeline).toBe('Bank pipeline is required');
	});

	it('requires at least one transaction type', () => {
		const errors = validateConfiguration({
			...validConfigurationInput,
			transactionTypes: validConfigurationInput.transactionTypes.map((type) => ({
				...type,
				checked: false
			}))
		});

		expect(errors.transactionTypes).toBe('Select at least one transaction type');
	});

	it('skips commission validation when commission setup is hidden', () => {
		const errors = validateConfiguration({
			...validConfigurationInput,
			commissionRows: [],
			requireCommission: false
		});

		expect(errors.commissionRows).toBeUndefined();
	});

	it('ignores incomplete default commission rows when commission setup is hidden', () => {
		const errors = validateConfiguration({
			...validConfigurationInput,
			commissionRows: [
				{
					id: 'row-1',
					baseAmount: '',
					method: 'flat_fee',
					gatewayFee: '',
					partnerFee: ''
				},
				{
					id: 'row-2',
					baseAmount: '',
					method: 'flat_fee',
					gatewayFee: '',
					partnerFee: ''
				}
			],
			requireCommission: false
		});

		expect(errors.commissionRows).toBeUndefined();
		expect(Object.keys(errors).some((key) => key.startsWith('commissionRows'))).toBe(false);
	});
});
