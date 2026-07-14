import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as v from 'valibot';
import { authClient } from '$lib/server/domains/auth/client';
import { SignInBodySchema } from '$lib/server/domains/auth/schema';
import { storeSession } from '$lib/server/domains/auth/session';
import { decodeJwt } from '$lib/server/domains/auth/jwt';
import { resolvePortalHome } from '$lib/stores/auth/portal';
import type { GatewayTokenPayload } from '$lib/stores/auth/types';

export const POST: RequestHandler = async ({
	request,
	cookies,
	fetch,
	locals,
	getClientAddress
}) => {
	const log = locals.logger;
	const ip = getClientAddress();

	const body = await request.json().catch(() => null);
	const parsed = v.safeParse(SignInBodySchema, body);

	if (!parsed.success) {
		log.warn({ ip, issues: parsed.issues }, 'sign-in rejected — invalid request body');
		error(400, parsed.issues[0]?.message ?? 'Invalid email or password format');
	}

	log.info({ ip, userEmail: parsed.output.userEmail }, 'sign-in attempt');

	const result = await authClient.signIn(
		fetch,
		log,
		parsed.output.userEmail,
		parsed.output.password,
		parsed.output.force
	);

	if (!result.ok) {
		const exceptionCode = result.error.kind === 'http' ? result.error.code : undefined;
		const upstreamStatus = result.error.kind === 'http' ? result.error.status : undefined;
		const message =
			result.error.kind === 'http' ? result.error.message : 'Invalid email or password.';

		const requiresForce =
			exceptionCode === 'FAILED_TO_SIGN_IN' &&
			(message === 'User Session Already Exists' || upstreamStatus === 202);

		if (requiresForce) {
			log.warn(
				{
					ip,
					userEmail: parsed.output.userEmail,
					exceptionCode,
					errorKind: result.error.kind,
					upstreamStatus
				},
				'sign-in requires force — session already exists'
			);
			return json(
				{
					exceptionCode,
					message,
					statusCode: 202,
					requiresForce: true
				},
				{ status: 409 }
			);
		}

		const status =
			result.error.kind === 'http' && result.error.status >= 400 && result.error.status < 500
				? result.error.status
				: 401;

		log.warn(
			{
				ip,
				userEmail: parsed.output.userEmail,
				exceptionCode,
				errorKind: result.error.kind,
				status
			},
			'sign-in failed'
		);

		return json({ exceptionCode, message, statusCode: status }, { status });
	}

	const tokens = result.data.data[0];
	if (!tokens) {
		log.error(
			{ ip, userEmail: parsed.output.userEmail },
			'sign-in succeeded but no tokens returned'
		);
		error(502, 'Sign-in succeeded but no tokens were returned.');
	}

	const gatewayPayload = decodeJwt<GatewayTokenPayload>(tokens.gatewayToken);
	const redirectTo = resolvePortalHome(gatewayPayload['cognito:groups'] ?? []);

	log.info(
		{
			ip,
			userEmail: parsed.output.userEmail,
			redirectTo,
			groups: gatewayPayload['cognito:groups']
		},
		'sign-in succeeded'
	);
	storeSession(cookies, tokens);
	return json({ message: 'Signed in successfully', redirectTo });
};
