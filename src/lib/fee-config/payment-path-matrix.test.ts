import { describe, expect, it } from 'vitest';
import type { PaymentRails } from './types';
import {
	getInstrumentsForMethod,
	getRailsForMethodInstrument,
	isValidPaymentPathCombo,
	formatLivePreviewPath,
	PAYMENT_PATH_MATRIX
} from './payment-path-matrix';

describe('payment-path-matrix', () => {
	it('lists all valid combinations from spec', () => {
		expect(PAYMENT_PATH_MATRIX).toHaveLength(16);
	});

	it('returns instruments for payins', () => {
		const instruments = getInstrumentsForMethod('payins');
		expect(instruments).toContain('CREDIT');
		expect(instruments).toContain('UPI');
		expect(instruments).not.toContain('IMPS');
	});

	it('returns rails for payins credit', () => {
		const rails = getRailsForMethodInstrument('payins', 'CREDIT');
		expect(rails).toEqual(
			expect.arrayContaining(['VISA', 'MASTER', 'RUPAY', 'CORPORATE', 'AMEX', 'DINERS'])
		);
	});

	it('validates known combo', () => {
		expect(isValidPaymentPathCombo('payins', 'CREDIT', 'VISA')).toBe(true);
		expect(isValidPaymentPathCombo('payins', 'CREDIT', 'IMPS' as PaymentRails)).toBe(false);
	});

	it('formats live preview breadcrumb path', () => {
		expect(
			formatLivePreviewPath({
				pipeline: 'omiware',
				method: 'payins',
				instrument: 'CREDIT',
				paymentRails: 'MASTER'
			})
		).toBe('omiware · payins · CREDIT · MASTER');

		expect(
			formatLivePreviewPath({
				pipeline: 'omiware',
				method: 'payins',
				instrument: 'UPI',
				paymentRails: 'default'
			})
		).toBe('omiware · payins · UPI');
	});
});
