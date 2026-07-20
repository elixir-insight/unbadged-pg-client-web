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

export const CreateIpAllowlistRequestSchema = v.object({
	ipAddress: v.pipe(v.string(), v.trim(), v.minLength(1, 'IP address is required'))
});

export const CreateIpAllowlistResponseSchema = v.object({
	data: v.array(v.unknown()),
	message: v.string(),
	statusCode: v.number()
});

export type CreateIpAllowlistRequest = v.InferOutput<typeof CreateIpAllowlistRequestSchema>;
export type CreateIpAllowlistResponse = v.InferOutput<typeof CreateIpAllowlistResponseSchema>;

export const DeleteIpAllowlistResponseSchema = v.object({
	data: v.array(v.unknown()),
	message: v.string(),
	statusCode: v.number()
});

export type DeleteIpAllowlistResponse = v.InferOutput<typeof DeleteIpAllowlistResponseSchema>;
