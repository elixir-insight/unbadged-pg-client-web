import * as v from 'valibot';

export const PaginationSchema = v.object({
	total: v.number(),
	page: v.number(),
	limit: v.number()
});

/** List item from GET /api/v1/{management|merchant}/member */
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

export const AssignedUserSchema = v.object({
	id: v.number(),
	name: v.string()
});

/**
 * Detail item from GET /api/v1/{management|merchant}/member/{memberId}.
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
	updatedBy: v.optional(v.nullable(v.number())),
	assignedUsers: v.optional(v.array(AssignedUserSchema), [])
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

/** Role from GET /api/v1/{management|merchant}/roles */
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
	/** Upstream omits pagination when the list is empty. */
	pagination: v.optional(PaginationSchema)
});

export const CreateMemberBodySchema = v.object({
	employeeId: v.string(),
	phoneNumber: v.string(),
	reportingTo: v.number(),
	roles: v.array(v.number()),
	userEmail: v.pipe(v.string(), v.trim(), v.toLowerCase()),
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

/** Lightweight user from GET /api/v1/{management|merchant}/user/list — for reporting-to lookup */
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

/** Permission entry from GET /api/v1/{management|merchant}/permissions */
export const ResourcePermissionItemSchema = v.object({
	id: v.number(),
	name: v.string(),
	description: v.string(),
	resourceName: v.optional(v.string())
});

export const ResourcePermissionModuleSchema = v.object({
	module: v.string(),
	permissions: v.array(ResourcePermissionItemSchema)
});

export const PermissionsCatalogDataSchema = v.object({
	permissions: v.array(ResourcePermissionModuleSchema)
});

export const PermissionsCatalogResponseSchema = v.object({
	statusCode: v.number(),
	message: v.string(),
	data: v.array(PermissionsCatalogDataSchema),
	pagination: v.optional(PaginationSchema)
});

/**
 * Current user's own granted permissions from GET /api/v1/user/permissions.
 * `data[0]` is keyed by portal group (e.g. "MANAGEMENT"), each mapping
 * module → array of granted action names.
 */
export const UserPermissionsResponseSchema = v.object({
	statusCode: v.number(),
	message: v.string(),
	data: v.array(v.record(v.string(), v.record(v.string(), v.array(v.string()))))
});

/** Role detail from GET /api/v1/{portal}/roles/{roleId} */
export const OrgRoleDetailPermissionSchema = v.object({
	id: v.number(),
	name: v.string(),
	description: v.optional(v.string())
});

export const OrgRoleDetailUserSchema = v.object({
	userName: v.string(),
	email: v.string()
});

export const OrgRoleDetailInfoSchema = v.object({
	roleId: v.number(),
	roleName: v.string(),
	description: v.optional(v.string(), ''),
	roleAssignedCount: v.number(),
	defaultRole: v.boolean()
});

export const OrgRoleDetailItemSchema = v.object({
	roleInfo: OrgRoleDetailInfoSchema,
	permissions: v.array(OrgRoleDetailPermissionSchema),
	users: v.array(OrgRoleDetailUserSchema)
});

export const OrgRoleDetailResponseSchema = v.object({
	statusCode: v.number(),
	message: v.string(),
	data: v.array(OrgRoleDetailItemSchema),
	pagination: v.optional(PaginationSchema)
});

/** POST /api/v1/{portal}/roles */
export const CreateOrgRoleBodySchema = v.object({
	roleName: v.string(),
	description: v.string(),
	permissions: v.array(v.number())
});

export const CreateOrgRoleResponseSchema = v.object({
	statusCode: v.number(),
	message: v.string(),
	data: v.optional(v.array(v.unknown()), []),
	pagination: v.optional(PaginationSchema)
});

/** PATCH /api/v1/{portal}/roles/{roleId} */
export const UpdateOrgRoleBodySchema = v.object({
	roleName: v.string(),
	description: v.string(),
	addPermissions: v.array(v.number()),
	revokePermissions: v.array(v.number())
});

export const UpdateOrgRoleResponseSchema = v.object({
	statusCode: v.number(),
	message: v.string(),
	data: v.optional(v.array(v.unknown()), []),
	pagination: v.optional(PaginationSchema)
});

/** DELETE /api/v1/{portal}/roles/{roleId} */
export const DeleteOrgRoleResponseSchema = UpdateOrgRoleResponseSchema;

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
export type ResourcePermissionItem = v.InferOutput<typeof ResourcePermissionItemSchema>;
export type ResourcePermissionModule = v.InferOutput<typeof ResourcePermissionModuleSchema>;
export type PermissionsCatalogResponse = v.InferOutput<typeof PermissionsCatalogResponseSchema>;
export type UserPermissionsResponse = v.InferOutput<typeof UserPermissionsResponseSchema>;
export type OrgRoleDetailItem = v.InferOutput<typeof OrgRoleDetailItemSchema>;
export type OrgRoleDetailResponse = v.InferOutput<typeof OrgRoleDetailResponseSchema>;
export type CreateOrgRoleBody = v.InferOutput<typeof CreateOrgRoleBodySchema>;
export type CreateOrgRoleResponse = v.InferOutput<typeof CreateOrgRoleResponseSchema>;
export type UpdateOrgRoleBody = v.InferOutput<typeof UpdateOrgRoleBodySchema>;
export type UpdateOrgRoleResponse = v.InferOutput<typeof UpdateOrgRoleResponseSchema>;
export type DeleteOrgRoleResponse = v.InferOutput<typeof DeleteOrgRoleResponseSchema>;
