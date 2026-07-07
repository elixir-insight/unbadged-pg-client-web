export type {
	AadhaarResult,
	KycTab,
	PanDetails,
	PanResult,
	VerificationHistoryEntry,
	VerificationRecordStatus,
	VerificationResult,
	VerificationStatus
} from './types';

export {
	createVerificationRefId,
	formatAadhaarDisplay,
	maskAadhaar,
	mockAadhaarResult,
	mockPanResult,
	sanitizeAadhaar,
	sanitizePan
} from './mock';

export { validateKycInput } from './validation';

export { default as KycAadhaarResult } from './kyc-aadhaar-result.svelte';
export { default as KycEmptyState } from './kyc-empty-state.svelte';
export { default as KycFailedState } from './kyc-failed-state.svelte';
export { default as KycLoadingState } from './kyc-loading-state.svelte';
export { default as KycPanResult } from './kyc-pan-result.svelte';
export { default as KycResultRow } from './kyc-result-row.svelte';
export { default as KycStatusBadge } from './kyc-status-badge.svelte';
export { default as KycTabBar } from './kyc-tab-bar.svelte';
export { default as KycVerificationForm } from './kyc-verification-form.svelte';
export { default as KycVerificationHistory } from './kyc-verification-history.svelte';
export { default as KycVerificationRecord } from './kyc-verification-record.svelte';
export { default as KycVerificationSeal } from './kyc-verification-seal.svelte';
