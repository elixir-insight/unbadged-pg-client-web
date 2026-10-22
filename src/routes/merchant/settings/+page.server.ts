import { fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import type { Actions, PageServerLoad } from './$types';
import { authClient } from '$lib/server/domains/auth/client';
import { merchantApiCredentialsClient } from '$lib/server/domains/merchant-api-credentials/client';
import { merchantProfileClient } from '$lib/server/domains/merchant-profile/client';
import { mapMerchantProfile } from '$lib/server/domains/merchant-profile/mappers/from-api/profile';
import { getValidSession } from '$lib/server/domains/auth/getValidSession';
import { requirePermission } from '$lib/server/domains/auth/requirePermission';
import { resetPasswordAction } from '$lib/server/domains/auth/reset-password';
import {
	CreateMfaRequestSchema,
	UpdateMfaRequestSchema,
	type MfaConfig
} from '$lib/server/domains/auth/schema';
import { clearAuthCookies } from '$lib/server/domains/auth/session';

function handleAuthFailure(
	cookies: Parameters<PageServerLoad>[0]['cookies'],
	error: { kind: string; status?: number }
): never | null {
	if (error.kind === 'http' && error.status === 401) {
		clearAuthCookies(cookies);
		redirect(303, '/login?reason=session-expired');
	}
	return null;
}

export const load: PageServerLoad = async ({ cookies, fetch, locals }) => {
	const tokens = await getValidSession(cookies, fetch, locals.logger);

	const [credentialResult, profileResult, mfaResult] = await Promise.all([
		merchantApiCredentialsClient.list(
			fetch,
			locals.logger,
			tokens.accessToken,
			tokens.gatewayToken
		),
		merchantProfileClient.getProfile(fetch, locals.logger, tokens.accessToken, tokens.gatewayToken),
		authClient.getMfa(fetch, locals.logger, tokens.accessToken, tokens.gatewayToken)
	]);

	if (
		(!credentialResult.ok &&
			credentialResult.error.kind === 'http' &&
			credentialResult.error.status === 401) ||
		(!profileResult.ok &&
			profileResult.error.kind === 'http' &&
			profileResult.error.status === 401) ||
		(!mfaResult.ok && mfaResult.error.kind === 'http' && mfaResult.error.status === 401)
	) {
		clearAuthCookies(cookies);
		redirect(303, '/login?reason=session-expired');
	}

	let apiCredential: { id: string; clientId: string } | null = null;
	let apiCredentialError: string | null = null;

	if (!credentialResult.ok) {
		locals.logger.error({ error: credentialResult.error }, 'failed to load API credential');
		apiCredentialError = 'Could not load your API credential. Please try again.';
	} else {
		const item = credentialResult.data.data[0];
		apiCredential = item ? { id: String(item.id), clientId: item.clientId } : null;
	}

	let profile = null;
	let profileError: string | null = null;

	if (!profileResult.ok) {
		locals.logger.error({ error: profileResult.error }, 'failed to load merchant profile');
		profileError = 'Could not load your organization profile. Please try again.';
	} else {
		const item = profileResult.data.data[0];
		profile = item ? mapMerchantProfile(item) : null;
		if (!profile) {
			profileError = 'Organization profile not found.';
		}
	}

	let mfaConfig: MfaConfig | null = null;
	let mfaError: string | null = null;

	if (!mfaResult.ok) {
		handleAuthFailure(cookies, mfaResult.error);
		locals.logger.error({ error: mfaResult.error }, 'failed to load MFA configuration');
		mfaError = 'Could not load MFA settings. Please try again.';
	} else {
		mfaConfig = mfaResult.data.data[0] ?? { configured: false, enabled: false };
	}

	return {
		apiCredential,
		apiCredentialError,
		profile,
		profileError,
		mfaConfig,
		mfaError
	};
};

export const actions = {
	generate: async ({ cookies, fetch, locals }) => {
		requirePermission(locals.userPermissions, 'PROFILE', 'write');
		const tokens = await getValidSession(cookies, fetch, locals.logger);
		const result = await merchantApiCredentialsClient.create(
			fetch,
			locals.logger,
			tokens.accessToken,
			tokens.gatewayToken
		);

		if (result.ok) {
			const credential = result.data.data[0];
			if (!credential) {
				locals.logger.error('API credential created but response contained no data');
				return fail(500, { message: 'Something went wrong. Please try again.' });
			}
			return { clientId: credential.clientId, clientSecret: credential.clientSecret };
		}

		if (result.error.kind === 'http' && result.error.status === 401) {
			clearAuthCookies(cookies);
			redirect(303, '/login?reason=session-expired');
		}
		if (result.error.kind === 'http' && result.error.status === 422) {
			return fail(422, {
				message: "You've already generated a credential for this organization.",
				selfCorrect: true
			});
		}
		if (result.error.kind === 'http' && result.error.status === 400) {
			return fail(400, {
				message: result.error.message || 'Missing organization or user context.'
			});
		}
		locals.logger.error({ error: result.error }, 'failed to generate API credential');
		return fail(500, { message: 'Something went wrong. Please try again.', retryable: true });
	},

	revoke: async ({ request, cookies, fetch, locals }) => {
		requirePermission(locals.userPermissions, 'PROFILE', 'delete');
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '').trim();
		if (!id) {
			return fail(400, { message: 'Missing credential id.' });
		}

		const tokens = await getValidSession(cookies, fetch, locals.logger);
		const result = await merchantApiCredentialsClient.revoke(
			fetch,
			locals.logger,
			tokens.accessToken,
			tokens.gatewayToken,
			id
		);

		if (result.ok) {
			return { revoked: true };
		}

		if (result.error.kind === 'http' && result.error.status === 401) {
			clearAuthCookies(cookies);
			redirect(303, '/login?reason=session-expired');
		}

		locals.logger.error({ error: result.error }, 'failed to revoke API credential');
		return fail(result.error.kind === 'http' ? result.error.status : 500, {
			message: result.error.message || 'Something went wrong. Please try again.'
		});
	},

	createMfa: async ({ request, cookies, fetch, locals }) => {
		requirePermission(locals.userPermissions, 'PROFILE', 'write-restricted');
		const formData = await request.formData();
		const parsed = v.safeParse(CreateMfaRequestSchema, {
			method: String(formData.get('method') ?? '').trim()
		});

		if (!parsed.success) {
			return fail(400, {
				mfaMessage: parsed.issues[0]?.message ?? 'Select a valid MFA method.'
			});
		}

		const tokens = await getValidSession(cookies, fetch, locals.logger);
		const result = await authClient.createMfa(
			fetch,
			locals.logger,
			tokens.accessToken,
			tokens.gatewayToken,
			parsed.output.method
		);

		if (result.ok) {
			return {
				mfaSuccess: true,
				mfaMessage: 'MFA has been set up successfully.',
				mfaConfig: result.data.data?.[0] ?? {
					method: parsed.output.method,
					configured: true,
					enabled: true
				}
			};
		}

		if (result.error.kind === 'http' && result.error.status === 401) {
			clearAuthCookies(cookies);
			redirect(303, '/login?reason=session-expired');
		}

		locals.logger.error({ error: result.error }, 'failed to create MFA configuration');
		return fail(result.error.kind === 'http' ? result.error.status : 500, {
			mfaMessage: result.error.message || 'Could not set up MFA. Please try again.'
		});
	},

	updateMfa: async ({ request, cookies, fetch, locals }) => {
		requirePermission(locals.userPermissions, 'PROFILE', 'write-restricted');
		const formData = await request.formData();
		const hasEnabled = formData.has('enabled');
		const methodValue = String(formData.get('method') ?? '').trim();

		const parsed = v.safeParse(UpdateMfaRequestSchema, {
			...(hasEnabled ? { enabled: String(formData.get('enabled')).trim() === 'true' } : {}),
			...(methodValue ? { method: methodValue } : {})
		});

		if (!parsed.success) {
			return fail(400, {
				mfaMessage: parsed.issues[0]?.message ?? 'Invalid MFA update request.'
			});
		}

		const tokens = await getValidSession(cookies, fetch, locals.logger);
		const result = await authClient.updateMfa(
			fetch,
			locals.logger,
			tokens.accessToken,
			tokens.gatewayToken,
			parsed.output
		);

		if (result.ok) {
			const changedMethod = parsed.output.method !== undefined;
			return {
				mfaSuccess: true,
				mfaMessage: changedMethod
					? 'MFA method updated successfully.'
					: parsed.output.enabled
						? 'MFA enabled successfully.'
						: 'MFA disabled successfully.',
				mfaConfig: result.data.data[0] ?? null
			};
		}

		if (result.error.kind === 'http' && result.error.status === 401) {
			clearAuthCookies(cookies);
			redirect(303, '/login?reason=session-expired');
		}

		locals.logger.error({ error: result.error }, 'failed to update MFA configuration');
		return fail(result.error.kind === 'http' ? result.error.status : 500, {
			mfaMessage: result.error.message || 'Could not update MFA. Please try again.'
		});
	},

	resetPassword: async ({ request, cookies, fetch, locals }) => {
		requirePermission(locals.userPermissions, 'PROFILE', 'write-restricted');
		return resetPasswordAction({
			request,
			cookies,
			fetch,
			logger: locals.logger
		});
	}
} satisfies Actions;
