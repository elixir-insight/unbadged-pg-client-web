import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { isDocumentFieldName } from '$lib/api/onboarding';
import {
	DOCUMENT_ACCEPT,
	DOCUMENT_KEYS,
	DOCUMENT_LABELS,
	DOCUMENT_MAX_BYTES,
	IMAGE_DOCUMENT_ACCEPT
} from '$lib/components/self-onboarding/validation';
import { onboardingClient } from '$lib/server/domains/onboarding/client';
import { extractProfileStatus, extractVerifications } from '$lib/server/domains/onboarding/extract';
import { requireOnboardingSession } from '$lib/server/domains/onboarding/guard';
import {
	isOrgDocumentEditableWhenRemarked,
	isRemarkedProfileStatus
} from '$lib/server/domains/onboarding/remarked-saves';
import { GENERIC_SAVE_ERROR } from '$lib/server/domains/onboarding/save-section';
import type { DocumentKey } from '$lib/types/onboarding';

function isDocumentKey(value: unknown): value is DocumentKey {
	return typeof value === 'string' && (DOCUMENT_KEYS as string[]).includes(value);
}

type UploadItem = { documentType: DocumentKey; fieldName: string; file: File };

const ALLOWED_EXTENSIONS = new Set(
	`${DOCUMENT_ACCEPT},${IMAGE_DOCUMENT_ACCEPT}`
		.split(',')
		.map((part) => part.trim().replace(/^\./, '').toLowerCase())
		.filter(Boolean)
);

function fileExtension(name: string): string {
	const dot = name.lastIndexOf('.');
	return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

/** The picked documents, as `documents` (JSON list of slot + field) plus one `file:<slot>` each. */
function readUploads(form: FormData): UploadItem[] | string {
	let entries: unknown;
	try {
		entries = JSON.parse(String(form.get('documents') ?? '[]'));
	} catch {
		return 'Malformed request.';
	}
	if (!Array.isArray(entries) || entries.length === 0) return 'Pick at least one document.';

	const items: UploadItem[] = [];
	for (const entry of entries) {
		const record = (entry ?? {}) as Record<string, unknown>;
		const documentType = record.documentType;
		const fieldName = record.fieldName;
		if (!isDocumentKey(documentType)) return 'Unknown document type.';
		// Only ever forward a field name from this slot's own allowlist — never an arbitrary
		// client-supplied one (see ORG_DOCUMENT_FIELDS).
		if (typeof fieldName !== 'string' || !isDocumentFieldName(documentType, fieldName)) {
			return 'Select which document this is.';
		}
		const file = form.get(`file:${documentType}`);
		if (!(file instanceof File) || file.size === 0) {
			return `${DOCUMENT_LABELS[documentType]}: a file is required.`;
		}
		if (file.size > DOCUMENT_MAX_BYTES) {
			return `${DOCUMENT_LABELS[documentType]}: file must be 5MB or smaller.`;
		}
		const extension = fileExtension(file.name);
		if (!ALLOWED_EXTENSIONS.has(extension)) {
			return `${DOCUMENT_LABELS[documentType]}: upload a PDF or image file.`;
		}
		items.push({ documentType, fieldName, file });
	}
	return items;
}

// Uploaded documents are loaded once by the layout (+layout.server.ts), alongside the org record.
export const actions: Actions = {
	/** Uploads every document picked on this step, when the user continues. */
	default: async ({ request, cookies, fetch, locals }) => {
		const session = await requireOnboardingSession({
			cookies,
			fetch,
			log: locals.logger,
			groups: locals.merchantSession?.groups
		});
		if (!session.ok) return session.failure;

		const items = readUploads(await request.formData());
		if (typeof items === 'string') return fail(400, { error: items, uploaded: [] });

		const orgResult = await onboardingClient.fetchOrganization(
			fetch,
			locals.logger,
			session.tokens
		);
		if (!orgResult.ok) {
			return fail(orgResult.error.kind === 'http' ? orgResult.error.status : 502, {
				error: orgResult.error.kind === 'http' ? orgResult.error.message : GENERIC_SAVE_ERROR,
				uploaded: []
			});
		}

		const profileStatus = extractProfileStatus(orgResult.data.data);
		const rejectedKeys = isRemarkedProfileStatus(profileStatus)
			? Object.keys(extractVerifications(orgResult.data.data))
			: null;

		const uploaded: DocumentKey[] = [];
		for (const { documentType, fieldName, file } of items) {
			if (
				rejectedKeys &&
				!isOrgDocumentEditableWhenRemarked(documentType, fieldName, rejectedKeys)
			) {
				return fail(403, {
					error: `${DOCUMENT_LABELS[documentType]}: only documents rejected by management can be replaced.`,
					uploaded
				});
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
				const message = result.error.kind === 'http' ? result.error.message : GENERIC_SAVE_ERROR;
				// Stop at the first failure; the ones before it did upload and stay uploaded.
				return fail(status, {
					error: `${DOCUMENT_LABELS[documentType]}: ${message}`,
					uploaded
				});
			}
			uploaded.push(documentType);
		}

		return { success: true as const, uploaded };
	}
};
