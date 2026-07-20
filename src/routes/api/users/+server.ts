import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Cookies } from '@sveltejs/kit';
import type { Logger } from 'pino';
import * as v from 'valibot';
import { getValidSession, SessionError } from '$lib/server/domains/auth/getValidSession';
import { membersClient } from '$lib/server/domains/members/client';
import { resolveMembersApiPortalFromRequest } from '$lib/server/domains/members/portal';
import { CreateMemberBodySchema, type MemberListItem } from '$lib/server/domains/members/schema';
import type { ApiUsersListResponse } from '$lib/stores/user-management/api-types';
import { mapStatusFilterToEnabled } from '$lib/stores/user-management/user-mapper';

/** Normalize role labels so display names match API SCREAMING_SNAKE names. */
function roleKey(role: string): string {
	return role.toLowerCase().replace(/[\s_]+/g, '');
}

function filterMembers(
	members: MemberListItem[],
	search: string,
	status: string,
	role: string
): MemberListItem[] {
	const enabledFilter = mapStatusFilterToEnabled(status);
	const roleFilterKey = role ? roleKey(role) : '';

	return members.filter((member) => {
		if (enabledFilter !== undefined && member.enabled !== enabledFilter) return false;

		if (roleFilterKey && !(member.roles ?? []).some((r) => roleKey(String(r)) === roleFilterKey))
			return false;

		if (!search) return true;
		const query = search.toLowerCase();
		const employeeId = member.employeeId == null ? '' : member.employeeId;
		return (
			member.userName.toLowerCase().includes(query) ||
			employeeId.toLowerCase().includes(query) ||
			member.userEmail.toLowerCase().includes(query)
		);
	});
}

async function requireSession(cookies: Cookies, fetchFn: typeof fetch, logger: Logger) {
	try {
		return await getValidSession(cookies, fetchFn, logger);
	} catch (e) {
		if (e instanceof SessionError) {
			error(401, { message: 'Unauthorized' });
		}
		throw e;
	}
}

export const GET: RequestHandler = async ({ url, request, cookies, fetch, locals }) => {
	const tokens = await requireSession(cookies, fetch, locals.logger);
	const portal = resolveMembersApiPortalFromRequest({
		url,
		request,
		groups: locals.merchantSession?.groups ?? []
	});

	const userId = url.searchParams.get('userId');

	if (userId) {
		const memberId = Number(userId);
		const log = locals.logger.child({ action: 'view-user', memberId: userId, portal });

		if (!Number.isFinite(memberId)) {
			log.warn('invalid user id');
			error(400, { message: 'Invalid user id' });
		}

		log.info('fetching member detail');

		const result = await membersClient.getById(
			fetch,
			log,
			tokens.accessToken,
			tokens.gatewayToken,
			memberId,
			portal
		);

		if (!result.ok) {
			log.warn(
				{
					errorKind: result.error.kind,
					message: result.error.message,
					...(result.error.kind === 'http'
						? { status: result.error.status, code: result.error.code }
						: {})
				},
				'member detail fetch failed'
			);
			if (result.error.kind === 'http') {
				error(result.error.status, { message: result.error.message });
			}
			error(502, { message: result.error.message });
		}

		const member = result.data?.data?.[0];
		if (!member) {
			log.warn('member detail response had empty data[]');
			error(404, { message: 'User not found' });
		}

		log.info(
			{
				userName: member.userName,
				userEmail: member.userEmail,
				employeeId: member.employeeId,
				enabled: member.enabled,
				status: member.enabled ? 'Active' : 'Invited',
				supervisorId: member.supervisorId,
				roles: member.roles ?? [],
				orgId: member.orgId
			},
			'member detail fetched (Active and Invited both resolve reporting-to the same way)'
		);

		// Detail API returns role IDs; resolve to role names for the UI.
		const orgId = Number(locals.merchantSession?.organizationId ?? member.orgId);
		let resolvedRoles: Array<string | number> = member.roles ?? [];

		if (Number.isFinite(orgId) && resolvedRoles.some((r) => typeof r === 'number')) {
			const rolesResult = await membersClient.listOrgRoles(
				fetch,
				log,
				tokens.accessToken,
				tokens.gatewayToken,
				orgId,
				{ page: 0, limit: 1000 },
				portal
			);

			if (rolesResult.ok) {
				const nameById = new Map(
					(rolesResult.data?.data ?? []).map((role) => [role.roleId, role.roleName] as const)
				);
				resolvedRoles = resolvedRoles.map((role) => {
					if (typeof role !== 'number') return role;
					return nameById.get(role) ?? `ROLE_${role}`;
				});
				log.info({ roles: resolvedRoles }, 'member role IDs resolved to role names');
			} else {
				log.warn(
					{
						errorKind: rolesResult.error.kind,
						message: rolesResult.error.message
					},
					'org roles fetch failed — role IDs may not display as names'
				);
			}
		}

		// Enrich reporting-to + count of direct reports.
		// Picker uses user/list IDs; detail only returns supervisorId — resolve name from
		// members first, then fall back to user directory (same source as the picker).
		let reportingTo:
			{ id: number; name: string; employeeId?: string; userEmail?: string } | undefined;
		let assignedUsersCount = 0;

		const [membersList, directoryList] = await Promise.all([
			membersClient.list(
				fetch,
				log,
				tokens.accessToken,
				tokens.gatewayToken,
				{ page: 1, limit: 1000 },
				portal
			),
			membersClient.listUsers(
				fetch,
				log,
				tokens.accessToken,
				tokens.gatewayToken,
				{ page: 0, limit: 1000 },
				portal
			)
		]);

		if (!membersList.ok) {
			log.warn(
				{
					errorKind: membersList.error.kind,
					message: membersList.error.message
				},
				'members list fetch failed — assignedUsersCount may be empty'
			);
		} else {
			const members = membersList.data?.data ?? [];
			assignedUsersCount = members.filter(
				(item) => item.supervisorId != null && Number(item.supervisorId) === Number(memberId)
			).length;
		}

		const supervisorId = member.supervisorId ?? null;
		if (supervisorId != null) {
			const members = membersList.ok ? (membersList.data?.data ?? []) : [];
			const supervisor = members.find((item) => Number(item.id) === Number(supervisorId));

			if (supervisor) {
				reportingTo = {
					id: supervisor.id,
					name: supervisor.userName,
					employeeId: supervisor.employeeId ?? undefined,
					userEmail: supervisor.userEmail
				};
			} else {
				const directory = directoryList.ok ? (directoryList.data?.data ?? []) : [];
				const fromDirectory = directory.find((user) => Number(user.id) === Number(supervisorId));
				if (fromDirectory) {
					reportingTo = {
						id: fromDirectory.id,
						name: fromDirectory.userName
					};
					log.info(
						{ supervisorId, name: fromDirectory.userName },
						'reporting-to resolved from user directory'
					);
				} else {
					log.warn(
						{
							supervisorId,
							membersOk: membersList.ok,
							directoryOk: directoryList.ok
						},
						'supervisor not found in members list or user directory — reporting-to will be empty'
					);
				}
			}
		} else {
			log.warn(
				{ supervisorId: member.supervisorId, enabled: member.enabled },
				'no supervisorId on member — reporting-to will be empty'
			);
		}

		if (!membersList.ok && !reportingTo) {
			return json({
				...(result.data ?? {}),
				data: [{ ...member, roles: resolvedRoles, assignedUsersCount }]
			});
		}

		log.info(
			{
				supervisorId,
				reportingTo: reportingTo ?? null,
				assignedUsersCount
			},
			'reporting-to and assigned-reports resolved — returning view-user response'
		);

		return json({
			...(result.data ?? {}),
			data: [
				{
					...member,
					roles: resolvedRoles,
					...(reportingTo ? { reportingTo } : {}),
					assignedUsersCount
				}
			]
		});
	}

	const search = (url.searchParams.get('search') ?? '').trim();
	const status = (url.searchParams.get('status') ?? '').trim();
	const role = (url.searchParams.get('role') ?? '').trim();
	const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1);
	const limit = Math.max(1, Number(url.searchParams.get('limit') ?? 10) || 10);
	const hasFilters = Boolean(search || status || role);

	const result = await membersClient.list(
		fetch,
		locals.logger,
		tokens.accessToken,
		tokens.gatewayToken,
		{
			page: hasFilters ? 1 : page,
			// When filters are applied, load a larger page and filter locally until
			// the upstream API supports search/status/role query params.
			limit: hasFilters ? Math.max(limit, 1000) : limit
		},
		portal
	);

	if (!result.ok) {
		if (result.error.kind === 'http') {
			error(result.error.status, { message: result.error.message });
		}
		error(502, { message: result.error.message });
	}

	if (!hasFilters) {
		return json(result.data ?? {});
	}

	const filtered = filterMembers(result.data?.data ?? [], search, status, role);
	const start = (page - 1) * limit;
	const paginated = filtered.slice(start, start + limit);

	const response: ApiUsersListResponse = {
		statusCode: result.data?.statusCode ?? 200,
		message: result.data?.message ?? '',
		data: paginated as ApiUsersListResponse['data'],
		pagination: {
			total: filtered.length,
			page,
			limit
		}
	};

	return json(response);
};

export const POST: RequestHandler = async ({ request, url, cookies, fetch, locals }) => {
	const tokens = await requireSession(cookies, fetch, locals.logger);
	const portal = resolveMembersApiPortalFromRequest({
		url,
		request,
		groups: locals.merchantSession?.groups ?? []
	});

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, { message: 'Invalid JSON body' });
	}

	const parsed = v.safeParse(CreateMemberBodySchema, body);
	if (!parsed.success) {
		error(400, { message: 'Invalid create member payload' });
	}

	const result = await membersClient.create(
		fetch,
		locals.logger,
		tokens.accessToken,
		tokens.gatewayToken,
		parsed.output,
		portal
	);

	if (!result.ok) {
		if (result.error.kind === 'http') {
			error(result.error.status, { message: result.error.message });
		}
		error(502, { message: result.error.message });
	}

	return json(result.data ?? {}, { status: 201 });
};

export const PUT: RequestHandler = async ({ request, url, cookies, fetch, locals }) => {
	const tokens = await requireSession(cookies, fetch, locals.logger);
	const portal = resolveMembersApiPortalFromRequest({
		url,
		request,
		groups: locals.merchantSession?.groups ?? []
	});

	const userId = url.searchParams.get('userId');
	const memberId = Number(userId);
	if (!userId || !Number.isFinite(memberId)) {
		error(400, { message: 'Invalid user id' });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, { message: 'Invalid JSON body' });
	}

	const parsed = v.safeParse(CreateMemberBodySchema, body);
	if (!parsed.success) {
		error(400, { message: 'Invalid update member payload' });
	}

	const result = await membersClient.update(
		fetch,
		locals.logger,
		tokens.accessToken,
		tokens.gatewayToken,
		memberId,
		parsed.output,
		portal
	);

	if (!result.ok) {
		if (result.error.kind === 'http') {
			error(result.error.status, { message: result.error.message });
		}
		error(502, { message: result.error.message });
	}

	return json(result.data ?? {});
};

export const DELETE: RequestHandler = async ({ request, url, cookies, fetch, locals }) => {
	const tokens = await requireSession(cookies, fetch, locals.logger);
	const portal = resolveMembersApiPortalFromRequest({
		url,
		request,
		groups: locals.merchantSession?.groups ?? []
	});

	const userId = url.searchParams.get('userId');
	const memberId = Number(userId);
	if (!userId || !Number.isFinite(memberId)) {
		error(400, { message: 'Invalid user id' });
	}

	const result = await membersClient.delete(
		fetch,
		locals.logger,
		tokens.accessToken,
		tokens.gatewayToken,
		memberId,
		portal
	);

	if (!result.ok) {
		if (result.error.kind === 'http') {
			error(result.error.status, { message: result.error.message });
		}
		error(502, { message: result.error.message });
	}

	return json(result.data ?? {});
};
