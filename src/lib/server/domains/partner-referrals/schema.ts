import * as v from 'valibot';

export const ReferralMerchantRecordSchema = v.object({
	affiliateId: v.optional(v.string()),
	brandName: v.optional(v.string()),
	businessType: v.optional(v.string()),
	companyName: v.optional(v.string()),
	createdAt: v.pipe(v.string(), v.minLength(1)),
	createdBy: v.optional(v.string()),
	email: v.optional(v.string()),
	orgId: v.pipe(v.string(), v.minLength(1)),
	phoneNumber: v.optional(v.string()),
	profileDescription: v.optional(v.string()),
	profileStatus: v.pipe(v.string(), v.minLength(1)),
	profileType: v.optional(v.string()),
	serviceTypes: v.optional(v.array(v.string())),
	updatedAt: v.optional(v.string()),
	updatedBy: v.optional(v.string())
});

export const ReferralMerchantsPaginationSchema = v.object({
	limit: v.number(),
	page: v.number(),
	total: v.number()
});

export const GetReferralMerchantsResponseSchema = v.object({
	message: v.optional(v.string()),
	statusCode: v.optional(v.number()),
	data: v.optional(v.array(ReferralMerchantRecordSchema)),
	pagination: v.optional(ReferralMerchantsPaginationSchema),
	statusCounts: v.optional(v.unknown())
});

export type ReferralMerchantRecord = v.InferOutput<typeof ReferralMerchantRecordSchema>;
export type ReferralMerchantsPagination = v.InferOutput<typeof ReferralMerchantsPaginationSchema>;
export type GetReferralMerchantsResponse = v.InferOutput<typeof GetReferralMerchantsResponseSchema>;
