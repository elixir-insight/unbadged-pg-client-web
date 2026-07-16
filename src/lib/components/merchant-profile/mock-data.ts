import type { BadgeVariant } from '$lib/components/ui/badge/badge.svelte';

export type AccountStatus = 'active' | 'inactive' | 'suspended';
export type VirtualAccountStatus = 'active' | 'inactive';
export type ChangeRequestStatus = 'approved' | 'pending' | 'rejected';

export interface VirtualAccount extends Record<string, unknown> {
	id: string;
	accountNumber: string;
	accountType: string;
	status: VirtualAccountStatus;
	createdDate: string;
}

export interface ChangeRequest extends Record<string, unknown> {
	id: string;
	requestId: string;
	category: string;
	requestedBy: string;
	requestedOn: string;
	status: ChangeRequestStatus;
	reviewedBy: string;
}

export interface MerchantProfileData {
	merchantName: string;
	merchantId: string;
	organizationName: string;
	status: AccountStatus;
	memberSince: string;
	lastUpdated: string;
	lastLogin: string;
	personal: {
		firstName: string;
		lastName: string;
		email: string;
		mobile: string;
		merchantId: string;
		accountStatus: AccountStatus;
	};
	organization: {
		name: string;
		type: string;
		website: string;
		officialEmail: string;
		contactNumber: string;
		status: AccountStatus;
	};
	company: {
		name: string;
		gstNumber: string;
		panNumber: string;
		cinNumber: string;
		registeredAddress: string;
		city: string;
		state: string;
		country: string;
		pincode: string;
	};
	banking: {
		bankName: string;
		accountHolderName: string;
		accountNumber: string;
		maskedAccountNumber: string;
		ifscCode: string;
		branchName: string;
		accountType: string;
	};
	virtualAccounts: VirtualAccount[];
	configuration: {
		callbackUrl: string;
		webhookUrl: string;
		ipWhitelist: string;
	};
	changeRequests: ChangeRequest[];
}

export const merchantProfile: MerchantProfileData = {
	merchantName: 'Arjun Mehta',
	merchantId: 'MID-7739201',
	organizationName: 'Zenith Retail Pvt Ltd',
	status: 'active',
	memberSince: '12 Jan 2023',
	lastUpdated: '08 Jul 2026',
	lastLogin: '15 Jul 2026, 09:42 AM',
	personal: {
		firstName: 'Arjun',
		lastName: 'Mehta',
		email: 'arjun.mehta@zenithretail.com',
		mobile: '+91 98765 43210',
		merchantId: 'MID-7739201',
		accountStatus: 'active'
	},
	organization: {
		name: 'Zenith Retail Pvt Ltd',
		type: 'Private Limited Company',
		website: 'https://www.zenithretail.com',
		officialEmail: 'contact@zenithretail.com',
		contactNumber: '+91 22 4567 8900',
		status: 'active'
	},
	company: {
		name: 'Zenith Retail Private Limited',
		gstNumber: '27ABCDE1234F1Z5',
		panNumber: 'ABCDE1234F',
		cinNumber: 'U74999MH2019PTC321456',
		registeredAddress: '4th Floor, Prism Towers, Andheri Kurla Road',
		city: 'Mumbai',
		state: 'Maharashtra',
		country: 'India',
		pincode: '400059'
	},
	banking: {
		bankName: 'HDFC Bank',
		accountHolderName: 'Zenith Retail Private Limited',
		accountNumber: '50100234567890',
		maskedAccountNumber: 'XXXX XXXX 7890',
		ifscCode: 'HDFC0001234',
		branchName: 'Andheri East Branch',
		accountType: 'Current Account'
	},
	virtualAccounts: [
		{
			id: 'va-1',
			accountNumber: 'VA-4829102734',
			accountType: 'Collections',
			status: 'active',
			createdDate: '14 Jan 2023'
		},
		{
			id: 'va-2',
			accountNumber: 'VA-4829102891',
			accountType: 'Settlements',
			status: 'active',
			createdDate: '02 Mar 2024'
		},
		{
			id: 'va-3',
			accountNumber: 'VA-4829103015',
			accountType: 'Refunds',
			status: 'inactive',
			createdDate: '19 Nov 2024'
		}
	],
	configuration: {
		callbackUrl: 'https://api.zenithretail.com/webhooks/payments/callback',
		webhookUrl: 'https://api.zenithretail.com/webhooks/payments/status',
		ipWhitelist: '103.21.244.10, 103.21.244.11'
	},
	changeRequests: [
		{
			id: 'cr-1',
			requestId: 'CRQ-10234',
			category: 'Banking Information',
			requestedBy: 'Arjun Mehta',
			requestedOn: '02 Jul 2026',
			status: 'approved',
			reviewedBy: 'Neha Kulkarni'
		},
		{
			id: 'cr-2',
			requestId: 'CRQ-10221',
			category: 'Company Information',
			requestedBy: 'Arjun Mehta',
			requestedOn: '24 Jun 2026',
			status: 'approved',
			reviewedBy: 'Neha Kulkarni'
		},
		{
			id: 'cr-3',
			requestId: 'CRQ-10198',
			category: 'Configuration',
			requestedBy: 'Priya Sharma',
			requestedOn: '11 Jun 2026',
			status: 'rejected',
			reviewedBy: 'Rahul Verma'
		},
		{
			id: 'cr-4',
			requestId: 'CRQ-10176',
			category: 'Organization Information',
			requestedBy: 'Arjun Mehta',
			requestedOn: '29 May 2026',
			status: 'approved',
			reviewedBy: 'Neha Kulkarni'
		},
		{
			id: 'cr-5',
			requestId: 'CRQ-10142',
			category: 'Personal Information',
			requestedBy: 'Arjun Mehta',
			requestedOn: '03 May 2026',
			status: 'pending',
			reviewedBy: '—'
		},
		{
			id: 'cr-6',
			requestId: 'CRQ-10098',
			category: 'Banking Information',
			requestedBy: 'Priya Sharma',
			requestedOn: '18 Apr 2026',
			status: 'approved',
			reviewedBy: 'Rahul Verma'
		},
		{
			id: 'cr-7',
			requestId: 'CRQ-10054',
			category: 'Company Information',
			requestedBy: 'Arjun Mehta',
			requestedOn: '02 Apr 2026',
			status: 'rejected',
			reviewedBy: 'Neha Kulkarni'
		}
	]
};

export function statusVariant(status: AccountStatus | VirtualAccountStatus): BadgeVariant {
	if (status === 'active') return 'success';
	if (status === 'inactive') return 'warning';
	return 'error';
}

export function statusLabel(status: AccountStatus | VirtualAccountStatus): string {
	return status.charAt(0).toUpperCase() + status.slice(1);
}

export function changeRequestVariant(status: ChangeRequestStatus): BadgeVariant {
	if (status === 'approved') return 'success';
	if (status === 'pending') return 'warning';
	return 'error';
}

export function changeRequestLabel(status: ChangeRequestStatus): string {
	return status.charAt(0).toUpperCase() + status.slice(1);
}
