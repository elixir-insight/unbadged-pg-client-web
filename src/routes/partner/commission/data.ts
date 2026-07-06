// TEMP: dummy data until /partner/commission API. Replace fetchCommissions() body only —
// keep the return type identical.

import type {
	CommissionMerchantOption,
	CommissionPaymentMethod,
	CommissionPaymentMethodCounts,
	CommissionRecord,
	FetchCommissionsParams,
	FetchCommissionsResponse,
	CommissionsSummary
} from './types';

const ALL_RECORDS: CommissionRecord[] = [
	{
		id: 'com-20260703-001',
		merchantId: 'MRC-10021',
		merchantName: 'BlueCart Retail',
		transactionRef: 'TXN-88412001',
		paymentMethod: 'UPI',
		volume: 245000,
		commission: 612,
		date: '2026-07-03'
	},
	{
		id: 'com-20260703-002',
		merchantId: 'MRC-10052',
		merchantName: 'GreenLeaf Organics',
		transactionRef: 'TXN-88412002',
		paymentMethod: 'Card',
		volume: 512000,
		commission: 1536,
		date: '2026-07-03'
	},
	{
		id: 'com-20260703-003',
		merchantId: 'MRC-10139',
		merchantName: 'AutoCare Pro',
		transactionRef: 'TXN-88412003',
		paymentMethod: 'NetBanking',
		volume: 890000,
		commission: 2314,
		date: '2026-07-03'
	},
	{
		id: 'com-20260702-001',
		merchantId: 'MRC-10021',
		merchantName: 'BlueCart Retail',
		transactionRef: 'TXN-88411001',
		paymentMethod: 'Card',
		volume: 318000,
		commission: 795,
		date: '2026-07-02'
	},
	{
		id: 'com-20260702-002',
		merchantId: 'MRC-10034',
		merchantName: 'Nova Health Labs',
		transactionRef: 'TXN-88411002',
		paymentMethod: 'UPI',
		volume: 176000,
		commission: 352,
		date: '2026-07-02'
	},
	{
		id: 'com-20260702-003',
		merchantId: 'MRC-10089',
		merchantName: 'Cafe Mornings',
		transactionRef: 'TXN-88411003',
		paymentMethod: 'Wallet',
		volume: 94000,
		commission: 207,
		date: '2026-07-02'
	},
	{
		id: 'com-20260702-004',
		merchantId: 'MRC-10235',
		merchantName: 'QuickMed Pharmacy',
		transactionRef: 'TXN-88411004',
		paymentMethod: 'UPI',
		volume: 423000,
		commission: 973,
		date: '2026-07-02'
	},
	{
		id: 'com-20260701-001',
		merchantId: 'MRC-10052',
		merchantName: 'GreenLeaf Organics',
		transactionRef: 'TXN-88410001',
		paymentMethod: 'UPI',
		volume: 628000,
		commission: 1884,
		date: '2026-07-01'
	},
	{
		id: 'com-20260701-002',
		merchantId: 'MRC-10115',
		merchantName: 'Studio Fit',
		transactionRef: 'TXN-88410002',
		paymentMethod: 'Card',
		volume: 287000,
		commission: 689,
		date: '2026-07-01'
	},
	{
		id: 'com-20260701-003',
		merchantId: 'MRC-10102',
		merchantName: 'TechParts Hub',
		transactionRef: 'TXN-88410003',
		paymentMethod: 'NetBanking',
		volume: 1150000,
		commission: 3220,
		date: '2026-07-01'
	},
	{
		id: 'com-20260630-001',
		merchantId: 'MRC-10021',
		merchantName: 'BlueCart Retail',
		transactionRef: 'TXN-88409001',
		paymentMethod: 'UPI',
		volume: 402000,
		commission: 1005,
		date: '2026-06-30'
	},
	{
		id: 'com-20260630-002',
		merchantId: 'MRC-10034',
		merchantName: 'Nova Health Labs',
		transactionRef: 'TXN-88409002',
		paymentMethod: 'Card',
		volume: 221000,
		commission: 442,
		date: '2026-06-30'
	},
	{
		id: 'com-20260630-003',
		merchantId: 'MRC-10139',
		merchantName: 'AutoCare Pro',
		transactionRef: 'TXN-88409003',
		paymentMethod: 'UPI',
		volume: 734000,
		commission: 1908,
		date: '2026-06-30'
	},
	{
		id: 'com-20260629-001',
		merchantId: 'MRC-10089',
		merchantName: 'Cafe Mornings',
		transactionRef: 'TXN-88408001',
		paymentMethod: 'Wallet',
		volume: 118000,
		commission: 260,
		date: '2026-06-29'
	},
	{
		id: 'com-20260629-002',
		merchantId: 'MRC-10235',
		merchantName: 'QuickMed Pharmacy',
		transactionRef: 'TXN-88408002',
		paymentMethod: 'UPI',
		volume: 356000,
		commission: 819,
		date: '2026-06-29'
	},
	{
		id: 'com-20260628-001',
		merchantId: 'MRC-10052',
		merchantName: 'GreenLeaf Organics',
		transactionRef: 'TXN-88407001',
		paymentMethod: 'Card',
		volume: 845000,
		commission: 2535,
		date: '2026-06-28'
	},
	{
		id: 'com-20260628-002',
		merchantId: 'MRC-10115',
		merchantName: 'Studio Fit',
		transactionRef: 'TXN-88407002',
		paymentMethod: 'UPI',
		volume: 194000,
		commission: 466,
		date: '2026-06-28'
	},
	{
		id: 'com-20260627-001',
		merchantId: 'MRC-10021',
		merchantName: 'BlueCart Retail',
		transactionRef: 'TXN-88406001',
		paymentMethod: 'NetBanking',
		volume: 267000,
		commission: 668,
		date: '2026-06-27'
	},
	{
		id: 'com-20260627-002',
		merchantId: 'MRC-10102',
		merchantName: 'TechParts Hub',
		transactionRef: 'TXN-88406002',
		paymentMethod: 'Card',
		volume: 982000,
		commission: 2750,
		date: '2026-06-27'
	},
	{
		id: 'com-20260626-001',
		merchantId: 'MRC-10034',
		merchantName: 'Nova Health Labs',
		transactionRef: 'TXN-88405001',
		paymentMethod: 'UPI',
		volume: 143000,
		commission: 286,
		date: '2026-06-26'
	},
	{
		id: 'com-20260626-002',
		merchantId: 'MRC-10139',
		merchantName: 'AutoCare Pro',
		transactionRef: 'TXN-88405002',
		paymentMethod: 'UPI',
		volume: 612000,
		commission: 1591,
		date: '2026-06-26'
	},
	{
		id: 'com-20260625-001',
		merchantId: 'MRC-10235',
		merchantName: 'QuickMed Pharmacy',
		transactionRef: 'TXN-88404001',
		paymentMethod: 'Card',
		volume: 478000,
		commission: 1099,
		date: '2026-06-25'
	},
	{
		id: 'com-20260625-002',
		merchantId: 'MRC-10089',
		merchantName: 'Cafe Mornings',
		transactionRef: 'TXN-88404002',
		paymentMethod: 'Wallet',
		volume: 86000,
		commission: 189,
		date: '2026-06-25'
	},
	{
		id: 'com-20260624-001',
		merchantId: 'MRC-10052',
		merchantName: 'GreenLeaf Organics',
		transactionRef: 'TXN-88403001',
		paymentMethod: 'UPI',
		volume: 701000,
		commission: 2103,
		date: '2026-06-24'
	},
	{
		id: 'com-20260624-002',
		merchantId: 'MRC-10115',
		merchantName: 'Studio Fit',
		transactionRef: 'TXN-88403002',
		paymentMethod: 'Card',
		volume: 233000,
		commission: 559,
		date: '2026-06-24'
	}
];

function buildMerchants(records: CommissionRecord[]): CommissionMerchantOption[] {
	const merchants = new Map<string, CommissionMerchantOption>();

	for (const record of records) {
		if (!merchants.has(record.merchantId)) {
			merchants.set(record.merchantId, {
				value: record.merchantId,
				label: record.merchantName,
				description: record.merchantId
			});
		}
	}

	return [...merchants.values()].sort((a, b) => a.label.localeCompare(b.label));
}

function buildAvailableDates(records: CommissionRecord[]): string[] {
	return [...new Set(records.map((record) => record.date))].sort((a, b) => b.localeCompare(a));
}

function buildPaymentMethodCounts(records: CommissionRecord[]): CommissionPaymentMethodCounts {
	const methods: CommissionPaymentMethod[] = ['UPI', 'Card', 'NetBanking', 'Wallet'];
	const counts = Object.fromEntries(
		methods.map((method) => [method, records.filter((r) => r.paymentMethod === method).length])
	) as Record<CommissionPaymentMethod, number>;

	return { all: records.length, ...counts };
}

function buildSummary(records: CommissionRecord[]): CommissionsSummary {
	const totalVolume = records.reduce((sum, record) => sum + record.volume, 0);
	const totalCommission = records.reduce((sum, record) => sum + record.commission, 0);

	return {
		totalVolume,
		totalCommission,
		recordCount: records.length,
		effectiveRatePercent:
			totalVolume > 0 ? Number(((totalCommission / totalVolume) * 100).toFixed(2)) : 0
	};
}

export function fetchCommissions({
	dateFrom = '',
	dateTo = '',
	merchant = '',
	paymentMethod = '',
	search = '',
	searchField = 'transactionRef'
}: FetchCommissionsParams = {}): Promise<FetchCommissionsResponse> {
	let records = ALL_RECORDS;

	if (dateFrom && dateTo) {
		records = records.filter((record) => record.date >= dateFrom && record.date <= dateTo);
	}

	if (merchant) {
		records = records.filter((record) => record.merchantId === merchant);
	}

	const normalizedSearch = search.trim().toLowerCase();
	if (normalizedSearch) {
		records = records.filter((record) =>
			searchField === 'merchant'
				? record.merchantName.toLowerCase().includes(normalizedSearch)
				: record.transactionRef.toLowerCase().includes(normalizedSearch)
		);
	}

	// Counts reflect date/merchant/search filters but not paymentMethod itself, so the
	// payment-method cards stay comparable while one of them is selected.
	const paymentMethodCounts = buildPaymentMethodCounts(records);

	if (paymentMethod) {
		records = records.filter((record) => record.paymentMethod === paymentMethod);
	}

	return Promise.resolve({
		records,
		total: records.length,
		summary: buildSummary(records),
		merchants: buildMerchants(ALL_RECORDS),
		availableDates: buildAvailableDates(ALL_RECORDS),
		paymentMethodCounts
	});
}
