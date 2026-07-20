import * as v from 'valibot';

export const IpAllowlistEntrySchema = v.object({
	id: v.number(),
	ipAddress: v.string(),
	createdAt: v.string()
});

export const IpAllowlistResponseSchema = v.object({
	data: v.array(IpAllowlistEntrySchema),
	message: v.string(),
	statusCode: v.number()
});

export type IpAllowlistEntry = v.InferOutput<typeof IpAllowlistEntrySchema>;
export type IpAllowlistResponse = v.InferOutput<typeof IpAllowlistResponseSchema>;
