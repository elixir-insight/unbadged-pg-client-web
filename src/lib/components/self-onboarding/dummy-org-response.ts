/**
 * ⚠ DUMMY — UI/test fixture only.
 * Do not ship these values as production defaults or as the live GET response.
 * Swap for the confirmed backend payload before release (see onboarding redesign §6).
 */
import type { ProfileStatus } from './stage-status';

export interface DummyOrgRecord {
	orgId: string;
	profileStatus: ProfileStatus;
	profileType: string;
	legalCompanyName: string;
	businessType: string;
	brandName: string;
	orgPan: string;
	gstNumber: string;
	cin: string;
	orgTan: string;
	email: string;
	phoneNumber: string;
	businessPhone: string;
	organizationWebsite: string;
	industry: string;
	communicationAddress: string;
	registeredYear: number;
	serviceTypes: null;
	address: {
		address: string;
		city: string;
		state: string;
		country: string;
		pinCode: string;
	};
	directors: Array<{
		id: number;
		name: string;
		aadhar: string;
		pan: string;
		email: string;
		phoneNumber: string;
	}>;
	bankDetails: {
		accountHolderName: string;
		accountNumber: string;
		ifscCode: string;
		bankName: string;
		branchName: string;
	};
	verifications: Record<string, string>;
}

export const DUMMY_REMARKED_ORG: DummyOrgRecord = {
	orgId: 'ORG_2c1',
	profileStatus: 'REMARKED',
	profileType: 'MERCHANT',
	legalCompanyName: 'Loreal Paris',
	businessType: 'PRIVATE_LIMITED',
	brandName: 'Example Pay',
	orgPan: '**********',
	gstNumber: '29ABCWWW1234F1Z6',
	cin: 'U12345KA2026PTC123456',
	orgTan: 'BLRA16345B',
	email: 'viburoshin57@gmail.com',
	phoneNumber: '+917315765098',
	businessPhone: '+919876543210',
	organizationWebsite: 'https://example.com',
	industry: 'FINTECH',
	communicationAddress: '12 Business Park, Bengaluru',
	registeredYear: 2026,
	serviceTypes: null,
	address: {
		address: '12 Business Park',
		city: 'Bengaluru',
		state: 'Karnataka',
		country: 'India',
		pinCode: '560001'
	},
	directors: [
		{
			id: 100058,
			name: 'Test Director',
			aadhar: '************',
			pan: '**********',
			email: 'director@example.com',
			phoneNumber: '+919876543211'
		}
	],
	bankDetails: {
		accountHolderName: '⚠ DUMMY — Example Pay Pvt Ltd',
		accountNumber: '⚠ DUMMY — •••••••••012',
		ifscCode: '⚠ DUMMY — HDFC0001234',
		bankName: '⚠ DUMMY — HDFC Bank',
		branchName: '⚠ DUMMY — MG Road'
	},
	verifications: {
		'kyb.cin': 'Not Clear',
		'bankDetails.ifscCode': '⚠ DUMMY — IFSC does not match bank statement'
	}
};
