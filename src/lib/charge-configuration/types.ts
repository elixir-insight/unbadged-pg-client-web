export type ChargeConfigurationItem = {
	id: string;
	methodConfigId: string;
	pipelineCode: string;
	vaNumber: string;
	baseAmount: string;
	chargeRate: string;
	chargeType: string;
	gstExclusive: boolean;
	gstPercentage: string;
	effectiveFrom: string;
	effectiveTo: string;
};

export type ChargeSlabSection = {
	slabs: import('$lib/fee-config/types').FeeSlabRow[];
	effectiveFrom: string;
	effectiveTo: string;
	hasConfigurations: boolean;
};
