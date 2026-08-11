export type PaymentMethodConfigItem = {
	id: string;
	pipelineCode: string;
	serviceType: string;
	instrument: string;
	paymentRail: string;
	description: string;
};

export type PaymentPathApiSelection = {
	pipeline: string;
	method: string;
	instrument: string;
	paymentRails: string;
};
