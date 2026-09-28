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

function eventWithSession(fields: Record<string, string>, userEmail?: string) {
	const cookies = fakeCookies();
	if (userEmail) {
		storeSignupAccount(cookies as unknown as Parameters<typeof storeSignupAccount>[0], {
			userEmail
		});
	}
	return {
		fetch: vi.fn() as unknown as typeof fetch,
		request: {
			formData: async () => {
				const data = new FormData();
				for (const [key, value] of Object.entries(fields)) data.set(key, value);
				return data;
			}
		},
		cookies,
		locals: { logger: fakeLogger() },
		getClientAddress: () => '127.0.0.1'
	} as unknown as Parameters<typeof actions.confirm>[0];
}

describe('/confirm-email load', () => {
	it('reads the email from the signup cookie, never the URL', async () => {
		const cookies = fakeCookies();
		storeSignupAccount(cookies as unknown as Parameters<typeof storeSignupAccount>[0], {
			userEmail: 'cookie@acme.test'
		});

		const result = await load({
			cookies,
			fetch: vi.fn() as unknown as typeof fetch,
			locals: { logger: fakeLogger() },
			url: new URL('https://example.test/confirm-email?userEmail=spoofed%40acme.test')
		} as unknown as Parameters<typeof load>[0]);

		expect(result).toEqual({ userEmail: 'cookie@acme.test' });
	});

	it('redirects to /sign-up when there is no signup session', async () => {
		try {
			await load({
				cookies: fakeCookies(),
				fetch: vi.fn() as unknown as typeof fetch,
				locals: { logger: fakeLogger() },
				url: new URL('https://example.test/confirm-email')
			} as unknown as Parameters<typeof load>[0]);
			expect.unreachable('load should have redirected');
		} catch (error) {
			expect(isRedirect(error)).toBe(true);
			if (isRedirect(error)) expect(error.location).toBe('/sign-up');
		}
	});
});

describe('/confirm-email actions', () => {
	beforeEach(() => {
		vi.mocked(authClient.confirmSignup).mockReset();
		vi.mocked(authClient.resendConfirmationCode).mockReset();
	});

	it('rejects a short code before hitting the network', async () => {
		const result = await actions.confirm(
			eventWithSession({ confirmationCode: '12' }, 'owner@acme.test')
		);

		expect(authClient.confirmSignup).not.toHaveBeenCalled();
		expect(result).toMatchObject({
			status: 400,
			data: { codeError: 'Enter the 6-digit code.' }
		});
	});

	it('redirects to /sign-up when confirming without a signup session', async () => {
		try {
			await actions.confirm(eventWithSession({ confirmationCode: '123456' }));
			expect.unreachable('action should have redirected');
		} catch (error) {
			expect(isRedirect(error)).toBe(true);
			if (isRedirect(error)) expect(error.location).toBe('/sign-up');
		}
	});

	it('returns verified:true on a 200 confirm — no redirect, client drives navigation', async () => {
		vi.mocked(authClient.confirmSignup).mockResolvedValue({
			ok: true,
			data: { statusCode: 200, message: 'Email confirmed', data: [] }
		});

		const result = await actions.confirm(
			eventWithSession({ confirmationCode: '123456' }, 'owner@acme.test')
		);

		expect(result).toEqual({ verified: true });
	});

	it('ignores a client-submitted userEmail field and confirms against the session email', async () => {
		vi.mocked(authClient.confirmSignup).mockResolvedValue({
			ok: true,
			data: { statusCode: 200, message: 'Email confirmed', data: [] }
		});

		await actions.confirm(
			eventWithSession(
				{ confirmationCode: '123456', userEmail: 'attacker@evil.test' },
				'owner@acme.test'
			)
		);

		expect(authClient.confirmSignup).toHaveBeenCalledWith(
			expect.anything(),
			expect.anything(),
			expect.objectContaining({ userEmail: 'owner@acme.test' })
		);
	});

	it('returns the upstream message when confirm fails, keeping the code editable', async () => {
		vi.mocked(authClient.confirmSignup).mockResolvedValue({
			ok: false,
			error: { kind: 'http', status: 400, message: 'That code is incorrect or has expired.' }
		});

		const result = await actions.confirm(
			eventWithSession({ confirmationCode: '000000' }, 'owner@acme.test')
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

		const result = await actions.resend(eventWithSession({}, 'owner@acme.test'));

		expect(result).toMatchObject({ resendSuccess: true });
	});

	it('returns resendError when resend fails', async () => {
		vi.mocked(authClient.resendConfirmationCode).mockResolvedValue({
			ok: false,
			error: { kind: 'http', status: 429, message: 'Too many attempts' }
		});

		const result = await actions.resend(eventWithSession({}, 'owner@acme.test'));

		expect(result).toMatchObject({
			status: 429,
			data: { resendError: 'Too many attempts', resendFailed: true }
		});
	});
});
