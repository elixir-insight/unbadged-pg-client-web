import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import {
	GetNotificationModulesResponseSchema,
	GetNotificationSubscriptionsResponseSchema,
	ListNotificationsResponseSchema,
	UpdateNotificationStateRequestSchema,
	UpdateNotificationSubscriptionsRequestSchema,
	UpdateNotificationSubscriptionsResponseSchema
} from './schema';

describe('GetNotificationModulesResponseSchema', () => {
	it('accepts the documented payload', () => {
		const result = v.safeParse(GetNotificationModulesResponseSchema, {
			data: [
				{
					moduleCode: 'SECURITY',
					name: 'Security',
					description: 'Password, MFA, login, account unlock, and system maintenance updates.',
					subscribable: true,
					emailEnabled: true
				}
			],
			message: 'Notification Modules Fetched Successfully',
			statusCode: 200
		});
		expect(result.success).toBe(true);
	});
});

describe('ListNotificationsResponseSchema', () => {
	it('accepts the documented payload, including nullable actionUrl and metadata', () => {
		const result = v.safeParse(ListNotificationsResponseSchema, {
			data: [
				{
					actionUrl: 'https://example.com',
					body: 'string',
					createdAt: 'string',
					eventCode: 'ORGANIZATION_CREATED',
					metadata: {},
					notificationId: 1,
					read: true,
					title: 'string'
				}
			],
			message: 'string',
			pagination: { limit: 10, page: 1, total: 1 },
			statusCode: 200
		});
		expect(result.success).toBe(true);
	});

	it('accepts a notification without actionUrl or metadata', () => {
		const result = v.safeParse(ListNotificationsResponseSchema, {
			data: [
				{
					body: 'string',
					createdAt: 'string',
					eventCode: 'ORGANIZATION_CREATED',
					notificationId: 1,
					read: false,
					title: 'string'
				}
			],
			message: 'string',
			pagination: { limit: 10, page: 1, total: 1 },
			statusCode: 200
		});
		expect(result.success).toBe(true);
	});
});

describe('UpdateNotificationStateRequestSchema', () => {
	it('accepts READ and DONE actions', () => {
		expect(v.safeParse(UpdateNotificationStateRequestSchema, { action: 'READ' }).success).toBe(
			true
		);
		expect(v.safeParse(UpdateNotificationStateRequestSchema, { action: 'DONE' }).success).toBe(
			true
		);
	});

	it('rejects an unknown action', () => {
		expect(v.safeParse(UpdateNotificationStateRequestSchema, { action: 'ARCHIVED' }).success).toBe(
			false
		);
	});
});

describe('GetNotificationSubscriptionsResponseSchema', () => {
	it('accepts the documented payload', () => {
		const result = v.safeParse(GetNotificationSubscriptionsResponseSchema, {
			data: [
				{ moduleCode: 'SECURITY', channel: 'EMAIL' },
				{ moduleCode: 'SECURITY', channel: 'IN_APP' }
			],
			message: 'Notification Subscriptions Fetched Successfully',
			statusCode: 200
		});
		expect(result.success).toBe(true);
	});
});

describe('UpdateNotificationSubscriptionsRequestSchema', () => {
	it('accepts the documented request payload', () => {
		const result = v.safeParse(UpdateNotificationSubscriptionsRequestSchema, {
			subscriptions: [{ channel: 'IN_APP', moduleCode: 'ORGANIZATION', subscribed: true }]
		});
		expect(result.success).toBe(true);
	});

	it('rejects an unknown channel', () => {
		const result = v.safeParse(UpdateNotificationSubscriptionsRequestSchema, {
			subscriptions: [{ channel: 'SMS', moduleCode: 'ORGANIZATION', subscribed: true }]
		});
		expect(result.success).toBe(false);
	});
});

describe('UpdateNotificationSubscriptionsResponseSchema', () => {
	it('accepts the documented ack payload', () => {
		const result = v.safeParse(UpdateNotificationSubscriptionsResponseSchema, {
			data: [],
			message: 'Notification Subscriptions Updated Successfully',
			statusCode: 200
		});
		expect(result.success).toBe(true);
	});
});
