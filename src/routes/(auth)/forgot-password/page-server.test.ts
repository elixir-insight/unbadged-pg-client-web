import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isRedirect } from '@sveltejs/kit';

vi.mock('$lib/server/domains/auth/client', () => ({
	authClient: { forgotPassword: vi.fn() }
}));

import { authClient } from '$lib/server/domains/auth/client';
import { actions } from './+page.server';

function formDataEvent(fields: Record<string, string>) {
	return {
		fetch: vi.fn(),
		request: {
			formData: async () => {
				const data = new FormData();
				for (const [key, value] of Object.entries(fields)) data.set(key, value);
				return data;
			}
		},
		locals: { logger: { child: vi.fn().mockReturnThis() } }
	} as unknown as Parameters<typeof actions.default>[0];
}

describe('/forgot-password action', () => {
	beforeEach(() => {
		vi.mocked(authClient.forgotPassword).mockReset();
	});

	it('rejects a missing email before hitting the network', async () => {
		const event = formDataEvent({ userEmail: '' });

		const result = await actions.default(event);

		expect(authClient.forgotPassword).not.toHaveBeenCalled();
		expect(result).toMatchObject({ status: 400 });
	});

	it('rejects a malformed email before hitting the network', async () => {
		const event = formDataEvent({ userEmail: 'not-an-email' });

		const result = await actions.default(event);

		expect(authClient.forgotPassword).not.toHaveBeenCalled();
		expect(result).toMatchObject({ status: 400 });
	});

	it('redirects to /reset-password with the email on backend success', async () => {
		vi.mocked(authClient.forgotPassword).mockResolvedValue({
			ok: true,
			data: { message: 'password reset', statusCode: 200, data: [] }
		});

		const event = formDataEvent({ userEmail: 'merchant@example.test' });

		try {
			await actions.default(event);
			expect.unreachable('action should have redirected on success');
		} catch (error) {
			expect(isRedirect(error)).toBe(true);
			if (isRedirect(error)) {
				expect(error.location).toBe(
					'/reset-password?userEmail=merchant%40example.test&message=password%20reset'
				);
			}
		}
	});

	it('returns a fail response when the backend call fails', async () => {
		vi.mocked(authClient.forgotPassword).mockResolvedValue({
			ok: false,
			error: { kind: 'http', status: 404, code: 'not_found', message: 'Not found' }
		});

		const event = formDataEvent({ userEmail: 'merchant@example.test' });

		const result = await actions.default(event);

		expect(result).toMatchObject({ status: 404 });
	});
});
