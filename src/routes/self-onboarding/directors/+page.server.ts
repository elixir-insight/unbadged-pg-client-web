import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { toKybPayload } from '$lib/api/onboarding';
import { extractDirectorIds } from '$lib/components/self-onboarding/director-ids';
import { onboardingClient } from '$lib/server/domains/onboarding/client';
import {
	extractDocuments,
	extractOrganizationDataArray
} from '$lib/server/domains/onboarding/extract';
import { requireOnboardingSession } from '$lib/server/domains/onboarding/guard';
import { parseDocumentFileName } from '$lib/server/domains/organization/utils/document-field-names';
import type { OnboardingFormData } from '$lib/types/onboarding';
import {
	MAX_UPLOAD_FILE_SIZE_BYTES,
	MAX_UPLOAD_FILE_SIZE_LABEL
} from '$lib/validation/file-upload';

/** Confirmed against management onboarding's upload-documents.ts allowedDirectorDocumentFields. */
const DIRECTOR_DOCUMENT_FIELDS = new Set(['aadhar', 'pan']);

export const actions: Actions = {
	/**
	 * Only called for a director that already exists upstream (has a numeric id) — mirrors
	 * Management Onboarding's removeDirector, which deletes immediately on remove for a persisted
	 * director and only drops unsaved ones locally (see directors-api.ts / kyb/+page.svelte).
	 */
	deleteDirector: async ({ request, cookies, fetch, locals }) => {
		const session = await requireOnboardingSession({
			cookies,
			fetch,
			log: locals.logger,
			groups: locals.merchantSession?.groups
		});
		if (!session.ok) return session.failure;

		const form = await request.formData();
		const directorId = Number(form.get('directorId'));
		if (!Number.isInteger(directorId)) {
			return fail(400, { error: 'Malformed request.' });
		}

		const result = await onboardingClient.deleteDirector(
			fetch,
			locals.logger,
			session.tokens,
			directorId
		);
		if (!result.ok) {
			const status = result.error.kind === 'http' ? result.error.status : 502;
			return fail(status, { error: result.error.message });
		}

		return { success: true as const };
	},

	getDirectorDocuments: async ({ request, cookies, fetch, locals }) => {
		const session = await requireOnboardingSession({
			cookies,
			fetch,
			log: locals.logger,
			groups: locals.merchantSession?.groups
		});
		if (!session.ok) return session.failure;

		const form = await request.formData();
		const directorId = Number(form.get('directorId'));
		if (!Number.isInteger(directorId)) {
			return fail(400, { error: 'Malformed request.' });
		}

		const result = await onboardingClient.getDirectorDocuments(
			fetch,
			locals.logger,
			session.tokens,
			directorId
		);
		if (!result.ok) {
			const status = result.error.kind === 'http' ? result.error.status : 502;
			return fail(status, { error: result.error.message });
		}

		// Same fileName parsing management onboarding uses (DIRECTOR_<id>_aadharCard, pan, …).
		const fields = extractDocuments(result.data.data).map((doc) => {
			const parsed = doc.fileName ? parseDocumentFileName(doc.fileName) : null;
			return parsed?.kind === 'director' ? parsed.field : null;
		});
		return {
			success: true as const,
			aadhar: fields.includes('aadharDocument'),
			pan: fields.includes('panDocument')
		};
	},

	// Multipart field names (`aadhar` / `pan`) and the one-file-per-field-at-a-time shape follow
	// management onboarding's uploadDirectorDocumentsMutation exactly (upload-documents.ts).
	uploadDirectorDocument: async ({ request, cookies, fetch, locals }) => {
		const session = await requireOnboardingSession({
			cookies,
			fetch,
			log: locals.logger,
			groups: locals.merchantSession?.groups
		});
		if (!session.ok) return session.failure;

		const form = await request.formData();
		const directorId = Number(form.get('directorId'));
		if (!Number.isInteger(directorId)) {
			return fail(400, { error: 'Malformed request.' });
		}

		const upstreamForm = new FormData();
		for (const field of DIRECTOR_DOCUMENT_FIELDS) {
			const file = form.get(field);
			if (!(file instanceof File) || file.size === 0) continue;
			if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
				return fail(400, { error: `File must be ${MAX_UPLOAD_FILE_SIZE_LABEL} or smaller.` });
			}
			upstreamForm.append(field, file, file.name);
		}
		if ([...upstreamForm.keys()].length === 0) {
			return fail(400, { error: 'A file is required.' });
		}

		const result = await onboardingClient.uploadDirectorDocuments(
			fetch,
			locals.logger,
			session.tokens,
			directorId,
			upstreamForm
		);
		if (!result.ok) {
			const status = result.error.kind === 'http' ? result.error.status : 502;
			return fail(status, { error: result.error.message });
		}

		return { success: true as const };
	},

	// Named, not `default`: SvelteKit rejects a default action on a page that also has named ones
	// (deleteDirector) with a 500 — which is what every "Continue" here was hitting.
	saveDirectors: async ({ request, cookies, fetch, locals }) => {
		const session = await requireOnboardingSession({
			cookies,
			fetch,
			log: locals.logger,
			groups: locals.merchantSession?.groups
		});
		if (!session.ok) return session.failure;

		let fd: OnboardingFormData;
		try {
			const form = await request.formData();
			fd = JSON.parse(String(form.get('payload') ?? '')) as OnboardingFormData;
		} catch {
			return fail(400, { error: 'Malformed request.' });
		}

		const result = await onboardingClient.saveOrganization(
			fetch,
			locals.logger,
			session.tokens,
			toKybPayload(fd)
		);
		if (!result.ok) {
			const status = result.error.kind === 'http' ? result.error.status : 502;
			return fail(status, { error: result.error.message });
		}

		let ids = extractDirectorIds(extractOrganizationDataArray(result.data.data), fd.directors);
		if (!ids) {
			// The PUT response didn't carry ids back — fall back to a GET, same as the client did
			// before this call moved server-side.
			const orgResult = await onboardingClient.fetchOrganization(
				fetch,
				locals.logger,
				session.tokens
			);
			if (orgResult.ok) {
				ids = extractDirectorIds(extractOrganizationDataArray(orgResult.data.data), fd.directors);
			}
		}

		if (!ids) {
			locals.logger.warn(
				{ directors: fd.directors.length },
				'directors saved but their ids could not be matched from the organization record'
			);
		}
		return { success: true as const, directorIds: ids };
	}
};
