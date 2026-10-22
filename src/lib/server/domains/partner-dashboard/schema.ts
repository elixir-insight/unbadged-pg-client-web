import * as v from 'valibot';

const NumericStringSchema = v.pipe(
	v.union([v.string(), v.number()]),
	v.transform((value) => {
		const parsed =
			typeof value === 'number' ? value : Number(String(value).replace(/,/g, '').trim());
		return Number.isFinite(parsed) ? parsed : 0;
	})
);

const NullableNumericStringSchema = v.pipe(
	v.union([v.string(), v.number(), v.null(), v.undefined()]),
	v.transform((value) => {
		if (value == null) return 0;
		const parsed =
			typeof value === 'number' ? value : Number(String(value).replace(/,/g, '').trim());
		return Number.isFinite(parsed) ? parsed : 0;
	})
);

const AmountWithChangeSchema = v.object({
	amount: NumericStringSchema,
	changePercent: NullableNumericStringSchema
});

function parseNumeric(value: string | number | null | undefined): number {
	if (value == null) return 0;
	const parsed = typeof value === 'number' ? value : Number(String(value).replace(/,/g, '').trim());
	return Number.isFinite(parsed) ? parsed : 0;
}

// --- /api/v1/partner/dashboard/kpis ---

export const PartnerKpisDataSchema = v.object({
	totalCommission: AmountWithChangeSchema,
	totalVolume: AmountWithChangeSchema,
	successRate: NumericStringSchema,
	activeMerchants: NumericStringSchema
});

export const PartnerKpisResponseSchema = v.object({
	statusCode: v.number(),
	message: v.string(),
	data: v.array(PartnerKpisDataSchema)
});

// --- /api/v1/partner/dashboard/commission/trend ---

export const CommissionTrendPointSchema = v.object({
	date: v.string(),
	commissionAmount: NumericStringSchema
});

export const CommissionTrendResponseSchema = v.object({
	statusCode: v.number(),
	message: v.string(),
	data: v.array(CommissionTrendPointSchema)
});

// --- /api/v1/partner/dashboard/commission/chart ---

export const CommissionChartTypeSchema = v.pipe(
	v.object({
		transactionType: v.optional(v.string()),
		type: v.optional(v.string()),
		label: v.optional(v.string()),
		commissionAmount: v.optional(v.union([v.string(), v.number(), v.null()])),
		commission: v.optional(v.union([v.string(), v.number(), v.null()])),
		amount: v.optional(v.union([v.string(), v.number(), v.null()])),
		value: v.optional(v.union([v.string(), v.number(), v.null()]))
	}),
	v.transform((item) => ({
		label: (item.transactionType ?? item.type ?? item.label ?? 'Other').trim() || 'Other',
		value: parseNumeric(
			item.commissionAmount ?? item.commission ?? item.amount ?? item.value ?? null
		)
	}))
);

export const CommissionChartDataSchema = v.object({
	transactionTypes: v.optional(v.array(CommissionChartTypeSchema), []),
	totalCommission: v.optional(NullableNumericStringSchema, 0)
});

export const CommissionChartResponseSchema = v.object({
	statusCode: v.number(),
	message: v.string(),
	data: v.array(CommissionChartDataSchema)
});

export type PartnerKpisData = v.InferOutput<typeof PartnerKpisDataSchema>;
export type PartnerKpisResponse = v.InferOutput<typeof PartnerKpisResponseSchema>;
export type CommissionTrendPoint = v.InferOutput<typeof CommissionTrendPointSchema>;
export type CommissionTrendResponse = v.InferOutput<typeof CommissionTrendResponseSchema>;
export type CommissionChartType = v.InferOutput<typeof CommissionChartTypeSchema>;
export type CommissionChartData = v.InferOutput<typeof CommissionChartDataSchema>;
export type CommissionChartResponse = v.InferOutput<typeof CommissionChartResponseSchema>;
