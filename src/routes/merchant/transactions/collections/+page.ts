import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';

export function load() {
	redirect(303, resolve('/merchant/transactions/collections/payments'));
}
