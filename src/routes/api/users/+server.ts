import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Cookies } from '@sveltejs/kit';
import type { Logger } from 'pino';
import * as v from 'valibot';
import { getValidSession, SessionError } from '$lib/server/domains/auth/getValidSession';
import { membersClient } from '$lib/server/domains/members/client';
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

		if (roleFilterKey && !member.roles.some((r) => roleKey(String(r)) === roleFilterKey))
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

export const GET: RequestHandler = async ({ url, cookies, fetch, locals }) => {
	const tokens = await requireSession(cookies, fetch, locals.logger);

	const userId = url.searchParams.get('userId');

	if (userId) {
		const memberId = Number(userId);
		const log = locals.logger.child({ action: 'view-user', memberId: userId });

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
			memberId
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

		const member = result.data.data[0];
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
				roles: member.roles,
				orgId: member.orgId
			},
			'member detail fetched (Active and Invited both resolve reporting-to the same way)'
		);

		// Reporting-to is resolved for every member that has a supervisorId —
		// including inactive/Invited (enabled: false). Status is never used as a filter here.
		const supervisorId = member.supervisorId ?? null;
		if (supervisorId == null) {
			log.warn(
				{ supervisorId: member.supervisorId, enabled: member.enabled },
				'no supervisorId on member — reporting-to will be empty'
			);
			return json(result.data);
		}

		log.info(
			{ supervisorId, enabled: member.enabled },
			'resolving reporting-to: match user-list id === supervisorId'
		);

		const directory = await membersClient.listUsers(
			fetch,
			log,
			tokens.accessToken,
			tokens.gatewayToken,
			{ page: 0, limit: 1000 }
		);

		if (!directory.ok) {
			log.warn(
				{
					supervisorId,
					errorKind: directory.error.kind,
					message: directory.error.message
				},
				'user directory fetch failed — reporting-to will be empty'
			);
			return json(result.data);
		}

		log.info({ directoryCount: directory.data.data.length }, 'user directory loaded');

		// Compare GET /api/v1/management/user/list → data[].id
		// with member detail → supervisorId, then show that user's userName.
		const supervisor = directory.data.data.find((user) => Number(user.id) === Number(supervisorId));
		if (!supervisor) {
			log.warn(
				{
					supervisorId,
					directoryIds: directory.data.data.map((user) => user.id)
				},
				'supervisor not found in user directory — reporting-to will be empty'
			);
			return json(result.data);
		}

		log.info(
			{
				supervisorId,
				supervisorName: supervisor.userName,
				reportingTo: { id: supervisor.id, name: supervisor.userName }
			},
			'reporting-to resolved — returning view-user response'
		);

		return json({
			...result.data,
			data: [
				{
					...member,
					reportingTo: {
						id: supervisor.id,
						name: supervisor.userName
					}
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
		}
	);

	if (!result.ok) {
		if (result.error.kind === 'http') {
			error(result.error.status, { message: result.error.message });
		}
		error(502, { message: result.error.message });
	}

	if (!hasFilters) {
		return json(result.data);
	}

	const filtered = filterMembers(result.data.data, search, status, role);
	const start = (page - 1) * limit;
	const paginated = filtered.slice(start, start + limit);

	const response: ApiUsersListResponse = {
		statusCode: result.data.statusCode,
		message: result.data.message,
		data: paginated as ApiUsersListResponse['data'],
		pagination: {
			total: filtered.length,
			page,
			limit
		}
	};

	return json(response);
};

export const POST: RequestHandler = async ({ request, cookies, fetch, locals }) => {
	const tokens = await requireSession(cookies, fetch, locals.logger);

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
		parsed.output
	);

	if (!result.ok) {
		if (result.error.kind === 'http') {
			error(result.error.status, { message: result.error.message });
		}
		error(502, { message: result.error.message });
	}

	return json(result.data, { status: 201 });
};
