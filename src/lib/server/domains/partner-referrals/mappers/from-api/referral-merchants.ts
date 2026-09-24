import type {
	ReferralMerchant,
	ReferralsStatusCounts,
	ReferralsSummary
} from '$lib/partner/referrals/types';
import type { GetReferralMerchantsResponse, ReferralMerchantRecord } from '../../schema';

export type MappedReferralMerchants = {
	merchants: ReferralMerchant[];
	pagination: {
		limit: number;
		page: number;
		total: number;
	};
};

const UI_STATUS_TO_API_STATUSES: Record<string, string> = {
	active: 'ACTIVE,APPROVED',
	pending: 'IN_PROGRESS',
	inactive: 'ON_HOLD,FROZEN',
	rejected: 'REJECTED'
};

export function mapUiStatusToApiStatuses(status: string): string | undefined {
	const mapped = UI_STATUS_TO_API_STATUSES[status];
	return mapped ?? status.toUpperCase();
}

export function mapProfileStatusToReferralStatus(
	profileStatus: string
): ReferralMerchant['status'] {
	const normalized = profileStatus.trim().toUpperCase();

	if (normalized === 'ACTIVE' || normalized === 'APPROVED') return 'active';
	if (normalized === 'IN_PROGRESS') return 'pending';
	if (normalized === 'ON_HOLD' || normalized === 'FROZEN') return 'inactive';
	if (normalized === 'REJECTED') return 'rejected';

	return 'pending';
}

export function mapReferralMerchant(record: ReferralMerchantRecord): ReferralMerchant {
	const brandName = record.brandName?.trim() ?? '';
	const companyName = record.companyName?.trim() ?? '';
	const name = (brandName || companyName || record.orgId).trim();

	return {
		id: record.affiliateId?.trim() || record.orgId,
		name: name || record.orgId,
		brandName,
		companyName,
		merchantId: record.orgId,
		email: record.email?.trim() ?? '',
		status: mapProfileStatusToReferralStatus(record.profileStatus),
		businessType: record.businessType?.trim() ?? '',
		referredOn: record.createdAt,
		volume: 0,
		commissionEarned: 0
	};
}

function normalizePagination(
	payload: GetReferralMerchantsResponse,
	fallbackLimit: number,
	fallbackPage: number,
	dataLength: number
): MappedReferralMerchants['pagination'] {
	const pagination = payload.pagination;
	const limit = pagination?.limit ?? fallbackLimit;
	const total = pagination?.total ?? dataLength;
	const apiPage = pagination?.page ?? fallbackPage;

	return {
		limit,
		page: apiPage + 1,
		total
	};
}

export function mapReferralMerchantsResponse(
	payload: GetReferralMerchantsResponse,
	fallbackLimit: number,
	fallbackPage: number
): MappedReferralMerchants {
	const merchants = (payload.data ?? []).map(mapReferralMerchant);

	return {
		merchants,
		pagination: normalizePagination(payload, fallbackLimit, fallbackPage, merchants.length)
	};
}

export function buildReferralsStatusCounts(merchants: ReferralMerchant[]): ReferralsStatusCounts {
	return {
		all: merchants.length,
		active: merchants.filter((merchant) => merchant.status === 'active').length,
		pending: merchants.filter((merchant) => merchant.status === 'pending').length,
		inactive: merchants.filter((merchant) => merchant.status === 'inactive').length,
		rejected: merchants.filter((merchant) => merchant.status === 'rejected').length
	};
}

export function buildReferralsSummary(merchants: ReferralMerchant[]): ReferralsSummary {
	const activeMerchants = merchants.filter((merchant) => merchant.status === 'active');

	return {
		totalReferrals: merchants.length,
		activeMerchants: activeMerchants.length,
		pendingOnboarding: merchants.filter((merchant) => merchant.status === 'pending').length,
		totalCommission: merchants.reduce((sum, merchant) => sum + merchant.commissionEarned, 0)
	};
}

export function filterReferralsByEmail(
	merchants: ReferralMerchant[],
	search: string
): ReferralMerchant[] {
	const needle = search.trim().toLowerCase();
	if (!needle) return merchants;

	return merchants.filter((merchant) => merchant.email.toLowerCase().includes(needle));
}

export function filterReferralsByName(
	merchants: ReferralMerchant[],
	search: string
): ReferralMerchant[] {
	const needle = search.trim().toLowerCase();
	if (!needle) return merchants;

	return merchants.filter((merchant) => {
		const haystacks = [
			merchant.name,
			merchant.brandName,
			merchant.companyName,
			merchant.merchantId
		];

		return haystacks.some((value) => value.toLowerCase().includes(needle));
	});
}
