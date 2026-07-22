import * as v from 'valibot';

export const DashboardKpiRangeSchema = v.picklist(['today', '7d', '30d']);

/** Upstream sends numeric fields as strings. */
const NumericStringSchema = v.pipe(
	v.union([v.string(), v.number()]),
	v.transform((value) => {
		const parsed =
			typeof value === 'number' ? value : Number(String(value).replace(/,/g, '').trim());
		return Number.isFinite(parsed) ? parsed : 0;
	})
);

export const DashboardAmountWithChangeSchema = v.object({
	amount: NumericStringSchema,
	changePercent: NumericStringSchema
});

export const DashboardKpisDataSchema = v.object({
	totalCollections: DashboardAmountWithChangeSchema,
	avgTransactionValue: DashboardAmountWithChangeSchema,
	successRate: NumericStringSchema,
	totalSettled: NumericStringSchema,
	awaitingSettlement: NumericStringSchema
});

export const DashboardKpisResponseSchema = v.object({
	statusCode: v.number(),
	message: v.string(),
	/** Upstream wraps the KPI payload in a single-element array. */
	data: v.array(DashboardKpisDataSchema)
});

export const DashboardTrendGranularitySchema = v.picklist(['daily', 'weekly']);

export const CollectionsTrendPointSchema = v.object({
	date: v.string(),
	grossAmount: NumericStringSchema,
	netAmount: NumericStringSchema,
	transactionCount: v.pipe(
		v.union([v.number(), v.string()]),
		v.transform((value) => {
			const parsed = typeof value === 'number' ? value : Number(String(value).trim());
			return Number.isFinite(parsed) ? parsed : 0;
		})
	)
});

export const CollectionsTrendResponseSchema = v.object({
	statusCode: v.number(),
	message: v.string(),
	data: v.array(CollectionsTrendPointSchema)
});

export const PaymentMixMethodSchema = v.object({
	method: v.string(),
	volume: NumericStringSchema
});

export const PaymentMixDataSchema = v.object({
	paymentMethods: v.array(PaymentMixMethodSchema),
	totalVolume: NumericStringSchema
});

export const PaymentMixResponseSchema = v.object({
	statusCode: v.number(),
	message: v.string(),
	/** Upstream wraps the payload in a single-element array (same as KPIs). */
	data: v.array(PaymentMixDataSchema)
});

export const ConversionFunnelStageSchema = v.object({
	id: v.string(),
	count: NumericStringSchema,
	conversionRate: NumericStringSchema,
	dropOffRate: NumericStringSchema
});

export const ConversionFunnelTerminalStatusSchema = v.object({
	id: v.string(),
	count: NumericStringSchema
});

export const ConversionFunnelDataSchema = v.object({
	overallConversionRate: NumericStringSchema,
	overallConversionRateChange: NumericStringSchema,
	previousOverallConversionRate: NumericStringSchema,
	stages: v.array(ConversionFunnelStageSchema),
	terminalStatuses: v.array(ConversionFunnelTerminalStatusSchema)
});

export const ConversionFunnelResponseSchema = v.object({
	statusCode: v.number(),
	message: v.string(),
	/** Upstream wraps the payload in a single-element array (same as KPIs). */
	data: v.array(ConversionFunnelDataSchema)
});

export type DashboardKpiRange = v.InferOutput<typeof DashboardKpiRangeSchema>;
export type DashboardAmountWithChange = v.InferOutput<typeof DashboardAmountWithChangeSchema>;
export type DashboardKpisData = v.InferOutput<typeof DashboardKpisDataSchema>;
export type DashboardKpisResponse = v.InferOutput<typeof DashboardKpisResponseSchema>;
export type DashboardTrendGranularity = v.InferOutput<typeof DashboardTrendGranularitySchema>;
export type CollectionsTrendPoint = v.InferOutput<typeof CollectionsTrendPointSchema>;
export type CollectionsTrendResponse = v.InferOutput<typeof CollectionsTrendResponseSchema>;
export type PaymentMixMethod = v.InferOutput<typeof PaymentMixMethodSchema>;
export type PaymentMixData = v.InferOutput<typeof PaymentMixDataSchema>;
export type PaymentMixResponse = v.InferOutput<typeof PaymentMixResponseSchema>;
export type ConversionFunnelStage = v.InferOutput<typeof ConversionFunnelStageSchema>;
export type ConversionFunnelTerminalStatus = v.InferOutput<
	typeof ConversionFunnelTerminalStatusSchema
>;
export type ConversionFunnelData = v.InferOutput<typeof ConversionFunnelDataSchema>;
export type ConversionFunnelResponse = v.InferOutput<typeof ConversionFunnelResponseSchema>;
