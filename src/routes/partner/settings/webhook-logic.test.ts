import { describe, expect, it } from 'vitest';
import {
	buildWebhookUpdatePayload,
	classifyWebhookErrorField,
	isValidWebhookUrl,
	parseAddWebhookResult,
	parseUpdateWebhookResult,
	type WebhookUrlRow
} from './webhook-logic';

const webhook: WebhookUrlRow = {
	id: '42',
	eventType: 'PAYIN',
	webhookUrl: 'https://example.com/webhook',
	isActive: true,
	createdAt: '2026-01-01T00:00:00.000Z'
};

describe('isValidWebhookUrl', () => {
	it('accepts well-formed http and https URLs', () => {
		expect(isValidWebhookUrl('https://example.com/webhook')).toBe(true);
		expect(isValidWebhookUrl('http://example.com/webhook')).toBe(true);
	});

	it('rejects malformed URLs', () => {
		expect(isValidWebhookUrl('not-a-url')).toBe(false);
		expect(isValidWebhookUrl('')).toBe(false);
		expect(isValidWebhookUrl('example.com/webhook')).toBe(false);
		expect(isValidWebhookUrl('srtech@gmail.com')).toBe(false);
		expect(isValidWebhookUrl('https:// srtech@gmail.com')).toBe(false);
		expect(isValidWebhookUrl('abc')).toBe(false);
	});

	it('rejects well-formed URLs using a non-http(s) protocol', () => {
		expect(isValidWebhookUrl('ftp://example.com/webhook')).toBe(false);
		expect(isValidWebhookUrl('javascript:alert(1)')).toBe(false);
	});
});

describe('buildWebhookUpdatePayload', () => {
	it('returns no fields when nothing changed', () => {
		expect(
			buildWebhookUpdatePayload(webhook, {
				eventType: webhook.eventType,
				webhookUrl: webhook.webhookUrl,
				isActive: webhook.isActive,
				secretKey: ''
			})
		).toEqual({});
	});

	it('includes only fields that changed', () => {
		expect(
			buildWebhookUpdatePayload(webhook, {
				eventType: webhook.eventType,
				webhookUrl: 'https://new-url.com',
				isActive: false,
				secretKey: ''
			})
		).toEqual({ webhookUrl: 'https://new-url.com', isActive: false });
	});

	it('omits a blank secret and includes a supplied secret', () => {
		expect(
			buildWebhookUpdatePayload(webhook, {
				eventType: webhook.eventType,
				webhookUrl: webhook.webhookUrl,
				isActive: webhook.isActive,
				secretKey: 'new-secret'
			})
		).toEqual({ secretKey: 'new-secret' });
	});
});

describe('classifyWebhookErrorField', () => {
	it('maps event-related messages to the eventType field', () => {
		expect(classifyWebhookErrorField('Invalid event type supplied.')).toBe('eventType');
	});

	it('maps url-related messages to the webhookUrl field', () => {
		expect(classifyWebhookErrorField('Malformed url in request.')).toBe('webhookUrl');
	});

	it('maps secret-related messages to the secretKey field', () => {
		expect(classifyWebhookErrorField('secret key missing')).toBe('secretKey');
	});

	it('falls back to a general error when nothing matches', () => {
		expect(classifyWebhookErrorField('Organization ID missing.')).toBe('general');
	});
});

describe('parseAddWebhookResult', () => {
	it('reports added on success', () => {
		expect(parseAddWebhookResult({ type: 'success', status: 200 })).toEqual({ kind: 'added' });
	});

	it('classifies a 400 failure and attributes it to the right field', () => {
		const outcome = parseAddWebhookResult({
			type: 'failure',
			status: 400,
			data: { message: 'Invalid event type supplied.' }
		});
		expect(outcome).toEqual({
			kind: 'error',
			message: 'Invalid event type supplied.',
			field: 'eventType'
		});
	});

	it('falls back to a generic general-form error when the failure has no message', () => {
		const outcome = parseAddWebhookResult({ type: 'failure', status: 500, data: {} });
		expect(outcome).toEqual({
			kind: 'error',
			message: 'Something went wrong. Please try again.',
			field: 'general'
		});
	});

	it('treats a SvelteKit error result as a generic retryable error', () => {
		const outcome = parseAddWebhookResult({ type: 'error', error: new Error('boom') });
		expect(outcome.kind).toBe('error');
	});
});

describe('parseUpdateWebhookResult', () => {
	it('reports updated on success', () => {
		expect(parseUpdateWebhookResult({ type: 'success', status: 200 })).toEqual({ kind: 'updated' });
	});

	it('maps a 400 message to a field while preserving the backend message', () => {
		expect(
			parseUpdateWebhookResult({
				type: 'failure',
				status: 400,
				data: { message: 'Malformed webhook URL.' }
			})
		).toEqual({
			kind: 'error',
			message: 'Malformed webhook URL.',
			field: 'webhookUrl',
			retryable: false
		});
	});

	it('keeps 403 and 409 errors at form level', () => {
		for (const status of [403, 409]) {
			expect(
				parseUpdateWebhookResult({
					type: 'failure',
					status,
					data: { message: 'Update restricted.' }
				})
			).toMatchObject({ kind: 'error', message: 'Update restricted.', field: 'general' });
		}
	});

	it('marks 500 failures as retryable', () => {
		expect(
			parseUpdateWebhookResult({
				type: 'failure',
				status: 500,
				data: { message: 'Something went wrong.', retryable: true }
			})
		).toMatchObject({ kind: 'error', retryable: true });
	});
});
