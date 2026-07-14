import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isRedirect } from '@sveltejs/kit';

vi.mock('$lib/server/domains/auth/client', () => ({
	authClient: { confirmPassword: vi.fn() }
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

const validFields = {
	userEmail: 'merchant@example.test',
	confirmationCode: '123456',
	newPassword: 'TestPass@123',
	confirmPassword: 'TestPass@123'
};

describe('/reset-password action', () => {
	beforeEach(() => {
		vi.mocked(authClient.confirmPassword).mockReset();
	});

	it('rejects mismatched passwords before hitting the network', async () => {
		const event = formDataEvent({ ...validFields, confirmPassword: 'Different@123' });

		const result = await actions.default(event);

		expect(authClient.confirmPassword).not.toHaveBeenCalled();
		expect(result).toMatchObject({ status: 400 });
	});

	it('rejects a malformed email before hitting the network', async () => {
		const event = formDataEvent({ ...validFields, userEmail: 'not-an-email' });

		const result = await actions.default(event);

		expect(authClient.confirmPassword).not.toHaveBeenCalled();
		expect(result).toMatchObject({ status: 400 });
	});

	it('rejects a confirmation code that is not 6 digits', async () => {
		const event = formDataEvent({ ...validFields, confirmationCode: '123' });

		const result = await actions.default(event);

		expect(authClient.confirmPassword).not.toHaveBeenCalled();
		expect(result).toMatchObject({ status: 400 });
	});

	it('rejects a password shorter than 8 characters', async () => {
		const event = formDataEvent({
			...validFields,
			newPassword: 'Ab1@',
			confirmPassword: 'Ab1@'
		});

		const result = await actions.default(event);

		expect(authClient.confirmPassword).not.toHaveBeenCalled();
		expect(result).toMatchObject({ status: 400 });
	});

	it('redirects to /login on backend success', async () => {
		vi.mocked(authClient.confirmPassword).mockResolvedValue({
			ok: true,
			data: { message: 'password reset', statusCode: 200, data: [] }
		});

		const event = formDataEvent(validFields);

		try {
			await actions.default(event);
			expect.unreachable('action should have redirected on success');
		} catch (error) {
			expect(isRedirect(error)).toBe(true);
			if (isRedirect(error)) {
				expect(error.location).toBe('/login');
			}
		}

		expect(authClient.confirmPassword).toHaveBeenCalledWith(
			expect.any(Function),
			event.locals.logger,
			validFields.userEmail,
			validFields.confirmationCode,
			validFields.newPassword
		);
	});

	it('returns a fail response when the backend call fails', async () => {
		vi.mocked(authClient.confirmPassword).mockResolvedValue({
			ok: false,
			error: { kind: 'http', status: 400, code: 'invalid_code', message: 'Invalid code' }
		});

		const event = formDataEvent(validFields);

		const result = await actions.default(event);

		expect(result).toMatchObject({ status: 400 });
	});
});
