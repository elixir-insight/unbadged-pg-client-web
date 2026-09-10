import type { StageKey, StageTabId } from '$lib/components/self-onboarding/stages';

export interface RemarkRoute {
	stage: StageKey;
	tab: StageTabId;
	field: string;
}

export interface RoutedRemark extends RemarkRoute {
	key: string;
	message: string;
}

const DIRECTOR_KEY = /^directors\[(\d+)\]\.(.+)$/;

function directorFieldLabel(field: string, index: number): string {
	const labels: Record<string, string> = {
		name: 'Name',
		aadhar: 'Aadhar',
		pan: 'PAN',
		email: 'Email',
		phoneNumber: 'Phone',
		phone: 'Phone',
		din: 'DIN'
	};
	const label = labels[field] ?? field;
	return `Director ${index + 1} — ${label}`;
}

function bankFieldLabel(field: string): string {
	const labels: Record<string, string> = {
		accountHolderName: 'Account holder name',
		accountNumber: 'Account number',
		ifscCode: 'IFSC',
		bankName: 'Bank name',
		branchName: 'Branch name'
	};
	return labels[field] ?? field;
}

function addressFieldLabel(field: string): string {
	const labels: Record<string, string> = {
		address: 'Address line',
		city: 'City',
		state: 'State',
		country: 'Country',
		pinCode: 'Pincode',
		pincode: 'Pincode',
		line1: 'Address line',
		line2: 'Address line 2'
	};
	return labels[field] ?? field;
}

/**
 * Maps a `verifications` key from GET onboarding to the stage, tab, and field label.
 * Used by the sidebar sub-label, resume logic, and "Fix this →" jumps.
 */
export function routeVerificationKey(key: string): RemarkRoute {
	if (key === 'kyb.businessPan' || key.startsWith('kyb.businessPan.')) {
		return { stage: 'business-details', tab: 'pan', field: 'Business PAN' };
	}
	if (key === 'kyb.gstNumber' || key.startsWith('kyb.gstNumber.')) {
		return { stage: 'business-details', tab: 'gst', field: 'GSTIN' };
	}
	if (key === 'kyb.cin' || key.startsWith('kyb.cin.')) {
		return { stage: 'business-details', tab: 'company', field: 'CIN' };
	}
	if (
		key === 'kyb.tan' ||
		key.startsWith('kyb.tan.') ||
		key === 'orgTan' ||
		key.startsWith('orgTan.')
	) {
		return { stage: 'business-details', tab: 'company', field: 'TAN' };
	}
	if (key === 'kyb.businessPhone' || key.startsWith('kyb.businessPhone.')) {
		return { stage: 'business-details', tab: 'company', field: 'Business phone' };
	}
	if (key === 'kyb.organizationWebsite' || key.startsWith('kyb.organizationWebsite.')) {
		return { stage: 'business-details', tab: 'company', field: 'Website' };
	}
	if (key === 'kyb.industry' || key.startsWith('kyb.industry.')) {
		return { stage: 'business-details', tab: 'company', field: 'Industry' };
	}
	if (key === 'brandName' || key.startsWith('brandName.')) {
		return { stage: 'business-details', tab: 'company', field: 'Brand name' };
	}
	if (key === 'kyb.registeredYear' || key.startsWith('kyb.registeredYear.')) {
		return { stage: 'business-details', tab: 'company', field: 'Registered year' };
	}
	if (key === 'kyb.communicationAddress' || key.startsWith('kyb.communicationAddress.')) {
		return { stage: 'business-details', tab: 'address', field: 'Communication address' };
	}
	if (key === 'addressDetails' || key.startsWith('addressDetails.')) {
		const suffix = key.startsWith('addressDetails.') ? key.slice('addressDetails.'.length) : '';
		return { stage: 'business-details', tab: 'address', field: addressFieldLabel(suffix) };
	}
	if (key === 'bankDetails' || key.startsWith('bankDetails.')) {
		const suffix = key.startsWith('bankDetails.') ? key.slice('bankDetails.'.length) : '';
		return { stage: 'account-ownership', tab: 'bank', field: bankFieldLabel(suffix) };
	}

	const directorMatch = DIRECTOR_KEY.exec(key);
	if (directorMatch) {
		const index = Number(directorMatch[1]);
		const field = directorMatch[2] ?? '';
		return {
			stage: 'account-ownership',
			tab: 'directors',
			field: directorFieldLabel(field, Number.isFinite(index) ? index : 0)
		};
	}

	if (key.startsWith('kyb.')) {
		return { stage: 'business-details', tab: 'company', field: key.slice(4) };
	}

	return { stage: 'business-details', tab: 'company', field: key };
}

export function routeToStage(key: string): StageKey {
	return routeVerificationKey(key).stage;
}

export function routeToTab(key: string): StageTabId {
	return routeVerificationKey(key).tab;
}

export function getFieldRemark(
	verifications: Record<string, string> | undefined,
	key: string
): string {
	if (!verifications) return '';
	return verifications[key] ?? '';
}

export function remarksForTab(
	verifications: Record<string, string> | undefined,
	tab: StageTabId
): RoutedRemark[] {
	if (!verifications) return [];
	return Object.entries(verifications)
		.filter(([, message]) => message.trim().length > 0)
		.map(([key, message]) => ({ key, message, ...routeVerificationKey(key) }))
		.filter((remark) => remark.tab === tab);
}

export function remarksForStage(
	verifications: Record<string, string> | undefined,
	stage: StageKey
): RoutedRemark[] {
	if (!verifications) return [];
	return Object.entries(verifications)
		.filter(([, message]) => message.trim().length > 0)
		.map(([key, message]) => ({ key, message, ...routeVerificationKey(key) }))
		.filter((remark) => remark.stage === stage);
}

export function allRoutedRemarks(
	verifications: Record<string, string> | undefined
): RoutedRemark[] {
	if (!verifications) return [];
	return Object.entries(verifications)
		.filter(([, message]) => message.trim().length > 0)
		.map(([key, message]) => ({ key, message, ...routeVerificationKey(key) }));
}

export function directorRemarkIndex(key: string): number | null {
	const match = DIRECTOR_KEY.exec(key);
	if (!match) return null;
	const index = Number(match[1]);
	return Number.isFinite(index) ? index : null;
}
