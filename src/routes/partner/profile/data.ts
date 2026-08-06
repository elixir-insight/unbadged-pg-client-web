// TEMP: dummy data until /partner/profile API. Replace fetchPartnerProfile() /
// savePartnerProfile() bodies only — keep the return types identical.

import type {
	FetchPartnerProfileResponse,
	PartnerProfile,
	SavePartnerProfilePayload,
	SavePartnerProfileResponse
} from './types';

let profileStore: PartnerProfile = {
	name: 'Aarav Kapoor',
	company: 'Riverline Partners',
	email: 'aarav.kapoor@riverline.in',
	phone: '+91 98765 43210',
	website: 'https://riverline.in',
	city: 'Mumbai'
};

export function fetchPartnerProfile(): Promise<FetchPartnerProfileResponse> {
	return Promise.resolve({ ...profileStore });
}

export function savePartnerProfile(
	payload: SavePartnerProfilePayload
): Promise<SavePartnerProfileResponse> {
	profileStore = { ...payload };
	return Promise.resolve({ ...profileStore });
}
