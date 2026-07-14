import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { getValidSession, SessionError } from '$lib/server/domains/auth/getValidSession';
import { clearAuthCookies } from '$lib/server/domains/auth/session';
import { decodeJwt } from '$lib/server/domains/auth/jwt';
import { parseMerchantSessionFromGateway } from '$lib/stores/auth/session';
import type { GatewayTokenPayload } from '$lib/stores/auth/types';

// Keep auth pages + API routes public so missing/expired cookies never block
// sign-in/sign-out or forgot/reset password flows.
const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password', '/api/auth'];

function isPublicPath(pathname: string) {
	return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export const handle: Handle = async ({ event, resolve }) => {
	if (isPublicPath(event.url.pathname)) {
		event.locals.merchantSession = null;
		event.locals.gatewayToken = null;
		return resolve(event);
	}

	try {
		const tokens = await getValidSession(event.cookies, event.fetch);

		const gatewayPayload = decodeJwt<GatewayTokenPayload>(tokens.gatewayToken);
		event.locals.merchantSession = parseMerchantSessionFromGateway(gatewayPayload);
		event.locals.gatewayToken = tokens.gatewayToken;
	} catch (e) {
		event.locals.merchantSession = null;
		event.locals.gatewayToken = null;

		if (e instanceof SessionError) {
			clearAuthCookies(event.cookies);
			redirect(303, '/login?reason=session-expired');
		}
		throw e;
	}

	return resolve(event);
};
