import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { isDocumentFieldName } from '$lib/api/onboarding';
import { DOCUMENT_KEYS } from '$lib/components/self-onboarding/validation';
import { onboardingClient } from '$lib/server/domains/onboarding/client';
import { requireOnboardingSession } from '$lib/server/domains/onboarding/guard';
import type { DocumentKey } from '$lib/types/onboarding';

function isDocumentKey(value: FormDataEntryValue | null): value is DocumentKey {
	return typeof value === 'string' && (DOCUMENT_KEYS as string[]).includes(value);
}

// Uploaded documents are loaded once by the layout (+layout.server.ts), alongside the org record.
export const actions: Actions = {
	default: async ({ request, cookies, fetch, locals }) => {
		const session = await requireOnboardingSession({
			cookies,
			fetch,
			log: locals.logger,
			groups: locals.merchantSession?.groups
		});
		if (!session.ok) return session.failure;

		const form = await request.formData();
		const documentType = form.get('documentType');
		const file = form.get('file');
		const fieldName = form.get('fieldName');

		if (!isDocumentKey(documentType)) {
			return fail(400, { error: 'Unknown document type.' });
		}
		// Only ever forward a field name from this slot's own allowlist — never an arbitrary
		// client-supplied one (see ORG_DOCUMENT_FIELDS).
		if (typeof fieldName !== 'string' || !isDocumentFieldName(documentType, fieldName)) {
			return fail(400, { error: 'Select which document this is.' });
		}
		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { error: 'A file is required.' });
		}

		const upstreamForm = new FormData();
		upstreamForm.append(fieldName, file, file.name);

		const result = await onboardingClient.uploadOrgDocument(
			fetch,
			locals.logger,
			session.tokens,
			upstreamForm
		);
		if (!result.ok) {
			const status = result.error.kind === 'http' ? result.error.status : 502;
			return fail(status, { error: result.error.message });
		}

		return { success: true as const, documentType };
	}
};
