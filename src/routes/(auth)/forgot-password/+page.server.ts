import { fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { resolve } from '$app/paths';
import type { Actions } from './$types';
import { authClient } from '$lib/server/domains/auth/client';
import { ForgotPasswordRequestSchema } from '$lib/server/domains/auth/schema';

// No session cookie involved — runs entirely pre-authentication.
export const actions: Actions = {
	default: async ({ request, fetch, locals }) => {
		const data = await request.formData();
		const userEmail = String(data.get('userEmail') ?? '');
		const parsed = v.safeParse(ForgotPasswordRequestSchema, { userEmail });
		if (!parsed.success) {
			return fail(400, {
				emailError: parsed.issues[0]?.message ?? 'Invalid email.',
				userEmail
			});
		}

		const result = await authClient.forgotPassword(fetch, locals.logger, parsed.output.userEmail);
		if (!result.ok) {
			const httpStatus = result.error.kind === 'http' ? result.error.status : 502;
			const status = httpStatus >= 400 && httpStatus < 500 ? httpStatus : 502;
			return fail(status, {
				error: result.error.message,
				userEmail: parsed.output.userEmail
			});
		}
		const resetPasswordUrl = `${resolve('/reset-password')}?userEmail=${encodeURIComponent(parsed.output.userEmail)}&message=${encodeURIComponent(result.data.message)}`;
		redirect(303, resetPasswordUrl);
	}
};
