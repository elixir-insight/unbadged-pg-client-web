import {
	PAYMENT_LINK_CURRENCY,
	PAYMENT_LINK_DUMMY_CUSTOMER_ADDRESS,
	PAYMENT_LINK_MERCHANT_URL
} from '../../constants';
import { toE164IndianPhone } from '$lib/server/domains/organization/mappers/to-api/create-organization';
import type {
	CreatePaymentLinkClientRequest,
	CreatePaymentLinkUpstreamRequest
} from '../../schema';

export function buildCreatePaymentLinkRequest(
	input: CreatePaymentLinkClientRequest
): CreatePaymentLinkUpstreamRequest {
	return {
		amount: input.amount,
		currency: PAYMENT_LINK_CURRENCY,
		description: input.description,
		referenceId: input.referenceId,
		allowedPaymentMethods: [...input.allowedPaymentMethods],
		deliveryMethods: [...input.deliveryMethods],
		expiresBy: input.expiresBy.trim(),
		customer: {
			name: input.customerName,
			email: input.customerEmail,
			phoneNumber: toE164IndianPhone(input.customerPhone),
			...PAYMENT_LINK_DUMMY_CUSTOMER_ADDRESS
		},
		merchantUrl: { ...PAYMENT_LINK_MERCHANT_URL }
	};
}
