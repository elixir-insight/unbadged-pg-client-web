import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import {
	AddWebhookBodySchema,
	WebhookUrlCreateResponseSchema,
	WebhookUrlListResponseSchema
} from './schema';

describe('WebhookUrlListResponseSchema', () => {
	it('accepts the documented empty-state payload', () => {
		const result = v.safeParse(WebhookUrlListResponseSchema, {
			data: [],
			message: 'string',
			pagination: { limit: 10, page: 1, total: 0 },
			statusCode: 200
		});
		expect(result.success).toBe(true);
	});

	it('accepts a populated payload ΓÇö including multiple entries for the same eventType', () => {
		const result = v.safeParse(WebhookUrlListResponseSchema, {
			data: [
				{
					id: 'hook-1',
					eventType: 'payment.success',
					webhookUrl: 'https://example.com/hooks/a',
					isActive: true,
					createdAt: '2026-01-01T00:00:00.000Z',
					updatedAt: '2026-01-01T00:00:00.000Z'
				},
				{
					id: 'hook-2',
					eventType: 'payment.success',
					webhookUrl: 'https://example.com/hooks/b',
					isActive: false,
					createdAt: '2026-01-02T00:00:00.000Z',
					updatedAt: '2026-01-02T00:00:00.000Z'
				}
			],
			message: 'string',
			pagination: { limit: 10, page: 1, total: 2 },
			statusCode: 200
		});
		expect(result.success).toBe(true);
	});
});

describe('WebhookUrlCreateResponseSchema', () => {
	it('accepts the documented 200 payload', () => {
		const result = v.safeParse(WebhookUrlCreateResponseSchema, {
			data: [
				{
					id: 'hook-1',
					eventType: 'payment.success',
					webhookUrl: 'https://example.com/hooks/a',
					isActive: true,
					createdAt: '2026-01-01T00:00:00.000Z',
					updatedAt: '2026-01-01T00:00:00.000Z'
				}
			],
			message: 'string',
			pagination: { limit: 10, page: 1, total: 1 },
			statusCode: 200
		});
		expect(result.success).toBe(true);
	});
});

describe('AddWebhookBodySchema', () => {
	it('accepts a well-formed request body', () => {
		const result = v.safeParse(AddWebhookBodySchema, {
			eventType: 'payment.success',
			webhookUrl: 'https://example.com/hooks/a',
			secretKey: 'shh-secret'
		});
		expect(result.success).toBe(true);
	});

	it('rejects an empty eventType', () => {
		const result = v.safeParse(AddWebhookBodySchema, {
			eventType: '   ',
			webhookUrl: 'https://example.com/hooks/a',
			secretKey: 'shh-secret'
		});
		expect(result.success).toBe(false);
	});

	it('rejects a malformed webhookUrl', () => {
		const result = v.safeParse(AddWebhookBodySchema, {
			eventType: 'payment.success',
			webhookUrl: 'not-a-url',
			secretKey: 'shh-secret'
		});
		expect(result.success).toBe(false);
	});

	it('rejects a non-http(s) protocol', () => {
		const result = v.safeParse(AddWebhookBodySchema, {
			eventType: 'payment.success',
			webhookUrl: 'ftp://example.com/hooks/a',
			secretKey: 'shh-secret'
		});
		expect(result.success).toBe(false);
	});

	it('rejects an empty secretKey', () => {
		const result = v.safeParse(AddWebhookBodySchema, {
			eventType: 'payment.success',
			webhookUrl: 'https://example.com/hooks/a',
			secretKey: ''
		});
		expect(result.success).toBe(false);
	});
});
