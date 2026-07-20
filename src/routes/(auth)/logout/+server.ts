import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { performSignOut } from '$lib/server/domains/auth/sign-out';

/** Form-friendly sign-out: clears session and redirects to login. */
export const POST: RequestHandler = async ({ cookies, fetch, locals }) => {
	await performSignOut({ fetch, cookies, logger: locals.logger });
	redirect(303, '/login');
};
