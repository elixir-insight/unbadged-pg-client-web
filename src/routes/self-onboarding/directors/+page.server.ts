import { fail } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { Actions } from './$types';
import { extractDirectorIds } from '$lib/components/self-onboarding/director-ids';
import { onboardingClient } from '$lib/server/domains/onboarding/client';
import {
	extractDocuments,
	extractOrganizationDataArray
} from '$lib/server/domains/onboarding/extract';
import { requireOnboardingSession } from '$lib/server/domains/onboarding/guard';
import { saveFailure, saveOrganizationSection } from '$lib/server/domains/onboarding/save-section';
import { uploadErrorDetails } from '$lib/server/domains/onboarding/upload-error';
import { parseDocumentFileName } from '$lib/server/domains/organization/utils/document-field-names';
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
		if (!result.ok) return saveFailure(result.error);

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
		if (!result.ok) return saveFailure(result.error);

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
			const { error } = result;
			const body = error.kind === 'http' ? error.body : undefined;
			const details = uploadErrorDetails(body);
			locals.logger.error(
				{
					directorId,
					files: [...upstreamForm.entries()].map(([field, value]) => ({
						field,
						name: value instanceof File ? value.name : undefined,
						type: value instanceof File ? value.type : undefined,
						size: value instanceof File ? value.size : undefined
					})),
					kind: error.kind,
					status: error.kind === 'http' ? error.status : undefined,
					exceptionCode: error.kind === 'http' ? error.code : undefined,
					message: error.message,
					details,
					// Full upstream body: the generic message alone doesn't say which file failed or why.
					response: body
				},
				`director document upload failed — ${error.message}`
			);
			const status = error.kind === 'http' ? error.status : 502;
			const text =
				error.kind === 'http'
					? details.length > 0
						? `${error.message}: ${details.join('; ')}`
						: error.message
					: 'Something went wrong. Please try again.';
			// Dev only: hand the raw upstream answer to the browser so it can be read in DevTools.
			return fail(status, {
				error: text,
				...(dev && {
					debug: {
						directorId,
						status,
						code: error.kind === 'http' ? error.code : undefined,
						response: body
					}
				})
			});
		}

		return { success: true as const };
	},

	// Named, not `default`: SvelteKit rejects a default action on a page that also has named ones
	// (deleteDirector) with a 500 — which is what every "Continue" here was hitting.
	saveDirectors: async (event) => {
		const { fetch, locals } = event;
		const saved = await saveOrganizationSection(event, 'directors');
		if (!saved.ok) return saved.failure;
		const { form: fd, data: result, tokens } = saved;

		let ids = extractDirectorIds(extractOrganizationDataArray(result.data), fd.directors);
		if (!ids) {
			// The PUT response didn't carry ids back — fall back to a GET, same as the client did
			// before this call moved server-side.
			const orgResult = await onboardingClient.fetchOrganization(fetch, locals.logger, tokens);
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
