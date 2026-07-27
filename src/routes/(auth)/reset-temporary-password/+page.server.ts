import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { authClient } from '$lib/server/domains/auth/client';
import {
	extractAuthTokens,
	performSignIn,
	startAuthenticatedSession
} from '$lib/server/domains/auth/sign-in';
import { clearPasswordChallenge, readPasswordChallenge } from '$lib/server/domains/auth/session';

export const load: PageServerLoad = async ({ cookies, locals }) => {
	const challenge = readPasswordChallenge(cookies);
	if (!challenge) {
		locals.logger.info('reset-temporary-password visited without a challenge — redirecting');
		redirect(303, '/login');
	}
	return { userEmail: challenge.userEmail };
};

export const actions = {
	default: async ({ request, cookies, fetch, locals, getClientAddress }) => {
		const log = locals.logger;
		const challenge = readPasswordChallenge(cookies);
		if (!challenge) {
			log.warn('set-password attempted without a challenge session');
			redirect(303, '/login');
		}

		const formData = await request.formData();
		const newPassword = String(formData.get('newPassword') ?? '');
		const confirmPassword = String(formData.get('confirmPassword') ?? '');

		if (newPassword.trim().length < 8) {
			return fail(400, { message: 'Password must be at least 8 characters.' });
		}
		if (newPassword !== confirmPassword) {
			return fail(400, { message: 'Passwords do not match.' });
		}

		const result = await authClient.setPassword(
			fetch,
			log,
			challenge.userEmail,
			challenge.challengeSession,
			newPassword
		);

		if (!result.ok) {
			const message =
				result.error.kind === 'http'
					? result.error.message
					: 'Could not set the new password. Please try again.';
			const status =
				result.error.kind === 'http' && result.error.status >= 400 && result.error.status < 500
					? result.error.status
					: 502;
			log.warn(
				{ userEmail: challenge.userEmail, errorKind: result.error.kind, status },
				'set-password failed'
			);
			// Expired/invalid challenge — force a fresh sign-in to get a new one.
			// (400s stay on the page: they may be password-policy errors the user can fix.)
			if (status === 401) {
				clearPasswordChallenge(cookies);
				redirect(303, '/login?reason=challenge-expired');
			}
			return fail(status, { message });
		}

		log.info({ userEmail: challenge.userEmail }, 'password set — starting session');
		clearPasswordChallenge(cookies);

		const tokens = extractAuthTokens(result.data.data[0]);
		if (tokens) {
			const redirectTo = startAuthenticatedSession(cookies, tokens);
			log.info(
				{ userEmail: challenge.userEmail, redirectTo },
				'password set — session started from set-password tokens'
			);
			redirect(303, redirectTo);
		}

		log.info(
			{ userEmail: challenge.userEmail },
			'set-password returned no tokens — falling back to sign-in'
		);

		const signInResult = await performSignIn({
			fetch,
			cookies,
			logger: log,
			ip: getClientAddress(),
			userEmail: challenge.userEmail,
			password: newPassword
		});

		if (signInResult.ok) {
			log.info(
				{ userEmail: challenge.userEmail, redirectTo: signInResult.redirectTo },
				'password set — session started'
			);
			redirect(303, signInResult.redirectTo);
		}

		log.warn(
			{ userEmail: challenge.userEmail, status: signInResult.status },
			'password set but auto sign-in failed — redirecting to login'
		);
		redirect(303, '/login?reason=password-updated');
	}
} satisfies Actions;
