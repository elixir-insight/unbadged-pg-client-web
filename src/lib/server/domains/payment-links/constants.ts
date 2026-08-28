export const PAYMENT_LINK_CURRENCY = 'INR';

export const PAYMENT_LINK_MERCHANT_URL = {
	successUrl: 'https://dev-checkout.elixirpay.in/',
	failureUrl: 'https://dev-checkout.elixirpay.in/',
	cancelUrl: 'https://dev-checkout.elixirpay.in/'
} as const;

export const PAYMENT_LINK_DUMMY_CUSTOMER_ADDRESS = {
	city: 'Bengaluru',
	country: 'IN',
	zipCode: '560001'
} as const;
