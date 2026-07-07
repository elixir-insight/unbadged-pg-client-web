export type KycTab = 'aadhaar' | 'pan';

export type VerificationStatus = 'idle' | 'loading' | 'success' | 'failed';

export type VerificationRecordStatus = 'Verified' | 'Failed';

export interface AadhaarResult {
	aadhaar_number: string;
	full_name: string;
	dob: string;
	gender: string;
	age_range: string;
	address: string;
	state: string;
	last_digits: string;
	is_mobile: boolean;
	verification_status: 'Verified';
	remarks: string;
}

export interface PanDetails {
	full_name: string;
	gender: string;
	category: string;
	dob: string;
	father_name: string;
}

export interface PanResult {
	pan_number: string;
	verification_status: 'Verified';
	pan_details: PanDetails;
}

export type VerificationResult = AadhaarResult | PanResult;

export interface VerificationHistoryEntry {
	id: string;
	timestamp: Date;
	method: 'Aadhaar' | 'PAN';
	identifier: string;
	initiatedBy: string;
	status: VerificationRecordStatus;
}
