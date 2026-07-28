import { fail, redirect } from '@sveltejs/kit';
import type { Cookies } from '@sveltejs/kit';
import type { Logger } from 'pino';
import * as v from 'valibot';
import { authClient } from './client';
import { getValidSession } from './getValidSession';
import { ResetPasswordRequestSchema } from './schema';
import { clearAuthCookies } from './session';

/**
 * Shared form-action handler for POST /api/v1/user/password/reset.
 * Used by both merchant and management settings.
 */
export async function resetPasswordAction(opts: {
	request: Request;
	cookies: Cookies;
	fetch: typeof fetch;
	logger: Logger;
}) {
	const { request, cookies, fetch: fetchFn, logger } = opts;
	const formData = await request.formData();

	const oldPassword = String(formData.get('oldPassword') ?? '');
	const newPassword = String(formData.get('newPassword') ?? '');
	const confirmPassword = String(formData.get('confirmPassword') ?? '');

	if (newPassword !== confirmPassword) {
		return fail(400, { message: 'Passwords do not match.' });
	}

	const parsed = v.safeParse(ResetPasswordRequestSchema, { oldPassword, newPassword });
	if (!parsed.success) {
		return fail(400, {
			message: parsed.issues[0]?.message ?? 'Invalid password details.'
		});
	}

	const tokens = await getValidSession(cookies, fetchFn, logger);
	const result = await authClient.resetPassword(
		fetchFn,
		logger,
		tokens.accessToken,
		tokens.gatewayToken,
		parsed.output.oldPassword,
		parsed.output.newPassword
	);

	if (result.ok) {
		return { success: true as const, message: result.data.message };
	}

	if (result.error.kind === 'http' && result.error.status === 401) {
		clearAuthCookies(cookies);
		redirect(303, '/login?reason=session-expired');
	}

	logger.error({ error: result.error }, 'failed to reset password');

	const httpStatus = result.error.kind === 'http' ? result.error.status : 500;
	const status = httpStatus >= 400 && httpStatus < 500 ? httpStatus : 500;

	return fail(status, {
		message: result.error.message || 'Could not change password. Please try again.'
	});
}
