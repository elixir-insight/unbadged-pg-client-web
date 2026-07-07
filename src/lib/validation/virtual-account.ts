import * as v from 'valibot';
import { flattenIssues, requiredText } from './onboarding';
import {
	COMMISSION_EFFECTIVE_OPTIONS,
	VA_BANK_PIPELINES,
	VA_COMMISSION_METHODS,
	VA_PIPELINE_TRANSACTION_TYPES
} from '$lib/components/organization/va-form-constants';
import { availableBankPipelines } from '../../routes/management/onboarding/create-organization/constants';

const POSITIVE_AMOUNT_REGEX = /^\d+(\.\d{1,2})?$/;
const VA_BANK_PIPELINE_VALUES = VA_BANK_PIPELINES.map((pipeline) => pipeline.value);
const CONFIGURATION_BANK_PIPELINE_VALUES = availableBankPipelines.map((pipeline) => pipeline.value);
const VA_COMMISSION_METHOD_VALUES = VA_COMMISSION_METHODS.map((method) => method.value);
const COMMISSION_EFFECTIVE_VALUES = COMMISSION_EFFECTIVE_OPTIONS.map((option) => option.value);

export const CONFIGURATION_COMMISSION_METHODS = [
	'flat_fee',
	'percentage',
	'tiered',
	'interchange'
] as const;

export const VA_STATUS_VALUES = [
	'ACTIVE',
	'IN_ACTIVE',
	'ON_HOLD',
	'RESERVE',
	'FROZEN',
	'DISABLED',
	'LIEN_MARK'
] as const;

export const VA_PIPELINE_UNIQUE_ERROR =
	'A virtual account already exists for this bank pipeline. Only one VA is allowed per pipeline.';

function requiredPositiveAmount(
	requiredMessage: string,
	invalidMessage = 'Enter a valid positive amount'
) {
	return v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, requiredMessage),
		v.check((val) => POSITIVE_AMOUNT_REGEX.test(val) && Number(val) > 0, invalidMessage)
	);
}

function requiredNonNegativeAmount(requiredMessage: string) {
	return v.pipe(
		v.string(),
		v.trim(),
		v.minLength(1, requiredMessage),
		v.check((val) => POSITIVE_AMOUNT_REGEX.test(val) && Number(val) >= 0, 'Enter a valid amount')
	);
}

function requiredBankPipeline(values: string[]) {
	return v.pipe(
		requiredText('Bank pipeline is required'),
		v.check((val) => values.includes(val), 'Select a valid bank pipeline')
	);
}

function requiredVaBankPipeline() {
	return requiredBankPipeline(VA_BANK_PIPELINE_VALUES);
}

function requiredConfigurationBankPipeline() {
	return requiredBankPipeline(CONFIGURATION_BANK_PIPELINE_VALUES);
}

const methodLimitFieldsSchema = v.object({
	min: requiredPositiveAmount('Min value is required'),
	max: requiredPositiveAmount('Max value is required'),
	total: requiredPositiveAmount('Total limit is required')
});

const vaCommissionTierSchema = v.object({
	id: v.string(),
	baseAmount: requiredPositiveAmount('Base amount is required'),
	method: v.pipe(
		v.string(),
		v.minLength(1, 'Commission method is required'),
		v.check(
			(val) =>
				VA_COMMISSION_METHOD_VALUES.includes(val as (typeof VA_COMMISSION_METHOD_VALUES)[number]),
			'Select a valid commission method'
		)
	),
	gatewayFee: requiredNonNegativeAmount('Gateway fee is required'),
	partnerFee: requiredNonNegativeAmount('Partner fee is required'),
	readonly: v.optional(v.boolean())
});

const configurationCommissionRowSchema = v.object({
	id: v.string(),
	baseAmount: requiredPositiveAmount('Base amount is required'),
	method: v.pipe(
		v.string(),
		v.minLength(1, 'Commission method is required'),
		v.check(
			(val) =>
				CONFIGURATION_COMMISSION_METHODS.includes(
					val as (typeof CONFIGURATION_COMMISSION_METHODS)[number]
				),
			'Select a valid commission method'
		)
	),
	gatewayFee: requiredNonNegativeAmount('Gateway fee is required'),
	partnerFee: requiredNonNegativeAmount('Partner fee is required')
});

/** Shape-only schema — used when commission setup is hidden (e.g. Payin). */
const configurationCommissionRowPassthroughSchema = v.object({
	id: v.string(),
	baseAmount: v.string(),
	method: v.string(),
	gatewayFee: v.string(),
	partnerFee: v.string()
});

const configurationTxTypeSchema = v.object({
	id: requiredText('Transaction type is required'),
	label: v.string(),
	checked: v.boolean(),
	limits: methodLimitFieldsSchema
});

export interface ConfigurationValidationInput {
	bankPipeline: string;
	securityDeposit: string;
	transactionLimit: string;
	dailyDepositLimit: string;
	minTxAmount: string;
	maxTxAmount: string;
	transactionTypes: Array<{
		id: string;
		label: string;
		checked: boolean;
		limits: { min: string; max: string; total: string };
	}>;
	commissionRows: Array<{
		id: string;
		baseAmount: string;
		method: string;
		gatewayFee: string;
		partnerFee: string;
	}>;
	requireCommission: boolean;
}

export interface VaFormValidationInput {
	bankingPipeline: string;
	transactionLimit: string;
	dailyDepositLimit: string;
	minTxAmount: string;
	maxTxAmount: string;
	transactionTypes: string[];
	methodLimits: Record<string, { min: string; max: string; total: string }>;
	commissionTiers: Array<{
		id: string;
		baseAmount: string;
		method: string;
		gatewayFee: string;
		partnerFee: string;
		readonly?: boolean;
	}>;
	allowNonWhitelisted?: boolean;
	vaStatus?: string;
	commissionEffectiveDate?: string;
}

function appendMethodLimitChecks<T extends VaFormValidationInput>(
	schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>
) {
	return v.pipe(
		schema,
		v.forward(
			v.check((input) => {
				for (const type of input.transactionTypes) {
					const limit = input.methodLimits[type];
					if (!limit) return false;
					if (Number(limit.min) > Number(limit.max)) return false;
				}
				return true;
			}, 'Min value cannot exceed max value for a payment method'),
			['methodLimits']
		),
		v.forward(
			v.check((input) => {
				for (const type of input.transactionTypes) {
					const limit = input.methodLimits[type];
					if (!limit) return false;
					if (Number(limit.max) > Number(limit.total)) return false;
				}
				return true;
			}, 'Max value cannot exceed total limit for a payment method'),
			['methodLimits']
		)
	);
}

function buildVaFormSchema(existingPipelines: string[], mode: 'create' | 'update') {
	const baseShape = {
		bankingPipeline: requiredVaBankPipeline(),
		transactionLimit: requiredPositiveAmount('Transaction limit is required'),
		dailyDepositLimit: requiredPositiveAmount('Daily deposit limit is required'),
		minTxAmount: requiredPositiveAmount('Min transaction amount is required'),
		maxTxAmount: requiredPositiveAmount('Max transaction amount is required'),
		transactionTypes: v.pipe(
			v.array(v.string()),
			v.minLength(1, 'Select at least one transaction type'),
			v.check(
				(types) => types.every((type) => type.trim() !== ''),
				'Select valid transaction types'
			)
		),
		methodLimits: v.record(v.string(), methodLimitFieldsSchema),
		commissionTiers: v.pipe(
			v.array(vaCommissionTierSchema),
			v.minLength(1, 'Add at least one commission slab')
		),
		allowNonWhitelisted: v.optional(v.boolean()),
		vaStatus: v.optional(
			v.pipe(
				v.string(),
				v.minLength(1, 'Virtual account status is required'),
				v.check(
					(val) => VA_STATUS_VALUES.includes(val as (typeof VA_STATUS_VALUES)[number]),
					'Select a valid virtual account status'
				)
			)
		),
		commissionEffectiveDate: v.optional(
			v.pipe(
				v.string(),
				v.minLength(1, 'Effective date is required'),
				v.check(
					(val) =>
						COMMISSION_EFFECTIVE_VALUES.includes(
							val as (typeof COMMISSION_EFFECTIVE_VALUES)[number]
						),
					'Select a valid effective date'
				)
			)
		)
	};

	let schema = v.object(baseShape) as v.BaseSchema<
		unknown,
		VaFormValidationInput,
		v.BaseIssue<unknown>
	>;

	schema = v.pipe(
		schema,
		v.forward(
			v.partialCheck(
				[['minTxAmount'], ['maxTxAmount']],
				(input) => Number(input.minTxAmount) <= Number(input.maxTxAmount),
				'Min transaction amount cannot exceed max transaction amount'
			),
			['maxTxAmount']
		),
		v.forward(
			v.check(
				(input) => !existingPipelines.includes(input.bankingPipeline),
				VA_PIPELINE_UNIQUE_ERROR
			),
			['bankingPipeline']
		),
		v.forward(
			v.check((input) => {
				const allowed = new Set(VA_PIPELINE_TRANSACTION_TYPES[input.bankingPipeline] ?? []);
				return input.transactionTypes.every((type) => allowed.has(type));
			}, 'Selected transaction types are not available for this bank pipeline'),
			['transactionTypes']
		),
		v.forward(
			v.check(
				(input) => input.transactionTypes.every((type) => input.methodLimits[type] !== undefined),
				'Configure limits for every selected transaction type'
			),
			['methodLimits']
		)
	) as typeof schema;

	if (mode === 'update') {
		schema = v.pipe(
			schema,
			v.forward(
				v.check((input) => Boolean(input.vaStatus?.trim()), 'Virtual account status is required'),
				['vaStatus']
			),
			v.forward(
				v.check(
					(input) => Boolean(input.commissionEffectiveDate?.trim()),
					'Effective date is required'
				),
				['commissionEffectiveDate']
			)
		) as typeof schema;
	}

	return appendMethodLimitChecks(schema);
}

export function buildConfigurationSchema(requireCommission: boolean) {
	let schema = v.pipe(
		v.object({
			bankPipeline: requiredConfigurationBankPipeline(),
			securityDeposit: requiredPositiveAmount('Security deposit is required'),
			transactionLimit: requiredPositiveAmount('Transaction limit is required'),
			dailyDepositLimit: requiredPositiveAmount('Daily deposit limit is required'),
			minTxAmount: requiredPositiveAmount('Min transaction amount is required'),
			maxTxAmount: requiredPositiveAmount('Max transaction amount is required'),
			transactionTypes: v.pipe(
				v.array(configurationTxTypeSchema),
				v.minLength(1, 'Select at least one transaction type')
			),
			commissionRows: requireCommission
				? v.pipe(
						v.array(configurationCommissionRowSchema),
						v.minLength(1, 'Add at least one commission slab')
					)
				: v.array(configurationCommissionRowPassthroughSchema),
			requireCommission: v.boolean()
		}),
		v.forward(
			v.partialCheck(
				[['minTxAmount'], ['maxTxAmount']],
				(input) => Number(input.minTxAmount) <= Number(input.maxTxAmount),
				'Min transaction amount cannot exceed max transaction amount'
			),
			['maxTxAmount']
		),
		v.forward(
			v.check(
				(input) => input.transactionTypes.some((type) => type.checked),
				'Select at least one transaction type'
			),
			['transactionTypes']
		),
		v.forward(
			v.check((input) => {
				for (const type of input.transactionTypes) {
					if (!type.checked) continue;
					if (Number(type.limits.min) > Number(type.limits.max)) return false;
				}
				return true;
			}, 'Min value cannot exceed max value for a payment method'),
			['transactionTypes']
		),
		v.forward(
			v.check((input) => {
				for (const type of input.transactionTypes) {
					if (!type.checked) continue;
					if (Number(type.limits.max) > Number(type.limits.total)) return false;
				}
				return true;
			}, 'Max value cannot exceed total limit for a payment method'),
			['transactionTypes']
		)
	);

	if (requireCommission) {
		schema = v.pipe(
			schema,
			v.forward(
				v.check((input) => input.commissionRows.length > 0, 'Add at least one commission slab'),
				['commissionRows']
			)
		);
	}

	return schema;
}

export function validateConfiguration(input: ConfigurationValidationInput): Record<string, string> {
	const selectedTypes = input.transactionTypes.filter((type) => type.checked);
	const payload = {
		...input,
		transactionTypes: selectedTypes.length > 0 ? selectedTypes : input.transactionTypes
	};
	const result = v.safeParse(buildConfigurationSchema(input.requireCommission), payload);
	return result.success ? {} : flattenIssues(result.issues);
}

export function validateCreateVa(
	input: VaFormValidationInput,
	existingPipelines: string[]
): Record<string, string> {
	const result = v.safeParse(buildVaFormSchema(existingPipelines, 'create'), input);
	return result.success ? {} : flattenIssues(result.issues);
}

export function validateUpdateVa(
	input: VaFormValidationInput,
	existingPipelines: string[]
): Record<string, string> {
	const result = v.safeParse(buildVaFormSchema(existingPipelines, 'update'), input);
	return result.success ? {} : flattenIssues(result.issues);
}

export function isConfigurationValid(input: ConfigurationValidationInput): boolean {
	return v.safeParse(buildConfigurationSchema(input.requireCommission), {
		...input,
		transactionTypes:
			input.transactionTypes.filter((type) => type.checked).length > 0
				? input.transactionTypes.filter((type) => type.checked)
				: input.transactionTypes
	}).success;
}

export function isCreateVaValid(
	input: VaFormValidationInput,
	existingPipelines: string[]
): boolean {
	return v.safeParse(buildVaFormSchema(existingPipelines, 'create'), input).success;
}

export function isUpdateVaValid(
	input: VaFormValidationInput,
	existingPipelines: string[]
): boolean {
	return v.safeParse(buildVaFormSchema(existingPipelines, 'update'), input).success;
}

export function firstValidationError(errors: Record<string, string>): string | null {
	const values = Object.values(errors);
	return values.length > 0 ? values[0] : null;
}
