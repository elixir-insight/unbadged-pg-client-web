import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as v from 'valibot';
import { SignInBodySchema } from '$lib/server/domains/auth/schema';
import { performSignIn } from '$lib/server/domains/auth/sign-in';

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

	const result = await performSignIn({
		fetch,
		cookies,
		logger: log,
		ip,
		userEmail: parsed.output.userEmail,
		password: parsed.output.password,
		force: parsed.output.force
	});

	if (!result.ok) {
		if (result.requiresForce) {
			return json(
				{
					exceptionCode: result.exceptionCode,
					message: result.message,
					statusCode: 202,
					requiresForce: true
				},
				{ status: 409 }
			);
		}

		return json(
			{
				exceptionCode: result.exceptionCode,
				message: result.message,
				statusCode: result.status
			},
			{ status: result.status }
		);
	}

	return json({ message: 'Signed in successfully', redirectTo: result.redirectTo });
};
