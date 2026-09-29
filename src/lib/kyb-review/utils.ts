import {
	PENDING_REVIEW,
	VERIFICATION_STATUSES,
	type FieldReview,
	type SectionPayload,
	type VerificationStatus
} from './types';

export type VerificationRecord = {
	fieldName: string;
	status: string;
	remarks?: string | null;
};

export type PayloadField = {
	fieldName: string;
	saved: FieldReview;
	draft: FieldReview;
};

export function isVerificationStatus(value: string): value is VerificationStatus {
	return (VERIFICATION_STATUSES as readonly string[]).includes(value);
}

/** A field missing from the mapped record is PENDING. */
export function resolveFieldReview(
	verifications: Record<string, FieldReview>,
	fieldName: string
): FieldReview {
	return verifications[fieldName] ?? PENDING_REVIEW;
}

export function mapVerifications(
	items: readonly VerificationRecord[]
): Record<string, FieldReview> {
	const mapped: Record<string, FieldReview> = {};

	for (const item of items) {
		const fieldName = item.fieldName.trim();
		if (!fieldName) continue;

		const normalized = item.status.trim().toUpperCase();
		const status = isVerificationStatus(normalized) ? normalized : 'PENDING';
		mapped[fieldName] = {
			status,
			// Kept for every status so the review summary can show whatever note the server has.
			remarks: (item.remarks ?? '').trim()
		};
	}

	return mapped;
}

/** Only a rejection carries a note; the backend stores no remarks for VERIFIED or PENDING. */
export function takesNote(status: VerificationStatus): boolean {
	return status === 'REJECTED';
}

export function needsNote(draft: FieldReview): boolean {
	return takesNote(draft.status) && draft.remarks.trim().length === 0;
}

export function isChanged(saved: FieldReview, draft: FieldReview): boolean {
	if (saved.status !== draft.status) return true;
	if (!takesNote(draft.status)) return false;
	return saved.remarks.trim() !== draft.remarks.trim();
}

export function buildSectionPayload(fields: readonly PayloadField[]): SectionPayload {
	const verified: string[] = [];
	const rejected: SectionPayload['rejected'] = [];
	const resetToPending: string[] = [];

	for (const field of fields) {
		if (!isChanged(field.saved, field.draft)) continue;

		if (field.draft.status === 'VERIFIED') {
			verified.push(field.fieldName);
			continue;
		}

		if (field.draft.status === 'REJECTED') {
			rejected.push({ fieldName: field.fieldName, remarks: field.draft.remarks.trim() });
		} else {
			resetToPending.push(field.fieldName);
		}
	}

	const payload: SectionPayload = {};
	if (verified.length > 0) payload.verified = verified;
	if (rejected.length > 0) payload.rejected = rejected;
	if (resetToPending.length > 0) payload.resetToPending = resetToPending;
	return payload;
}
