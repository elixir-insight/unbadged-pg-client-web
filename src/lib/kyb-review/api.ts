import { resolve } from '$app/paths';
import type { UpdateProfilePayload } from './profile';
import type { ReviewDecision, SectionPayload } from './types';

async function throwResponseError(response: Response): Promise<never> {
	const body: unknown = await response.json().catch(() => null);
	const message =
		body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
			? body.message.trim()
			: '';

	throw new Error(message);
}

export async function submitSectionReview(orgId: string, payload: SectionPayload): Promise<void> {
	const response = await fetch(resolve('/api/kyb/[orgId]/verifications', { orgId }), {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});

	if (response.ok) return;
	await throwResponseError(response);
}

/** Approves the organization or sends the rejected fields' remarks back to the merchant. */
export async function submitReviewDecision(orgId: string, decision: ReviewDecision): Promise<void> {
	const response = await fetch(resolve('/api/kyb/[orgId]/decision', { orgId }), {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(decision)
	});

	if (response.ok) return;
	await throwResponseError(response);
}

/** Approval step 1: saves profile type, service types and affiliate before approving. */
export async function updateOrganizationProfile(
	orgId: string,
	payload: UpdateProfilePayload
): Promise<void> {
	const response = await fetch(
		resolve('/api/management/onboard/organization/[orgId]/profile', { orgId }),
		{
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		}
	);

	if (response.ok) return;
	await throwResponseError(response);
}
