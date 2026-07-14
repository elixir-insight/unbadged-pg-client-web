import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as v from 'valibot';
import { authClient } from '$lib/server/domains/auth/client';
import { SignInBodySchema } from '$lib/server/domains/auth/schema';
import { storeSession } from '$lib/server/domains/auth/session';

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
		log.warn(
			{
				ip,
				userEmail: parsed.output.userEmail,
				exceptionCode: result.error.kind === 'http' ? result.error.code : undefined,
				errorKind: result.error.kind
			},
			'sign-in failed'
		);
		error(401, 'Invalid email or password.');
	}

	const tokens = result.data.data[0];
	if (!tokens) {
		log.error(
			{ ip, userEmail: parsed.output.userEmail },
			'sign-in succeeded but no tokens returned'
		);
		error(502, 'Sign-in succeeded but no tokens were returned.');
	}

	log.info({ ip, userEmail: parsed.output.userEmail }, 'sign-in succeeded');
	storeSession(cookies, tokens);
	return json({ message: 'Signed in successfully' });
};
