export type ReferralStatus = 'active' | 'pending' | 'inactive' | 'rejected';

export type ReferralMerchant = {
	id: string;
	name: string;
	brandName: string;
	companyName: string;
	merchantId: string;
	email: string;
	status: ReferralStatus;
	businessType: string;
	referredOn: string;
	volume: number;
	commissionEarned: number;
};

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
