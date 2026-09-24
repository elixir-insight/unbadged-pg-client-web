import type * as v from 'valibot';
import type { Logger } from 'pino';
import type { BankAccountRequest, UpdateOrganizationRequest } from '$lib/api/onboarding';
import { apiFetch } from '$lib/server/http/fetchClient';
import type { OnboardingTokens } from './guard';
import {
	CreateBankAccountResponseSchema,
	DeleteDirectorResponseSchema,
	GetBankAccountsResponseSchema,
	GetDocumentsResponseSchema,
	GetOrganizationResponseSchema,
	SubmitOnboardingResponseSchema,
	UpdateBankAccountResponseSchema,
	UpdateOrganizationResponseSchema,
	UploadDocumentsResponseSchema
} from './schema';

function call<TSchema extends v.GenericSchema>(
	fetchFn: typeof fetch,
	log: Logger,
	tokens: OnboardingTokens,
	path: string,
	method: 'GET' | 'POST' | 'PUT' | 'DELETE',
	schema: TSchema,
	body?: unknown
) {
	return apiFetch(`/api/v1/onboarding/${path}`, {
		fetch: fetchFn,
		logger: log,
		method,
		accessToken: tokens.accessToken,
		gatewayToken: tokens.gatewayToken,
		body,
		schema
	});
}

export const onboardingClient = {
	saveOrganization(
		fetchFn: typeof fetch,
		log: Logger,
		tokens: OnboardingTokens,
		payload: UpdateOrganizationRequest
	) {
		return call(
			fetchFn,
			log,
			tokens,
			'organization',
			'PUT',
			UpdateOrganizationResponseSchema,
			payload
		);
	},

	fetchOrganization(fetchFn: typeof fetch, log: Logger, tokens: OnboardingTokens) {
		return call(fetchFn, log, tokens, 'organization', 'GET', GetOrganizationResponseSchema);
	},

	createBankAccount(
		fetchFn: typeof fetch,
		log: Logger,
		tokens: OnboardingTokens,
		payload: BankAccountRequest
	) {
		return call(
			fetchFn,
			log,
			tokens,
			'organization/bank',
			'POST',
			CreateBankAccountResponseSchema,
			payload
		);
	},

	updateBankAccount(
		fetchFn: typeof fetch,
		log: Logger,
		tokens: OnboardingTokens,
		accountId: number,
		payload: BankAccountRequest
	) {
		return call(
			fetchFn,
			log,
			tokens,
			`organization/bank/${accountId}`,
			'PUT',
			UpdateBankAccountResponseSchema,
			payload
		);
	},

	getBankAccounts(fetchFn: typeof fetch, log: Logger, tokens: OnboardingTokens) {
		return call(
			fetchFn,
			log,
			tokens,
			'organization/bank-accounts',
			'GET',
			GetBankAccountsResponseSchema
		);
	},

	deleteDirector(fetchFn: typeof fetch, log: Logger, tokens: OnboardingTokens, directorId: number) {
		return call(
			fetchFn,
			log,
			tokens,
			`organization/directors/${directorId}`,
			'DELETE',
			DeleteDirectorResponseSchema
		);
	},

	getDirectorDocuments(
		fetchFn: typeof fetch,
		log: Logger,
		tokens: OnboardingTokens,
		directorId: number
	) {
		return call(
			fetchFn,
			log,
			tokens,
			`organization/directors/${directorId}/documents`,
			'GET',
			GetDocumentsResponseSchema
		);
	},

	// FormData bodies pass straight through apiFetch, which already lets fetch set its own
	// multipart boundary header instead of forcing Content-Type: application/json.
	uploadDirectorDocuments(
		fetchFn: typeof fetch,
		log: Logger,
		tokens: OnboardingTokens,
		directorId: number,
		formData: FormData
	) {
		return call(
			fetchFn,
			log,
			tokens,
			`organization/directors/${directorId}/documents`,
			'POST',
			UploadDocumentsResponseSchema,
			formData
		);
	},

	getOrgDocuments(fetchFn: typeof fetch, log: Logger, tokens: OnboardingTokens) {
		return call(fetchFn, log, tokens, 'organization/documents', 'GET', GetDocumentsResponseSchema);
	},

	uploadOrgDocument(
		fetchFn: typeof fetch,
		log: Logger,
		tokens: OnboardingTokens,
		formData: FormData
	) {
		return call(
			fetchFn,
			log,
			tokens,
			'organization/documents',
			'POST',
			UploadDocumentsResponseSchema,
			formData
		);
	},

	submitOnboarding(fetchFn: typeof fetch, log: Logger, tokens: OnboardingTokens) {
		return call(
			fetchFn,
			log,
			tokens,
			'organization/submit',
			'POST',
			SubmitOnboardingResponseSchema
		);
	}
};
