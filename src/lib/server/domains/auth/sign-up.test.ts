import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Cookies } from '@sveltejs/kit';
import type { Logger } from 'pino';
import {
	performConfirmSignUp,
	performResendSignUpConfirmation,
	performSignUp,
	readSignupAccount,
	storeSignupAccount
} from './sign-up';
import type { SignUpBody } from '$lib/validation/sign-up';

vi.mock('./client', () => ({
	authClient: { signUp: vi.fn(), confirmSignup: vi.fn(), resendConfirmationCode: vi.fn() }
}));

import { authClient } from './client';

function fakeCookies(): Cookies & { store: Record<string, string> } {
	const store: Record<string, string> = {};
	return {
		store,
		get: (name: string) => store[name],
		getAll: () => Object.entries(store).map(([name, value]) => ({ name, value })),
		set: (name: string, value: string) => {
			store[name] = value;
		},
		delete: (name: string) => {
			delete store[name];
		},
		serialize: () => ''
	} as unknown as Cookies & { store: Record<string, string> };
}

function fakeLogger(): Logger {
	const noop = () => {};
	const logger = { info: noop, warn: noop, error: noop, debug: noop } as unknown as Logger;
	// @ts-expect-error minimal pino-shaped fake
	logger.child = () => logger;
	return logger;
}

const validBody: SignUpBody = {
	legalCompanyName: 'Acme Payments Pvt Ltd',
	businessType: 'PRIVATE_LIMITED',
	userEmail: 'owner@acme.test',
	phoneNumber: '9876543210',
	password: 'SecurePass1!',
	affiliateId: ''
};

describe('performSignUp', () => {
	beforeEach(() => {
		vi.mocked(authClient.signUp).mockReset();
	});

	it('persists orgId and userEmail on a 201 response', async () => {
		vi.mocked(authClient.signUp).mockResolvedValue({
			ok: true,
			data: {
				statusCode: 201,
				message: 'Account created',
				data: [{ orgId: 'org_123', userEmail: 'owner@acme.test' }]
			}
		});
		const cookies = fakeCookies();

		const result = await performSignUp({
			fetch: vi.fn() as unknown as typeof fetch,
			cookies,
			logger: fakeLogger(),
			ip: '127.0.0.1',
			body: validBody
		});

		expect(result).toMatchObject({
			ok: true,
			orgId: 'org_123',
			userEmail: 'owner@acme.test'
		});
		expect(authClient.signUp).toHaveBeenCalledWith(
			expect.anything(),
			expect.anything(),
			expect.objectContaining({
				phoneNumber: '+919876543210',
				affiliateId: ''
			})
		);
		expect(JSON.parse(cookies.store.signupAccount)).toEqual({
			orgId: 'org_123',
			userEmail: 'owner@acme.test'
		});
	});

	it('surfaces the upstream message on http failure', async () => {
		vi.mocked(authClient.signUp).mockResolvedValue({
			ok: false,
			error: { kind: 'http', status: 409, message: 'Email already exists' }
		});

		const result = await performSignUp({
			fetch: vi.fn() as unknown as typeof fetch,
			cookies: fakeCookies(),
			logger: fakeLogger(),
			ip: '127.0.0.1',
			body: validBody
		});

		expect(result).toEqual({
			ok: false,
			status: 409,
			message: 'Email already exists'
		});
	});

	it('uses a generic fallback when the response has no message', async () => {
		vi.mocked(authClient.signUp).mockResolvedValue({
			ok: false,
			error: { kind: 'http', status: 500, message: '' }
		});

		const result = await performSignUp({
			fetch: vi.fn() as unknown as typeof fetch,
			cookies: fakeCookies(),
			logger: fakeLogger(),
			ip: '127.0.0.1',
			body: validBody
		});

		expect(result).toEqual({
			ok: false,
			status: 502,
			message: 'Something went wrong. Try again.'
		});
	});

	it('uses a generic fallback on network errors', async () => {
		vi.mocked(authClient.signUp).mockResolvedValue({
			ok: false,
			error: { kind: 'network', message: 'Failed to fetch' }
		});

		const result = await performSignUp({
			fetch: vi.fn() as unknown as typeof fetch,
			cookies: fakeCookies(),
			logger: fakeLogger(),
			ip: '127.0.0.1',
			body: validBody
		});

		expect(result).toEqual({
			ok: false,
			status: 502,
			message: 'Something went wrong. Try again.'
		});
	});

	it('rejects a 200 envelope that is not statusCode 201', async () => {
		vi.mocked(authClient.signUp).mockResolvedValue({
			ok: true,
			data: {
				statusCode: 200,
				message: 'Not created',
				data: [{ orgId: 'org_123', userEmail: 'owner@acme.test' }]
			}
		});

		const result = await performSignUp({
			fetch: vi.fn() as unknown as typeof fetch,
			cookies: fakeCookies(),
			logger: fakeLogger(),
			ip: '127.0.0.1',
			body: validBody
		});

		expect(result).toEqual({
			ok: false,
			status: 502,
			message: 'Not created'
		});
	});
});

describe('storeSignupAccount', () => {
	it('writes orgId and userEmail to an httpOnly cookie', () => {
		const cookies = fakeCookies();
		storeSignupAccount(cookies, { orgId: 'org_1', userEmail: 'a@b.test' });
		expect(JSON.parse(cookies.store.signupAccount)).toEqual({
			orgId: 'org_1',
			userEmail: 'a@b.test'
		});
	});

	it('reads a previously stored signup account', () => {
		const cookies = fakeCookies();
		storeSignupAccount(cookies, { orgId: 'org_1', userEmail: 'a@b.test' });
		expect(readSignupAccount(cookies)).toEqual({ orgId: 'org_1', userEmail: 'a@b.test' });
	});
});

describe('performConfirmSignUp', () => {
	beforeEach(() => {
		vi.mocked(authClient.confirmSignup).mockReset();
	});

	it('succeeds on statusCode 200', async () => {
		vi.mocked(authClient.confirmSignup).mockResolvedValue({
			ok: true,
			data: { statusCode: 200, message: 'Email confirmed', data: [] }
		});

		const cookies = fakeCookies();
		storeSignupAccount(cookies, { orgId: 'org_1', userEmail: 'owner@acme.test' });

		const result = await performConfirmSignUp({
			fetch: vi.fn() as unknown as typeof fetch,
			cookies,
			logger: fakeLogger(),
			ip: '127.0.0.1',
			userEmail: 'owner@acme.test',
			confirmationCode: '123456'
		});

		expect(result).toEqual({ ok: true, message: 'Email confirmed' });
		expect(readSignupAccount(cookies)).toBeNull();
	});

	it('surfaces the upstream message on http failure', async () => {
		vi.mocked(authClient.confirmSignup).mockResolvedValue({
			ok: false,
			error: { kind: 'http', status: 400, message: 'That code is incorrect or has expired.' }
		});

		const result = await performConfirmSignUp({
			fetch: vi.fn() as unknown as typeof fetch,
			cookies: fakeCookies(),
			logger: fakeLogger(),
			ip: '127.0.0.1',
			userEmail: 'owner@acme.test',
			confirmationCode: '000000'
		});

		expect(result).toEqual({
			ok: false,
			status: 400,
			message: 'That code is incorrect or has expired.'
		});
	});
});

describe('performResendSignUpConfirmation', () => {
	beforeEach(() => {
		vi.mocked(authClient.resendConfirmationCode).mockReset();
	});

	it('succeeds on statusCode 200', async () => {
		vi.mocked(authClient.resendConfirmationCode).mockResolvedValue({
			ok: true,
			data: { statusCode: 200, message: 'Code sent', data: [] }
		});

		const result = await performResendSignUpConfirmation({
			fetch: vi.fn() as unknown as typeof fetch,
			logger: fakeLogger(),
			ip: '127.0.0.1',
			userEmail: 'owner@acme.test'
		});

		expect(result).toEqual({ ok: true, message: 'Code sent' });
	});
});
