import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { performSignOut } from '$lib/server/domains/auth/sign-out';

export const POST: RequestHandler = async ({ cookies, fetch, locals }) => {
	await performSignOut({ fetch, cookies, logger: locals.logger });
	return json({ message: 'Signed out' });
};
