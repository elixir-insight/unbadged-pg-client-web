import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isRedirect } from '@sveltejs/kit';

vi.mock('$lib/server/domains/auth/client', () => ({
	authClient: { signUp: vi.fn() }
}));

import { authClient } from '$lib/server/domains/auth/client';
import { actions, load } from './+page.server';

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
	} as unknown as Parameters<typeof actions.signup>[0];
}

const validFields = {
	legalCompanyName: 'Acme Payments Pvt Ltd',
	businessType: 'PRIVATE_LIMITED',
	userEmail: 'owner@acme.test',
	phoneNumber: '9876543210',
	password: 'SecurePass1!',
	affiliateId: ''
};

describe('/sign-up load', () => {
	it('allows an unauthenticated visitor to open signup', async () => {
		const result = await load({
			cookies: fakeCookies(),
			fetch: vi.fn() as unknown as typeof fetch,
			locals: { logger: fakeLogger() }
		} as unknown as Parameters<typeof load>[0]);

		expect(result).toEqual({});
	});
});

describe('/sign-up action', () => {
	beforeEach(() => {
		vi.mocked(authClient.signUp).mockReset();
	});

	it('rejects a missing company name before hitting the network', async () => {
		const result = await actions.signup(formDataEvent({ ...validFields, legalCompanyName: '' }));

		expect(authClient.signUp).not.toHaveBeenCalled();
		expect(result).toMatchObject({
			status: 400,
			data: {
				errors: { legalCompanyName: "Enter your company's legal name." }
			}
		});
	});

	it('redirects to /confirm-email on a 201 signup', async () => {
		vi.mocked(authClient.signUp).mockResolvedValue({
			ok: true,
			data: {
				statusCode: 201,
				message: 'Account created',
				data: [{ orgId: 'org_123', userEmail: 'owner@acme.test' }]
			}
		});

		try {
			await actions.signup(formDataEvent(validFields));
			expect.unreachable('action should have redirected on success');
		} catch (error) {
			expect(isRedirect(error)).toBe(true);
			if (isRedirect(error)) {
				expect(error.location).toBe('/confirm-email');
			}
		}
	});

	it('returns the upstream message when signup fails', async () => {
		vi.mocked(authClient.signUp).mockResolvedValue({
			ok: false,
			error: { kind: 'http', status: 409, message: 'Email already exists' }
		});

		const result = await actions.signup(formDataEvent(validFields));

		expect(result).toMatchObject({
			status: 409,
			data: { message: 'Email already exists', userEmail: 'owner@acme.test' }
		});
	});
});
