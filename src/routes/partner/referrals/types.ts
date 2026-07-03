export type ReferralStatus = 'active' | 'pending' | 'inactive' | 'rejected';

export type ReferralMerchant = {
	id: string;
	name: string;
	merchantId: string;
	email: string;
	status: ReferralStatus;
	referredOn: string;
	volume: number;
	commissionEarned: number;
};

export interface FetchReferralsParams {
	status?: string;
	search?: string;
	/** Reserved for server-side pagination — ignored while pagination is client-side. */
	page?: number;
}

export interface ReferralsStatusCounts {
	all: number;
	active: number;
	pending: number;
	inactive: number;
	rejected: number;
}

export interface ReferralsSummary {
	totalReferrals: number;
	activeMerchants: number;
	pendingOnboarding: number;
	totalCommission: number;
}

export interface FetchReferralsResponse {
	merchants: ReferralMerchant[];
	total: number;
	statusCounts: ReferralsStatusCounts;
	summary: ReferralsSummary;
}
