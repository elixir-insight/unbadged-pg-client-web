import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getOrganizationDetail } from '$lib/data/organization-detail';

export const GET: RequestHandler = async ({ params }) => {
	await new Promise((r) => setTimeout(r, 200));
	const organization = getOrganizationDetail(params.orgId);
	if (!organization) {
		return new Response(JSON.stringify({ message: 'Organization not found' }), { status: 404 });
	}
	return json(organization);
};
