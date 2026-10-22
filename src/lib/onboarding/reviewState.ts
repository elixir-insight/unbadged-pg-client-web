import type { VerificationStatus } from './verificationFields';

/**
 * What the reviewer can do next, from GET /verifications statuses:
 * - PENDING: some field is still unreviewed, so no action yet
 * - REMARKED: everything is reviewed and at least one field is rejected → send remarks
 * - APPROVABLE: every field is verified → approve
 */
export type ReviewOutcome = 'PENDING' | 'REMARKED' | 'APPROVABLE';

export function getReviewOutcome(fields: readonly { status: VerificationStatus }[]): ReviewOutcome {
	// No verification records yet means nothing has been reviewed — never approvable.
	if (fields.length === 0) return 'PENDING';
	if (fields.some((field) => field.status === 'PENDING')) return 'PENDING';
	if (fields.some((field) => field.status === 'REJECTED')) return 'REMARKED';
	return 'APPROVABLE';
}
