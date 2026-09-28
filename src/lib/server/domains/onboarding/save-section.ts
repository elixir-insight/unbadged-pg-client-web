import { fail, type ActionFailure, type Cookies } from '@sveltejs/kit';
import type { Logger } from 'pino';
import { toSectionPayload, type KybSource, type OrganizationSection } from '$lib/api/onboarding';
import type { ApiError } from '$lib/server/http/errors';
import type { OnboardingFormData } from '$lib/types/onboarding';
import { onboardingClient } from './client';
import { extractOnboardingPrefill } from './extract';
import { requireOnboardingSession } from './guard';

/** Shown for anything that isn't a backend rejection (network, timeout, unexpected response). */
export const GENERIC_SAVE_ERROR = 'Something went wrong. Please try again.';

export type SaveFailure = ActionFailure<{ error: string; field?: string }>;

/** The field a backend rejection names, when it names one (not observed so far — kept in case). */
function errorField(body: unknown): string | undefined {
	if (!body || typeof body !== 'object') return undefined;
	const record = body as Record<string, unknown>;
	const field = record.field ?? record.fieldName;
	return typeof field === 'string' && field.trim() ? field.trim() : undefined;
}

/** A failed upstream call as the action's failure: the backend's own message, or the generic one. */
export function saveFailure(error: ApiError): SaveFailure {
	if (error.kind !== 'http') return fail(502, { error: GENERIC_SAVE_ERROR });
	const field = errorField(error.body);
	return fail(error.status, { error: error.message, ...(field && { field }) });
}

/** Everything a step has nothing to say about yet — an org with no saved details. */
function emptySource(): KybSource {
	const address = { line1: '', line2: '', city: '', state: '', pincode: '' };
	return {
		businessPan: '',
		gstin: '',
		directors: [],
		businessDetails: {
			cin: '',
			tan: '',
			brandName: '',
			phone: '',
			website: '',
			industry: '',
			registeredYear: null,
			address,
			communicationAddress: { ...address },
			sameAsCommunication: true
		}
	};
}

/**
 * Saves one step's part of the organization (see toSectionPayload): re-reads what's saved
 * upstream first, so the PUT carries the other steps' fields exactly as the backend holds them.
 */
export async function saveOrganizationSection(
	event: {
		request: Request;
		cookies: Cookies;
		fetch: typeof fetch;
		locals: App.Locals;
	},
	section: OrganizationSection
) {
	const { request, cookies, fetch, locals } = event;
	const log: Logger = locals.logger;
	const session = await requireOnboardingSession({
		cookies,
		fetch,
		log,
		groups: locals.merchantSession?.groups
	});
	if (!session.ok) return { ok: false as const, failure: session.failure };

	let form: OnboardingFormData;
	try {
		const body = await request.formData();
		form = JSON.parse(String(body.get('payload') ?? '')) as OnboardingFormData;
	} catch {
		return { ok: false as const, failure: fail(400, { error: 'Malformed request.' }) };
	}

	const savedResult = await onboardingClient.fetchOrganization(fetch, log, session.tokens);
	if (!savedResult.ok) return { ok: false as const, failure: saveFailure(savedResult.error) };
	const saved = extractOnboardingPrefill(savedResult.data.data) ?? emptySource();

	const payload = toSectionPayload(section, form, saved);
	const result = await onboardingClient.saveOrganization(fetch, log, session.tokens, payload);
	if (!result.ok) return { ok: false as const, failure: saveFailure(result.error) };
	return { ok: true as const, form, data: result.data, tokens: session.tokens };
}
