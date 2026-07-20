import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { authClient } from '$lib/server/domains/auth/client';
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
	default: async ({ request, cookies, fetch, locals }) => {
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

		log.info({ userEmail: challenge.userEmail }, 'password set — challenge completed');
		clearPasswordChallenge(cookies);
		redirect(303, '/login?reason=password-updated');
	}
} satisfies Actions;
