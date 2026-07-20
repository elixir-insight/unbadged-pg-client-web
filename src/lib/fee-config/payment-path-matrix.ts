import type { PaymentInstrument, PaymentMethod, PaymentRails } from './types';

export interface PaymentPathCombo {
	method: PaymentMethod;
	instrument: PaymentInstrument;
	paymentRails: PaymentRails;
}

const DEFAULT_RAILS: PaymentRails = 'default';

export const PAYMENT_PATH_MATRIX: PaymentPathCombo[] = [
	{ method: 'payins', instrument: 'CREDIT', paymentRails: 'VISA' },
	{ method: 'payins', instrument: 'CREDIT', paymentRails: 'MASTER' },
	{ method: 'payins', instrument: 'CREDIT', paymentRails: 'RUPAY' },
	{ method: 'payins', instrument: 'CREDIT', paymentRails: 'CORPORATE' },
	{ method: 'payins', instrument: 'CREDIT', paymentRails: 'AMEX' },
	{ method: 'payins', instrument: 'CREDIT', paymentRails: 'DINERS' },
	{ method: 'payins', instrument: 'DEBIT', paymentRails: 'VISA' },
	{ method: 'payins', instrument: 'DEBIT', paymentRails: 'MASTER' },
	{ method: 'payins', instrument: 'DEBIT', paymentRails: 'RUPAY' },
	{ method: 'payins', instrument: 'NETBANKING', paymentRails: DEFAULT_RAILS },
	{ method: 'payins', instrument: 'UPI', paymentRails: DEFAULT_RAILS },
	{ method: 'payins', instrument: 'INTERNATIONAL CARD', paymentRails: DEFAULT_RAILS },
	{ method: 'payouts', instrument: 'UPI', paymentRails: DEFAULT_RAILS },
	{ method: 'payouts', instrument: 'RTGS', paymentRails: DEFAULT_RAILS },
	{ method: 'payouts', instrument: 'NEFT', paymentRails: DEFAULT_RAILS },
	{ method: 'payouts', instrument: 'IMPS', paymentRails: DEFAULT_RAILS }
];

export const PAYMENT_METHODS: PaymentMethod[] = ['payins', 'payouts'];

export function getInstrumentsForMethod(method: PaymentMethod | ''): PaymentInstrument[] {
	if (!method) return [];
	const instruments = new Set<PaymentInstrument>();
	for (const combo of PAYMENT_PATH_MATRIX) {
		if (combo.method === method) instruments.add(combo.instrument);
	}
	return [...instruments];
}

export function getRailsForMethodInstrument(
	method: PaymentMethod | '',
	instrument: PaymentInstrument | ''
): PaymentRails[] {
	if (!method || !instrument) return [];
	const rails = new Set<PaymentRails>();
	for (const combo of PAYMENT_PATH_MATRIX) {
		if (combo.method === method && combo.instrument === instrument) {
			rails.add(combo.paymentRails);
		}
	}
	return [...rails];
}

export function isValidPaymentPathCombo(
	method: PaymentMethod | '',
	instrument: PaymentInstrument | '',
	paymentRails: PaymentRails | ''
): boolean {
	if (!method || !instrument || !paymentRails) return false;
	return PAYMENT_PATH_MATRIX.some(
		(combo) =>
			combo.method === method &&
			combo.instrument === instrument &&
			combo.paymentRails === paymentRails
	);
}

export function formatPaymentPathLabel(
	method: PaymentMethod | '',
	instrument: PaymentInstrument | '',
	paymentRails: PaymentRails | ''
): string {
	if (!method) return '—';
	const parts: string[] = [method, instrument].filter(Boolean);
	if (paymentRails && paymentRails !== DEFAULT_RAILS) {
		parts.push(paymentRails);
	}
	return parts.join(' · ');
}

export function formatLivePreviewPath(selection: {
	pipeline: string;
	method: PaymentMethod | '';
	instrument: PaymentInstrument | '';
	paymentRails: PaymentRails | '';
}): string {
	const pipeline = (selection.pipeline || 'omiware').toLowerCase();
	if (!selection.method) return pipeline;

	const method = selection.method.toLowerCase();
	if (!selection.instrument) return `${pipeline} · ${method}`;

	const instrument = selection.instrument.toUpperCase();
	if (!selection.paymentRails || selection.paymentRails === DEFAULT_RAILS) {
		return `${pipeline} · ${method} · ${instrument}`;
	}

	return `${pipeline} · ${method} · ${instrument} · ${selection.paymentRails.toUpperCase()}`;
}

export function railsDisplayLabel(rails: PaymentRails): string {
	return rails === DEFAULT_RAILS ? 'default' : rails;
}
