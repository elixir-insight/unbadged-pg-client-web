import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { apiCredentialsClient } from '$lib/server/domains/api-credentials/client';
import { getValidSession } from '$lib/server/domains/auth/getValidSession';
import { clearAuthCookies } from '$lib/server/domains/auth/session';

export const load: PageServerLoad = async ({ cookies, fetch, locals }) => {
	const tokens = await getValidSession(cookies, fetch, locals.logger);
	const result = await apiCredentialsClient.list(
		fetch,
		locals.logger,
		tokens.accessToken,
		tokens.gatewayToken
	);

	if (!result.ok) {
		if (result.error.kind === 'http' && result.error.status === 401) {
			clearAuthCookies(cookies);
			redirect(303, '/login?reason=session-expired');
		}
		locals.logger.error({ error: result.error }, 'failed to load API credential');
		return {
			apiCredential: null,
			apiCredentialError: 'Could not load your API credential. Please try again.'
		};
	}

	// Only id/clientId are ever forwarded to the client — clientSecret from the
	// list response (if the backend ever sends it) is intentionally dropped here
	// so it never reaches the browser. id is normalized to a string since the
	// backend returns it as a number.
	const item = result.data.data[0];
	return {
		apiCredential: item ? { id: String(item.id), clientId: item.clientId } : null,
		apiCredentialError: null
	};
};

export const actions = {
	generate: async ({ cookies, fetch, locals }) => {
		const tokens = await getValidSession(cookies, fetch, locals.logger);
		const result = await apiCredentialsClient.create(
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
		const result = await apiCredentialsClient.revoke(
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
	}
} satisfies Actions;
