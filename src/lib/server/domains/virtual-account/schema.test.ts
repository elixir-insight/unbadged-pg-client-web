import { describe, expect, it } from 'vitest';
import * as v from 'valibot';
import {
	CreateVirtualAccountRequestSchema,
	CreateVirtualAccountResponseSchema,
	DEFAULT_ACTIVATE_VIRTUAL_ACCOUNT_REQUEST,
	MerchantVirtualAccountSchema
} from './schema';

describe('DEFAULT_ACTIVATE_VIRTUAL_ACCOUNT_REQUEST', () => {
	it('matches CreateVirtualAccountRequestSchema', () => {
		const parsed = v.safeParse(
			CreateVirtualAccountRequestSchema,
			DEFAULT_ACTIVATE_VIRTUAL_ACCOUNT_REQUEST
		);
		expect(parsed.success).toBe(true);
	});

	it('uses the merchant activation defaults', () => {
		expect(DEFAULT_ACTIVATE_VIRTUAL_ACCOUNT_REQUEST).toMatchObject({
			pipelineCode: 'TEST',
			pipelineRole: 'PAYIN',
			pipelineClass: 'DIRECT',
			isNonWhitelistedAllowed: true,
			tps: 30,
			allowedTxnTypes: [
				expect.objectContaining({
					transactionType: 'NET_BANKING',
					typeCode: 202
				})
			]
		});
	});
});

describe('MerchantVirtualAccountSchema', () => {
	it('normalizes vaNumber to virtualAccountNumber', () => {
		const parsed = v.safeParse(MerchantVirtualAccountSchema, {
			vaNumber: 'TEST202610019122',
			pipelineRole: 'PAYIN',
			pipelineClass: 'DIRECT',
			pipelineCode: 'TEST'
		});

		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.output.virtualAccountNumber).toBe('TEST202610019122');
		}
	});
});

describe('CreateVirtualAccountResponseSchema', () => {
	it('parses the create VAN API response', () => {
		const parsed = v.safeParse(CreateVirtualAccountResponseSchema, {
			data: [
				{
					vaNumber: 'TEST202610019122',
					pipelineRole: 'PAYIN',
					pipelineClass: 'DIRECT',
					pipelineCode: 'TEST',
					txnAmountMax: '200000',
					txnAmountMin: '0',
					dailyTxnLimit: '2000000',
					dailyDepositLimit: '2000000',
					allowedTxnTypes: [
						{
							transactionType: 'NET_BANKING',
							txnAmountMax: '200000',
							txnAmountMin: '0',
							dailyTxnLimit: '2000000',
							dailyTxnAmount: '2000000',
							id: 0,
							typeCode: 202
						}
					],
					tps: 30,
					isNonWhitelistedAllowed: true
				}
			],
			message: 'Virtual account created successfully',
			statusCode: 201
		});

		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.output.data[0]?.virtualAccountNumber).toBe('TEST202610019122');
			expect(parsed.output.message).toBe('Virtual account created successfully');
			expect(parsed.output.statusCode).toBe(201);
		}
	});
});
