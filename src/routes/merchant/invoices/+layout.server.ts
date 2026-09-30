import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getValidSession } from '$lib/server/domains/auth/getValidSession';
import { clearAuthCookies } from '$lib/server/domains/auth/session';
import { merchantProfileClient } from '$lib/server/domains/merchant-profile/client';
import { mapMerchantProfile } from '$lib/server/domains/merchant-profile/mappers/from-api/profile';

export const load: LayoutServerLoad = async ({ cookies, fetch, locals }) => {
	const tokens = await getValidSession(cookies, fetch, locals.logger);
	const profileResult = await merchantProfileClient.getProfile(
		fetch,
		locals.logger,
		tokens.accessToken,
		tokens.gatewayToken
	);

	if (
		!profileResult.ok &&
		profileResult.error.kind === 'http' &&
		profileResult.error.status === 401
	) {
		clearAuthCookies(cookies);
		redirect(303, '/login?reason=session-expired');
	}

	if (!profileResult.ok) {
		locals.logger.error(
			{ error: profileResult.error },
			'failed to load merchant profile for invoices'
		);
		return {
			issuer: null,
			issuerError: 'Could not load your organization profile. Please try again.'
		};
	}

	const item = profileResult.data.data[0];
	const profile = item ? mapMerchantProfile(item) : null;
	if (!profile) {
		return {
			issuer: null,
			issuerError: 'Organization profile not found.'
		};
	}

	const issuerName =
		profile.companyName !== '—'
			? profile.companyName
			: profile.orgName !== '—'
				? profile.orgName
				: profile.displayName;

	return {
		issuer: {
			name: issuerName,
			gstNumber: profile.gstNumber
		},
		issuerError: null
	};
};
