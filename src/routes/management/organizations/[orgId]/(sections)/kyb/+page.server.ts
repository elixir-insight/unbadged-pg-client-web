import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import * as v from 'valibot';
import { apiFetch } from '$lib/server/http/fetchClient';
import type { ApiError } from '$lib/server/http/errors';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { requirePermission } from '$lib/server/domains/auth/requirePermission';
import { organizationClient } from '$lib/server/domains/organization/client';
import { pipelineClient } from '$lib/server/domains/pipeline/client';
import { toPipelineDropdownOptions } from '$lib/server/domains/pipeline/map-options';
import { mapGetOrganizationResponse } from '$lib/server/domains/organization/mappers/from-api/get-organization';
import { loadOrganizationDocuments } from '$lib/server/domains/organization/loaders/documents';
import { loadOrganizationBankAccounts } from '$lib/server/domains/organization/loaders/bank-accounts';
import { unmaskOrganizationForReview } from '$lib/server/domains/organization/loaders/sensitive-data';
import { parseUpdateKybSectionFormData } from '$lib/server/domains/organization/utils/form-data';
import { updateKybSectionMutation } from '$lib/server/domains/organization/mutations/update-kyb-section';
import { buildSections } from '$lib/kyb-review/sections';
import { mapVerifications } from '$lib/kyb-review/utils';

const VerificationRecordSchema = v.object({
	fieldName: v.optional(v.nullable(v.string()), ''),
	status: v.optional(v.nullable(v.string()), ''),
	remarks: v.optional(v.nullable(v.string()))
});

const GetVerificationsResponseSchema = v.object({
	message: v.optional(v.string()),
	statusCode: v.optional(v.number()),
	data: v.optional(v.nullable(v.array(VerificationRecordSchema)))
});

function throwApiError(apiError: ApiError): never {
	if (apiError.kind === 'http') {
		error(apiError.status, apiError.message);
	}
	error(502, apiError.message);
}

export const load: PageServerLoad = async ({ params, cookies, fetch, locals, depends }) => {
	depends('kyb:verifications');
	requirePermission(locals.userPermissions, 'ORGANIZATION', 'read');

	const orgId = params.orgId?.trim() ?? '';
	if (!orgId) {
		error(404, 'Organization not found');
	}

	const log = locals.logger;
	let tokens;
	try {
		tokens = await getValidSession(cookies, fetch, log);
	} catch (cause) {
		if (cause instanceof SessionInactiveError || cause instanceof SessionError) {
			error(401, cause.message);
		}
		throw cause;
	}

	const verificationsPath = `api/v1/management/onboard/organization/${encodeURIComponent(orgId)}/verifications`;
	const [detailsResult, verificationsResult] = await Promise.all([
		organizationClient.getDetails(fetch, log, tokens.accessToken, tokens.gatewayToken, orgId),
		apiFetch(verificationsPath, {
			fetch,
			logger: log,
			method: 'GET',
			accessToken: tokens.accessToken,
			gatewayToken: tokens.gatewayToken,
			schema: GetVerificationsResponseSchema
		})
	]);

	if (!detailsResult.ok) throwApiError(detailsResult.error);
	if (!verificationsResult.ok) throwApiError(verificationsResult.error);
	log.info({ orgId, response: detailsResult.data }, 'GET organization details succeeded');
	log.info({ orgId, response: verificationsResult.data }, 'GET verifications succeeded');

	const mapped = mapGetOrganizationResponse(detailsResult.data, orgId);
	if (!mapped) {
		error(404, 'Organization not found');
	}

	// Org details carry no files or bank accounts; fetch them like the documents and bank pages.
	const loaderParams = { fetch, log, cookies, orgId, organizationBase: mapped };
	const [{ documents, directors }, { bankAccounts, bankAccountsLoadError }] = await Promise.all([
		loadOrganizationDocuments(loaderParams),
		loadOrganizationBankAccounts(loaderParams)
	]);
	log.info(
		{ orgId, fromBankApi: bankAccounts, fromDetails: mapped.bankAccounts, bankAccountsLoadError },
		'GET bank accounts for review'
	);
	const merged = {
		...mapped,
		documents,
		directors,
		// Prefer the bank-accounts API; fall back to accounts embedded in the details response.
		bankAccounts: bankAccounts.length > 0 ? bankAccounts : mapped.bankAccounts
	};

	// Only while in review: pipelines feed the approve popup, and the reviewer sees decrypted
	// PAN / Aadhaar. Every other status keeps the masked values the edit form relies on.
	const inReview = merged.status === 'IN_REVIEW';
	const [payinResult, payoutResult, unmasked] = inReview
		? await Promise.all([
				pipelineClient.list(fetch, log, tokens.accessToken, tokens.gatewayToken, 'PAYIN'),
				pipelineClient.list(fetch, log, tokens.accessToken, tokens.gatewayToken, 'PAYOUT'),
				unmaskOrganizationForReview({
					fetch,
					log,
					accessToken: tokens.accessToken,
					gatewayToken: tokens.gatewayToken,
					orgId,
					organization: merged
				})
			])
		: [null, null, null];
	const organization = unmasked?.organization ?? merged;
	const pipelineFailures = [payinResult, payoutResult]
		.map((result) => (result && !result.ok ? result.error.message : null))
		.filter((message): message is string => Boolean(message));

	const items = (verificationsResult.data.data ?? []).map((item) => ({
		fieldName: item.fieldName ?? '',
		status: item.status ?? '',
		remarks: item.remarks
	}));

	const verifications = mapVerifications(items);

	return {
		kybReview: {
			organization,
			verifications,
			sensitiveDataError: unmasked?.sensitiveDataError ?? null,
			sections: buildSections(organization, Object.keys(verifications)),
			pipelines: {
				payin: toPipelineDropdownOptions(payinResult?.ok ? payinResult.data : null),
				payout: toPipelineDropdownOptions(payoutResult?.ok ? payoutResult.data : null),
				error: pipelineFailures.length > 0 ? [...new Set(pipelineFailures)].join('; ') : null
			}
		}
	};
};

export const actions = {
	saveSection: async ({ request, params, cookies, fetch, locals }) => {
		requirePermission(locals.userPermissions, 'ORGANIZATION', 'write');
		const log = locals.logger;
		const orgId = params.orgId?.trim() ?? '';
		const formData = await request.formData();
		const parsed = parseUpdateKybSectionFormData(formData);

		if (!parsed.success) {
			log.warn({ issues: parsed.issues }, 'update organization rejected — invalid form data');
			return fail(400, {
				message: parsed.issues[0]?.message ?? 'Invalid organization payload'
			});
		}

		const result = await updateKybSectionMutation({
			fetch,
			log,
			cookies,
			orgId,
			body: parsed.output
		});

		if (!result.ok) {
			return fail(result.status, { message: result.message });
		}

		return {
			success: true,
			message: result.message,
			section: parsed.output.section
		};
	}
} satisfies Actions;
