import { organizations, type Organization } from './mockData';
import { getOnboardingOrgById } from './onboardingMockData';
import type { OnboardingOrgRecord } from '$lib/types/organization';

export type { OnboardingOrgRecord as OrganizationDetail };

const STATES = ['Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu', 'Gujarat'];
const CITIES = ['Mumbai', 'Bengaluru', 'New Delhi', 'Chennai', 'Ahmedabad'];

function hashCode(value: string): number {
	let hash = 0;
	for (let i = 0; i < value.length; i++) {
		hash = (hash << 5) - hash + value.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash);
}

function pick<T>(items: T[], seed: number, offset = 0): T {
	return items[(seed + offset) % items.length];
}

function buildFromListOrg(org: Organization): OnboardingOrgRecord {
	const seed = hashCode(org.id);
	const slug = org.name.toLowerCase().replace(/\s+/g, '');
	const isPrivateLimited = org.businessType === 'PRIVATE_LIMITED';
	const city = pick(CITIES, seed);
	const state = pick(STATES, seed);
	const phone = `9${String(800000000 + (seed % 99999999)).slice(0, 9)}`;

	return {
		orgId: org.id,
		legalCompanyName: org.name,
		businessType: org.businessType,
		profileStatus: org.status,
		profileType: org.profileType,
		affiliateId: 1000 + (seed % 100),
		userEmail: `contact@${slug}.com`,
		phoneNumber: phone,
		createdAt: org.createdAt,
		bankAccounts: [
			{
				id: 1,
				holderName: org.name,
				accountNumber: String(100000000000 + (seed % 900000000000)),
				ifscCode: 'HDFC0001234',
				bankName: 'HDFC Bank',
				branchName: `${city} Main Branch`,
				accountType: 'CURRENT',
				status: 'VERIFIED'
			}
		],
		kyb: {
			businessPan: `AAAC${String(seed).padStart(4, '0').slice(0, 4)}A`,
			gstNumber: `27AAAC${String(seed).padStart(4, '0').slice(0, 4)}A1Z${seed % 10}`,
			cin: isPrivateLimited
				? `U${String(62000 + (seed % 1000)).padStart(5, '0')}MH${2010 + (seed % 14)}PTC${String(seed % 100000).padStart(6, '0')}`
				: undefined,
			tan: isPrivateLimited ? `MUMC${String(seed % 100000).padStart(5, '0')}D` : undefined,
			businessPhone: phone,
			organizationWebsite: `https://${slug}.com`,
			industry: 'Financial Services',
			registeredYear: 2015 + (seed % 10),
			communicationAddress: `${100 + (seed % 200)}, Business Park, ${city}`
		},
		addressDetails: {
			address: `${100 + (seed % 200)}, Business Park`,
			city,
			state,
			country: 'India',
			pinCode: String(400000 + (seed % 99999)).padStart(6, '0')
		},
		directors: [
			{
				id: 1,
				name: org.assignedAdmin,
				aadhar: `${1000 + (seed % 9000)}-${1000 + ((seed >> 2) % 9000)}-${1000 + ((seed >> 4) % 9000)}`,
				pan: `ABCDE${String(seed % 10000).padStart(4, '0')}F`,
				email: `contact@${slug}.com`,
				phoneNumber: phone
			}
		],
		integration: {
			callbackUrl: `https://${slug}.com/payment/callback`,
			ipAddress: `103.${seed % 255}.${(seed >> 4) % 255}.10`
		},
		documents: [],
		createdBy: 1,
		updatedBy: 1
	};
}

export function getOrganizationDetail(orgId: string): OnboardingOrgRecord | undefined {
	const listOrg = organizations.find((o) => o.id === orgId);
	if (!listOrg) return undefined;

	const existing = getOnboardingOrgById(orgId);
	if (existing) {
		return {
			...existing,
			profileStatus: listOrg.status,
			legalCompanyName: listOrg.name,
			businessType: listOrg.businessType,
			profileType: listOrg.profileType
		};
	}

	return buildFromListOrg(listOrg);
}
