import { describe, expect, it, vi } from 'vitest';
import type { Cookies } from '@sveltejs/kit';
import type { Logger } from 'pino';
import { resetPasswordAction } from './reset-password';

function fakeJwt(payload: Record<string, unknown>): string {
	const b64 = (obj: unknown) => Buffer.from(JSON.stringify(obj)).toString('base64url');
	return `${b64({ alg: 'none' })}.${b64(payload)}.sig`;
}

function fakeCookies(): Cookies {
	const accessToken = fakeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 });
	const store: Record<string, string> = {
		accessToken,
		gatewayToken: 'gateway-token',
		idToken: fakeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 }),
		refreshToken: 'refresh-token'
	};
	return {
		get: (name: string) => store[name],
		getAll: () => Object.entries(store).map(([name, value]) => ({ name, value })),
		set: (name: string, value: string) => {
			store[name] = value;
		},
		delete: (name: string) => {
			delete store[name];
		},
		serialize: () => ''
	} as unknown as Cookies;
}

function fakeLogger(): Logger {
	const noop = () => {};
	const logger = { info: noop, warn: noop, error: noop, debug: noop } as unknown as Logger;
	// @ts-expect-error minimal pino-shaped fake
	logger.child = () => logger;
	return logger;
}

function jsonResponse(status: number, body: unknown) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});
}

function formRequest(fields: Record<string, string>) {
	const formData = new FormData();
	for (const [key, value] of Object.entries(fields)) {
		formData.set(key, value);
	}
	return { formData: () => Promise.resolve(formData) } as unknown as Request;
}

const validPassword = 'SecurePass1!';

describe('resetPasswordAction', () => {
	it('returns success when the upstream reset succeeds', async () => {
		const fetchFn = vi.fn().mockResolvedValue(
			jsonResponse(200, {
				data: [],
				message: 'Password Reset Successfully',
				statusCode: 200
			})
		);

		const result = await resetPasswordAction({
			request: formRequest({
				oldPassword: 'OldPass1!',
				newPassword: validPassword,
				confirmPassword: validPassword
			}),
			cookies: fakeCookies(),
			fetch: fetchFn,
			logger: fakeLogger()
		});

		expect(result).toEqual({
			success: true,
			message: 'Password Reset Successfully'
		});
		expect(fetchFn).toHaveBeenCalledWith(
			expect.stringContaining('/api/v1/user/password/reset'),
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify({
					oldPassword: 'OldPass1!',
					newPassword: validPassword
				})
			})
		);
	});

	it('fails when passwords do not match', async () => {
		const fetchFn = vi.fn();

		const result = await resetPasswordAction({
			request: formRequest({
				oldPassword: 'OldPass1!',
				newPassword: validPassword,
				confirmPassword: 'DifferentPass1!'
			}),
			cookies: fakeCookies(),
			fetch: fetchFn,
			logger: fakeLogger()
		});

		expect(result).toMatchObject({
			status: 400,
			data: { message: 'Passwords do not match.' }
		});
		expect(fetchFn).not.toHaveBeenCalled();
	});

	it('fails when the new password fails policy validation', async () => {
		const fetchFn = vi.fn();

		const result = await resetPasswordAction({
			request: formRequest({
				oldPassword: 'OldPass1!',
				newPassword: 'short',
				confirmPassword: 'short'
			}),
			cookies: fakeCookies(),
			fetch: fetchFn,
			logger: fakeLogger()
		});

		expect(result).toMatchObject({ status: 400 });
		expect(fetchFn).not.toHaveBeenCalled();
	});

	it('returns the upstream error message on 400', async () => {
		const fetchFn = vi.fn().mockResolvedValue(
			jsonResponse(400, {
				message: 'Old password is incorrect',
				statusCode: 400,
				exceptionCode: 'ERR_AUTH'
			})
		);

		const result = await resetPasswordAction({
			request: formRequest({
				oldPassword: 'WrongPass1!',
				newPassword: validPassword,
				confirmPassword: validPassword
			}),
			cookies: fakeCookies(),
			fetch: fetchFn,
			logger: fakeLogger()
		});

		expect(result).toMatchObject({
			status: 400,
			data: { message: 'Old password is incorrect' }
		});
	});

	it('redirects to login on 401', async () => {
		const fetchFn = vi.fn().mockResolvedValue(
			jsonResponse(401, {
				message: 'Unauthorized',
				statusCode: 401,
				exceptionCode: 'X'
			})
		);

		await expect(
			resetPasswordAction({
				request: formRequest({
					oldPassword: 'OldPass1!',
					newPassword: validPassword,
					confirmPassword: validPassword
				}),
				cookies: fakeCookies(),
				fetch: fetchFn,
				logger: fakeLogger()
			})
		).rejects.toMatchObject({ status: 303, location: '/login?reason=session-expired' });
	});
});
