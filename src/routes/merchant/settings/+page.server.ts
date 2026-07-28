import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { merchantApiCredentialsClient } from '$lib/server/domains/merchant-api-credentials/client';
import { merchantProfileClient } from '$lib/server/domains/merchant-profile/client';
import { mapMerchantProfile } from '$lib/server/domains/merchant-profile/mappers/from-api/profile';
import { getValidSession } from '$lib/server/domains/auth/getValidSession';
import { resetPasswordAction } from '$lib/server/domains/auth/reset-password';
import { clearAuthCookies } from '$lib/server/domains/auth/session';

export const load: PageServerLoad = async ({ cookies, fetch, locals }) => {
	const tokens = await getValidSession(cookies, fetch, locals.logger);

	const [credentialResult, profileResult] = await Promise.all([
		merchantApiCredentialsClient.list(
			fetch,
			locals.logger,
			tokens.accessToken,
			tokens.gatewayToken
		),
		merchantProfileClient.getProfile(fetch, locals.logger, tokens.accessToken, tokens.gatewayToken)
	]);

	if (
		(!credentialResult.ok &&
			credentialResult.error.kind === 'http' &&
			credentialResult.error.status === 401) ||
		(!profileResult.ok && profileResult.error.kind === 'http' && profileResult.error.status === 401)
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

	return {
		apiCredential,
		apiCredentialError,
		profile,
		profileError
	};
};

export const actions = {
	generate: async ({ cookies, fetch, locals }) => {
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

	resetPassword: async ({ request, cookies, fetch, locals }) =>
		resetPasswordAction({
			request,
			cookies,
			fetch,
			logger: locals.logger
		})
} satisfies Actions;
