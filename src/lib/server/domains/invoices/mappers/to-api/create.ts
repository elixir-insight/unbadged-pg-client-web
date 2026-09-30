import { toE164IndianPhone } from '$lib/server/domains/organization/mappers/to-api/create-organization';
import {
	INVOICE_CURRENCY,
	INVOICE_DUMMY_CUSTOMER_ADDRESS,
	INVOICE_DUMMY_CUSTOMER_ADDRESS_LINE,
	INVOICE_MERCHANT_URL
} from '../../constants';
import type { CreateInvoiceClientRequest, CreateInvoiceUpstreamRequest } from '../../schema';

export function buildCreateInvoiceRequest(
	input: CreateInvoiceClientRequest
): CreateInvoiceUpstreamRequest {
	const customerAddress = input.customerAddress.trim() || INVOICE_DUMMY_CUSTOMER_ADDRESS_LINE;

	return {
		amount: input.amount,
		currency: INVOICE_CURRENCY,
		description: input.description,
		referenceId: input.referenceId,
		allowedPaymentMethods: [...input.allowedPaymentMethods],
		deliveryMethods: [...input.deliveryMethods],
		expiresBy: input.expiresBy.trim(),
		customer: {
			name: input.customerName,
			email: input.customerEmail,
			phoneNumber: toE164IndianPhone(input.customerPhone),
			...INVOICE_DUMMY_CUSTOMER_ADDRESS
		},
		customerAddress,
		gstNumber: input.gstNumber.trim(),
		items: input.items.map((item) => ({
			itemName: item.itemName.trim(),
			price: item.price.trim(),
			quantity: item.quantity,
			total: item.total.trim()
		})),
		merchantName: input.merchantName.trim(),
		merchantUrl: { ...INVOICE_MERCHANT_URL }
	};
}
