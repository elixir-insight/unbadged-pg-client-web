import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isRedirect } from '@sveltejs/kit';

vi.mock('$lib/server/domains/auth/client', () => ({
	authClient: { confirmSignup: vi.fn(), resendConfirmationCode: vi.fn() }
}));

import { authClient } from '$lib/server/domains/auth/client';
import { actions, load } from './+page.server';
import { storeSignupAccount } from '$lib/server/domains/auth/sign-up';

function fakeCookies() {
	const store: Record<string, string> = {};
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
	};
}

function fakeLogger() {
	const logger = {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
		child: vi.fn()
	};
	logger.child.mockReturnValue(logger);
	return logger;
}

function formDataEvent(fields: Record<string, string>) {
	return {
		fetch: vi.fn() as unknown as typeof fetch,
		request: {
			formData: async () => {
				const data = new FormData();
				for (const [key, value] of Object.entries(fields)) data.set(key, value);
				return data;
			}
		},
		cookies: fakeCookies(),
		locals: { logger: fakeLogger() },
		getClientAddress: () => '127.0.0.1'
	} as unknown as Parameters<typeof actions.confirm>[0];
}

describe('/confirm-signup load', () => {
	it('prefers userEmail from the query string', async () => {
		const result = await load({
			cookies: fakeCookies(),
			fetch: vi.fn() as unknown as typeof fetch,
			locals: { logger: fakeLogger() },
			url: new URL('https://example.test/confirm-signup?userEmail=Owner%40Acme.test')
		} as unknown as Parameters<typeof load>[0]);

		expect(result).toEqual({ userEmail: 'owner@acme.test' });
	});

	it('falls back to the signup cookie when the query is missing', async () => {
		const cookies = fakeCookies();
		storeSignupAccount(cookies as unknown as Parameters<typeof storeSignupAccount>[0], {
			orgId: 'org_1',
			userEmail: 'cookie@acme.test'
		});

		const result = await load({
			cookies,
			fetch: vi.fn() as unknown as typeof fetch,
			locals: { logger: fakeLogger() },
			url: new URL('https://example.test/confirm-signup')
		} as unknown as Parameters<typeof load>[0]);

		expect(result).toEqual({ userEmail: 'cookie@acme.test' });
	});

	it('returns an empty email when nothing was passed', async () => {
		const result = await load({
			cookies: fakeCookies(),
			fetch: vi.fn() as unknown as typeof fetch,
			locals: { logger: fakeLogger() },
			url: new URL('https://example.test/confirm-signup')
		} as unknown as Parameters<typeof load>[0]);

		expect(result).toEqual({ userEmail: '' });
	});
});

describe('/confirm-signup actions', () => {
	beforeEach(() => {
		vi.mocked(authClient.confirmSignup).mockReset();
		vi.mocked(authClient.resendConfirmationCode).mockReset();
	});

	it('rejects a short code before hitting the network', async () => {
		const result = await actions.confirm(
			formDataEvent({ userEmail: 'owner@acme.test', confirmationCode: '12' })
		);

		expect(authClient.confirmSignup).not.toHaveBeenCalled();
		expect(result).toMatchObject({
			status: 400,
			data: { codeError: 'Enter the 6-digit code.' }
		});
	});

	it('redirects to /login on a 200 confirm', async () => {
		vi.mocked(authClient.confirmSignup).mockResolvedValue({
			ok: true,
			data: { statusCode: 200, message: 'Email confirmed', data: [] }
		});

		try {
			await actions.confirm(
				formDataEvent({ userEmail: 'owner@acme.test', confirmationCode: '123456' })
			);
			expect.unreachable('action should have redirected on success');
		} catch (error) {
			expect(isRedirect(error)).toBe(true);
			if (isRedirect(error)) {
				expect(error.location).toBe('/login');
			}
		}
	});

	it('returns the upstream message when confirm fails', async () => {
		vi.mocked(authClient.confirmSignup).mockResolvedValue({
			ok: false,
			error: { kind: 'http', status: 400, message: 'That code is incorrect or has expired.' }
		});

		const result = await actions.confirm(
			formDataEvent({ userEmail: 'owner@acme.test', confirmationCode: '000000' })
		);

		expect(result).toMatchObject({
			status: 400,
			data: {
				codeError: 'That code is incorrect or has expired.',
				confirmationCode: '000000'
			}
		});
	});

	it('returns resendSuccess without starting a cooldown on the server', async () => {
		vi.mocked(authClient.resendConfirmationCode).mockResolvedValue({
			ok: true,
			data: { statusCode: 200, message: 'Code sent', data: [] }
		});

		const result = await actions.resend(formDataEvent({ userEmail: 'owner@acme.test' }));

		expect(result).toMatchObject({
			resendSuccess: true,
			userEmail: 'owner@acme.test'
		});
	});

	it('returns resendError when resend fails', async () => {
		vi.mocked(authClient.resendConfirmationCode).mockResolvedValue({
			ok: false,
			error: { kind: 'http', status: 429, message: 'Too many attempts' }
		});

		const result = await actions.resend(formDataEvent({ userEmail: 'owner@acme.test' }));

		expect(result).toMatchObject({
			status: 429,
			data: { resendError: 'Too many attempts', resendFailed: true }
		});
	});
});
