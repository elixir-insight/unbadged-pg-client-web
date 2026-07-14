import { fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { authClient } from '$lib/server/domains/auth/client';
import { ConfirmPasswordRequestSchema } from '$lib/server/domains/auth/schema';

// No session cookie involved — runs entirely pre-authentication.
export const load: PageServerLoad = ({ url }) => {
	return { userEmail: url.searchParams.get('userEmail') ?? '' };
};

export const actions: Actions = {
	default: async ({ request, fetch, locals }) => {
		const data = await request.formData();

		const userEmail = String(data.get('userEmail') ?? '');
		const confirmationCode = String(data.get('confirmationCode') ?? '');
		const newPassword = String(data.get('newPassword') ?? '');
		const confirmPassword = String(data.get('confirmPassword') ?? '');

		if (newPassword !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match.', userEmail });
		}

		const parsed = v.safeParse(ConfirmPasswordRequestSchema, {
			userEmail,
			confirmationCode,
			newPassword
		});
		if (!parsed.success) {
			return fail(400, {
				error: parsed.issues[0]?.message ?? 'Invalid details.',
				userEmail
			});
		}

		const result = await authClient.confirmPassword(
			fetch,
			locals.logger,
			parsed.output.userEmail,
			parsed.output.confirmationCode,
			parsed.output.newPassword
		);

		if (!result.ok) {
			console.log(result, 'fail');
			const httpStatus = result.error.kind === 'http' ? result.error.status : 502;
			const status = httpStatus >= 400 && httpStatus < 500 ? httpStatus : 502;
			return fail(status, {
				error: result.error.message,
				userEmail
			});
		}
		console.log(result);

		redirect(303, resolve('/login'));
	}
};
