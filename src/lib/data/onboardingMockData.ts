import type { OnboardingOrgRecord, OrganizationData, OrgDataV2 } from '$lib/types/organization';

const emptyKyb = (): OrgDataV2['kyb'] => ({
	businessPan: undefined,
	gstNumber: undefined,
	cin: undefined,
	tan: undefined,
	businessPhone: undefined,
	organizationWebsite: undefined,
	industry: undefined,
	registeredYear: null,
	communicationAddress: undefined
});

const emptyAddress = (): OrgDataV2['addressDetails'] => ({
	address: undefined,
	city: undefined,
	state: undefined,
	country: undefined,
	pinCode: undefined
});

const emptyDirector = (id: number): OrgDataV2['directors'][number] => ({
	id,
	name: undefined,
	aadhar: undefined,
	pan: undefined,
	email: undefined,
	phoneNumber: undefined
});

function toListItem(org: OnboardingOrgRecord): OrganizationData {
	return {
		orgId: org.orgId,
		legalCompanyName: org.legalCompanyName,
		createdAt: org.createdAt,
		businessType: org.businessType,
		profileType: org.profileType,
		profileStatus: org.profileStatus
	};
}

function toOrgDetail(org: OnboardingOrgRecord): OrgDataV2 {
	const {
		legalCompanyName,
		businessType,
		profileStatus,
		profileType,
		affiliateId,
		userEmail,
		phoneNumber,
		bankAccounts,
		kyb,
		addressDetails,
		directors,
		integration,
		documents,
		createdBy,
		updatedBy
	} = org;

	return {
		legalCompanyName,
		businessType,
		profileStatus,
		profileType,
		affiliateId,
		userEmail,
		phoneNumber,
		bankAccounts,
		kyb,
		addressDetails,
		directors,
		integration,
		documents,
		createdBy,
		updatedBy
	};
}

const onboardingOrgRecords: OnboardingOrgRecord[] = [
	{
		orgId: 'ORG-1000',
		legalCompanyName: 'Northwind Capital',
		businessType: 'PARTNERSHIP',
		profileStatus: 'PENDING',
		profileType: 'MERCHANT',
		affiliateId: 0,
		userEmail: 'contact@northwindcapital.in',
		phoneNumber: '9876543210',
		createdAt: '2024-12-31',
		bankAccounts: [],
		kyb: emptyKyb(),
		addressDetails: emptyAddress(),
		directors: [emptyDirector(1)],
		integration: { ipAddress: '' },
		documents: [],
		createdBy: 101,
		updatedBy: 101
	},
	{
		orgId: 'ORG-1003',
		legalCompanyName: 'Vertex Robotics',
		businessType: 'PRIVATE_LIMITED',
		profileStatus: 'PENDING',
		profileType: 'MERCHANT',
		affiliateId: 0,
		userEmail: 'hello@vertexrobotics.com',
		phoneNumber: '9123456780',
		createdAt: '2025-07-15',
		bankAccounts: [],
		kyb: {
			...emptyKyb(),
			businessPan: 'AABCV1234F',
			industry: 'Technology'
		},
		addressDetails: {
			address: '42 Industrial Estate',
			city: 'Bengaluru',
			state: 'Karnataka',
			country: 'India',
			pinCode: '560001'
		},
		directors: [emptyDirector(1)],
		integration: { ipAddress: '' },
		documents: [],
		createdBy: 102,
		updatedBy: 102
	},
	{
		orgId: 'ORG-1006',
		legalCompanyName: 'Stellar Foods',
		businessType: 'SOLE_PROPRIETORSHIP',
		profileStatus: 'PENDING',
		profileType: 'MERCHANT',
		affiliateId: 0,
		userEmail: 'orders@stellarfoods.in',
		phoneNumber: '9988776655',
		createdAt: '2025-01-03',
		bankAccounts: [],
		kyb: emptyKyb(),
		addressDetails: emptyAddress(),
		directors: [emptyDirector(1)],
		integration: { ipAddress: '' },
		documents: [],
		createdBy: 103,
		updatedBy: 103
	},
	{
		orgId: 'ORG-1010',
		legalCompanyName: 'Crestline Digital',
		businessType: 'PARTNERSHIP',
		profileStatus: 'PENDING',
		profileType: 'PARTNER',
		affiliateId: 0,
		userEmail: 'team@crestlinedigital.com',
		phoneNumber: '9012345678',
		createdAt: '2025-08-14',
		bankAccounts: [],
		kyb: emptyKyb(),
		addressDetails: emptyAddress(),
		directors: [emptyDirector(1)],
		integration: { ipAddress: '' },
		documents: [],
		createdBy: 104,
		updatedBy: 104
	},
	{
		orgId: 'ORG-1014',
		legalCompanyName: 'Cascade Fintech',
		businessType: 'LLP',
		profileStatus: 'IN_PROGRESS',
		profileType: 'MERCHANT',
		affiliateId: 1001,
		userEmail: 'ops@cascadefintech.in',
		phoneNumber: '9811122233',
		createdAt: '2026-03-11',
		bankAccounts: [
			{
				id: 1,
				holderName: 'Cascade Fintech LLP',
				accountNumber: '50100234567890',
				ifscCode: 'HDFC0001234',
				bankName: 'HDFC Bank',
				branchName: 'Mumbai Fort',
				accountType: 'CURRENT',
				status: 'PENDING'
			}
		],
		kyb: {
			businessPan: 'AAFCF5678K',
			gstNumber: '27AAFCF5678K1Z5',
			cin: undefined,
			tan: 'MUMC12345D',
			businessPhone: '9811122233',
			organizationWebsite: 'https://cascadefintech.in',
			industry: 'Financial Services',
			registeredYear: 2022,
			communicationAddress: 'Tower B, Bandra Kurla Complex, Mumbai'
		},
		addressDetails: {
			address: 'Tower B, Bandra Kurla Complex',
			city: 'Mumbai',
			state: 'Maharashtra',
			country: 'India',
			pinCode: '400051'
		},
		directors: [
			{
				id: 1,
				name: 'Ananya Desai',
				aadhar: '1234-5678-9012',
				pan: 'ABCDE1234F',
				email: 'ananya@cascadefintech.in',
				phoneNumber: '9811122233'
			}
		],
		integration: {
			id: 1,
			callbackUrl: 'https://cascadefintech.in/webhooks/payments',
			ipAddress: '203.0.113.10'
		},
		documents: [
			{
				id: 'DOC-1014-1',
				fileName: 'partnership-deed.pdf',
				fileType: 'application/pdf',
				size: 245760,
				createdAt: '2026-03-12T10:00:00Z',
				updatedAt: '2026-03-12T10:00:00Z',
				createdBy: 104,
				updatedBy: 104
			}
		],
		createdBy: 104,
		updatedBy: 105
	},
	{
		orgId: 'ORG-1018',
		legalCompanyName: 'Solaris Trade Co',
		businessType: 'PRIVATE_LIMITED',
		profileStatus: 'IN_PROGRESS',
		profileType: 'RESELLER',
		affiliateId: 1002,
		userEmail: 'support@solaristrade.com',
		phoneNumber: '9765432109',
		createdAt: '2026-04-03',
		bankAccounts: [
			{
				id: 1,
				holderName: 'Solaris Trade Co Pvt Ltd',
				accountNumber: '60200345678901',
				ifscCode: 'ICIC0000456',
				bankName: 'ICICI Bank',
				branchName: 'Hyderabad Hitech City',
				accountType: 'CURRENT',
				status: 'PENDING'
			}
		],
		kyb: {
			businessPan: 'AAPCS9012L',
			gstNumber: '36AAPCS9012L1Z8',
			cin: 'U51909TG2020PTC123456',
			tan: undefined,
			businessPhone: '9765432109',
			organizationWebsite: 'https://solaristrade.com',
			industry: 'E-Commerce',
			registeredYear: 2020,
			communicationAddress: 'Plot 18, Hitech City, Hyderabad'
		},
		addressDetails: {
			address: 'Plot 18, Hitech City',
			city: 'Hyderabad',
			state: 'Telangana',
			country: 'India',
			pinCode: '500081'
		},
		directors: [
			{
				id: 1,
				name: 'Rahul Verma',
				aadhar: '9876-5432-1098',
				pan: 'FGHIJ5678K',
				email: 'rahul@solaristrade.com',
				phoneNumber: '9765432109'
			},
			{
				id: 2,
				name: 'Priya Nair',
				aadhar: undefined,
				pan: undefined,
				email: 'priya@solaristrade.com',
				phoneNumber: undefined
			}
		],
		integration: {
			id: 2,
			callbackUrl: undefined,
			ipAddress: '198.51.100.22'
		},
		documents: [],
		createdBy: 105,
		updatedBy: 105
	}
];

export const onboardingOrganizations: OrganizationData[] = onboardingOrgRecords.map(toListItem);

export function getOnboardingOrgById(orgId: string | number): OnboardingOrgRecord | undefined {
	const key = String(orgId);
	return onboardingOrgRecords.find((org) => String(org.orgId) === key);
}

export function getOnboardingOrgDetail(orgId: string | number): OrgDataV2 | undefined {
	const org = getOnboardingOrgById(orgId);
	if (!org) return undefined;

	return toOrgDetail(org);
}
