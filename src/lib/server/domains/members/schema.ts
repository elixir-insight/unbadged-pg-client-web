import * as v from 'valibot';

export const PaginationSchema = v.object({
	total: v.number(),
	page: v.number(),
	limit: v.number()
});

/** List item from GET /api/v1/management/member */
export const MemberListItemSchema = v.object({
	id: v.number(),
	userName: v.string(),
	userEmail: v.string(),
	employeeId: v.optional(v.nullable(v.string()), ''),
	phoneNumber: v.optional(v.nullable(v.string()), ''),
	userType: v.optional(v.nullable(v.string()), 'MEMBER'),
	roles: v.optional(v.array(v.union([v.string(), v.number()])), []),
	supervisorId: v.optional(v.nullable(v.number())),
	orgId: v.optional(v.nullable(v.number())),
	enabled: v.boolean(),
	emailVerified: v.optional(v.boolean(), false),
	phoneNumberVerified: v.optional(v.boolean(), false),
	createdAt: v.optional(v.nullable(v.string()), ''),
	updatedAt: v.optional(v.nullable(v.string()), '')
});

/**
 * Detail item from GET /api/v1/management/member/{memberId}.
 * Active vs Invited payloads can omit or null some fields — keep this permissive.
 */
export const MemberDetailItemSchema = v.object({
	id: v.number(),
	userName: v.string(),
	userEmail: v.string(),
	employeeId: v.optional(v.nullable(v.string()), ''),
	phoneNumber: v.optional(v.nullable(v.string()), ''),
	userType: v.optional(v.nullable(v.string()), 'MEMBER'),
	roles: v.optional(v.array(v.union([v.number(), v.string()])), []),
	supervisorId: v.optional(v.nullable(v.number())),
	orgId: v.optional(v.nullable(v.number())),
	enabled: v.boolean(),
	phoneNumberVerified: v.optional(v.boolean(), false),
	emailVerified: v.optional(v.boolean(), false),
	createdAt: v.optional(v.nullable(v.string()), ''),
	updatedAt: v.optional(v.nullable(v.string()), ''),
	createdBy: v.optional(v.nullable(v.number())),
	updatedBy: v.optional(v.nullable(v.number()))
});

export const MembersListResponseSchema = v.object({
	statusCode: v.number(),
	message: v.string(),
	data: v.array(MemberListItemSchema),
	pagination: PaginationSchema
});

export const MemberDetailResponseSchema = v.object({
	statusCode: v.number(),
	message: v.string(),
	data: v.array(MemberDetailItemSchema)
});

/** Role from GET /api/v1/management/organizations/{orgId}/roles */
export const OrgRoleItemSchema = v.object({
	roleId: v.number(),
	roleName: v.string(),
	description: v.string(),
	roleAssignedCount: v.number(),
	defaultRole: v.boolean()
});

export const OrgRolesListResponseSchema = v.object({
	statusCode: v.number(),
	message: v.string(),
	data: v.array(OrgRoleItemSchema),
	pagination: PaginationSchema
});

export const CreateMemberBodySchema = v.object({
	employeeId: v.string(),
	phoneNumber: v.string(),
	reportingTo: v.number(),
	roles: v.array(v.number()),
	userEmail: v.string(),
	userName: v.string()
});

export const CreateMemberResponseSchema = v.object({
	statusCode: v.number(),
	message: v.string(),
	data: v.array(
		v.object({
			memberId: v.number()
		})
	),
	pagination: v.optional(PaginationSchema)
});

/** Same shape as create — PUT sends the full member payload (changed + unchanged fields). */
export const UpdateMemberBodySchema = CreateMemberBodySchema;

export const UpdateMemberResponseSchema = v.object({
	statusCode: v.number(),
	message: v.string(),
	data: v.array(v.unknown()),
	pagination: v.optional(PaginationSchema)
});

export const DeleteMemberResponseSchema = UpdateMemberResponseSchema;

/** Lightweight user from GET /api/v1/management/user/list — for reporting-to lookup */
export const UserDirectoryItemSchema = v.object({
	id: v.number(),
	userName: v.string()
});

export const UserDirectoryListResponseSchema = v.object({
	statusCode: v.number(),
	message: v.string(),
	data: v.array(UserDirectoryItemSchema),
	pagination: v.optional(v.unknown())
});

export type MemberListItem = v.InferOutput<typeof MemberListItemSchema>;
export type MemberDetailItem = v.InferOutput<typeof MemberDetailItemSchema>;
export type MembersListResponse = v.InferOutput<typeof MembersListResponseSchema>;
export type MemberDetailResponse = v.InferOutput<typeof MemberDetailResponseSchema>;
export type OrgRoleItem = v.InferOutput<typeof OrgRoleItemSchema>;
export type OrgRolesListResponse = v.InferOutput<typeof OrgRolesListResponseSchema>;
export type CreateMemberBody = v.InferOutput<typeof CreateMemberBodySchema>;
export type CreateMemberResponse = v.InferOutput<typeof CreateMemberResponseSchema>;
export type UpdateMemberBody = v.InferOutput<typeof UpdateMemberBodySchema>;
export type UpdateMemberResponse = v.InferOutput<typeof UpdateMemberResponseSchema>;
export type DeleteMemberResponse = v.InferOutput<typeof DeleteMemberResponseSchema>;
export type UserDirectoryItem = v.InferOutput<typeof UserDirectoryItemSchema>;
export type UserDirectoryListResponse = v.InferOutput<typeof UserDirectoryListResponseSchema>;
