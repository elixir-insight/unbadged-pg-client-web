// TEMP: dummy data until /partner/referrals API. Replace fetchReferrals() body only —
// keep the return type identical.

import type {
	FetchReferralsParams,
	FetchReferralsResponse,
	ReferralMerchant,
	ReferralsStatusCounts,
	ReferralsSummary
} from './types';

const ALL_MERCHANTS: ReferralMerchant[] = [
	{
		id: 'ref-001',
		name: 'BlueCart Retail',
		merchantId: 'MRC-10021',
		email: 'ops@bluecart.in',
		status: 'active',
		referredOn: '2026-01-12',
		volume: 1845000,
		commissionEarned: 36900
	},
	{
		id: 'ref-002',
		name: 'Nova Health Labs',
		merchantId: 'MRC-10034',
		email: 'finance@novahealth.io',
		status: 'active',
		referredOn: '2026-01-18',
		volume: 923000,
		commissionEarned: 18460
	},
	{
		id: 'ref-003',
		name: 'Urban Threads',
		merchantId: 'MRC-10041',
		email: 'billing@urbanthreads.com',
		status: 'pending',
		referredOn: '2026-02-03',
		volume: 0,
		commissionEarned: 0
	},
	{
		id: 'ref-004',
		name: 'GreenLeaf Organics',
		merchantId: 'MRC-10052',
		email: 'accounts@greenleaf.co.in',
		status: 'active',
		referredOn: '2026-02-09',
		volume: 2560000,
		commissionEarned: 51200
	},
	{
		id: 'ref-005',
		name: 'Swift Logistics',
		merchantId: 'MRC-10067',
		email: 'payables@swiftlogistics.in',
		status: 'inactive',
		referredOn: '2025-11-22',
		volume: 412000,
		commissionEarned: 8240
	},
	{
		id: 'ref-006',
		name: 'Pixel Games Studio',
		merchantId: 'MRC-10078',
		email: 'hello@pixelgames.app',
		status: 'pending',
		referredOn: '2026-02-14',
		volume: 0,
		commissionEarned: 0
	},
	{
		id: 'ref-007',
		name: 'Cafe Mornings',
		merchantId: 'MRC-10089',
		email: 'owner@cafemornings.in',
		status: 'active',
		referredOn: '2026-02-20',
		volume: 689000,
		commissionEarned: 13780
	},
	{
		id: 'ref-008',
		name: 'TechParts Hub',
		merchantId: 'MRC-10102',
		email: 'ar@techpartshub.com',
		status: 'rejected',
		referredOn: '2026-01-05',
		volume: 0,
		commissionEarned: 0
	},
	{
		id: 'ref-009',
		name: 'Studio Fit',
		merchantId: 'MRC-10115',
		email: 'billing@studiofit.in',
		status: 'active',
		referredOn: '2026-03-01',
		volume: 1332000,
		commissionEarned: 26640
	},
	{
		id: 'ref-010',
		name: 'BookNest',
		merchantId: 'MRC-10128',
		email: 'support@booknest.in',
		status: 'pending',
		referredOn: '2026-03-08',
		volume: 0,
		commissionEarned: 0
	},
	{
		id: 'ref-011',
		name: 'AutoCare Pro',
		merchantId: 'MRC-10139',
		email: 'payments@autocarepro.in',
		status: 'active',
		referredOn: '2026-03-12',
		volume: 3124000,
		commissionEarned: 62480
	},
	{
		id: 'ref-012',
		name: 'FreshBite Foods',
		merchantId: 'MRC-10144',
		email: 'finance@freshbite.co',
		status: 'inactive',
		referredOn: '2025-10-30',
		volume: 276000,
		commissionEarned: 5520
	},
	{
		id: 'ref-013',
		name: 'CloudLearn',
		merchantId: 'MRC-10157',
		email: 'billing@cloudlearn.io',
		status: 'active',
		referredOn: '2026-03-18',
		volume: 890000,
		commissionEarned: 17800
	},
	{
		id: 'ref-014',
		name: 'PetPals Store',
		merchantId: 'MRC-10166',
		email: 'accounts@petpals.in',
		status: 'pending',
		referredOn: '2026-03-22',
		volume: 0,
		commissionEarned: 0
	},
	{
		id: 'ref-015',
		name: 'Metro Electronics',
		merchantId: 'MRC-10178',
		email: 'pay@metroelectronics.com',
		status: 'active',
		referredOn: '2026-03-25',
		volume: 1768000,
		commissionEarned: 35360
	},
	{
		id: 'ref-016',
		name: 'TravelEase',
		merchantId: 'MRC-10189',
		email: 'ops@travelease.in',
		status: 'rejected',
		referredOn: '2026-02-01',
		volume: 0,
		commissionEarned: 0
	},
	{
		id: 'ref-017',
		name: 'Craft & Co',
		merchantId: 'MRC-10201',
		email: 'hello@craftandco.in',
		status: 'active',
		referredOn: '2026-04-02',
		volume: 583000,
		commissionEarned: 11660
	},
	{
		id: 'ref-018',
		name: 'Zen Wellness',
		merchantId: 'MRC-10214',
		email: 'billing@zenwellness.in',
		status: 'inactive',
		referredOn: '2025-12-15',
		volume: 224000,
		commissionEarned: 4480
	},
	{
		id: 'ref-019',
		name: 'HomeStyle Decor',
		merchantId: 'MRC-10227',
		email: 'finance@homestyle.in',
		status: 'pending',
		referredOn: '2026-04-08',
		volume: 0,
		commissionEarned: 0
	},
	{
		id: 'ref-020',
		name: 'QuickMed Pharmacy',
		merchantId: 'MRC-10235',
		email: 'accounts@quickmed.in',
		status: 'active',
		referredOn: '2026-04-12',
		volume: 1437000,
		commissionEarned: 28740
	}
];

function buildStatusCounts(merchants: ReferralMerchant[]): ReferralsStatusCounts {
	return {
		all: merchants.length,
		active: merchants.filter((m) => m.status === 'active').length,
		pending: merchants.filter((m) => m.status === 'pending').length,
		inactive: merchants.filter((m) => m.status === 'inactive').length,
		rejected: merchants.filter((m) => m.status === 'rejected').length
	};
}

function buildSummary(merchants: ReferralMerchant[]): ReferralsSummary {
	const activeMerchants = merchants.filter((m) => m.status === 'active');
	return {
		totalReferrals: merchants.length,
		activeMerchants: activeMerchants.length,
		pendingOnboarding: merchants.filter((m) => m.status === 'pending').length,
		totalCommission: merchants.reduce((sum, m) => sum + m.commissionEarned, 0)
	};
}

function matchesSearch(merchant: ReferralMerchant, search: string) {
	const needle = search.toLowerCase();
	return (
		merchant.name.toLowerCase().includes(needle) ||
		merchant.merchantId.toLowerCase().includes(needle) ||
		merchant.email.toLowerCase().includes(needle)
	);
}

export function fetchReferrals({
	status = '',
	search = '',
	page: _page = 1
}: FetchReferralsParams = {}): Promise<FetchReferralsResponse> {
	const normalizedSearch = search.trim().toLowerCase();

	let merchants = ALL_MERCHANTS;

	if (status) {
		merchants = merchants.filter((merchant) => merchant.status === status);
	}

	if (normalizedSearch) {
		merchants = merchants.filter((merchant) => matchesSearch(merchant, normalizedSearch));
	}

	// Client-side pagination slices in +page.svelte; `page` is kept for future API parity.
	void _page;

	return Promise.resolve({
		merchants,
		total: merchants.length,
		statusCounts: buildStatusCounts(ALL_MERCHANTS),
		summary: buildSummary(ALL_MERCHANTS)
	});
}
