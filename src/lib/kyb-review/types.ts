export const VERIFICATION_STATUSES = ['VERIFIED', 'PENDING', 'REJECTED'] as const;

export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const VERIFICATION_STATUS_LABEL: Record<VerificationStatus, string> = {
	VERIFIED: 'Verified',
	PENDING: 'Pending',
	REJECTED: 'Rejected'
};

export type FieldReview = {
	status: VerificationStatus;
	remarks: string;
};

/** One item from GET /verifications `data`. */
export type VerificationItem = {
	fieldName: string;
	status: VerificationStatus;
	remarks?: string | null;
};

export type ReviewFieldKind = 'field' | 'document';

export type ReviewField = {
	fieldName: string;
	label: string;
	value: string;
	kind: ReviewFieldKind;
	prefix?: string;
	href?: string;
	fileType?: string;
};

export type ReviewSectionId = 'legal' | 'address' | 'directors' | 'bank' | 'documents';

export type ReviewSection = {
	id: ReviewSectionId;
	title: string;
	subtitle: string;
	fields: ReviewField[];
};

export const REVIEW_TABS = [
	'legal',
	'address',
	'directors',
	'bank',
	'documents',
	'review'
] as const;

export type ReviewTab = (typeof REVIEW_TABS)[number];

export const REVIEW_TAB_LABEL: Record<ReviewTab, string> = {
	legal: 'Legal',
	address: 'Address',
	directors: 'Directors',
	bank: 'Bank',
	documents: 'Documents',
	review: 'Review'
};

export type RemarkEntry = {
	fieldName: string;
	remarks: string;
};

export type SectionPayload = {
	verified?: string[];
	rejected?: RemarkEntry[];
	resetToPending?: string[];
};

export type ReviewMessage = {
	type: 'success' | 'error';
	text: string;
};

export const PENDING_REVIEW: FieldReview = {
	status: 'PENDING',
	remarks: ''
};
