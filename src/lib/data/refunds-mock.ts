export type MerchantStatus = 'active' | 'on_hold' | 'inactive';
export type RefundStatus = 'pending' | 'processing' | 'success' | 'failed' | 'rejected';
export type RefundType = 'Full' | 'Partial';

export interface Merchant extends Record<string, unknown> {
	id: string;
	name: string;
	merchantId: string;
	status: MerchantStatus;
}

export interface VirtualAccount {
	id: string;
	merchantId: string;
	bankName: string;
	accountNumber: string;
	ifsc: string;
	status: 'active' | 'inactive';
	linkedDate: string;
}

export interface Refund extends Record<string, unknown> {
	id: string;
	merchantId: string;
	transactionId: string;
	refundId: string;
	customerName: string;
	refundType: RefundType;
	originalAmount: number;
	refundAmount: number;
	status: RefundStatus;
	requestedDate: string;
	completedDate: string | null;
	bank: string;
	utr: string;
	crn: string;
	remarks: string;
	paymentMethod: string;
}

export const merchants: Merchant[] = [
	{ id: 'M1', name: 'Acme Payments Pvt Ltd', merchantId: 'ACME001', status: 'active' },
	{ id: 'M2', name: 'Globex Corporation', merchantId: 'GLOB002', status: 'active' },
	{ id: 'M3', name: 'Wayne Enterprises', merchantId: 'WAYN003', status: 'on_hold' },
	{ id: 'M4', name: 'Stark Industries', merchantId: 'STARK004', status: 'inactive' },
	{ id: 'M5', name: 'Northwind Traders', merchantId: 'NWND005', status: 'active' },
	{ id: 'M6', name: 'Initech Solutions', merchantId: 'INIT006', status: 'on_hold' }
];

export const virtualAccounts: VirtualAccount[] = [
	{
		id: 'VA1',
		merchantId: 'M1',
		bankName: 'HDFC Bank',
		accountNumber: 'ACME0001293847',
		ifsc: 'HDFC0001234',
		status: 'active',
		linkedDate: '12 Jan 2024'
	},
	{
		id: 'VA2',
		merchantId: 'M1',
		bankName: 'ICICI Bank',
		accountNumber: 'ACME0001293848',
		ifsc: 'ICIC0001234',
		status: 'active',
		linkedDate: '15 Jan 2024'
	},
	{
		id: 'VA3',
		merchantId: 'M2',
		bankName: 'ICICI Bank',
		accountNumber: 'GLOB0001234567',
		ifsc: 'ICIC0001234',
		status: 'active',
		linkedDate: '10 Mar 2024'
	},
	{
		id: 'VA4',
		merchantId: 'M2',
		bankName: 'Axis Bank',
		accountNumber: 'GLOB0001234568',
		ifsc: 'UTIB0001234',
		status: 'inactive',
		linkedDate: '05 Apr 2024'
	},
	{
		id: 'VA5',
		merchantId: 'M3',
		bankName: 'Kotak Bank',
		accountNumber: 'WAYN0001234567',
		ifsc: 'KKBK0001234',
		status: 'active',
		linkedDate: '12 May 2024'
	},
	{
		id: 'VA6',
		merchantId: 'M4',
		bankName: 'HDFC Bank',
		accountNumber: 'STAR0001234567',
		ifsc: 'HDFC0005678',
		status: 'active',
		linkedDate: '01 Jun 2024'
	},
	{
		id: 'VA7',
		merchantId: 'M5',
		bankName: 'SBI',
		accountNumber: 'NWND0001234567',
		ifsc: 'SBIN0005678',
		status: 'active',
		linkedDate: '18 Feb 2024'
	},
	{
		id: 'VA8',
		merchantId: 'M6',
		bankName: 'ICICI Bank',
		accountNumber: 'INIT0001234567',
		ifsc: 'ICIC0005678',
		status: 'inactive',
		linkedDate: '22 Mar 2024'
	}
];

export const allRefunds: Refund[] = [
	{
		id: '1',
		merchantId: 'M1',
		transactionId: 'TXN-51',
		refundId: 'RFD-2026-0001',
		customerName: 'Suresh Kumar',
		refundType: 'Full',
		originalAmount: 28745.77,
		refundAmount: 28745.77,
		status: 'success',
		requestedDate: '27 Jun 2026',
		completedDate: '27 Jun 2026',
		bank: 'SBI',
		utr: 'UTR520344015738',
		crn: '8154088680189321',
		remarks: 'Customer requested full refund — product not delivered.',
		paymentMethod: 'Card'
	},
	{
		id: '2',
		merchantId: 'M2',
		transactionId: 'TXN-92',
		refundId: 'RFD-2026-0002',
		customerName: 'Ananya Rao',
		refundType: 'Partial',
		originalAmount: 64671.96,
		refundAmount: 32000.0,
		status: 'processing',
		requestedDate: '26 Jun 2026',
		completedDate: null,
		bank: 'HDFC Bank',
		utr: 'UTR320849309242',
		crn: '5870054809605277',
		remarks: 'Partial service not rendered.',
		paymentMethod: 'Net Banking'
	},
	{
		id: '3',
		merchantId: 'M5',
		transactionId: 'TXN-37',
		refundId: 'RFD-2026-0003',
		customerName: 'Rahul Das',
		refundType: 'Full',
		originalAmount: 15688.0,
		refundAmount: 15688.0,
		status: 'failed',
		requestedDate: '23 Jun 2026',
		completedDate: '24 Jun 2026',
		bank: 'ICICI Bank',
		utr: 'UTR351876500717',
		crn: '8586599401287255',
		remarks: 'Bank rejected due to account mismatch.',
		paymentMethod: 'Card'
	},
	{
		id: '4',
		merchantId: 'M6',
		transactionId: 'TXN-108',
		refundId: 'RFD-2026-0004',
		customerName: 'Vikram Singh',
		refundType: 'Full',
		originalAmount: 38530.94,
		refundAmount: 38530.94,
		status: 'pending',
		requestedDate: '22 Jun 2026',
		completedDate: null,
		bank: 'Kotak Bank',
		utr: 'UTR487097166173',
		crn: '6176348353694964',
		remarks: 'Awaiting merchant approval.',
		paymentMethod: 'UPI'
	},
	{
		id: '5',
		merchantId: 'M1',
		transactionId: 'TXN-63',
		refundId: 'RFD-2026-0005',
		customerName: 'Amit Patel',
		refundType: 'Partial',
		originalAmount: 37621.71,
		refundAmount: 10000.0,
		status: 'rejected',
		requestedDate: '20 Jun 2026',
		completedDate: '21 Jun 2026',
		bank: 'SBI',
		utr: 'UTR558587306748',
		crn: '6663720076483522',
		remarks: 'Rejected — refund window expired (>90 days).',
		paymentMethod: 'Net Banking'
	},
	{
		id: '6',
		merchantId: 'M2',
		transactionId: 'TXN-79',
		refundId: 'RFD-2026-0006',
		customerName: 'Lakshmi Pillai',
		refundType: 'Full',
		originalAmount: 5412.32,
		refundAmount: 5412.32,
		status: 'success',
		requestedDate: '18 Jun 2026',
		completedDate: '19 Jun 2026',
		bank: 'Axis Bank',
		utr: 'UTR277934984844',
		crn: '9702850439778620',
		remarks: 'Duplicate transaction.',
		paymentMethod: 'Card'
	},
	{
		id: '7',
		merchantId: 'M3',
		transactionId: 'TXN-44',
		refundId: 'RFD-2026-0007',
		customerName: 'Manish Verma',
		refundType: 'Partial',
		originalAmount: 9119.23,
		refundAmount: 4500.0,
		status: 'processing',
		requestedDate: '16 Jun 2026',
		completedDate: null,
		bank: 'HDFC Bank',
		utr: 'UTR842350892725',
		crn: '3663035702590942',
		remarks: 'Partial refund for cancelled order items.',
		paymentMethod: 'UPI'
	},
	{
		id: '8',
		merchantId: 'M4',
		transactionId: 'TXN-21',
		refundId: 'RFD-2026-0008',
		customerName: 'Priya Nair',
		refundType: 'Full',
		originalAmount: 72340.5,
		refundAmount: 72340.5,
		status: 'pending',
		requestedDate: '15 Jun 2026',
		completedDate: null,
		bank: 'SBI',
		utr: 'UTR194823740192',
		crn: '4481203948576123',
		remarks: 'Product damaged on delivery.',
		paymentMethod: 'Card'
	}
];
