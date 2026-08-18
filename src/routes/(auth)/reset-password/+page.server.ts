import { fail, redirect } from '@sveltejs/kit';
import * as v from 'valibot';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { authClient } from '$lib/server/domains/auth/client';
import {
	ConfirmPasswordRequestSchema,
	ForgotPasswordRequestSchema
} from '$lib/server/domains/auth/schema';

// No session cookie involved — runs entirely pre-authentication.
export const load: PageServerLoad = ({ url }) => {
	return { userEmail: url.searchParams.get('userEmail') ?? '' };
};

export const actions: Actions = {
	confirm: async ({ request, fetch, locals }) => {
		const data = await request.formData();

		const userEmail = String(data.get('userEmail') ?? '').trim();
		const confirmationCode = String(data.get('confirmationCode') ?? '').trim();
		const newPassword = String(data.get('newPassword') ?? '');
		const confirmPassword = String(data.get('confirmPassword') ?? '');

		if (newPassword !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match.', errorField: 'password', userEmail });
		}

		const parsed = v.safeParse(ConfirmPasswordRequestSchema, {
			userEmail,
			confirmationCode,
			newPassword
		});
		if (!parsed.success) {
			const invalidField = parsed.issues[0]?.path?.[0]?.key;
			return fail(400, {
				error: parsed.issues[0]?.message ?? 'Invalid details.',
				errorField: invalidField === 'confirmationCode' ? 'otp' : 'password',
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
			const httpStatus = result.error.kind === 'http' ? result.error.status : 502;
			const status = httpStatus >= 400 && httpStatus < 500 ? httpStatus : 502;
			const errorCode = result.error.kind === 'http' ? result.error.code : '';
			const isOtpError = /code|otp|confirmation/i.test(`${errorCode} ${result.error.message}`);
			return fail(status, {
				error: result.error.message,
				errorField: isOtpError ? 'otp' : 'password',
				userEmail
			});
		}

		redirect(303, resolve('/login'));
	},

	resend: async ({ request, fetch, locals }) => {
		const data = await request.formData();
		const userEmail = String(data.get('userEmail') ?? '').trim();

		const parsed = v.safeParse(ForgotPasswordRequestSchema, { userEmail });
		if (!parsed.success) {
			return fail(400, {
				error: parsed.issues[0]?.message ?? 'Invalid email.',
				userEmail
			});
		}

		const result = await authClient.forgotPassword(fetch, locals.logger, parsed.output.userEmail);

		if (!result.ok) {
			const httpStatus = result.error.kind === 'http' ? result.error.status : 502;
			const status = httpStatus >= 400 && httpStatus < 500 ? httpStatus : 502;
			return fail(status, {
				error: result.error.message,
				userEmail
			});
		}

		return { success: true, message: result.data.message, userEmail };
	}
};
