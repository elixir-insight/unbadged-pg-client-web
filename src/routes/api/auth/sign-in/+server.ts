import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as v from 'valibot';
import { authClient } from '$lib/server/domains/auth/client';
import { SignInBodySchema } from '$lib/server/domains/auth/schema';
import { storeSession } from '$lib/server/domains/auth/session';

export const POST: RequestHandler = async ({ request, cookies, fetch }) => {
	const body = await request.json().catch(() => null);
	const parsed = v.safeParse(SignInBodySchema, body);
	if (!parsed.success) {
		error(400, parsed.issues[0]?.message ?? 'Invalid email or password format');
	}

	const result = await authClient.signIn(
		fetch,
		parsed.output.userEmail,
		parsed.output.password,
		parsed.output.force
	);
	if (!result.ok) {
		// Enumeration-safe — same message for wrong password and unknown user
		error(401, 'Invalid email or password.');
	}

	// Follow-up: swagger can return 202 + sessionAlreadyExists — branch on
	// result.data.statusCode === 202 once the force-sign-in UI exists.

	const tokens = result.data.data[0];
	if (!tokens) {
		error(502, 'Sign-in succeeded but no tokens were returned.');
	}

	storeSession(cookies, tokens);
	return json({ message: 'Signed in successfully' });
};
