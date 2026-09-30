import {
	PAYMENT_LINK_CURRENCY,
	PAYMENT_LINK_DUMMY_CUSTOMER_ADDRESS
} from '../payment-links/constants';
import { INVOICE_API_BASE_URL } from '$lib/server/http/env';

export const INVOICE_CURRENCY = PAYMENT_LINK_CURRENCY;

/** Invoice payment redirect URLs — hardcoded to INVOICE_API_BASE_URL for all outcomes. */
export const INVOICE_MERCHANT_URL = {
	successUrl: INVOICE_API_BASE_URL,
	failureUrl: INVOICE_API_BASE_URL,
	cancelUrl: INVOICE_API_BASE_URL
} as const;

export const INVOICE_DUMMY_CUSTOMER_ADDRESS = PAYMENT_LINK_DUMMY_CUSTOMER_ADDRESS;

export const INVOICE_DUMMY_CUSTOMER_ADDRESS_LINE = 'Bengaluru, IN 560001';
