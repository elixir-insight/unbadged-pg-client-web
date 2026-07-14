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
import { canAccessPortalPath, resolvePortalHome } from '$lib/stores/auth/portal';
import type { GatewayTokenPayload } from '$lib/stores/auth/types';

// Keep auth pages + API routes public so missing/expired cookies never block
// sign-in/sign-out or forgot/reset password flows.
const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password', '/api/auth', '/logout'];

function isPublicPath(pathname: string) {
	if (pathname === '/') return true;
	return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export const handle: Handle = async ({ event, resolve }) => {
	const requestId = crypto.randomUUID();
	event.locals.requestId = requestId;
	event.locals.logger = logger.child({
		requestId,
		method: event.request.method,
		path: event.url.pathname
	});

	const start = Date.now();

	if (isPublicPath(event.url.pathname)) {
		event.locals.merchantSession = null;
		event.locals.gatewayToken = null;
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
		event.locals.merchantSession = parseMerchantSessionFromGateway(gatewayPayload);
		event.locals.gatewayToken = tokens.gatewayToken;
	} catch (e) {
		event.locals.merchantSession = null;
		event.locals.gatewayToken = null;

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

	const session = event.locals.merchantSession;
	if (session && !canAccessPortalPath(event.url.pathname, session.groups)) {
		const home = resolvePortalHome(session.groups);
		event.locals.logger.info(
			{ path: event.url.pathname, home, groups: session.groups },
			'portal access denied — redirecting to home'
		);
		redirect(303, home);
	}

	const response = await resolve(event);
	event.locals.logger.info(
		{ status: response.status, durationMs: Date.now() - start },
		'request completed'
	);
	response.headers.set('X-Request-Id', requestId);
	return response;
};
