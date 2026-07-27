import type { PayoutResponseType, PayoutRow } from '$lib/types/payout';
import type { TransactionScope } from '$lib/types/virtual-account';
import { matchesScope, scopeFieldsFromVan, type ScopeFields } from '$lib/data/management-van-mock';

const DAY_MS = 86_400_000;
const now = Date.now();

function fmtDate(ms: number): string {
	return new Date(ms).toLocaleString('en-IN', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

function row(
	id: number,
	daysAgo: number,
	beneficiaryName: string,
	crn: string,
	utr: number,
	clientOrderId: string,
	transactionAmount: string,
	transactionType: string,
	transactionStatus: string,
	scope: ScopeFields
): PayoutRow {
	const dateMs = now - daysAgo * DAY_MS;
	return {
		id,
		beneficiaryName,
		crn,
		utr,
		clientOrderId,
		transactionAmount,
		createdAt: fmtDate(dateMs),
		transactionType,
		transactionStatus,
		_dateMs: dateMs,
		...scope
	};
}

const northwindVan1 = scopeFieldsFromVan({
	vanId: 'VAN-1001',
	vanNumber: 'VA9823410001',
	orgId: 'ORG-1000',
	merchantName: 'Northwind Capital',
	status: 'active'
});

const northwindVan2 = scopeFieldsFromVan({
	vanId: 'VAN-1002',
	vanNumber: 'VA9823410002',
	orgId: 'ORG-1000',
	merchantName: 'Northwind Capital',
	status: 'active'
});

const vertexVan1 = scopeFieldsFromVan({
	vanId: 'VAN-3001',
	vanNumber: 'VA9823430001',
	orgId: 'ORG-1003',
	merchantName: 'Vertex Robotics',
	status: 'active'
});

const vertexVan2 = scopeFieldsFromVan({
	vanId: 'VAN-3002',
	vanNumber: 'VA9823430002',
	orgId: 'ORG-1003',
	merchantName: 'Vertex Robotics',
	status: 'active'
});

const stellarVan1 = scopeFieldsFromVan({
	vanId: 'VAN-6001',
	vanNumber: 'VA9823460001',
	orgId: 'ORG-1006',
	merchantName: 'Stellar Foods',
	status: 'active'
});

export const payoutMockData: PayoutRow[] = [
	row(
		1,
		1,
		'Arjun Mehta',
		'CRN-2026001',
		123456789012,
		'PO-1001',
		'₹4,500.00',
		'IMPS',
		'success',
		northwindVan1
	),
	row(
		2,
		2,
		'Priya Sharma',
		'CRN-2026002',
		234567890123,
		'PO-1002',
		'₹12,000.00',
		'NEFT',
		'pending',
		northwindVan1
	),
	row(
		3,
		3,
		'Vikram Nair',
		'CRN-2026003',
		345678901234,
		'PO-1003',
		'₹2,750.00',
		'RTGS',
		'failed',
		northwindVan1
	),
	row(
		4,
		5,
		'Sneha Iyer',
		'CRN-2026004',
		456789012345,
		'PO-1004',
		'₹8,200.00',
		'UPI',
		'success',
		northwindVan1
	),
	row(
		5,
		6,
		'Rahul Gupta',
		'CRN-2026005',
		567890123456,
		'PO-1005',
		'₹1,500.00',
		'IMPS',
		'success',
		northwindVan1
	),
	row(
		6,
		9,
		'Kavya Reddy',
		'CRN-2026006',
		678901234567,
		'PO-1006',
		'₹6,800.00',
		'UPI',
		'pending',
		northwindVan2
	),
	row(
		7,
		12,
		'Amit Kumar',
		'CRN-2026007',
		789012345678,
		'PO-1007',
		'₹25,000.00',
		'NEFT',
		'success',
		northwindVan2
	),
	row(
		8,
		14,
		'Divya Krishnan',
		'CRN-2026008',
		890123456789,
		'PO-1008',
		'₹3,200.00',
		'RTGS',
		'failed',
		northwindVan2
	),
	row(
		9,
		18,
		'Suresh Patel',
		'CRN-2026009',
		901234567890,
		'PO-1009',
		'₹9,500.00',
		'UPI',
		'success',
		northwindVan2
	),
	row(
		10,
		22,
		'Meera Pillai',
		'CRN-2026010',
		102345678901,
		'PO-1010',
		'₹750.00',
		'IMPS',
		'success',
		northwindVan2
	),
	row(
		11,
		25,
		'Rajesh Verma',
		'CRN-2026011',
		213456789012,
		'PO-1011',
		'₹15,000.00',
		'UPI',
		'pending',
		vertexVan1
	),
	row(
		12,
		28,
		'Anita Bose',
		'CRN-2026012',
		324567890123,
		'PO-1012',
		'₹42,000.00',
		'NEFT',
		'success',
		vertexVan1
	),
	row(
		13,
		35,
		'Kiran Singh',
		'CRN-2026013',
		435678901234,
		'PO-1013',
		'₹5,600.00',
		'RTGS',
		'failed',
		vertexVan1
	),
	row(
		14,
		45,
		'Pooja Menon',
		'CRN-2026014',
		546789012345,
		'PO-1014',
		'₹11,200.00',
		'UPI',
		'success',
		vertexVan1
	),
	row(
		15,
		52,
		'Dev Joshi',
		'CRN-2026015',
		657890123456,
		'PO-1015',
		'₹2,300.00',
		'IMPS',
		'success',
		vertexVan2
	),
	row(
		16,
		60,
		'Riya Desai',
		'CRN-2026016',
		768901234567,
		'PO-1016',
		'₹450.00',
		'UPI',
		'pending',
		vertexVan2
	),
	row(
		17,
		72,
		'Sanjay Rao',
		'CRN-2026017',
		879012345678,
		'PO-1017',
		'₹18,900.00',
		'NEFT',
		'success',
		vertexVan2
	),
	row(
		18,
		85,
		'Nandini Ghosh',
		'CRN-2026018',
		980123456789,
		'PO-1018',
		'₹7,100.00',
		'RTGS',
		'success',
		vertexVan2
	),
	row(
		19,
		95,
		'Mohan Das',
		'CRN-2026019',
		109876543210,
		'PO-1019',
		'₹3,400.00',
		'UPI',
		'failed',
		stellarVan1
	),
	row(
		20,
		110,
		'Lakshmi Kumar',
		'CRN-2026020',
		210987654321,
		'PO-1020',
		'₹22,500.00',
		'NEFT',
		'success',
		stellarVan1
	)
];

export function getPayoutList(scope?: TransactionScope): PayoutRow[] {
	return payoutMockData.filter((item) => matchesScope(item, scope));
}

export const mockPayoutResponse: PayoutResponseType = {
	statusCode: 200,
	message: 'Success',
	data: payoutMockData,
	pagination: {
		total: payoutMockData.length,
		page: 1,
		limit: 10
	}
};
