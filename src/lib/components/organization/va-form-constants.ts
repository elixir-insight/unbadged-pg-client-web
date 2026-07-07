export interface VATransactionType {
	value: string;
	label: string;
	description: string;
}

export const VA_TRANSACTION_TYPES: VATransactionType[] = [
	{ value: 'IMPS', label: 'IMPS', description: 'Immediate Payment' },
	{ value: 'NEFT', label: 'NEFT', description: 'Electronic Funds Transfer' },
	{ value: 'RTGS', label: 'RTGS', description: 'Real Time Settlement' },
	{ value: 'NET_BANKING', label: 'NET_BANKING', description: 'Online Banking' },
	{ value: 'CARD', label: 'CARD', description: 'Card Payment' }
];

export const VA_COMMISSION_METHODS = [
	{ value: 'flatrate', label: 'Flatrate ₹' },
	{ value: 'percentage', label: 'Percentage %' }
] as const;

export const VA_BANK_PIPELINES = [
	{ value: 'OMNIWARE BANK', label: 'OMNIWARE BANK' },
	{ value: 'HDFC Bank', label: 'HDFC Bank' },
	{ value: 'ICICI Bank', label: 'ICICI Bank' },
	{ value: 'SBI', label: 'SBI' },
	{ value: 'Axis Bank', label: 'Axis Bank' }
];

export const COMMISSION_EFFECTIVE_OPTIONS = [
	{ value: 'today', label: 'Today' },
	{ value: 'tomorrow', label: 'Tomorrow' }
];

export const VA_PIPELINE_TRANSACTION_TYPES: Record<string, string[]> = {
	'OMNIWARE BANK': ['IMPS', 'NEFT', 'NET_BANKING', 'CARD'],
	'HDFC Bank': ['IMPS', 'NEFT', 'RTGS', 'NET_BANKING', 'CARD'],
	'ICICI Bank': ['IMPS', 'NEFT', 'RTGS', 'NET_BANKING'],
	SBI: ['IMPS', 'NEFT', 'RTGS'],
	'Axis Bank': ['IMPS', 'NEFT', 'NET_BANKING', 'CARD']
};

export const VA_MOCK_DETAILS: Record<
	string,
	{
		bankingPipeline: string;
		transactionTypes: string[];
		methodLimits: Record<string, { min: string; max: string; total: string }>;
	}
> = {
	'VA-7821': {
		bankingPipeline: 'HDFC Bank',
		transactionTypes: ['NEFT', 'RTGS', 'IMPS'],
		methodLimits: {
			NEFT: { min: '100', max: '10001', total: '1000000' },
			RTGS: { min: '200000', max: '200001', total: '1000000' },
			IMPS: { min: '100', max: '10001', total: '10000000000' }
		}
	},
	'VA-7822': {
		bankingPipeline: 'ICICI Bank',
		transactionTypes: ['IMPS', 'NEFT', 'NET_BANKING'],
		methodLimits: {
			IMPS: { min: '100', max: '50000', total: '5000000' },
			NEFT: { min: '100', max: '100000', total: '10000000' },
			NET_BANKING: { min: '500', max: '200000', total: '20000000' }
		}
	},
	'VA-7823': {
		bankingPipeline: 'OMNIWARE BANK',
		transactionTypes: ['IMPS', 'NEFT', 'NET_BANKING', 'CARD'],
		methodLimits: {
			IMPS: { min: '100', max: '10001', total: '1000000' },
			NEFT: { min: '100', max: '10001', total: '1000000' },
			NET_BANKING: { min: '100', max: '50000', total: '5000000' },
			CARD: { min: '100', max: '100000', total: '10000000' }
		}
	}
};

export function getTransactionTypeMeta(value: string): VATransactionType | undefined {
	return VA_TRANSACTION_TYPES.find((t) => t.value === value);
}

export function getTransactionTypesForPipeline(pipeline: string): VATransactionType[] {
	const allowed = VA_PIPELINE_TRANSACTION_TYPES[pipeline];
	if (!allowed) return [];
	return VA_TRANSACTION_TYPES.filter((type) => allowed.includes(type.value));
}

export function toTransactionTypeOptions(pipeline: string) {
	return getTransactionTypesForPipeline(pipeline).map((type) => ({
		value: type.value,
		label: type.label
	}));
}

export interface MethodLimit {
	min: string;
	max: string;
	total: string;
}

export function syncMethodLimits(
	limits: Record<string, MethodLimit>,
	types: string[]
): Record<string, MethodLimit> {
	let changed = false;
	const next = { ...limits };

	for (const type of types) {
		if (!next[type]) {
			next[type] = { min: '', max: '', total: '' };
			changed = true;
		}
	}

	for (const key of Object.keys(next)) {
		if (!types.includes(key)) {
			delete next[key];
			changed = true;
		}
	}

	return changed ? next : limits;
}

export function filterSelectedTransactionTypes(selected: string[], pipeline: string): string[] {
	const allowed = new Set(VA_PIPELINE_TRANSACTION_TYPES[pipeline] ?? []);
	return selected.filter((type) => allowed.has(type));
}

export function getVaMockDetails(vaNo: string) {
	return (
		VA_MOCK_DETAILS[vaNo] ?? {
			bankingPipeline: 'HDFC Bank',
			transactionTypes: ['NEFT', 'RTGS', 'IMPS'],
			methodLimits: {
				NEFT: { min: '100', max: '10001', total: '1000000' },
				RTGS: { min: '200000', max: '200001', total: '1000000' },
				IMPS: { min: '100', max: '10001', total: '10000000000' }
			}
		}
	);
}

export function makeCommissionTier(baseAmount = '', readonly = false) {
	return {
		id: `tier-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
		baseAmount,
		method: 'flatrate',
		gatewayFee: '0',
		partnerFee: '0',
		readonly
	};
}
