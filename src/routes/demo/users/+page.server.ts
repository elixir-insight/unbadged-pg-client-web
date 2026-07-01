import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, fetch }) => {
	const search = url.searchParams.get('search')?.trim() ?? '';
	const limit = Number(url.searchParams.get('limit') ?? 10);
	const skip = Number(url.searchParams.get('skip') ?? 0);

	// skip is only used for paginated list views — not while searching
	if (search && skip > 0) {
		const cleaned = new URL(url);
		cleaned.searchParams.delete('skip');
		throw redirect(303, cleaned.pathname + cleaned.search);
	}

	const endpoint = search
		? `https://dummyjson.com/users/search?q=${encodeURIComponent(search)}&limit=${limit}`
		: `https://dummyjson.com/users?skip=${skip}&limit=${limit}`;

	const res = await fetch(endpoint);
	const data = await res.json();
	return { data };
};
