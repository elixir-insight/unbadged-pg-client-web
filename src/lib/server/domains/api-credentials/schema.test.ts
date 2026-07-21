import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import {
	ApiCredentialCreateResponseSchema,
	ApiCredentialListResponseSchema,
	ApiCredentialRevokeResponseSchema
} from './schema';

describe('ApiCredentialListResponseSchema', () => {
	it('accepts the documented empty-state payload', () => {
		const result = v.safeParse(ApiCredentialListResponseSchema, {
			data: [],
			message: 'string',
			statusCode: 200
		});
		expect(result.success).toBe(true);
	});

	it('accepts the documented populated payload, including pagination', () => {
		const result = v.safeParse(ApiCredentialListResponseSchema, {
			data: [{ clientId: 'client-1', clientSecret: 'secret-1', id: 'cred-1' }],
			message: 'string',
			pagination: { total: 1, page: 1, limit: 10 },
			statusCode: 200
		});
		expect(result.success).toBe(true);
	});

	it('accepts the real backend shape — numeric id, no clientSecret on GET', () => {
		const result = v.safeParse(ApiCredentialListResponseSchema, {
			message: 'API credentials retrieved successfully',
			data: [{ clientId: 'ELXhVfw0FIyo4_zs0Fis8-LEA', id: 1 }],
			statusCode: 200
		});
		expect(result.success).toBe(true);
	});
});

describe('ApiCredentialCreateResponseSchema', () => {
	it('accepts the documented 201 payload', () => {
		const result = v.safeParse(ApiCredentialCreateResponseSchema, {
			data: [{ clientId: 'client-1', clientSecret: 'secret-1' }],
			message: 'API credential created successfully',
			statusCode: 201
		});
		expect(result.success).toBe(true);
	});
});

describe('ApiCredentialRevokeResponseSchema', () => {
	it('accepts the documented 200 payload', () => {
		const result = v.safeParse(ApiCredentialRevokeResponseSchema, {
			message: 'API credential revoked successfully',
			statusCode: 200
		});
		expect(result.success).toBe(true);
	});
});
