export type PaymentMethod = 'payins' | 'payouts';
export type PaymentInstrument =
	| 'CREDIT'
	| 'DEBIT'
	| 'NETBANKING'
	| 'UPI'
	| 'INTERNATIONAL CARD'
	| 'RTGS'
	| 'NEFT'
	| 'IMPS';
export type PaymentRails =
	| 'default'
	| 'VISA'
	| 'MASTER'
	| 'RUPAY'
	| 'CORPORATE'
	| 'AMEX'
	| 'DINERS';

export type FeeType = 'flat' | 'percentage';

export interface FeeSlabRow {
	id: string;
	baseAmount: string;
	feeType: FeeType;
	feeRate: string;
	gstExclusive: boolean;
}

export interface PaymentMethodConfiguration {
	id: string;
	pipelineId: string;
	method: PaymentMethod;
	instrument: PaymentInstrument;
	paymentRails: PaymentRails;
	effectiveFrom: string;
	effectiveTo: string | null;
}

export interface FeeConfiguration {
	id: string;
	methodConfigId: string;
	baseAmount: number | null;
	chargeType: FeeType;
	chargeRate: number;
	gstExclusive: boolean;
	effectiveFrom: string;
	effectiveTo: string | null;
}

export interface CommissionConfiguration {
	id: string;
	orgId: string;
	methodConfigId: string;
	feeConfigId: string;
	baseAmount: number | null;
	commissionType: FeeType;
	feeRate: number;
	gstPercentage: number;
	gstExclusive: boolean;
	pipelineId: string;
	effectiveFrom: string;
	effectiveTo: string | null;
}

export interface PartnerConfiguration {
	id: string;
	orgId: string;
	partnerId: string;
	methodConfigId: string;
	baseAmount: number | null;
	feeType: FeeType;
	feeRate: number;
	gstExclusive: boolean;
	effectiveFrom: string;
	effectiveTo: string | null;
}

export interface PaymentPathSelection {
	pipeline: string;
	method: PaymentMethod | '';
	instrument: PaymentInstrument | '';
	paymentRails: PaymentRails | '';
}

export interface FeeSectionDraft {
	slabs: FeeSlabRow[];
	effectiveFrom: string;
	effectiveTo: string;
}

export interface FeeConfigDraft {
	methodConfigId: string;
	charges: FeeSectionDraft | null;
	commission: FeeSectionDraft | null;
	partner: FeeSectionDraft | null;
	feeConfigId: string | null;
}

export interface ResolvedSlabFee {
	amount: number;
	rateLabel: string;
	slab: FeeSlabRow;
}

export interface FeePreviewBreakdown {
	grossAmount: number;
	gatewayFee: ResolvedSlabFee | null;
	commissionFee: ResolvedSlabFee | null;
	partnerFee: ResolvedSlabFee | null;
	netAmount: number;
	retainedPercent: number;
}

export interface SlabValidationResult {
	valid: boolean;
	errors: string[];
	rowErrors: Record<string, string[]>;
}
