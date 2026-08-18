import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import {
	PaymentOrderCountsResponseSchema,
	PaymentOrderListItemSchema,
	PaymentOrderListResponseSchema,
	PaymentOrderTimelineItemSchema
} from '../../schema';
import {
	getPaymentOrderStatusCount,
	mapPaymentOrderApiStatus,
	mapPaymentOrderCardCounts,
	mapPaymentOrderDetail,
	mapPaymentOrderListItem,
	mapPaymentOrderTimeline,
	mapPaymentOrderUiStatus
} from './list';

describe('payment order list mapper', () => {
	it('accepts live count responses without pagination', () => {
		const result = v.safeParse(PaymentOrderCountsResponseSchema, {
			data: [
				{
					authorizedCount: 0,
					cancelledCount: 0,
					capturedCount: 0,
					createdCount: 0,
					expiredCount: 0,
					failedCount: 0,
					initiatedCount: 0,
					rejectedCount: 0,
					suspectedCount: 0,
					totalCount: 0
				}
			],
			message: 'Successfully fetched payment orders counts',
			statusCode: 200
		});

		expect(result.success).toBe(true);
	});

	it('maps API statuses into the existing order status groups', () => {
		expect(mapPaymentOrderApiStatus('CAPTURED')).toBe('success');
		expect(mapPaymentOrderApiStatus('AUTHORIZED')).toBe('pending');
		expect(mapPaymentOrderApiStatus('CANCELLED')).toBe('failed');
		expect(mapPaymentOrderApiStatus('EXPIRED')).toBe('expired');
	});

	it('maps UI status filters to comma-separated API statuses', () => {
		expect(mapPaymentOrderUiStatus('success')).toBe('CAPTURED');
		expect(mapPaymentOrderUiStatus('pending')).toBe('INITIATED,AUTHORIZED,SUSPECTED,ATTEMPTED');
		expect(mapPaymentOrderUiStatus(undefined)).toBeUndefined();
	});

	it('accepts live payin order list responses with object redirectUrl', () => {
		const result = v.safeParse(PaymentOrderListResponseSchema, {
			statusCode: 200,
			message: 'Successfully fetched payin orders',
			data: [
				{
					id: '1105',
					orderId: 'ORD_FudSPOO4qu',
					status: 'CREATED',
					transactionAmount: '5',
					redirectUrl: {
						successUrl: 'https://chatgpt.com',
						cancelUrl: 'https://www.youtube.com',
						failureUrl: 'https://www.google.com'
					},
					allowedPaymentMethods: ['UPI']
				},
				{
					id: '1104',
					orderId: 'ORD_FudMr8vgPo',
					status: 'ATTEMPTED',
					transactionAmount: '65',
					redirectUrl: {
						successUrl: 'https://frontoff-stg.elixrretailpos.com/dashboard',
						cancelUrl: 'https://frontoff-stg.elixrretailpos.com/dashboard',
						failureUrl: 'https://frontoff-stg.elixrretailpos.com/dashboard'
					},
					allowedPaymentMethods: []
				},
				{
					id: '1099',
					orderId: 'ORD_FtXazgU5ku',
					status: 'ATTEMPTED',
					transactionAmount: '10000',
					redirectUrl: {
						successUrl: 'https://www.google.com/',
						cancelUrl: 'https://chatgpt.com/',
						failureUrl: 'https://www.youtube.com/'
					},
					allowedPaymentMethods: null
				}
			],
			pagination: { total: 1067, page: 0, limit: 10 }
		});

		expect(result.success).toBe(true);
	});

	it('maps API fields into a table row', () => {
		const row = mapPaymentOrderListItem({
			bankPipelineCode: '',
			checkoutExpiry: '',
			clientOrderId: '',
			closedAt: '',
			createdAt: '2026-07-21T10:00:00.000Z',
			createdAtIst: '',
			customerEmail: 'customer@example.com',
			customerName: 'Customer',
			customerPhoneNumber: '',
			description: '',
			gatewayDescription: '',
			id: '1',
			orderId: 'ORD-1',
			orgId: 'ORG-1',
			payinAttemptId: 'PAY-1',
			paymentLink: '',
			pipelineClass: '',
			redirectUrl: '',
			allowedPaymentMethods: [],
			requestIpAddress: '',
			status: 'CAPTURED',
			transactionAmount: '4500',
			updatedAt: '',
			vaIdentifier: '',
			virtualAccountNumber: ''
		});

		expect(row.orderId).toBe('ORD-1');
		expect(row.customer).toBe('Customer');
		expect(row.amount).toContain('4,500');
		expect(row.attemptId).toBe('PAY-1');
		expect(row.status).toBe('success');
	});

	it('maps an API order into the detail view', () => {
		const order = mapPaymentOrderDetail(
			v.parse(PaymentOrderListItemSchema, {
				orderId: 'ORD-1',
				clientOrderId: 'CLIENT-1',
				customerName: 'Customer',
				createdAt: '2026-07-21T10:00:00.000Z',
				status: 'CAPTURED',
				transactionAmount: '4500'
			})
		);

		expect(order.orderId).toBe('ORD-1');
		expect(order.clientOrderId).toBe('CLIENT-1');
		expect(order.orderAmount).toContain('4,500');
		expect(order.orderStatus).toBe('success');
	});

	it('maps and orders API timeline events', () => {
		const timeline = mapPaymentOrderTimeline([
			v.parse(PaymentOrderTimelineItemSchema, {
				amount: '4500',
				createdAt: '2026-07-21T10:05:00.000Z',
				eventTitle: 'Payment captured',
				orderId: 'ORD-1',
				status: 'CAPTURED'
			}),
			v.parse(PaymentOrderTimelineItemSchema, {
				amount: '4500',
				createdAt: '2026-07-21T10:00:00.000Z',
				eventTitle: 'Order created',
				orderId: 'ORD-1',
				status: 'CREATED'
			})
		]);

		expect(timeline.map((entry) => entry.entryTitle)).toEqual([
			'Order created',
			'Payment captured'
		]);
		expect(timeline[1]?.entryType).toBe('payment_completed');
	});

	it('aggregates API counts into the visible cards', () => {
		expect(
			mapPaymentOrderCardCounts({
				authorizedCount: 2,
				cancelledCount: 3,
				capturedCount: 4,
				createdCount: 5,
				expiredCount: 6,
				failedCount: 7,
				initiatedCount: 8,
				rejectedCount: 9,
				suspectedCount: 10,
				totalCount: 54
			})
		).toEqual({
			Orders: 54,
			Successful: 4,
			Pending: 20,
			Created: 5,
			Failed: 19
		});
	});

	it('returns the filtered total for server pagination', () => {
		const counts = {
			authorizedCount: 2,
			cancelledCount: 3,
			capturedCount: 4,
			createdCount: 5,
			expiredCount: 6,
			failedCount: 7,
			initiatedCount: 8,
			rejectedCount: 9,
			suspectedCount: 10,
			totalCount: 54
		};

		expect(getPaymentOrderStatusCount(counts, 'pending')).toBe(20);
		expect(getPaymentOrderStatusCount(counts, 'failed')).toBe(19);
		expect(getPaymentOrderStatusCount(counts, 'expired')).toBe(6);
		expect(getPaymentOrderStatusCount(counts, undefined)).toBe(54);
	});
});
