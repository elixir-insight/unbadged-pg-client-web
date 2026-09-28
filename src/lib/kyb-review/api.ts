import { resolve } from '$app/paths';
import type { SectionPayload } from './types';

export async function submitSectionReview(orgId: string, payload: SectionPayload): Promise<void> {
	const response = await fetch(resolve('/api/kyb/[orgId]/verifications', { orgId }), {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});

	if (response.ok) return;

	const body: unknown = await response.json().catch(() => null);
	const message =
		body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
			? body.message.trim()
			: '';

	throw new Error(message);
}
