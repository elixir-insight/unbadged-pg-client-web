import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { findTransaction } from '$lib/server/check-status-store';
import type { SearchByType } from '$lib/types/check-status';

const VALID_SEARCH_BY = new Set<SearchByType>(['utr', 'crn', 'client_order_id']);

export const POST: RequestHandler = async ({ request }) => {
	let body: { searchBy?: string; value?: string };

	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid request body');
	}

	const searchBy = body.searchBy as SearchByType;
	const value = body.value?.trim() ?? '';

	if (!VALID_SEARCH_BY.has(searchBy)) {
		throw error(400, 'Invalid search type');
	}

	if (!value) {
		throw error(400, 'Search value is required');
	}

	await new Promise((resolve) => setTimeout(resolve, 600));

	const result = findTransaction(searchBy, value);
	if (!result) {
		throw error(404, 'No matching transaction found');
	}

	return json(result);
};
