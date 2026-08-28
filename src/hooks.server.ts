import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { logger } from '$lib/server/logger';
import {
	getValidSession,
	SessionError,
	SessionInactiveError
} from '$lib/server/domains/auth/getValidSession';
import { clearAuthCookies } from '$lib/server/domains/auth/session';
import { decodeJwt } from '$lib/server/domains/auth/jwt';
import { parseMerchantSessionFromGateway } from '$lib/stores/auth/session';
import type { AccessTokenPayload, GatewayTokenPayload } from '$lib/stores/auth/types';
import { membersClient } from '$lib/server/domains/members/client';
import { resolveMembersApiPortal } from '$lib/server/domains/members/portal';
import {
	isRootUser,
	normalizeUserPermissions,
	portalGroupKeyFromPathname,
	rootUserPermissions,
	type RbacPermissions
} from '$lib/rbac';

// Keep auth pages + API routes public so missing/expired cookies never block
// sign-in/sign-out or forgot/reset password flows.
const PUBLIC_PATHS = [
	'/login',
	'/forgot-password',
	'/reset-password',
	'/reset-temporary-password',
	'/api/auth',
	'/logout'
];

function isPublicPath(pathname: string) {
	if (pathname === '/') return true;
	return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function serializeUserPermissions(permissions: RbacPermissions): Record<string, string[]> {
	const serialized: Record<string, string[]> = {};
	for (const [module, actions] of Object.entries(permissions)) {
		if (actions) serialized[module] = [...actions].sort();
	}
	return serialized;
}

export const handle: Handle = async ({ event, resolve }) => {
	const requestId = crypto.randomUUID();
	event.locals.requestId = requestId;
	event.locals.logger = logger.child({
		requestId,
		method: event.request.method,
		path: event.url.pathname
	});
	event.locals.logger.info('request started');

	const start = Date.now();

	if (isPublicPath(event.url.pathname)) {
		event.locals.merchantSession = null;
		event.locals.gatewayToken = null;
		event.locals.userPermissions = {};
		const response = await resolve(event);
		event.locals.logger.info(
			{ status: response.status, durationMs: Date.now() - start },
			'request completed (public path)'
		);
		response.headers.set('X-Request-Id', requestId);
		return response;
	}

	try {
		const tokens = await getValidSession(event.cookies, event.fetch, event.locals.logger);
		const gatewayPayload = decodeJwt<GatewayTokenPayload>(tokens.gatewayToken);
		const accessPayload = decodeJwt<AccessTokenPayload>(tokens.accessToken);
		event.locals.merchantSession = parseMerchantSessionFromGateway(
			gatewayPayload,
			accessPayload['cognito:groups'] ?? []
		);
		event.locals.gatewayToken = tokens.gatewayToken;

		const groups = accessPayload['cognito:groups'] ?? [];
		const rootIdentifiers = gatewayPayload.group ? [...groups, gatewayPayload.group] : groups;

		// ROOT (platform or merchant-org) is often missing from org role tables,
		// so /user/permissions returns data: [{}]. Grant the full catalog instead.
		if (isRootUser(gatewayPayload.userType, rootIdentifiers)) {
			event.locals.userPermissions = rootUserPermissions();
			event.locals.logger.info(
				{
					userType: gatewayPayload.userType,
					groups: rootIdentifiers,
					permissions: serializeUserPermissions(event.locals.userPermissions)
				},
				'root user — granting full permissions'
			);
		} else {
			// Fail closed: an empty permissions object means every can() check
			// returns false, so a fetch failure blocks RBAC-gated actions/UI
			// rather than silently granting them.
			event.locals.userPermissions = {};
			const permsResult = await membersClient.getMyPermissions(
				event.fetch,
				event.locals.logger,
				tokens.accessToken,
				tokens.gatewayToken
			);
			if (permsResult.ok) {
				// Page requests carry their own portal in the pathname (/management/...,
				// /merchant/...). BFF API requests (/api/...) don't — fall back to the
				// same referer/groups resolution the rest of the app's API routes use,
				// so permissions aren't accidentally merged across portals.
				const groupKey =
					portalGroupKeyFromPathname(event.url.pathname) ??
					resolveMembersApiPortal({
						portalParam: event.url.searchParams.get('portal'),
						referer: event.request.headers.get('referer'),
						groups
					}).toUpperCase();
				event.locals.userPermissions = normalizeUserPermissions(permsResult.data.data, groupKey);
				event.locals.logger.info(
					{ permissions: serializeUserPermissions(event.locals.userPermissions) },
					'user permissions loaded'
				);
			} else {
				event.locals.logger.warn(
					{
						errorKind: permsResult.error.kind,
						message: permsResult.error.message
					},
					'failed to fetch user permissions — RBAC-gated actions will be blocked this request'
				);
			}
		}
	} catch (e) {
		event.locals.merchantSession = null;
		event.locals.gatewayToken = null;
		event.locals.userPermissions = {};

		if (e instanceof SessionError) {
			const isInactive = e instanceof SessionInactiveError;
			const hadSession = e.message !== 'No session found';
			event.locals.logger.info(
				{
					reason: e.message,
					...(isInactive ? { exceptionCode: e.exceptionCode } : {})
				},
				'session invalid — redirecting to login'
			);
			clearAuthCookies(event.cookies);
			// Only surface a notice when a real session ended — not when the user
			// simply isn't signed in yet.
			if (isInactive) {
				redirect(303, '/login?reason=session-inactive');
			}
			if (hadSession) {
				redirect(303, '/login?reason=session-expired');
			}
			redirect(303, '/login');
		}
		event.locals.logger.error({ err: e }, 'unexpected error in session resolution');
		throw e;
	}

	const response = await resolve(event);
	event.locals.logger.info(
		{ status: response.status, durationMs: Date.now() - start },
		'request completed'
	);
	response.headers.set('X-Request-Id', requestId);
	return response;
};
