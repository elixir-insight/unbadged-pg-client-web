import type { AadhaarResult, PanResult } from './types';

export function createVerificationRefId(): string {
	return `KYC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
}

export function maskAadhaar(digits: string): string {
	return `XXXX XXXX ${digits.slice(-4)}`;
}

export function mockAadhaarResult(digits: string): AadhaarResult {
	const last4 = digits.slice(-4);

	return {
		aadhaar_number: `XXXX XXXX ${last4}`,
		full_name: 'Ramesh Kumar Iyer',
		dob: '14-08-1990',
		gender: 'Male',
		age_range: '26–35',
		address: '12, Gandhi Street, T Nagar, Chennai, Tamil Nadu - 600017',
		state: 'Tamil Nadu',
		last_digits: last4,
		is_mobile: true,
		verification_status: 'Verified',
		remarks: 'Record matched with UIDAI database'
	};
}

export function mockPanResult(pan: string): PanResult {
	return {
		pan_number: pan,
		verification_status: 'Verified',
		pan_details: {
			full_name: 'Ramesh Kumar Iyer',
			gender: 'Male',
			category: 'Individual',
			dob: '14-08-1990',
			father_name: 'Suresh Kumar Iyer'
		}
	};
}

export function formatAadhaarDisplay(digits: string): string {
	return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function sanitizeAadhaar(value: string): string {
	return value.replace(/\D/g, '').slice(0, 12);
}

export function sanitizePan(value: string): string {
	return value
		.replace(/[^a-zA-Z0-9]/g, '')
		.slice(0, 10)
		.toUpperCase();
}
