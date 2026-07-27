import { describe, expect, it, vi } from 'vitest';
import type { Cookies } from '@sveltejs/kit';
import type { Logger } from 'pino';
import { load, actions } from './+page.server';

// `load` is annotated `: PageServerLoad` in +page.server.ts, which widens its
// publicly-visible return type — cast back to the shape it actually returns.
type SettingsLoadResult = {
	apiCredential: { id: string; clientId: string } | null;
	apiCredentialError: string | null;
	profile: {
		orgId: string;
		displayName: string;
		companyName: string;
		orgName: string;
		email: string;
		phone: string;
		businessType: string;
		country: string;
		registeredDate: string;
		website: string;
		username: string;
	} | null;
	profileError: string | null;
};

async function callLoad(event: Parameters<typeof load>[0]): Promise<SettingsLoadResult> {
	return (await load(event)) as SettingsLoadResult;
}

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

const profilePayload = {
	data: [
		{
			orgId: 'ORG_2bV',
			companyName: 'Elixir global',
			orgName: 'Elixir global',
			email: 'raghul.r@elixirpay.in',
			phone: '+916382303714',
			businessType: 'PRIVATE_LIMITED',
			country: 'India',
			registeredDate: '2026-07-21',
			website: 'https://www.elixirglobal.in',
			username: 'Elixir global'
		}
	],
	message: 'Organization profile fetched successfully',
	statusCode: 200
};

function mockSettingsFetch(handlers: {
	credentials?: Response | unknown;
	profile?: Response | unknown;
}) {
	return vi.fn().mockImplementation((input: RequestInfo | URL) => {
		const url = String(input);

		if (url.includes('/api/v1/merchant/organizations/api-credentials')) {
			const response = handlers.credentials ?? { data: [], message: 'ok', statusCode: 200 };
			return Promise.resolve(response instanceof Response ? response : jsonResponse(200, response));
		}

		if (url.includes('/api/v1/merchant/profile')) {
			const response = handlers.profile ?? profilePayload;
			return Promise.resolve(response instanceof Response ? response : jsonResponse(200, response));
		}

		return Promise.resolve(jsonResponse(404, { message: 'not found', statusCode: 404 }));
	});
}

describe('merchant settings +page.server load', () => {
	it('returns apiCredential: null when the org has no credential yet', async () => {
		const fetchFn = mockSettingsFetch({});

		const result = await callLoad({
			cookies: fakeCookies(),
			fetch: fetchFn,
			locals: { logger: fakeLogger() }
		} as never);

		expect(result.apiCredential).toBeNull();
		expect(result.apiCredentialError).toBeNull();
		expect(result.profile).toMatchObject({
			orgId: 'ORG_2bV',
			companyName: 'Elixir global',
			email: 'raghul.r@elixirpay.in'
		});
		expect(result.profileError).toBeNull();
	});

	it('returns only id/clientId when a credential exists — never clientSecret', async () => {
		const fetchFn = mockSettingsFetch({
			credentials: {
				data: [{ id: 'cred-1', clientId: 'client-1', clientSecret: 'super-secret' }],
				message: 'ok',
				statusCode: 200
			}
		});

		const result = await callLoad({
			cookies: fakeCookies(),
			fetch: fetchFn,
			locals: { logger: fakeLogger() }
		} as never);

		expect(result.apiCredential).toEqual({ id: 'cred-1', clientId: 'client-1' });
		expect(result.apiCredential).not.toHaveProperty('clientSecret');
		expect(JSON.stringify(result)).not.toContain('super-secret');
	});

	it('accepts the real backend shape — numeric id, no clientSecret on GET at all', async () => {
		const fetchFn = mockSettingsFetch({
			credentials: {
				message: 'API credentials retrieved successfully',
				data: [{ clientId: 'ELXhVfw0FIyo4_zs0Fis8-LEA', id: 1 }],
				statusCode: 200
			}
		});

		const result = await callLoad({
			cookies: fakeCookies(),
			fetch: fetchFn,
			locals: { logger: fakeLogger() }
		} as never);

		expect(result.apiCredential).toEqual({ id: '1', clientId: 'ELXhVfw0FIyo4_zs0Fis8-LEA' });
		expect(result.apiCredentialError).toBeNull();
	});

	it('returns a retryable error message when credentials fail with 500', async () => {
		const fetchFn = mockSettingsFetch({
			credentials: jsonResponse(500, { message: 'boom', statusCode: 500, exceptionCode: 'X' })
		});

		const result = await callLoad({
			cookies: fakeCookies(),
			fetch: fetchFn,
			locals: { logger: fakeLogger() }
		} as never);

		expect(result.apiCredential).toBeNull();
		expect(result.apiCredentialError).toBeTruthy();
		expect(result.profile).not.toBeNull();
	});

	it('returns a profile error when profile fetch fails with 500', async () => {
		const fetchFn = mockSettingsFetch({
			profile: jsonResponse(500, { message: 'boom', statusCode: 500, exceptionCode: 'X' })
		});

		const result = await callLoad({
			cookies: fakeCookies(),
			fetch: fetchFn,
			locals: { logger: fakeLogger() }
		} as never);

		expect(result.profile).toBeNull();
		expect(result.profileError).toBeTruthy();
	});

	it('returns profileError when profile data is empty', async () => {
		const fetchFn = mockSettingsFetch({
			profile: { data: [], message: 'ok', statusCode: 200 }
		});

		const result = await callLoad({
			cookies: fakeCookies(),
			fetch: fetchFn,
			locals: { logger: fakeLogger() }
		} as never);

		expect(result.profile).toBeNull();
		expect(result.profileError).toBe('Organization profile not found.');
	});

	it('redirects to login on a 401 from credentials', async () => {
		const fetchFn = mockSettingsFetch({
			credentials: jsonResponse(401, {
				message: 'Unauthorized',
				statusCode: 401,
				exceptionCode: 'X'
			})
		});

		await expect(
			load({
				cookies: fakeCookies(),
				fetch: fetchFn,
				locals: { logger: fakeLogger() }
			} as never)
		).rejects.toMatchObject({ status: 303, location: '/login?reason=session-expired' });
	});

	it('redirects to login on a 401 from profile', async () => {
		const fetchFn = mockSettingsFetch({
			profile: jsonResponse(401, { message: 'Unauthorized', statusCode: 401, exceptionCode: 'X' })
		});

		await expect(
			load({
				cookies: fakeCookies(),
				fetch: fetchFn,
				locals: { logger: fakeLogger() }
			} as never)
		).rejects.toMatchObject({ status: 303, location: '/login?reason=session-expired' });
	});
});

describe('merchant settings +page.server actions.generate (POST api-credentials)', () => {
	it('returns clientId/clientSecret on 201', async () => {
		const fetchFn = vi.fn().mockResolvedValue(
			jsonResponse(201, {
				data: [{ clientId: 'client-1', clientSecret: 'secret-1' }],
				message: 'API credential created successfully',
				statusCode: 201
			})
		);

		const result = await actions.generate({
			cookies: fakeCookies(),
			fetch: fetchFn,
			locals: { logger: fakeLogger() }
		} as never);

		expect(result).toEqual({ clientId: 'client-1', clientSecret: 'secret-1' });
	});

	it('self-corrects on 422 (credential already exists)', async () => {
		const fetchFn = vi
			.fn()
			.mockResolvedValue(
				jsonResponse(422, { message: 'limit reached', statusCode: 422, exceptionCode: 'X' })
			);

		const result = await actions.generate({
			cookies: fakeCookies(),
			fetch: fetchFn,
			locals: { logger: fakeLogger() }
		} as never);

		expect(result).toMatchObject({ status: 422, data: { selfCorrect: true } });
	});

	it('returns an inline 400 error without retry semantics', async () => {
		const fetchFn = vi.fn().mockResolvedValue(
			jsonResponse(400, {
				message: 'Organization/User ID missing',
				statusCode: 400,
				exceptionCode: 'X'
			})
		);

		const result = await actions.generate({
			cookies: fakeCookies(),
			fetch: fetchFn,
			locals: { logger: fakeLogger() }
		} as never);

		expect(result).toMatchObject({
			status: 400,
			data: { message: 'Organization/User ID missing' }
		});
		expect((result as { data?: Record<string, unknown> }).data).not.toHaveProperty('selfCorrect');
	});

	it('returns a retryable 500 error', async () => {
		const fetchFn = vi
			.fn()
			.mockResolvedValue(
				jsonResponse(500, { message: 'boom', statusCode: 500, exceptionCode: 'X' })
			);

		const result = await actions.generate({
			cookies: fakeCookies(),
			fetch: fetchFn,
			locals: { logger: fakeLogger() }
		} as never);

		expect(result).toMatchObject({ status: 500, data: { retryable: true } });
	});
});

describe('merchant settings +page.server actions.revoke (DELETE api-credentials/:id)', () => {
	function formRequest(id: string) {
		const formData = new FormData();
		formData.set('id', id);
		return { formData: () => Promise.resolve(formData) } as unknown as Request;
	}

	it('clears state on 200', async () => {
		const fetchFn = vi
			.fn()
			.mockResolvedValue(
				jsonResponse(200, { message: 'API credential revoked successfully', statusCode: 200 })
			);

		const result = await actions.revoke({
			request: formRequest('cred-1'),
			cookies: fakeCookies(),
			fetch: fetchFn,
			locals: { logger: fakeLogger() }
		} as never);

		expect(result).toEqual({ revoked: true });
	});

	it('redirects to login on 401', async () => {
		const fetchFn = vi
			.fn()
			.mockResolvedValue(
				jsonResponse(401, { message: 'Unauthorized', statusCode: 401, exceptionCode: 'X' })
			);

		await expect(
			actions.revoke({
				request: formRequest('cred-1'),
				cookies: fakeCookies(),
				fetch: fetchFn,
				locals: { logger: fakeLogger() }
			} as never)
		).rejects.toMatchObject({ status: 303, location: '/login?reason=session-expired' });
	});

	it('keeps existing state on a 400/500 — returns a fail() instead of clearing', async () => {
		const fetchFn = vi
			.fn()
			.mockResolvedValue(
				jsonResponse(500, { message: 'boom', statusCode: 500, exceptionCode: 'X' })
			);

		const result = await actions.revoke({
			request: formRequest('cred-1'),
			cookies: fakeCookies(),
			fetch: fetchFn,
			locals: { logger: fakeLogger() }
		} as never);

		expect(result).toMatchObject({ status: 500, data: { message: 'boom' } });
	});
});
